package com.revive.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revive.dto.*;
import com.revive.entity.FailedPayment;
import com.revive.entity.RecoveryPolicy;
import com.revive.enums.AuditActionType;
import com.revive.enums.PaymentStatus;
import com.revive.enums.RecoveryActionType;
import com.revive.ml.RecoveryPredictionModel;
import com.revive.repository.FailedPaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

/**
 * Core recovery orchestration service.
 * Coordinates the complete recovery workflow from detection to outcome.
 */
@Service
public class RecoveryOrchestrationService {

    private static final Logger logger = LoggerFactory.getLogger(RecoveryOrchestrationService.class);

    private final FailedPaymentRepository failedPaymentRepository;
    private final RecoveryPolicyService policyService;
    private final PolicyEvaluationEngine policyEvaluationEngine;
    private final AiRecoveryDiagnosisService diagnosisService;
    private final RecoveryPredictionModel predictionModel;
    private final AuditTrailService auditTrailService;
    private final ObjectMapper objectMapper;

    public RecoveryOrchestrationService(
            FailedPaymentRepository failedPaymentRepository,
            RecoveryPolicyService policyService,
            PolicyEvaluationEngine policyEvaluationEngine,
            AiRecoveryDiagnosisService diagnosisService,
            RecoveryPredictionModel predictionModel,
            AuditTrailService auditTrailService,
            ObjectMapper objectMapper) {
        this.failedPaymentRepository = failedPaymentRepository;
        this.policyService = policyService;
        this.policyEvaluationEngine = policyEvaluationEngine;
        this.diagnosisService = diagnosisService;
        this.predictionModel = predictionModel;
        this.auditTrailService = auditTrailService;
        this.objectMapper = objectMapper;
    }

    /**
     * Process a failed payment through the complete recovery workflow
     */
    @Transactional
    public RecoveryDecision processFailedPayment(Long failedPaymentId) {
        logger.info("Starting recovery process for payment ID: {}", failedPaymentId);

        // 1. Load payment
        FailedPayment payment = failedPaymentRepository.findById(failedPaymentId)
                .orElseThrow(() -> new RuntimeException("Failed payment not found: " + failedPaymentId));

        // Check if already recovered
        if (payment.getStatus() == PaymentStatus.RECOVERED) {
            logger.info("Payment {} already recovered", payment.getPaymentIdentifier());
            return RecoveryDecision.blocked(failedPaymentId, "Payment already recovered");
        }

        // Check if abandoned
        if (payment.getStatus() == PaymentStatus.ABANDONED) {
            logger.info("Payment {} was abandoned", payment.getPaymentIdentifier());
            return RecoveryDecision.blocked(failedPaymentId, "Payment marked as abandoned");
        }

        try {
            // 2. ML Recovery Probability Prediction
            logger.info("Predicting recovery probability for payment {}", payment.getPaymentIdentifier());
            double recoveryProbability = predictionModel.predictRecoveryProbability(payment);
            
            logAuditEvent(payment, AuditActionType.POLICY_CHECK, "ML_PREDICTION", 
                    Map.of(
                        "recoveryProbability", recoveryProbability,
                        "modelType", "LogisticRegression"
                    ),
                    String.format("ML predicted recovery probability: %.2f", recoveryProbability));

            // 3. AI Diagnosis
            logger.info("Running AI diagnosis for payment {}", payment.getPaymentIdentifier());
            AiDiagnosisResult diagnosis = diagnosisService.diagnose(payment);
            
            logAuditEvent(payment, AuditActionType.POLICY_CHECK, "AI_DIAGNOSIS", 
                    Map.of(
                        "diagnosis", diagnosis.getDiagnosis(),
                        "confidence", diagnosis.getConfidence(),
                        "suggestedAction", diagnosis.getSuggestedAction()
                    ),
                    String.format("AI Diagnosis: %s (confidence: %.2f)", 
                            diagnosis.getDiagnosis(), diagnosis.getConfidence()));

            // 4. Generate recommendation
            RecoveryRecommendation recommendation = buildRecommendation(diagnosis);
            
            logAuditEvent(payment, AuditActionType.RECOVERY_INITIATED, "RECOMMENDATION", 
                    Map.of(
                        "actionType", recommendation.getActionType().name(),
                        "reasoning", recommendation.getReasoning()
                    ),
                    String.format("Recommended: %s", recommendation.getActionType()));

            // 5. Get active policy
            RecoveryPolicy policy = policyService.getActivePolicies(payment.getWorkspace().getId())
                    .stream()
                    .findFirst()
                    .orElse(null);

            // 6. Evaluate policy
            logger.info("Evaluating policy for payment {}", payment.getPaymentIdentifier());
            PolicyEvaluationResult policyResult = policyEvaluationEngine.evaluateAction(
                    payment, 
                    recommendation.getActionType(), 
                    policy);

            logAuditEvent(payment, AuditActionType.POLICY_CHECK, "POLICY_EVALUATION", 
                    Map.of(
                        "allowed", policyResult.getAllowed(),
                        "reason", policyResult.getReason(),
                        "requiresApproval", policyResult.getRequiresApproval() != null ? policyResult.getRequiresApproval() : false
                    ),
                    policyResult.getReason());

            // 7. Make decision
            RecoveryDecision decision = RecoveryDecision.builder()
                    .failedPaymentId(failedPaymentId)
                    .recoveryProbability(recoveryProbability) // Use ML prediction
                    .aiDiagnosis(diagnosis)
                    .recommendation(recommendation)
                    .policyResult(policyResult)
                    .build();

            if (!policyResult.getAllowed()) {
                decision.setDecision("BLOCKED");
                decision.setReason(policyResult.getReason());
                
                // Update payment status if needed
                if (payment.getRetryCount() >= (policy != null ? policy.getMaxRetryCount() : 3)) {
                    payment.setStatus(PaymentStatus.UNDER_REVIEW);
                    failedPaymentRepository.save(payment);
                }
                
                logAuditEvent(payment, AuditActionType.POLICY_VIOLATION, "RECOVERY_BLOCKED", 
                        Map.of("reason", policyResult.getReason()),
                        "Recovery blocked by policy");
                
                logger.info("Recovery blocked for payment {}: {}", 
                        payment.getPaymentIdentifier(), policyResult.getReason());
            } else if (policyResult.getRequiresApproval() != null && policyResult.getRequiresApproval()) {
                decision.setDecision("ESCALATE");
                decision.setReason(policyResult.getReason());
                
                payment.setStatus(PaymentStatus.UNDER_REVIEW);
                failedPaymentRepository.save(payment);
                
                logAuditEvent(payment, AuditActionType.MANUAL_INTERVENTION, "ESCALATION_REQUIRED", 
                        Map.of("reason", policyResult.getReason()),
                        "Manual approval required");
                
                logger.info("Recovery escalated for payment {}: {}", 
                        payment.getPaymentIdentifier(), policyResult.getReason());
            } else {
                // Mark for execution (actual execution happens in RecoveryActionExecutor)
                decision.setDecision("EXECUTE");
                decision.setReason("Policy checks passed, ready for execution");
                
                payment.setStatus(PaymentStatus.PENDING_RETRY);
                failedPaymentRepository.save(payment);
                
                logger.info("Recovery approved for payment {}", payment.getPaymentIdentifier());
            }

            return decision;

        } catch (Exception e) {
            logger.error("Error processing recovery for payment {}: {}", 
                    payment.getPaymentIdentifier(), e.getMessage(), e);
            
            logAuditEvent(payment, AuditActionType.POLICY_VIOLATION, "RECOVERY_ERROR", 
                    Map.of("error", e.getMessage()),
                    "Recovery processing failed: " + e.getMessage());
            
            return RecoveryDecision.blocked(failedPaymentId, 
                    "Recovery processing error: " + e.getMessage());
        }
    }

    /**
     * Build recovery recommendation from AI diagnosis
     */
    private RecoveryRecommendation buildRecommendation(AiDiagnosisResult diagnosis) {
        RecoveryActionType actionType;
        try {
            actionType = RecoveryActionType.valueOf(diagnosis.getSuggestedAction());
        } catch (Exception e) {
            logger.warn("Invalid action type from AI: {}, defaulting to AUTOMATIC_RETRY", 
                    diagnosis.getSuggestedAction());
            actionType = RecoveryActionType.AUTOMATIC_RETRY;
        }

        return RecoveryRecommendation.builder()
                .actionType(actionType)
                .channel(getChannelForActionType(actionType))
                .reasoning(diagnosis.getReasoning())
                .confidence(diagnosis.getConfidence())
                .diagnosis(diagnosis.getDiagnosis())
                .recommendation(diagnosis.getRecommendation())
                .estimatedDelayMinutes(diagnosis.getSuggestedDelayMinutes())
                .build();
    }

    /**
     * Map action type to channel
     */
    private String getChannelForActionType(RecoveryActionType actionType) {
        return switch (actionType) {
            case AUTOMATIC_RETRY -> "PAYMENT_GATEWAY";
            case EMAIL_REMINDER -> "EMAIL";
            case SMS_REMINDER -> "SMS";
            case PAYMENT_LINK -> "EMAIL";
            case DISCOUNT_OFFER -> "EMAIL";
            case PHONE_CALL -> "PHONE";
            case ESCALATION -> "MANUAL";
            case CUSTOM -> "CUSTOM";
        };
    }

    /**
     * Log audit event
     */
    private void logAuditEvent(FailedPayment payment, AuditActionType actionType, 
                               String entityType, Map<String, Object> details, String outcome) {
        try {
            auditTrailService.logAction(
                    null, // System action
                    payment.getWorkspace(),
                    actionType,
                    entityType,
                    payment.getId(),
                    payment.getPaymentIdentifier(),
                    details,
                    outcome
            );
        } catch (Exception e) {
            logger.error("Failed to log audit event: {}", e.getMessage());
        }
    }
}
