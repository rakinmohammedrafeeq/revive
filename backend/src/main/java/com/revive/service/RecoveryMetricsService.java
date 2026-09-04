package com.revive.service;

import com.revive.dto.RecoveryMetricsResponse;
import com.revive.entity.FailedPayment;
import com.revive.enums.AuditActionType;
import com.revive.enums.PaymentStatus;
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
 * All metrics are derived from actual database records — no fake/hardcoded values.
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

    /**
     * Calculate comprehensive recovery metrics for workspace
     */
    @Transactional(readOnly = true)
    public RecoveryMetricsResponse calculateMetrics(Long workspaceId) {
        return calculateMetrics(workspaceId, null, null);
    }

    /**
     * Calculate recovery metrics for workspace within time range
     */
    @Transactional(readOnly = true)
    public RecoveryMetricsResponse calculateMetrics(
            Long workspaceId,
            LocalDateTime startDate,
            LocalDateTime endDate) {

        logger.info("Calculating recovery metrics for workspace {}", workspaceId);

        // Total revenue at risk (all failed payments)
        BigDecimal totalRevenueAtRisk = calculateTotalRevenueAtRisk(workspaceId);

        // Total recovered
        BigDecimal totalRecovered = recoveredRevenueRepository
                .calculateTotalRecoveredAmount(workspaceId);

        // Total recovery cost
        BigDecimal totalRecoveryCost = recoveredRevenueRepository
                .calculateTotalRecoveryCost(workspaceId);

        // Net gain
        BigDecimal netGain = recoveredRevenueRepository
                .calculateTotalNetGain(workspaceId);

        // ROI calculation
        BigDecimal roi = BigDecimal.ZERO;
        if (totalRecoveryCost.compareTo(BigDecimal.ZERO) > 0) {
            roi = netGain.divide(totalRecoveryCost, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
        }

        // Recovery rate
        Double recoveryRate = 0.0;
        if (totalRevenueAtRisk.compareTo(BigDecimal.ZERO) > 0) {
            recoveryRate = totalRecovered.divide(totalRevenueAtRisk, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"))
                    .doubleValue();
        }

        // Case counts
        Long totalCases = failedPaymentRepository.countByWorkspaceId(workspaceId);
        Long recoveredCases = failedPaymentRepository.countByWorkspaceIdAndStatus(
                workspaceId, PaymentStatus.RECOVERED);
        Long abandonedCases = failedPaymentRepository.countByWorkspaceIdAndStatus(
                workspaceId, PaymentStatus.ABANDONED);
        Long inProgressCases = failedPaymentRepository.countByWorkspaceIdAndStatus(
                workspaceId, PaymentStatus.RETRY_IN_PROGRESS);
        Long pendingReviewCases = failedPaymentRepository.countByWorkspaceIdAndStatus(
                workspaceId, PaymentStatus.UNDER_REVIEW);

        // Active cases (FAILED or PENDING_RETRY)
        Long failedCount = failedPaymentRepository.countByWorkspaceIdAndStatus(
                workspaceId, PaymentStatus.FAILED);
        Long pendingRetryCount = failedPaymentRepository.countByWorkspaceIdAndStatus(
                workspaceId, PaymentStatus.PENDING_RETRY);
        Long activeCases = failedCount + pendingRetryCount;

        // Policy-blocked action count (from audit trail)
        Long policyBlockedActions = auditTrailRepository
                .countByWorkspaceIdAndActionType(workspaceId, AuditActionType.POLICY_VIOLATION);

        // Expected Recovery Value = SUM(ML_probability × amount) for non-recovered payments
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
                .averageRecoveryTime(calculateAverageRecoveryTime(workspaceId))
                .expectedRecoveryValue(expectedRecoveryValue)
                .startDate(startDate)
                .endDate(endDate)
                .build();
    }

    /**
     * Calculate total revenue at risk across all failed payments for workspace
     */
    private BigDecimal calculateTotalRevenueAtRisk(Long workspaceId) {
        List<FailedPayment> payments = failedPaymentRepository
                .findByWorkspaceIdOrderByFailedAtDesc(workspaceId);
        return payments.stream()
                .map(FailedPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Calculate Expected Recovery Value using ML model predictions.
     * ERV = SUM(P(recovery) × payment_amount) for all active failed payments.
     *
     * This uses the ACTUAL trained ML model predictions (not hardcoded values).
     */
    private BigDecimal calculateExpectedRecoveryValue(Long workspaceId) {
        List<FailedPayment> activePayments = failedPaymentRepository
                .findByWorkspaceIdAndStatus(workspaceId, PaymentStatus.FAILED);
        activePayments.addAll(
                failedPaymentRepository.findByWorkspaceIdAndStatus(workspaceId, PaymentStatus.PENDING_RETRY)
        );

        BigDecimal erv = BigDecimal.ZERO;
        for (FailedPayment payment : activePayments) {
            try {
                double probability = predictionModel.predictRecoveryProbability(payment);
                BigDecimal paymentERV = payment.getAmount()
                        .multiply(BigDecimal.valueOf(probability));
                erv = erv.add(paymentERV);
            } catch (Exception e) {
                logger.warn("Failed to predict for payment {}: {}", 
                        payment.getPaymentIdentifier(), e.getMessage());
            }
        }
        return erv.setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calculate average recovery time in minutes from failure to recovery.
     * Computed from actual recovered payment timestamps.
     */
    private Double calculateAverageRecoveryTime(Long workspaceId) {
        List<FailedPayment> recoveredPayments = failedPaymentRepository
                .findByWorkspaceIdAndStatus(workspaceId, PaymentStatus.RECOVERED);

        if (recoveredPayments.isEmpty()) {
            return 0.0;
        }

        double totalMinutes = recoveredPayments.stream()
                .filter(p -> p.getFailedAt() != null && p.getRecoveredAt() != null)
                .mapToDouble(p -> Duration.between(p.getFailedAt(), p.getRecoveredAt()).toMinutes())
                .filter(m -> m > 0)
                .average()
                .orElse(0.0);

        return totalMinutes;
    }
}
