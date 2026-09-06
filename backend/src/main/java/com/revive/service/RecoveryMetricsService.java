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
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

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
    @Transactional(readOnly = true, timeout = 30)  // 30 second timeout
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

        // ── Case counts (efficient single-query aggregation) ─────────────────
        Map<PaymentStatus, Long> statusCounts = new EnumMap<>(PaymentStatus.class);
        long totalCases = 0;
        for (Object[] row : failedPaymentRepository.countByWorkspaceIdGroupByStatus(workspaceId)) {
            PaymentStatus st = (PaymentStatus) row[0];
            Long count = ((Number) row[1]).longValue();
            statusCounts.put(st, count);
            totalCases += count;
        }
        long recoveredCases    = statusCounts.getOrDefault(PaymentStatus.RECOVERED, 0L);
        long abandonedCases    = statusCounts.getOrDefault(PaymentStatus.ABANDONED, 0L);
        long inProgressCases   = statusCounts.getOrDefault(PaymentStatus.RETRY_IN_PROGRESS, 0L);
        long pendingReviewCases = statusCounts.getOrDefault(PaymentStatus.UNDER_REVIEW, 0L);
        long failedCount       = statusCounts.getOrDefault(PaymentStatus.FAILED, 0L);
        long pendingRetryCount = statusCounts.getOrDefault(PaymentStatus.PENDING_RETRY, 0L);
        long activeCases       = failedCount + pendingRetryCount;

        // ── Recovery Rates (Case-based & Volume-based) ────────────────────────
        // Case recovery rate: % of failed payment cases successfully recovered
        double recoveryRate = 0.0;
        if (totalCases > 0) {
            recoveryRate = ((double) recoveredCases / totalCases) * 100.0;
        }

        // Volume recovery rate: % of gross monetary value recovered
        double volumeRecoveryRate = 0.0;
        if (totalRevenueAtRisk.compareTo(BigDecimal.ZERO) > 0) {
            volumeRecoveryRate = totalRecovered
                    .divide(totalRevenueAtRisk, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"))
                    .doubleValue();
        }

        // ── Policy blocks ────────────────────────────────────────────────────
        long policyBlockedActions = safe(auditTrailRepository
                .countByWorkspaceIdAndActionType(workspaceId, AuditActionType.POLICY_VIOLATION));

        // ── Recovery action outcome counts (single-query aggregation) ────────
        Map<RecoveryActionStatus, Long> actionCounts = new EnumMap<>(RecoveryActionStatus.class);
        long totalAttempts = 0;
        for (Object[] row : recoveryActionRepository.countByWorkspaceIdGroupByStatus(workspaceId)) {
            RecoveryActionStatus st = (RecoveryActionStatus) row[0];
            Long count = ((Number) row[1]).longValue();
            actionCounts.put(st, count);
            totalAttempts += count;
        }

        long successfulRecoveries = actionCounts.getOrDefault(RecoveryActionStatus.COMPLETED_SUCCESS, 0L);

        long failedRecoveries = actionCounts.getOrDefault(RecoveryActionStatus.COMPLETED_FAILURE, 0L)
                + actionCounts.getOrDefault(RecoveryActionStatus.FAILED, 0L);

        long pendingRecoveries = actionCounts.getOrDefault(RecoveryActionStatus.IN_PROGRESS, 0L)
                + actionCounts.getOrDefault(RecoveryActionStatus.INITIATED, 0L);

        // ── Expected Recovery Value ──────────────────────────────────────────
        BigDecimal expectedRecoveryValue = calculateExpectedRecoveryValue(workspaceId);

        return RecoveryMetricsResponse.builder()
                .totalRevenueAtRisk(totalRevenueAtRisk)
                .totalRecovered(totalRecovered)
                .totalRecoveryCost(totalRecoveryCost)
                .netGain(netGain)
                .roi(roi)
                .recoveryRate(recoveryRate)
                .volumeRecoveryRate(volumeRecoveryRate)
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
     * Calculated via database-level aggregation.
     */
    private BigDecimal calculateTotalRevenueAtRisk(Long workspaceId) {
        return safe(failedPaymentRepository.sumAmountByWorkspaceId(workspaceId));
    }

    /**
     * Expected Recovery Value = SUM(P(recovery) × amount) for active FAILED payments.
     * Uses calibrated ML weights directly for ultra-fast, production-safe calculation.
     */
    private BigDecimal calculateExpectedRecoveryValue(Long workspaceId) {
        List<FailedPayment> activePayments = failedPaymentRepository
                .findByWorkspaceIdAndStatus(workspaceId, PaymentStatus.FAILED);
        activePayments.addAll(failedPaymentRepository
                .findByWorkspaceIdAndStatus(workspaceId, PaymentStatus.PENDING_RETRY));

        BigDecimal erv = BigDecimal.ZERO;
        for (FailedPayment payment : activePayments) {
            try {
                double probability = predictionModel.predictFast(payment);
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
     * Queries only timestamp columns without instantiating entity graphs.
     */
    private Double calculateAverageRecoveryTime(Long workspaceId) {
        List<Object[]> timestampPairs = failedPaymentRepository
                .findRecoveryTimestampsByWorkspaceId(workspaceId);

        if (timestampPairs.isEmpty()) return 0.0;

        return timestampPairs.stream()
                .filter(p -> p[0] != null && p[1] != null)
                .mapToDouble(p -> Duration.between((LocalDateTime) p[0], (LocalDateTime) p[1]).toMinutes())
                .filter(m -> m > 0)
                .average()
                .orElse(0.0);
    }

    // Null-safe helpers
    private BigDecimal safe(BigDecimal v) { return v != null ? v : BigDecimal.ZERO; }
    private long safe(Long v)             { return v != null ? v : 0L; }
}
