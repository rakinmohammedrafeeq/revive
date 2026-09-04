package com.revive.service;

import com.revive.dto.PolicyEvaluationResult;
import com.revive.entity.FailedPayment;
import com.revive.entity.RecoveryAction;
import com.revive.entity.RecoveryPolicy;
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

/**
 * Deterministic policy enforcement engine.
 * Evaluates whether a recovery action is permitted based on configured policies.
 */
@Service
public class PolicyEvaluationEngine {

    private static final Logger logger = LoggerFactory.getLogger(PolicyEvaluationEngine.class);

    private final RecoveryActionRepository recoveryActionRepository;

    public PolicyEvaluationEngine(RecoveryActionRepository recoveryActionRepository) {
        this.recoveryActionRepository = recoveryActionRepository;
    }

    /**
     * Evaluate whether a recovery action is allowed for this payment
     */
    @Transactional(readOnly = true)
    public PolicyEvaluationResult evaluateAction(
            FailedPayment payment,
            RecoveryActionType actionType,
            RecoveryPolicy policy) {
        
        if (policy == null || !policy.getIsActive()) {
            logger.warn("No active policy found for workspace {}", payment.getWorkspace().getId());
            return PolicyEvaluationResult.blocked("No active recovery policy configured");
        }

        // 1. Check retry limit
        if (payment.getRetryCount() >= policy.getMaxRetryCount()) {
            logger.info("Payment {} exceeded retry limit: {}/{}", 
                    payment.getPaymentIdentifier(), 
                    payment.getRetryCount(), 
                    policy.getMaxRetryCount());
            return PolicyEvaluationResult.blocked(
                    String.format("Retry limit exceeded (%d/%d attempts used)", 
                            payment.getRetryCount(), 
                            policy.getMaxRetryCount()));
        }

        // 2. Check cooldown period
        if (payment.getLastRetryAt() != null) {
            long hoursSinceLastRetry = ChronoUnit.HOURS.between(
                    payment.getLastRetryAt(), 
                    LocalDateTime.now());
            
            if (hoursSinceLastRetry < policy.getCooldownHours()) {
                logger.info("Payment {} in cooldown period: {} hours elapsed, {} required", 
                        payment.getPaymentIdentifier(), 
                        hoursSinceLastRetry, 
                        policy.getCooldownHours());
                return PolicyEvaluationResult.blocked(
                        String.format("Cooldown period active (%d/%d hours elapsed)", 
                                hoursSinceLastRetry, 
                                policy.getCooldownHours()));
            }
        }

        // 3. Check per-payment cost limit
        if (policy.getMaxRecoveryCostPerPayment() != null) {
            BigDecimal totalCost = calculateTotalCost(payment);
            BigDecimal estimatedNewCost = estimateActionCost(actionType);
            BigDecimal projectedTotal = totalCost.add(estimatedNewCost);
            
            if (projectedTotal.compareTo(policy.getMaxRecoveryCostPerPayment()) > 0) {
                logger.info("Payment {} would exceed per-payment cost limit: {} + {} > {}", 
                        payment.getPaymentIdentifier(), 
                        totalCost, 
                        estimatedNewCost, 
                        policy.getMaxRecoveryCostPerPayment());
                return PolicyEvaluationResult.blocked(
                        String.format("Per-payment cost limit would be exceeded (₹%s + ₹%s > ₹%s)", 
                                totalCost, 
                                estimatedNewCost, 
                                policy.getMaxRecoveryCostPerPayment()));
            }
        }

        // 4. Check workspace budget (simplified - would need workspace-level tracking)
        if (policy.getMaxTotalRecoveryBudget() != null) {
            BigDecimal workspaceTotalCost = calculateWorkspaceTotalCost(payment.getWorkspace().getId());
            BigDecimal estimatedNewCost = estimateActionCost(actionType);
            
            if (workspaceTotalCost.add(estimatedNewCost).compareTo(policy.getMaxTotalRecoveryBudget()) > 0) {
                logger.info("Workspace {} would exceed budget: {} + {} > {}", 
                        payment.getWorkspace().getId(), 
                        workspaceTotalCost, 
                        estimatedNewCost, 
                        policy.getMaxTotalRecoveryBudget());
                return PolicyEvaluationResult.blocked(
                        String.format("Workspace recovery budget exhausted (₹%s/₹%s used)", 
                                workspaceTotalCost, 
                                policy.getMaxTotalRecoveryBudget()));
            }
        }

        // 5. Check channel restrictions (if allowedChannels is configured)
        if (policy.getAllowedChannels() != null && !policy.getAllowedChannels().isEmpty()) {
            String channel = getChannelForActionType(actionType);
            if (!policy.getAllowedChannels().contains(channel)) {
                logger.info("Channel {} not allowed for workspace {}", 
                        channel, 
                        payment.getWorkspace().getId());
                return PolicyEvaluationResult.blocked(
                        String.format("Channel '%s' not permitted by policy", channel));
            }
        }

        // 6. Check if manual approval required for high-value payments
        if (payment.getAmount().compareTo(new BigDecimal("50000")) > 0) {
            logger.info("High-value payment {} requires manual approval: ₹{}", 
                    payment.getPaymentIdentifier(), 
                    payment.getAmount());
            return PolicyEvaluationResult.requiresApproval(
                    String.format("Manual approval required for amounts > ₹50,000 (₹%s)", 
                            payment.getAmount()));
        }

        // All checks passed
        logger.info("Policy evaluation passed for payment {}, action {}", 
                payment.getPaymentIdentifier(), 
                actionType);
        
        PolicyEvaluationResult result = PolicyEvaluationResult.allowed();
        result.setPolicyName(policy.getName());
        return result;
    }

    /**
     * Calculate total cost of all recovery actions for this payment
     */
    private BigDecimal calculateTotalCost(FailedPayment payment) {
        List<RecoveryAction> actions = recoveryActionRepository
                .findByFailedPaymentIdOrderByInitiatedAtDesc(payment.getId());
        
        return actions.stream()
                .map(RecoveryAction::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Calculate total recovery cost for workspace
     */
    private BigDecimal calculateWorkspaceTotalCost(Long workspaceId) {
        // Simplified implementation - would need a proper query
        // For now, return zero to avoid blocking
        return BigDecimal.ZERO;
    }

    /**
     * Estimate cost for a recovery action type
     */
    private BigDecimal estimateActionCost(RecoveryActionType actionType) {
        return switch (actionType) {
            case AUTOMATIC_RETRY -> new BigDecimal("5.00");
            case EMAIL_REMINDER -> new BigDecimal("2.00");
            case SMS_REMINDER -> new BigDecimal("1.50");
            case PAYMENT_LINK -> new BigDecimal("3.00");
            case DISCOUNT_OFFER -> new BigDecimal("50.00");
            case PHONE_CALL -> new BigDecimal("20.00");
            case ESCALATION -> new BigDecimal("100.00");
            case CUSTOM -> new BigDecimal("10.00");
        };
    }

    /**
     * Map action type to channel
     */
    private String getChannelForActionType(RecoveryActionType actionType) {
        return switch (actionType) {
            case AUTOMATIC_RETRY -> "AUTOMATIC_RETRY";
            case EMAIL_REMINDER -> "EMAIL";
            case SMS_REMINDER -> "SMS";
            case PAYMENT_LINK -> "EMAIL";
            case DISCOUNT_OFFER -> "EMAIL";
            case PHONE_CALL -> "PHONE";
            case ESCALATION -> "MANUAL";
            case CUSTOM -> "CUSTOM";
        };
    }
}
