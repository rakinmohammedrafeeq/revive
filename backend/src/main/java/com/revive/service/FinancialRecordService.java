package com.revive.service;

import com.revive.dto.FinancialRecordRequest;
import com.revive.dto.FinancialRecordResponse;
import com.revive.entity.FinancialRecord;
import com.revive.entity.User;
import com.revive.entity.Workspace;
import com.revive.enums.TransactionType;
import com.revive.enums.WorkspacePermission;
import com.revive.exception.ForbiddenException;
import com.revive.exception.ResourceNotFoundException;
import com.revive.repository.FinancialRecordRepository;
import com.revive.repository.FinancialRecordSpecification;
import com.revive.repository.WorkspaceMemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.revive.repository.WorkspaceRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class FinancialRecordService {

    private static final Logger logger = LoggerFactory.getLogger(FinancialRecordService.class);

    private final FinancialRecordRepository recordRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final CurrentUserService currentUserService;
    private final VectorSearchService vectorSearchService;
    private final WorkspaceRepository workspaceRepository;

    public FinancialRecordService(FinancialRecordRepository recordRepository,
                                  WorkspaceMemberRepository workspaceMemberRepository,
                                  CurrentUserService currentUserService,
                                  VectorSearchService vectorSearchService,
                                  WorkspaceRepository workspaceRepository) {
        this.recordRepository = recordRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
        this.currentUserService = currentUserService;
        this.vectorSearchService = vectorSearchService;
        this.workspaceRepository = workspaceRepository;
    }

    @Transactional
    public FinancialRecordResponse createRecord(FinancialRecordRequest request) {
        User currentUser = currentUserService.requireCurrentUser();

        // Get current workspace
        Workspace workspace = currentUser.getCurrentWorkspace();
        if (workspace == null) {
            throw new ForbiddenException("No workspace selected");
        }

        // Check permission - need EDITOR or OWNER
        WorkspacePermission permission = workspaceMemberRepository
                .findPermissionByWorkspaceAndUser(workspace.getId(), currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("You don't have access to this workspace"));

        if (permission == WorkspacePermission.VIEWER) {
            throw new ForbiddenException("Viewers cannot create records");
        }

        FinancialRecord record = FinancialRecord.builder()
                .amount(request.getAmount())
                .type(TransactionType.valueOf(request.getType()))
                .category(request.getCategory())
                .date(request.getDate())
                .description(request.getDescription())
                .user(currentUser)
                .workspace(workspace)
                .build();

        FinancialRecord savedRecord = recordRepository.save(record);
        
        // Return immediately - indexing will happen asynchronously
        FinancialRecordResponse response = toResponse(savedRecord);
        
        // Index the record for vector search asynchronously (don't block the response)
        // This runs in a separate thread after the transaction commits
        Long recordId = savedRecord.getId();
        Long userId = currentUser.getId();
        Long workspaceId = workspace.getId();
        
        // Schedule async indexing - this happens after response is sent
        CompletableFuture.runAsync(() -> {
            try {
                vectorSearchService.indexFinancialRecord(
                    recordRepository.findById(recordId).orElse(null), 
                    userId, 
                    workspaceId
                );
            } catch (Exception e) {
                logger.error("Failed to index financial record {} for vector search: {}", recordId, e.getMessage());
            }
        });
        
        return response;
    }
    
    @Transactional
    public FinancialRecordResponse updateRecord(Long id, FinancialRecordRequest request) {
        FinancialRecord record = recordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Record not found with id: " + id));

        User currentUser = currentUserService.requireCurrentUser();

        // Check workspace access
        Workspace workspace = currentUser.getCurrentWorkspace();
        if (workspace == null || !record.getWorkspace().getId().equals(workspace.getId())) {
            throw new ForbiddenException("Record not found in current workspace");
        }

        // Check permission - need EDITOR or OWNER
        WorkspacePermission permission = workspaceMemberRepository
                .findPermissionByWorkspaceAndUser(workspace.getId(), currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("You don't have access to this workspace"));

        if (permission == WorkspacePermission.VIEWER) {
            throw new ForbiddenException("Viewers cannot update records");
        }

        record.setAmount(request.getAmount());
        record.setType(TransactionType.valueOf(request.getType()));
        record.setCategory(request.getCategory());
        record.setDate(request.getDate());
        record.setDescription(request.getDescription());
        // Keep the original owner, don't change it

        FinancialRecord savedRecord = recordRepository.save(record);
        
        // Return immediately without waiting for indexing
        return toResponse(savedRecord);
    }

    @Transactional
    public void deleteRecord(Long id) {
        FinancialRecord record = recordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Record not found with id: " + id));

        User currentUser = currentUserService.requireCurrentUser();

        // Check workspace access
        Workspace workspace = currentUser.getCurrentWorkspace();
        if (workspace == null || !record.getWorkspace().getId().equals(workspace.getId())) {
            throw new ForbiddenException("Record not found in current workspace");
        }

        // Check permission - need EDITOR or OWNER
        WorkspacePermission permission = workspaceMemberRepository
                .findPermissionByWorkspaceAndUser(workspace.getId(), currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("You don't have access to this workspace"));

        if (permission == WorkspacePermission.VIEWER) {
            throw new ForbiddenException("Viewers cannot delete records");
        }

        recordRepository.delete(record);
    }

    @Transactional(readOnly = true)
    public Page<FinancialRecordResponse> getAllRecords(
            LocalDate startDate, LocalDate endDate,
            String category, TransactionType type,
            int page, int size, String sortBy, String direction) {

        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        User currentUser = currentUserService.requireCurrentUser();

        // Get current workspace
        Workspace workspace = currentUser.getCurrentWorkspace();
        if (workspace == null) {
            throw new ForbiddenException("No workspace selected");
        }

        // Check workspace access
        WorkspacePermission permission = workspaceMemberRepository
                .findPermissionByWorkspaceAndUser(workspace.getId(), currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("You don't have access to this workspace"));

        // All records are scoped to current workspace
        Specification<FinancialRecord> spec = FinancialRecordSpecification.withFilters(
                startDate, endDate, category, type, workspace.getId());

        return recordRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public FinancialRecordResponse getRecordById(Long id) {
        FinancialRecord record = recordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Record not found with id: " + id));

        User currentUser = currentUserService.requireCurrentUser();

        // Check workspace access
        Workspace workspace = currentUser.getCurrentWorkspace();
        if (workspace == null || !record.getWorkspace().getId().equals(workspace.getId())) {
            throw new ForbiddenException("Record not found in current workspace");
        }

        // Check workspace access
        workspaceMemberRepository
                .findPermissionByWorkspaceAndUser(workspace.getId(), currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("You don't have access to this workspace"));

        return toResponse(record);
    }

    // ─── Agent explicit-workspace methods ──────────────────────────────────────
    // These take workspaceId as a parameter instead of reading currentUser.getCurrentWorkspace().
    // The implicit getCurrentWorkspace() path is NOT safe for the agent because the user's
    // persisted current_workspace_id may differ from the workspace they queried the agent about.
    // Existing methods (createRecord, getAllRecords, etc.) are unchanged.

    /**
     * Fetches paginated records for a specific workspace.
     * Called by the agent tool executor for the get_transactions tool.
     */
    @Transactional(readOnly = true)
    public List<FinancialRecordResponse> getAllRecordsForWorkspace(
            Long workspaceId, User callingUser,
            LocalDate startDate, LocalDate endDate,
            String category, TransactionType type,
            int page, int size) {

        // Defense-in-depth: verify membership (orchestrator already checked, but this is a write path guard)
        workspaceMemberRepository
                .findPermissionByWorkspaceAndUser(workspaceId, callingUser.getId())
                .orElseThrow(() -> new ForbiddenException("You don't have access to workspace " + workspaceId));

        Pageable pageable = PageRequest.of(page, size, Sort.by("date").descending());
        Specification<FinancialRecord> spec =
                FinancialRecordSpecification.withFilters(startDate, endDate, category, type, workspaceId);

        return recordRepository.findAll(spec, pageable).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Creates a record scoped to an explicit workspaceId.
     * Called by the agent tool executor after user confirmation of create_transaction.
     */
    @Transactional
    public FinancialRecordResponse createRecordForWorkspace(
            Long workspaceId, User callingUser, FinancialRecordRequest request) {

        WorkspacePermission permission = workspaceMemberRepository
                .findPermissionByWorkspaceAndUser(workspaceId, callingUser.getId())
                .orElseThrow(() -> new ForbiddenException("You don't have access to workspace " + workspaceId));

        if (permission == WorkspacePermission.VIEWER) {
            throw new ForbiddenException("Viewers cannot create records");
        }

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + workspaceId));

        FinancialRecord record = FinancialRecord.builder()
                .amount(request.getAmount())
                .type(TransactionType.valueOf(request.getType()))
                .category(request.getCategory())
                .date(request.getDate())
                .description(request.getDescription())
                .user(callingUser)
                .workspace(workspace)
                .build();

        FinancialRecord savedRecord = recordRepository.save(record);
        FinancialRecordResponse response = toResponse(savedRecord);

        // Async vector indexing — same pattern as createRecord()
        Long recordId = savedRecord.getId();
        Long userId = callingUser.getId();
        CompletableFuture.runAsync(() -> {
            try {
                vectorSearchService.indexFinancialRecord(
                        recordRepository.findById(recordId).orElse(null), userId, workspaceId);
            } catch (Exception e) {
                logger.error("Agent: failed to index record {} for vector search: {}", recordId, e.getMessage());
            }
        });

        return response;
    }

    /**
     * Updates a specific record, validating that it belongs to {@code workspaceId}.
     * Bypasses the currentUser.getCurrentWorkspace() check used by updateRecord().
     * Called by the agent tool executor after user confirmation of update_transaction.
     */
    @Transactional
    public FinancialRecordResponse updateRecordForWorkspace(
            Long workspaceId, Long recordId, User callingUser, FinancialRecordRequest request) {

        WorkspacePermission permission = workspaceMemberRepository
                .findPermissionByWorkspaceAndUser(workspaceId, callingUser.getId())
                .orElseThrow(() -> new ForbiddenException("You don't have access to workspace " + workspaceId));

        if (permission == WorkspacePermission.VIEWER) {
            throw new ForbiddenException("Viewers cannot update records");
        }

        FinancialRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Record not found: " + recordId));

        if (!record.getWorkspace().getId().equals(workspaceId)) {
            throw new ForbiddenException("Record " + recordId + " does not belong to workspace " + workspaceId);
        }

        record.setAmount(request.getAmount());
        record.setType(TransactionType.valueOf(request.getType()));
        record.setCategory(request.getCategory());
        record.setDate(request.getDate());
        record.setDescription(request.getDescription());

        return toResponse(recordRepository.save(record));
    }

    private FinancialRecordResponse toResponse(FinancialRecord record) {
        return FinancialRecordResponse.builder()
                .id(record.getId())
                .amount(record.getAmount())
                .type(record.getType().name())
                .category(record.getCategory())
                .date(record.getDate())
                .description(record.getDescription())
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .userId(record.getUser() != null ? record.getUser().getId() : null)
                .userName(record.getUser() != null ? record.getUser().getName() : null)
                .userEmail(record.getUser() != null ? record.getUser().getEmail() : null)
                .build();
    }
}
