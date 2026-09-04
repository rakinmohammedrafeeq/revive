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

    // ── Performance Metrics ──────────────────────────────────────────────────
    /** Average time from failure to recovery in minutes */
    private Double averageRecoveryTime;

    // ── Expected Recovery Value ─────────────────────────────────────────────
    /**
     * Expected Recovery Value = SUM(recovery_probability × payment_amount)
     * This is the revenue we expect to recover based on ML predictions.
     */
    private BigDecimal expectedRecoveryValue;

    // ── Time Range ─────────────────────────────────────────────────────────
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
