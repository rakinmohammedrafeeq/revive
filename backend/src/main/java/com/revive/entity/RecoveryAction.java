package com.revive.entity;

import com.revive.enums.RecoveryActionStatus;
import com.revive.enums.RecoveryActionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Represents a recovery action taken on a failed payment.
 * Tracks the lifecycle and outcome of each recovery attempt.
 */
@Entity
@Table(name = "recovery_actions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecoveryAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Failed payment this action targets
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "failed_payment_id", nullable = false)
    private FailedPayment failedPayment;

    /**
     * Type of recovery action
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 50)
    private RecoveryActionType actionType;

    /**
     * Communication channel or method used
     */
    @Column(name = "channel", length = 100)
    private String channel;

    /**
     * Current status of this action
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private RecoveryActionStatus status = RecoveryActionStatus.INITIATED;

    /**
     * Whether action was automated or manual
     */
    @Column(name = "is_automated", nullable = false)
    @Builder.Default
    private Boolean isAutomated = true;

    /**
     * User who initiated manual action (null for automated)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiated_by")
    private User initiatedBy;

    /**
     * Outcome details (gateway response, customer reply, etc.)
     * Stored as JSONB for flexibility
     */
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private String outcome;

    /**
     * Cost of this recovery action (SMS cost, discount amount, manual effort cost)
     */
    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal cost = BigDecimal.ZERO;

    /**
     * When the action was initiated
     */
    @Column(name = "initiated_at", nullable = false)
    private LocalDateTime initiatedAt;

    /**
     * When the action completed (success or failure)
     */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.initiatedAt == null) {
            this.initiatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
