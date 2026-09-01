package com.ledgera.entity;

import com.ledgera.enums.AuditActionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;

import java.time.LocalDateTime;

/**
 * Immutable audit log for all recovery-related actions.
 * Provides compliance trail and debugging capability.
 * 
 * IMPORTANT: This entity should never be updated or deleted in application code.
 * Only INSERT operations are allowed (append-only).
 */
@Entity
@Table(name = "audit_trail")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditTrail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * When this audit entry was created
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    /**
     * User who performed the action (null for system actions)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /**
     * Workspace context for the action
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    /**
     * Type of action being audited
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 50)
    private AuditActionType actionType;

    /**
     * Entity type being acted upon (e.g., "FailedPayment", "RecoveryAction")
     */
    @Column(name = "entity_type", length = 100)
    private String entityType;

    /**
     * ID of the entity being acted upon
     */
    @Column(name = "entity_id")
    private Long entityId;

    /**
     * Payment identifier for payment-related actions
     */
    @Column(name = "payment_identifier", length = 255)
    private String paymentIdentifier;

    /**
     * Detailed information about the action
     * Stored as JSONB for flexibility (includes request params, state changes, etc.)
     */
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String details;

    /**
     * Outcome of the action (success, failure, policy violation reason, etc.)
     */
    @Column(length = 1000)
    private String outcome;

    /**
     * IP address of the requesting client
     */
    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    /**
     * User agent string
     */
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }

    // NOTE: No @PreUpdate or update operations - this is append-only
}
