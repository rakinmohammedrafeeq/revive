package com.revive.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revive.entity.AuditTrail;
import com.revive.entity.User;
import com.revive.entity.Workspace;
import com.revive.enums.AuditActionType;
import com.revive.repository.AuditTrailRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Service for creating immutable audit trail entries.
 * 
 * IMPORTANT: This service only supports INSERT operations.
 * Audit entries should never be updated or deleted.
 */
@Service
public class AuditTrailService {

    private static final Logger logger = LoggerFactory.getLogger(AuditTrailService.class);

    private final AuditTrailRepository auditTrailRepository;
    private final ObjectMapper objectMapper;

    public AuditTrailService(
            AuditTrailRepository auditTrailRepository,
            ObjectMapper objectMapper) {
        this.auditTrailRepository = auditTrailRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Log an audit entry.
     * Uses REQUIRES_NEW to ensure audit log is persisted even if parent transaction fails.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(
            User user,
            Workspace workspace,
            AuditActionType actionType,
            String entityType,
            Long entityId,
            String paymentIdentifier,
            Map<String, Object> details,
            String outcome) {
        
        try {
            String detailsJson = objectMapper.writeValueAsString(details);
            
            AuditTrail entry = AuditTrail.builder()
                    .timestamp(LocalDateTime.now())
                    .user(user)
                    .workspace(workspace)
                    .actionType(actionType)
                    .entityType(entityType)
                    .entityId(entityId)
                    .paymentIdentifier(paymentIdentifier)
                    .details(detailsJson)
                    .outcome(outcome)
                    .build();
            
            auditTrailRepository.save(entry);
            
            logger.debug("Audit log created: actionType={}, entityType={}, entityId={}", 
                    actionType, entityType, entityId);
        } catch (Exception e) {
            // Don't fail the parent transaction if audit logging fails
            logger.error("Failed to create audit log entry: {}", e.getMessage(), e);
        }
    }

    /**
     * Retrieve audit trail for a workspace
     */
    @Transactional(readOnly = true)
    public List<AuditTrail> getWorkspaceAuditTrail(Long workspaceId) {
        return auditTrailRepository.findByWorkspaceIdOrderByTimestampDesc(workspaceId);
    }

    /**
     * Retrieve audit trail for a specific payment
     */
    @Transactional(readOnly = true)
    public List<AuditTrail> getPaymentAuditTrail(String paymentIdentifier) {
        return auditTrailRepository.findByPaymentIdentifierOrderByTimestampDesc(paymentIdentifier);
    }

    /**
     * Retrieve recent audit entries for monitoring
     */
    @Transactional(readOnly = true)
    public List<AuditTrail> getRecentAuditTrail(Long workspaceId) {
        return auditTrailRepository.findTop100ByWorkspaceIdOrderByTimestampDesc(workspaceId);
    }
}
