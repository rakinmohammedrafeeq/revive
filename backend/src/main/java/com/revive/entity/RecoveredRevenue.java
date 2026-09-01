package com.revive.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Tracks successfully recovered revenue for metrics and ROI calculation.
 * Links recovered payments to the actions that succeeded.
 */
@Entity
@Table(name = "recovered_revenue")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecoveredRevenue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Failed payment that was recovered
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "failed_payment_id", nullable = false)
    private FailedPayment failedPayment;

    /**
     * Recovery action that succeeded
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recovery_action_id", nullable = false)
    private RecoveryAction recoveryAction;

    /**
     * Amount successfully recovered
     */
    @Column(name = "recovered_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal recoveredAmount;

    /**
     * Total cost of all recovery attempts for this payment
     */
    @Column(name = "recovery_cost", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal recoveryCost = BigDecimal.ZERO;

    /**
     * Net gain (recovered amount - recovery cost)
     */
    @Column(name = "net_gain", nullable = false, precision = 15, scale = 2)
    private BigDecimal netGain;

    /**
     * Currency code
     */
    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "INR";

    /**
     * When the payment was recovered
     */
    @Column(name = "recovered_at", nullable = false)
    private LocalDateTime recoveredAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.recoveredAt == null) {
            this.recoveredAt = LocalDateTime.now();
        }
        // Calculate net gain if not set
        if (this.netGain == null && this.recoveredAmount != null && this.recoveryCost != null) {
            this.netGain = this.recoveredAmount.subtract(this.recoveryCost);
        }
    }
}
