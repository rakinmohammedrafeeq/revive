package com.revive.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.revive.entity.*;
import com.revive.enums.AuditActionType;
import com.revive.enums.PaymentStatus;
import com.revive.enums.RecoveryActionStatus;
import com.revive.enums.RecoveryActionType;
import com.revive.repository.FailedPaymentRepository;
import com.revive.repository.RecoveredRevenueRepository;
import com.revive.repository.RecoveryActionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Executes approved recovery actions and tracks outcomes.
 * 
 * This service is responsible for:
 * 1. Creating recovery action records
 * 2. Executing the actual recovery (via Razorpay or other channels)
 * 3. Recording outcomes and updating payment status
 * 4. Creating revenue recovery records for successful recoveries
 * 5. Maintaining audit trail
 */
@Service
public class RecoveryActionExecutor {

    private static final Logger logger = LoggerFactory.getLogger(RecoveryActionExecutor.class);

    private final RecoveryActionRepository recoveryActionRepository;
    private final FailedPaymentRepository failedPaymentRepository;
    private final RecoveredRevenueRepository recoveredRevenueRepository;
    private final RazorpayRecoveryService razorpayService;
    private final AuditTrailService auditTrailService;
    private final PaymentStateValidator stateValidator;
    private final MlPredictionTrackingService mlPredictionTrackingService;
    private final ObjectMapper objectMapper;

    public RecoveryActionExecutor(
            RecoveryActionRepository recoveryActionRepository,
            FailedPaymentRepository failedPaymentRepository,
            RecoveredRevenueRepository recoveredRevenueRepository,
            RazorpayRecoveryService razorpayService,
            AuditTrailService auditTrailService,
            PaymentStateValidator stateValidator,
            MlPredictionTrackingService mlPredictionTrackingService,
            ObjectMapper objectMapper) {
        this.recoveryActionRepository = recoveryActionRepository;
        this.failedPaymentRepository = failedPaymentRepository;
        this.recoveredRevenueRepository = recoveredRevenueRepository;
        this.razorpayService = razorpayService;
        this.auditTrailService = auditTrailService;
        this.stateValidator = stateValidator;
        this.mlPredictionTrackingService = mlPredictionTrackingService;
        this.objectMapper = objectMapper;
    }

    /**
     * Execute a recovery action for a failed payment
     * 
     * @param payment The failed payment
     * @param actionType Type of recovery action to execute
     * @param channel Communication channel or method
     * @param initiatedBy User who initiated (null for automated)
     * @return The created recovery action with outcome
     */
    @Transactional
    public RecoveryAction executeRecoveryAction(
            FailedPayment payment,
            RecoveryActionType actionType,
            String channel,
            User initiatedBy) {
        
        logger.info("Executing recovery action {} for payment {}", 
                actionType, payment.getPaymentIdentifier());

        // Check for terminal states (stopping rule)
        if (stateValidator.isTerminalState(payment.getStatus())) {
            logger.warn("Cannot execute recovery on terminal state {} for payment {}",
                    payment.getStatus(), payment.getPaymentIdentifier());
            
            RecoveryAction blockedAction = RecoveryAction.builder()
                    .failedPayment(payment)
                    .actionType(actionType)
                    .channel(channel)
                    .status(RecoveryActionStatus.BLOCKED)
                    .isAutomated(initiatedBy == null)
                    .initiatedBy(initiatedBy)
                    .initiatedAt(LocalDateTime.now())
                    .completedAt(LocalDateTime.now())
                    .cost(BigDecimal.ZERO)
                    .outcome(serializeOutcome(Map.of(
                            "blocked", true,
                            "reason", "Payment is in terminal state: " + payment.getStatus(),
                            "currentStatus", payment.getStatus().name()
                    )))
                    .build();
            
            return recoveryActionRepository.save(blockedAction);
        }

        // Validate state transition to RETRY_IN_PROGRESS
        if (!stateValidator.isValidTransition(payment.getStatus(), PaymentStatus.RETRY_IN_PROGRESS)) {
            logger.warn("Invalid state transition from {} to RETRY_IN_PROGRESS for payment {}",
                    payment.getStatus(), payment.getPaymentIdentifier());
            
            RecoveryAction blockedAction = RecoveryAction.builder()
                    .failedPayment(payment)
                    .actionType(actionType)
                    .channel(channel)
                    .status(RecoveryActionStatus.BLOCKED)
                    .isAutomated(initiatedBy == null)
                    .initiatedBy(initiatedBy)
                    .initiatedAt(LocalDateTime.now())
                    .completedAt(LocalDateTime.now())
                    .cost(BigDecimal.ZERO)
                    .outcome(serializeOutcome(Map.of(
                            "blocked", true,
                            "reason", "Invalid state transition",
                            "currentStatus", payment.getStatus().name(),
                            "attemptedStatus", "RETRY_IN_PROGRESS"
                    )))
                    .build();
            
            return recoveryActionRepository.save(blockedAction);
        }

        // Create recovery action record
        RecoveryAction action = RecoveryAction.builder()
                .failedPayment(payment)
                .actionType(actionType)
                .channel(channel)
                .status(RecoveryActionStatus.INITIATED)
                .isAutomated(initiatedBy == null)
                .initiatedBy(initiatedBy)
                .initiatedAt(LocalDateTime.now())
                .cost(estimateActionCost(actionType))
                .build();

        action = recoveryActionRepository.save(action);

        // Update payment status (validated transition)
        payment.setStatus(PaymentStatus.RETRY_IN_PROGRESS);
        payment.setRetryCount(payment.getRetryCount() + 1);
        payment.setLastRetryAt(LocalDateTime.now());
        failedPaymentRepository.save(payment);

        // Log audit event
        logAuditEvent(payment, AuditActionType.RECOVERY_INITIATED, action,
                "Recovery action initiated", Map.of(
                        "actionType", actionType.name(),
                        "channel", channel,
                        "automated", action.getIsAutomated()
                ));

        try {
            // Execute the actual recovery
            action.setStatus(RecoveryActionStatus.IN_PROGRESS);
            recoveryActionRepository.save(action);

            RazorpayRecoveryService.RecoveryExecutionResult result = 
                    razorpayService.executeRecovery(payment, action);

            // Store execution details
            action.setOutcome(serializeOutcome(result.getDetails()));
            action.setCompletedAt(LocalDateTime.now());

            if (result.isSuccess()) {
                // Payment successfully recovered!
                handleSuccessfulRecovery(payment, action, result.getRecoveredAmount());
            } else if (result.isPending()) {
                // Action executed but payment not yet recovered (e.g., email sent)
                handlePendingRecovery(payment, action);
            } else {
                // Recovery failed
                handleFailedRecovery(payment, action, result.getErrorMessage());
            }

        } catch (Exception e) {
            logger.error("Error executing recovery action: {}", e.getMessage(), e);
            action.setStatus(RecoveryActionStatus.FAILED);
            action.setOutcome(serializeOutcome(Map.of("error", e.getMessage())));
            action.setCompletedAt(LocalDateTime.now());
            recoveryActionRepository.save(action);

            // Validate transition back to FAILED
            if (stateValidator.isValidTransition(payment.getStatus(), PaymentStatus.FAILED)) {
                payment.setStatus(PaymentStatus.FAILED);
                failedPaymentRepository.save(payment);
            }

            logAuditEvent(payment, AuditActionType.RECOVERY_COMPLETED, action,
                    "Recovery action failed with error", Map.of("error", e.getMessage()));
        }

        return recoveryActionRepository.save(action);
    }

    /**
     * Handle successful payment recovery
     */
    private void handleSuccessfulRecovery(FailedPayment payment, RecoveryAction action, BigDecimal recoveredAmount) {
        logger.info("Payment {} successfully recovered! Amount: {}", 
                payment.getPaymentIdentifier(), recoveredAmount);

        // Update action status
        action.setStatus(RecoveryActionStatus.COMPLETED_SUCCESS);
        recoveryActionRepository.save(action);

        // Validate and update payment status to RECOVERED
        if (stateValidator.isValidTransition(payment.getStatus(), PaymentStatus.RECOVERED)) {
            payment.setStatus(PaymentStatus.RECOVERED);
            payment.setRecoveredAt(LocalDateTime.now());
            failedPaymentRepository.save(payment);

            // Record ML prediction outcome
            mlPredictionTrackingService.recordOutcome(payment.getId(), PaymentStatus.RECOVERED);
        } else {
            logger.error("Invalid transition to RECOVERED from {} for payment {}",
                    payment.getStatus(), payment.getPaymentIdentifier());
            return; // Don't create revenue record if state is inconsistent
        }

        // Calculate total recovery cost for this payment
        BigDecimal totalRecoveryCost = recoveryActionRepository
                .findByFailedPaymentIdOrderByInitiatedAtDesc(payment.getId())
                .stream()
                .map(RecoveryAction::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Create recovered revenue record
        RecoveredRevenue revenue = RecoveredRevenue.builder()
                .failedPayment(payment)
                .recoveryAction(action)
                .recoveredAmount(recoveredAmount)
                .recoveryCost(totalRecoveryCost)
                .netGain(recoveredAmount.subtract(totalRecoveryCost))
                .currency(payment.getCurrency())
                .recoveredAt(LocalDateTime.now())
                .build();

        recoveredRevenueRepository.save(revenue);

        // Log success
        logAuditEvent(payment, AuditActionType.REVENUE_RECOVERED, action,
                "Payment successfully recovered", Map.of(
                        "recoveredAmount", recoveredAmount,
                        "recoveryCost", totalRecoveryCost,
                        "netGain", revenue.getNetGain()
                ));

        logger.info("Created revenue record: recovered ₹{}, cost ₹{}, net gain ₹{}", 
                recoveredAmount, totalRecoveryCost, revenue.getNetGain());
    }

    /**
     * Handle pending recovery (action executed, awaiting customer response)
     */
    private void handlePendingRecovery(FailedPayment payment, RecoveryAction action) {
        logger.info("Recovery action for payment {} is pending customer response", 
                payment.getPaymentIdentifier());

        action.setStatus(RecoveryActionStatus.IN_PROGRESS);
        recoveryActionRepository.save(action);

        // Validate and update payment status to PENDING_RETRY
        if (stateValidator.isValidTransition(payment.getStatus(), PaymentStatus.PENDING_RETRY)) {
            payment.setStatus(PaymentStatus.PENDING_RETRY);
            failedPaymentRepository.save(payment);
        } else {
            logger.warn("Cannot transition to PENDING_RETRY from {} for payment {}",
                    payment.getStatus(), payment.getPaymentIdentifier());
        }

        logAuditEvent(payment, AuditActionType.RECOVERY_INITIATED, action,
                "Recovery action executed, awaiting customer response", Map.of());
    }

    /**
     * Handle failed recovery attempt
     */
    private void handleFailedRecovery(FailedPayment payment, RecoveryAction action, String errorMessage) {
        logger.info("Recovery action for payment {} failed: {}", 
                payment.getPaymentIdentifier(), errorMessage);

        action.setStatus(RecoveryActionStatus.COMPLETED_FAILURE);
        recoveryActionRepository.save(action);

        // Check if we should abandon the payment
        RecoveryPolicy policy = payment.getWorkspace().getId() != null ? 
                getDefaultPolicy() : null;
        
        if (policy != null && payment.getRetryCount() >= policy.getMaxRetryCount()) {
            // Validate transition to ABANDONED
            if (stateValidator.isValidTransition(payment.getStatus(), PaymentStatus.ABANDONED)) {
                payment.setStatus(PaymentStatus.ABANDONED);
                failedPaymentRepository.save(payment);

                // Record ML prediction outcome
                mlPredictionTrackingService.recordOutcome(payment.getId(), PaymentStatus.ABANDONED);

                logAuditEvent(payment, AuditActionType.PAYMENT_ABANDONED, action,
                        "Payment abandoned after exhausting retry limit", Map.of(
                                "retryCount", payment.getRetryCount(),
                                "maxRetries", policy.getMaxRetryCount()
                        ));
            }
        } else {
            // Validate transition back to FAILED
            if (stateValidator.isValidTransition(payment.getStatus(), PaymentStatus.FAILED)) {
                payment.setStatus(PaymentStatus.FAILED);
                failedPaymentRepository.save(payment);

                // Record ML prediction outcome
                mlPredictionTrackingService.recordOutcome(payment.getId(), PaymentStatus.FAILED);
            } else {
                logger.warn("Cannot transition to FAILED from {} for payment {}",
                        payment.getStatus(), payment.getPaymentIdentifier());
            }
        }

        logAuditEvent(payment, AuditActionType.RECOVERY_COMPLETED, action,
                "Recovery action failed", Map.of("errorMessage", errorMessage));
    }

    /**
     * Estimate cost for an action type
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
     * Serialize outcome to JSON string
     */
    private String serializeOutcome(Map<String, Object> outcome) {
        try {
            return objectMapper.writeValueAsString(outcome);
        } catch (JsonProcessingException e) {
            logger.error("Error serializing outcome: {}", e.getMessage());
            return "{}";
        }
    }

    /**
     * Get default policy (simplified - in production would load from database)
     */
    private RecoveryPolicy getDefaultPolicy() {
        return RecoveryPolicy.builder()
                .maxRetryCount(3)
                .cooldownHours(24)
                .build();
    }

    /**
     * Log audit event
     */
    private void logAuditEvent(FailedPayment payment, AuditActionType actionType,
                               RecoveryAction action, String outcome, Map<String, Object> additionalDetails) {
        try {
            Map<String, Object> details = new HashMap<>(additionalDetails);
            details.put("recoveryActionId", action.getId());
            details.put("actionType", action.getActionType().name());
            
            auditTrailService.logAction(
                    action.getInitiatedBy(),
                    payment.getWorkspace(),
                    actionType,
                    "RecoveryAction",
                    action.getId(),
                    payment.getPaymentIdentifier(),
                    details,
                    outcome
            );
        } catch (Exception e) {
            logger.error("Failed to log audit event: {}", e.getMessage());
        }
    }
}
