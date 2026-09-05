package com.revive.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.revive.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Represents a failed payment that requires recovery action.
 * Core entity for the Revive revenue recovery workflow.
 */
@Entity
@Table(name = "failed_payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FailedPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Workspace/merchant this payment belongs to
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    @JsonIgnore
    private Workspace workspace;

    /**
     * External payment/order identifier from payment gateway
     */
    @Column(name = "payment_identifier", nullable = false, length = 255)
    private String paymentIdentifier;

    /**
     * External order identifier if different from payment ID
     */
    @Column(name = "order_identifier", length = 255)
    private String orderIdentifier;

    /**
     * Customer identifier for recovery contact
     */
    @Column(name = "customer_id", nullable = false, length = 255)
    private String customerId;

    /**
     * Customer email for recovery notifications
     */
    @Column(name = "customer_email", length = 255)
    private String customerEmail;

    /**
     * Customer phone for SMS/call recovery
     */
    @Column(name = "customer_phone", length = 50)
    private String customerPhone;

    /**
     * Customer name for personalized recovery
     */
    @Column(name = "customer_name", length = 255)
    private String customerName;

    /**
     * Failed payment amount
     */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    /**
     * Currency code (e.g., INR, USD)
     */
    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "INR";

    /**
     * Current status in recovery workflow
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.FAILED;

    /**
     * Human-readable failure reason
     */
    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    /**
     * Gateway error code
     */
    @Column(name = "error_code", length = 100)
    private String errorCode;

    /**
     * Payment method used (UPI, CARD, NET_BANKING, etc.)
     */
    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    /**
     * Number of recovery attempts made
     */
    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private Integer retryCount = 0;

    /**
     * When the payment initially failed
     */
    @Column(name = "failed_at", nullable = false)
    private LocalDateTime failedAt;

    /**
     * When the last recovery attempt was made
     */
    @Column(name = "last_retry_at")
    private LocalDateTime lastRetryAt;

    /**
     * When payment was recovered (if successful)
     */
    @Column(name = "recovered_at")
    private LocalDateTime recoveredAt;

    /**
     * Additional metadata (gateway response, customer preferences, etc.)
     * Stored as JSONB for flexibility
     */
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private String metadata;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.failedAt == null) {
            this.failedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
