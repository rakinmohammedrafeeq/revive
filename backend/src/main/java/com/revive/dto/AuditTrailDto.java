package com.revive.dto;

import com.revive.enums.AuditActionType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Lightweight read-model for audit trail entries.
 * Avoids lazy-loading issues when serializing JPA entities directly.
 */
@Data
@Builder
public class AuditTrailDto {
    private Long id;
    private LocalDateTime timestamp;
    private AuditActionType actionType;
    private String entityType;
    private Long entityId;
    private String paymentIdentifier;
    private String details;  // raw JSON string from the details column
    private String outcome;
    private Long workspaceId;
    private String userEmail; // null for system actions
}
