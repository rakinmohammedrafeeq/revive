package com.ledgera.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Configurable guardrails for recovery actions.
 * Defines limits and rules for automated and manual recovery.
 */
@Entity
@Table(name = "recovery_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecoveryPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Workspace this policy applies to
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    /**
     * Human-readable policy name
     */
    @Column(nullable = false, length = 255)
    private String name;

    /**
     * Policy description
     */
    @Column(length = 1000)
    private String description;

    /**
     * Maximum retry attempts per payment
     */
    @Column(name = "max_retry_count", nullable = false)
    @Builder.Default
    private Integer maxRetryCount = 3;

    /**
     * Cooldown period between retries in hours
     */
    @Column(name = "cooldown_hours", nullable = false)
    @Builder.Default
    private Integer cooldownHours = 24;

    /**
     * Maximum recovery cost per payment (e.g., max ₹100 to recover ₹1000)
     */
    @Column(name = "max_recovery_cost_per_payment", precision = 10, scale = 2)
    private BigDecimal maxRecoveryCostPerPayment;

    /**
     * Maximum total recovery budget for workspace
     */
    @Column(name = "max_total_recovery_budget", precision = 15, scale = 2)
    private BigDecimal maxTotalRecoveryBudget;

    /**
     * Allowed recovery channels (comma-separated or JSONB array)
     */
    @Type(JsonBinaryType.class)
    @Column(name = "allowed_channels", columnDefinition = "jsonb")
    private String allowedChannels;

    /**
     * Additional policy rules (payment method restrictions, time windows, etc.)
     * Stored as JSONB for flexibility
     */
    @Type(JsonBinaryType.class)
    @Column(name = "policy_rules", columnDefinition = "jsonb")
    private String policyRules;

    /**
     * Whether this policy is currently active
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Priority for policy evaluation (lower number = higher priority)
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer priority = 100;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
