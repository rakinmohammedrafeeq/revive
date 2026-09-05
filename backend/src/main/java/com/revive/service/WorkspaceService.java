package com.revive.service;

import com.revive.dto.WorkspaceRequest;
import com.revive.dto.WorkspaceResponse;
import com.revive.entity.User;
import com.revive.entity.Workspace;
import com.revive.entity.WorkspaceMember;
import com.revive.enums.WorkspacePermission;
import com.revive.exception.BadRequestException;
import com.revive.exception.ForbiddenException;
import com.revive.exception.ResourceNotFoundException;
import com.revive.repository.WorkspaceMemberRepository;
import com.revive.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private static final Logger logger = LoggerFactory.getLogger(WorkspaceService.class);

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final CurrentUserService currentUserService;
    private final com.revive.repository.UserRepository userRepository;

    @Transactional
    public WorkspaceResponse createWorkspace(WorkspaceRequest request) {
        User currentUser = currentUserService.requireCurrentUser();
        
        // Generate unique slug
        String baseSlug = generateSlug(request.getName());
        String slug = baseSlug;
        int counter = 1;
        while (workspaceRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter++;
        }
        
        // Create workspace
        Workspace workspace = Workspace.builder()
                .name(request.getName())
                .slug(slug)
                .owner(currentUser)
                .isActive(true)
                .build();
        
        workspace = workspaceRepository.save(workspace);
        
        // Add creator as OWNER
        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(workspace)
                .user(currentUser)
                .permission(WorkspacePermission.OWNER)
                .isActive(true)
                .build();
        
        workspaceMemberRepository.save(member);
        
        // Set as current workspace if user doesn't have one
        if (currentUser.getCurrentWorkspace() == null) {
            currentUser.setCurrentWorkspace(workspace);
        }
        
        return mapToResponse(workspace, WorkspacePermission.OWNER, 1, true);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceResponse> getUserWorkspaces() {
        User currentUser = currentUserService.requireCurrentUser();
        List<Workspace> workspaces = workspaceRepository.findWorkspacesByUserId(currentUser.getId());
        Long currentWorkspaceId = currentUser.getCurrentWorkspace() != null 
            ? currentUser.getCurrentWorkspace().getId() 
            : null;
        
        return workspaces.stream()
                .map(workspace -> {
                    WorkspacePermission permission = workspaceMemberRepository
                            .findPermissionByWorkspaceAndUser(workspace.getId(), currentUser.getId())
                            .orElse(null);
                    int memberCount = workspaceMemberRepository
                            .findByWorkspaceIdAndIsActiveTrue(workspace.getId())
                            .size();
                    boolean isCurrent = currentWorkspaceId != null && currentWorkspaceId.equals(workspace.getId());
                    return mapToResponse(workspace, permission, memberCount, isCurrent);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkspaceResponse getWorkspaceById(Long workspaceId) {
        User currentUser = currentUserService.requireCurrentUser();
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        // Check access
        WorkspacePermission permission = workspaceMemberRepository
                .findPermissionByWorkspaceAndUser(workspaceId, currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("You don't have access to this workspace"));
        
        int memberCount = workspaceMemberRepository
                .findByWorkspaceIdAndIsActiveTrue(workspaceId)
                .size();
        
        boolean isCurrent = currentUser.getCurrentWorkspace() != null 
            && currentUser.getCurrentWorkspace().getId().equals(workspaceId);
        
        return mapToResponse(workspace, permission, memberCount, isCurrent);
    }

    @Transactional
    public WorkspaceResponse updateWorkspace(Long workspaceId, WorkspaceRequest request) {
        User currentUser = currentUserService.requireCurrentUser();
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        // Check OWNER permission
        WorkspacePermission permission = workspaceMemberRepository
                .findPermissionByWorkspaceAndUser(workspaceId, currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("You don't have access to this workspace"));
        
        if (permission != WorkspacePermission.OWNER) {
            throw new ForbiddenException("Only workspace owners can update workspace settings");
        }
        
        workspace.setName(request.getName());
        workspace = workspaceRepository.save(workspace);
        
        int memberCount = workspaceMemberRepository
                .findByWorkspaceIdAndIsActiveTrue(workspaceId)
                .size();
        
        boolean isCurrent = currentUser.getCurrentWorkspace() != null 
            && currentUser.getCurrentWorkspace().getId().equals(workspaceId);
        
        return mapToResponse(workspace, permission, memberCount, isCurrent);
    }

    @Transactional
    public void deleteWorkspace(Long workspaceId) {
        User currentUser = currentUserService.requireCurrentUser();
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        // Check OWNER permission
        WorkspacePermission permission = workspaceMemberRepository
                .findPermissionByWorkspaceAndUser(workspaceId, currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("You don't have access to this workspace"));
        
        if (permission != WorkspacePermission.OWNER) {
            throw new ForbiddenException("Only workspace owners can delete workspaces");
        }
        
        // Check if this is the user's last workspace
        List<Workspace> userWorkspaces = workspaceRepository.findWorkspacesByUserId(currentUser.getId());
        if (userWorkspaces.size() <= 1) {
            throw new BadRequestException("You must keep at least one workspace. Create a new workspace before deleting this one.");
        }
        
        // Check if this workspace is currently selected by any user
        List<User> usersWithThisWorkspace = userRepository.findByCurrentWorkspaceId(workspaceId);
        if (!usersWithThisWorkspace.isEmpty()) {
            // If current user has this as current workspace, switch them to another workspace first
            if (currentUser.getCurrentWorkspace() != null && 
                currentUser.getCurrentWorkspace().getId().equals(workspaceId)) {
                // Find another workspace for the user
                Workspace alternativeWorkspace = userWorkspaces.stream()
                        .filter(w -> !w.getId().equals(workspaceId))
                        .findFirst()
                        .orElseThrow(() -> new BadRequestException("Cannot delete workspace. Please switch to another workspace first."));
                
                // Switch current user to alternative workspace
                currentUser.setCurrentWorkspace(alternativeWorkspace);
                userRepository.save(currentUser);
            }
            
            // Switch other users to their first available workspace
            for (User user : usersWithThisWorkspace) {
                if (user.getId().equals(currentUser.getId())) {
                    continue; // Already handled above
                }
                
                List<Workspace> otherUserWorkspaces = workspaceRepository.findWorkspacesByUserId(user.getId());
                Workspace alternativeWorkspace = otherUserWorkspaces.stream()
                        .filter(w -> !w.getId().equals(workspaceId))
                        .findFirst()
                        .orElse(null);
                
                if (alternativeWorkspace != null) {
                    user.setCurrentWorkspace(alternativeWorkspace);
                    userRepository.save(user);
                } else {
                    // User has no other workspace, set to null
                    user.setCurrentWorkspace(null);
                    userRepository.save(user);
                }
            }
        }
        
        // Now safe to delete the workspace
        // CASCADE will handle workspace_members, workspace_invitations, and financial_records
        workspaceRepository.delete(workspace);
    }

    /**
     * Get user's primary (current) workspace.
     * Used by recovery controllers to scope data to the correct workspace.
     *
     * Returns a fully-initialized workspace entity (not a lazy proxy).
     */
    @Transactional
    public Workspace getUserPrimaryWorkspace(User user) {
        Workspace workspace = null;

        // First try the user's current workspace
        // IMPORTANT: Don't use the lazy proxy directly - fetch from repository
        if (user.getCurrentWorkspace() != null) {
            Long workspaceId = user.getCurrentWorkspace().getId();
            // Fetch the actual workspace from repository (fully initialized)
            workspace = workspaceRepository.findById(workspaceId).orElse(null);
        }

        // Fall back to first workspace the user is a member of
        if (workspace == null) {
            List<Workspace> workspaces = workspaceRepository.findWorkspacesByUserId(user.getId());
            if (!workspaces.isEmpty()) {
                workspace = workspaces.get(0);
            }
        }

        // Auto-create a default workspace if user has none
        if (workspace == null) {
            logger.info("No workspace found for user {}. Creating default workspace.", user.getEmail());

            String workspaceName = user.getName() != null && !user.getName().isEmpty()
                ? user.getName() + "'s Workspace"
                : "My Workspace";

            workspace = new Workspace();
            workspace.setName(workspaceName);
            workspace.setSlug(generateSlug(workspaceName + "-" + System.currentTimeMillis()));
            workspace.setOwner(user);
            workspace.setIsActive(true);
            workspace = workspaceRepository.save(workspace);

            // Add user as owner member
            WorkspaceMember member = new WorkspaceMember();
            member.setWorkspace(workspace);
            member.setUser(user);
            member.setPermission(WorkspacePermission.OWNER);
            member.setIsActive(true);
            workspaceMemberRepository.save(member);

            // Set as current workspace
            user.setCurrentWorkspace(workspace);
            userRepository.save(user);

            logger.info("Created default workspace '{}' (ID: {}) for user {}",
                    workspace.getName(), workspace.getId(), user.getEmail());
        }

        return workspace;
    }

    @Transactional
    public WorkspaceResponse switchWorkspace(Long workspaceId) {
        User currentUser = currentUserService.requireCurrentUser();
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        // Check access
        WorkspacePermission permission = workspaceMemberRepository
                .findPermissionByWorkspaceAndUser(workspaceId, currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("You don't have access to this workspace"));
        
        currentUser.setCurrentWorkspace(workspace);
        
        int memberCount = workspaceMemberRepository
                .findByWorkspaceIdAndIsActiveTrue(workspaceId)
                .size();
        
        return mapToResponse(workspace, permission, memberCount, true);
    }

    private String generateSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    private WorkspaceResponse mapToResponse(Workspace workspace, WorkspacePermission permission, int memberCount, boolean isCurrent) {
        return WorkspaceResponse.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .slug(workspace.getSlug())
                .ownerId(workspace.getOwner().getId())
                .ownerName(workspace.getOwner().getName())
                .userPermission(permission)
                .memberCount(memberCount)
                .isActive(workspace.getIsActive())
                .isCurrent(isCurrent)
                .createdAt(workspace.getCreatedAt())
                .updatedAt(workspace.getUpdatedAt())
                .build();
    }
}
