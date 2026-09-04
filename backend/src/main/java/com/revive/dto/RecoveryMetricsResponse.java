package com.revive.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Comprehensive recovery metrics response for dashboard and analytics.
 * All values are derived from actual database records — never faked.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RecoveryMetricsResponse {

    // ── Core Revenue Metrics ───────────────────────────────────────────────
    /** Total amount of all failed payments (money at risk) */
    private BigDecimal totalRevenueAtRisk;

    /** Total amount successfully recovered */
    private BigDecimal totalRecovered;

    /** Total cost spent on recovery actions */
    private BigDecimal totalRecoveryCost;

    /** Net gain after deducting recovery costs */
    private BigDecimal netGain;

    /** Return on investment as percentage */
    private BigDecimal roi;

    /** Recovery rate as percentage (recovered / at-risk) */
    private Double recoveryRate;

    // ── Case Counts ─────────────────────────────────────────────────────────
    /** All failed payment cases */
    private Long totalCases;

    /** Successfully recovered cases */
    private Long recoveredCases;

    /** Cases abandoned after exhausting retry limit */
    private Long abandonedCases;

    /** Cases with recovery currently in progress */
    private Long inProgressCases;

    /** Cases flagged for manual review */
    private Long pendingReviewCases;

    /** Active cases (FAILED + PENDING_RETRY) */
    private Long activeCases;

    /** Number of recovery attempts blocked by policy engine */
    private Long policyBlockedActions;

    // ── Recovery Action Outcomes ────────────────────────────────────────────
    /** Total number of recovery action attempts */
    private Long totalAttempts;

    /** Actions that resulted in successful payment */
    private Long successfulRecoveries;

    /** Actions that failed (payment declined again) */
    private Long failedRecoveries;

    /** Actions that are pending customer response (email/SMS/link sent) */
    private Long pendingRecoveries;

    // ── Performance Metrics ──────────────────────────────────────────────────
    /** Average time from failure to recovery in minutes */
    private Double averageRecoveryTime;

    // ── Expected Recovery Value ─────────────────────────────────────────────
    /**
     * Expected Recovery Value = SUM(recovery_probability × payment_amount)
     * This is the revenue we expect to recover based on ML predictions.
     */
    private BigDecimal expectedRecoveryValue;

    // ── Batch Evaluation ───────────────────────────────────────────────────
    /** Number of payments evaluated in the last batch run */
    private Integer batchEvaluatedCount;

    /** Batch evaluation timestamp */
    private LocalDateTime batchRunAt;

    // ── Time Range ─────────────────────────────────────────────────────────
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
