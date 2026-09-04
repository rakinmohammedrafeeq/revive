package com.revive.service;

import com.revive.dto.RecoveryMetricsResponse;
import com.revive.entity.FailedPayment;
import com.revive.enums.AuditActionType;
import com.revive.enums.PaymentStatus;
import com.revive.enums.RecoveryActionStatus;
import com.revive.ml.RecoveryPredictionModel;
import com.revive.repository.AuditTrailRepository;
import com.revive.repository.FailedPaymentRepository;
import com.revive.repository.RecoveredRevenueRepository;
import com.revive.repository.RecoveryActionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for calculating recovery metrics and ROI.
 *
 * All metrics are derived from actual database records — no fake/hardcoded values.
 *
 * Key formulas:
 *   Recovery Rate = totalRecovered / totalRevenueAtRisk × 100
 *   ROI = netGain / totalRecoveryCost × 100
 *   ERV = SUM(ML_probability × payment_amount) for active failed payments
 *   Net Gain = totalRecovered - totalRecoveryCost
 */
@Service
public class RecoveryMetricsService {

    private static final Logger logger = LoggerFactory.getLogger(RecoveryMetricsService.class);

    private final FailedPaymentRepository failedPaymentRepository;
    private final RecoveredRevenueRepository recoveredRevenueRepository;
    private final RecoveryActionRepository recoveryActionRepository;
    private final AuditTrailRepository auditTrailRepository;
    private final RecoveryPredictionModel predictionModel;

    public RecoveryMetricsService(
            FailedPaymentRepository failedPaymentRepository,
            RecoveredRevenueRepository recoveredRevenueRepository,
            RecoveryActionRepository recoveryActionRepository,
            AuditTrailRepository auditTrailRepository,
            RecoveryPredictionModel predictionModel) {
        this.failedPaymentRepository = failedPaymentRepository;
        this.recoveredRevenueRepository = recoveredRevenueRepository;
        this.recoveryActionRepository = recoveryActionRepository;
        this.auditTrailRepository = auditTrailRepository;
        this.predictionModel = predictionModel;
    }

    /** Calculate comprehensive recovery metrics for workspace */
    @Transactional(readOnly = true)
    public RecoveryMetricsResponse calculateMetrics(Long workspaceId) {
        return calculateMetrics(workspaceId, null, null);
    }

    /** Calculate recovery metrics for workspace within optional time range */
    @Transactional(readOnly = true)
    public RecoveryMetricsResponse calculateMetrics(
            Long workspaceId,
            LocalDateTime startDate,
            LocalDateTime endDate) {

        logger.info("Calculating recovery metrics for workspace {}", workspaceId);

        // ── Revenue amounts ─────────────────────────────────────────────────
        BigDecimal totalRevenueAtRisk = calculateTotalRevenueAtRisk(workspaceId);

        BigDecimal totalRecovered = safe(recoveredRevenueRepository
                .calculateTotalRecoveredAmount(workspaceId));

        BigDecimal totalRecoveryCost = safe(recoveredRevenueRepository
                .calculateTotalRecoveryCost(workspaceId));

        BigDecimal netGain = safe(recoveredRevenueRepository
                .calculateTotalNetGain(workspaceId));

        // ── ROI ─────────────────────────────────────────────────────────────
        BigDecimal roi = BigDecimal.ZERO;
        if (totalRecoveryCost.compareTo(BigDecimal.ZERO) > 0) {
            roi = netGain.divide(totalRecoveryCost, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        // ── Recovery Rate ────────────────────────────────────────────────────
        double recoveryRate = 0.0;
        if (totalRevenueAtRisk.compareTo(BigDecimal.ZERO) > 0) {
            recoveryRate = totalRecovered
                    .divide(totalRevenueAtRisk, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"))
                    .doubleValue();
        }

        // ── Case counts ─────────────────────────────────────────────────────
        long totalCases        = safe(failedPaymentRepository.countByWorkspaceId(workspaceId));
        long recoveredCases    = safe(failedPaymentRepository.countByWorkspaceIdAndStatus(workspaceId, PaymentStatus.RECOVERED));
        long abandonedCases    = safe(failedPaymentRepository.countByWorkspaceIdAndStatus(workspaceId, PaymentStatus.ABANDONED));
        long inProgressCases   = safe(failedPaymentRepository.countByWorkspaceIdAndStatus(workspaceId, PaymentStatus.RETRY_IN_PROGRESS));
        long pendingReviewCases = safe(failedPaymentRepository.countByWorkspaceIdAndStatus(workspaceId, PaymentStatus.UNDER_REVIEW));
        long failedCount       = safe(failedPaymentRepository.countByWorkspaceIdAndStatus(workspaceId, PaymentStatus.FAILED));
        long pendingRetryCount = safe(failedPaymentRepository.countByWorkspaceIdAndStatus(workspaceId, PaymentStatus.PENDING_RETRY));
        long activeCases       = failedCount + pendingRetryCount;

        // ── Policy blocks ────────────────────────────────────────────────────
        long policyBlockedActions = safe(auditTrailRepository
                .countByWorkspaceIdAndActionType(workspaceId, AuditActionType.POLICY_VIOLATION));

        // ── Recovery action outcome counts (from recovery_actions table) ─────
        long totalAttempts = recoveryActionRepository.countByFailedPaymentWorkspaceId(workspaceId);

        long successfulRecoveries = recoveryActionRepository
                .countByFailedPaymentWorkspaceIdAndStatus(workspaceId, RecoveryActionStatus.COMPLETED_SUCCESS);

        long failedRecoveries = recoveryActionRepository
                .countByFailedPaymentWorkspaceIdAndStatus(workspaceId, RecoveryActionStatus.COMPLETED_FAILURE)
                + recoveryActionRepository.countByFailedPaymentWorkspaceIdAndStatus(workspaceId, RecoveryActionStatus.FAILED);

        long pendingRecoveries = recoveryActionRepository
                .countByFailedPaymentWorkspaceIdAndStatus(workspaceId, RecoveryActionStatus.IN_PROGRESS)
                + recoveryActionRepository.countByFailedPaymentWorkspaceIdAndStatus(workspaceId, RecoveryActionStatus.INITIATED);

        // ── Expected Recovery Value ──────────────────────────────────────────
        BigDecimal expectedRecoveryValue = calculateExpectedRecoveryValue(workspaceId);

        return RecoveryMetricsResponse.builder()
                .totalRevenueAtRisk(totalRevenueAtRisk)
                .totalRecovered(totalRecovered)
                .totalRecoveryCost(totalRecoveryCost)
                .netGain(netGain)
                .roi(roi)
                .recoveryRate(recoveryRate)
                .totalCases(totalCases)
                .recoveredCases(recoveredCases)
                .abandonedCases(abandonedCases)
                .inProgressCases(inProgressCases)
                .pendingReviewCases(pendingReviewCases)
                .activeCases(activeCases)
                .policyBlockedActions(policyBlockedActions)
                .totalAttempts(totalAttempts)
                .successfulRecoveries(successfulRecoveries)
                .failedRecoveries(failedRecoveries)
                .pendingRecoveries(pendingRecoveries)
                .averageRecoveryTime(calculateAverageRecoveryTime(workspaceId))
                .expectedRecoveryValue(expectedRecoveryValue)
                .startDate(startDate)
                .endDate(endDate)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Total revenue at risk = sum of all failed payment amounts in workspace.
     * Includes ALL statuses (FAILED, RECOVERED, ABANDONED, etc.) to show
     * the full historical picture of revenue that was at risk.
     */
    private BigDecimal calculateTotalRevenueAtRisk(Long workspaceId) {
        List<FailedPayment> payments = failedPaymentRepository
                .findByWorkspaceIdOrderByFailedAtDesc(workspaceId);
        return payments.stream()
                .map(FailedPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Expected Recovery Value = SUM(P(recovery) × amount) for active FAILED payments.
     *
     * Uses the ACTUAL trained ML model — never hardcoded.
     */
    private BigDecimal calculateExpectedRecoveryValue(Long workspaceId) {
        List<FailedPayment> activePayments = failedPaymentRepository
                .findByWorkspaceIdAndStatus(workspaceId, PaymentStatus.FAILED);
        activePayments.addAll(failedPaymentRepository
                .findByWorkspaceIdAndStatus(workspaceId, PaymentStatus.PENDING_RETRY));

        BigDecimal erv = BigDecimal.ZERO;
        for (FailedPayment payment : activePayments) {
            try {
                double probability = predictionModel.predictRecoveryProbability(payment);
                erv = erv.add(payment.getAmount().multiply(BigDecimal.valueOf(probability)));
            } catch (Exception e) {
                logger.warn("Failed to predict for payment {}: {}",
                        payment.getPaymentIdentifier(), e.getMessage());
            }
        }
        return erv.setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Average time from failure → recovery in minutes.
     * Only considers payments with both failedAt and recoveredAt timestamps.
     */
    private Double calculateAverageRecoveryTime(Long workspaceId) {
        List<FailedPayment> recoveredPayments = failedPaymentRepository
                .findByWorkspaceIdAndStatus(workspaceId, PaymentStatus.RECOVERED);

        if (recoveredPayments.isEmpty()) return 0.0;

        return recoveredPayments.stream()
                .filter(p -> p.getFailedAt() != null && p.getRecoveredAt() != null)
                .mapToDouble(p -> Duration.between(p.getFailedAt(), p.getRecoveredAt()).toMinutes())
                .filter(m -> m > 0)
                .average()
                .orElse(0.0);
    }

    // Null-safe helpers
    private BigDecimal safe(BigDecimal v) { return v != null ? v : BigDecimal.ZERO; }
    private long safe(Long v)             { return v != null ? v : 0L; }
}
