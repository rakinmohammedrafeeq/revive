package com.revive.service;

import com.revive.dto.PolicyEvaluationResult;
import com.revive.entity.FailedPayment;
import com.revive.entity.RecoveryAction;
import com.revive.entity.RecoveryPolicy;
import com.revive.enums.RecoveryActionStatus;
import com.revive.enums.RecoveryActionType;
import com.revive.repository.RecoveryActionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

/**
 * Deterministic policy enforcement engine.
 *
 * This engine is authoritative — the LLM recommendation is only advisory.
 * A policy BLOCK cannot be overridden by any AI decision.
 *
 * Evaluated in order (first match wins):
 * 1. Hard-stop failure types (fraud, dispute) — always blocked
 * 2. Duplicate action in progress             — always blocked
 * 3. Retry limit reached                      — blocked (→ ABANDONED)
 * 4. Cooldown period not satisfied            — blocked (→ wait)
 * 5. Per-payment cost cap                     — blocked
 * 6. Workspace budget cap                     — blocked
 * 7. Channel restriction                      — blocked
 * 8. High-value manual approval threshold     — escalate (not blocked)
 * 9. All checks passed                        — allowed
 */
@Service
public class PolicyEvaluationEngine {

    private static final Logger logger = LoggerFactory.getLogger(PolicyEvaluationEngine.class);

    // Error codes that are permanent — retrying would be wasteful or dangerous
    private static final Set<String> HARD_STOP_ERROR_CODES = Set.of(
            "fraud_suspected", "fraud", "risk_decline", "disputed", "dispute",
            "chargeback", "stolen_card", "blocked_card"
    );

    // Default policy values when no policy is configured
    private static final int DEFAULT_MAX_RETRY_COUNT = 3;
    private static final int DEFAULT_COOLDOWN_HOURS = 1;
    private static final BigDecimal HIGH_VALUE_THRESHOLD = new BigDecimal("50000");

    private final RecoveryActionRepository recoveryActionRepository;

    public PolicyEvaluationEngine(RecoveryActionRepository recoveryActionRepository) {
        this.recoveryActionRepository = recoveryActionRepository;
    }

    /**
     * Evaluate whether a recovery action is permitted.
     *
     * @param payment            The failed payment
     * @param actionType         The LLM-recommended action to evaluate
     * @param policy             Active policy (may be null → uses defaults)
     * @param recoveryProbability ML model probability (not used to allow/block, only for logging)
     * @return PolicyEvaluationResult — allowed / blocked / requires-approval
     */
    @Transactional(readOnly = true)
    public PolicyEvaluationResult evaluateAction(
            FailedPayment payment,
            RecoveryActionType actionType,
            RecoveryPolicy policy,
            double recoveryProbability) {

        // ── RULE 1: Hard-stop failure types ───────────────────────────────
        String errorCode = payment.getErrorCode() != null
                ? payment.getErrorCode().toLowerCase() : "";
        String failureReason = payment.getFailureReason() != null
                ? payment.getFailureReason().toLowerCase() : "";

        boolean isHardStop = HARD_STOP_ERROR_CODES.stream()
                .anyMatch(code -> errorCode.contains(code) || failureReason.contains(code));

        if (isHardStop) {
            logger.info("Hard-stop rule triggered for payment {}: error_code={}",
                    payment.getPaymentIdentifier(), payment.getErrorCode());
            return PolicyEvaluationResult.blocked(
                    String.format("Permanent failure type '%s' — automatic recovery is not safe. Manual investigation required.",
                            payment.getErrorCode()));
        }

        // ── RULE 2: Duplicate action check ────────────────────────────────
        List<RecoveryAction> existingActions = recoveryActionRepository
                .findByFailedPaymentIdOrderByInitiatedAtDesc(payment.getId());

        boolean hasActiveAction = existingActions.stream().anyMatch(a ->
                a.getStatus() == RecoveryActionStatus.INITIATED
                || a.getStatus() == RecoveryActionStatus.IN_PROGRESS);

        if (hasActiveAction) {
            return PolicyEvaluationResult.blocked("A recovery action is already in progress for this payment");
        }

        // Use policy values or defaults
        int maxRetryCount = policy != null ? policy.getMaxRetryCount() : DEFAULT_MAX_RETRY_COUNT;
        int cooldownHours = policy != null ? policy.getCooldownHours() : DEFAULT_COOLDOWN_HOURS;

        // ── RULE 3: Retry limit ────────────────────────────────────────────
        if (payment.getRetryCount() >= maxRetryCount) {
            logger.info("Retry limit reached for payment {}: {}/{}",
                    payment.getPaymentIdentifier(), payment.getRetryCount(), maxRetryCount);
            return PolicyEvaluationResult.blocked(
                    String.format("Retry limit reached (%d/%d attempts used). Payment requires manual review.",
                            payment.getRetryCount(), maxRetryCount));
        }

        // ── RULE 4: Cooldown period ────────────────────────────────────────
        if (payment.getLastRetryAt() != null) {
            long hoursSince = ChronoUnit.HOURS.between(payment.getLastRetryAt(), LocalDateTime.now());
            if (hoursSince < cooldownHours) {
                logger.info("Cooldown active for payment {}: {}h elapsed, {}h required",
                        payment.getPaymentIdentifier(), hoursSince, cooldownHours);
                return PolicyEvaluationResult.blocked(
                        String.format("Cooldown period active — %d of %d hours elapsed. Try again later.",
                                hoursSince, cooldownHours));
            }
        }

        // ── RULE 5: Per-payment cost cap ───────────────────────────────────
        if (policy != null && policy.getMaxRecoveryCostPerPayment() != null) {
            BigDecimal existingCost = existingActions.stream()
                    .map(RecoveryAction::getCost)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal projectedCost = existingCost.add(estimateActionCost(actionType));

            if (projectedCost.compareTo(policy.getMaxRecoveryCostPerPayment()) > 0) {
                return PolicyEvaluationResult.blocked(
                        String.format("Per-payment cost cap would be exceeded (Rs.%s + Rs.%s > Rs.%s)",
                                existingCost, estimateActionCost(actionType),
                                policy.getMaxRecoveryCostPerPayment()));
            }
        }

        // ── RULE 6: Channel restriction ────────────────────────────────────
        if (policy != null && policy.getAllowedChannels() != null
                && !policy.getAllowedChannels().isEmpty()) {
            String requiredChannel = getChannelForActionType(actionType);
            if (!policy.getAllowedChannels().contains(requiredChannel)) {
                return PolicyEvaluationResult.blocked(
                        String.format("Channel '%s' is not permitted by the active policy", requiredChannel));
            }
        }

        // ── RULE 7: High-value manual approval ────────────────────────────
        if (payment.getAmount().compareTo(HIGH_VALUE_THRESHOLD) > 0) {
            logger.info("High-value payment {} requires manual approval: Rs.{}",
                    payment.getPaymentIdentifier(), payment.getAmount());
            return PolicyEvaluationResult.requiresApproval(
                    String.format("Amount Rs.%s exceeds Rs.50,000 threshold — manual approval required",
                            payment.getAmount()));
        }

        // ── All checks passed ─────────────────────────────────────────────
        logger.info("Policy ALLOWED for payment {} — action {}", payment.getPaymentIdentifier(), actionType);
        PolicyEvaluationResult result = PolicyEvaluationResult.allowed();
        result.setPolicyName(policy != null ? policy.getName() : "DEFAULT");
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private BigDecimal estimateActionCost(RecoveryActionType actionType) {
        return switch (actionType) {
            case AUTOMATIC_RETRY -> new BigDecimal("5.00");
            case EMAIL_REMINDER  -> new BigDecimal("2.00");
            case SMS_REMINDER    -> new BigDecimal("1.50");
            case PAYMENT_LINK    -> new BigDecimal("3.00");
            case DISCOUNT_OFFER  -> new BigDecimal("50.00");
            case PHONE_CALL      -> new BigDecimal("20.00");
            case ESCALATION      -> new BigDecimal("100.00");
            case CUSTOM          -> new BigDecimal("10.00");
        };
    }

    private String getChannelForActionType(RecoveryActionType actionType) {
        return switch (actionType) {
            case AUTOMATIC_RETRY -> "AUTOMATIC_RETRY";
            case EMAIL_REMINDER  -> "EMAIL";
            case SMS_REMINDER    -> "SMS";
            case PAYMENT_LINK    -> "EMAIL";
            case DISCOUNT_OFFER  -> "EMAIL";
            case PHONE_CALL      -> "PHONE";
            case ESCALATION      -> "MANUAL";
            case CUSTOM          -> "CUSTOM";
        };
    }
}
