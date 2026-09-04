package com.revive.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revive.dto.*;
import com.revive.entity.FailedPayment;
import com.revive.entity.RecoveryAction;
import com.revive.entity.RecoveryPolicy;
import com.revive.enums.AuditActionType;
import com.revive.enums.PaymentStatus;
import com.revive.enums.RecoveryActionStatus;
import com.revive.enums.RecoveryActionType;
import com.revive.ml.RecoveryPredictionModel;
import com.revive.repository.FailedPaymentRepository;
import com.revive.repository.RecoveryActionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Core recovery orchestration service.
 *
 * Implements the full pipeline:
 * DETECT → ML PREDICT → AI DIAGNOSE → RECOMMEND → POLICY GUARD → ACT → AUDIT
 *
 * Design principles:
 * - ML model answers: "How likely is this to be recovered?"
 * - LLM answers: "Why did it fail? What should we do?"
 * - Policy engine answers: "Are we allowed to do it?" (LLM cannot override policy)
 * - Orchestrator: ties it together, ensures idempotency, writes audit trail
 */
@Service
public class RecoveryOrchestrationService {

    private static final Logger logger = LoggerFactory.getLogger(RecoveryOrchestrationService.class);

    // Minimum ML probability to recommend active recovery (low probability → NO_ACTION / escalate)
    private static final double MIN_RECOVERY_PROBABILITY = 0.15;

    private final FailedPaymentRepository failedPaymentRepository;
    private final RecoveryActionRepository recoveryActionRepository;
    private final RecoveryPolicyService policyService;
    private final PolicyEvaluationEngine policyEvaluationEngine;
    private final AiRecoveryDiagnosisService diagnosisService;
    private final RecoveryPredictionModel predictionModel;
    private final RecoveryActionExecutor actionExecutor;
    private final AuditTrailService auditTrailService;
    private final ObjectMapper objectMapper;

    public RecoveryOrchestrationService(
            FailedPaymentRepository failedPaymentRepository,
            RecoveryActionRepository recoveryActionRepository,
            RecoveryPolicyService policyService,
            PolicyEvaluationEngine policyEvaluationEngine,
            AiRecoveryDiagnosisService diagnosisService,
            RecoveryPredictionModel predictionModel,
            RecoveryActionExecutor actionExecutor,
            AuditTrailService auditTrailService,
            ObjectMapper objectMapper) {
        this.failedPaymentRepository = failedPaymentRepository;
        this.recoveryActionRepository = recoveryActionRepository;
        this.policyService = policyService;
        this.policyEvaluationEngine = policyEvaluationEngine;
        this.diagnosisService = diagnosisService;
        this.predictionModel = predictionModel;
        this.actionExecutor = actionExecutor;
        this.auditTrailService = auditTrailService;
        this.objectMapper = objectMapper;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MAIN ENTRY POINT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Process a failed payment through the complete recovery workflow.
     *
     * Steps:
     * 1. Load and validate payment (idempotency check)
     * 2. ML recovery probability prediction
     * 3. LLM failure diagnosis
     * 4. Build structured recommendation
     * 5. Deterministic policy evaluation
     * 6. Decision: BLOCKED / ESCALATE / EXECUTE
     * 7. If EXECUTE: run the bounded action
     * 8. Write audit trail at every step
     *
     * @param failedPaymentId DB id of the failed payment
     * @return RecoveryDecision with full pipeline result
     */
    @Transactional
    public RecoveryDecision processFailedPayment(Long failedPaymentId) {
        logger.info("Starting recovery pipeline for payment ID: {}", failedPaymentId);

        // ── STEP 1: Load payment ────────────────────────────────────────────
        FailedPayment payment = failedPaymentRepository.findById(failedPaymentId)
                .orElseThrow(() -> new RuntimeException("Failed payment not found: " + failedPaymentId));

        // ── STEP 1b: Stopping rules — terminal states ───────────────────────
        if (payment.getStatus() == PaymentStatus.RECOVERED) {
            return blocked(payment, "ALREADY_RECOVERED",
                    "Payment already recovered — no further action needed");
        }
        if (payment.getStatus() == PaymentStatus.ABANDONED) {
            return blocked(payment, "ABANDONED",
                    "Payment marked as abandoned — recovery window has closed");
        }

        // ── STEP 1c: Idempotency — duplicate execution guard ────────────────
        RecoveryDecision duplicateGuard = checkDuplicateExecution(payment);
        if (duplicateGuard != null) return duplicateGuard;

        try {
            // ── STEP 2: ML Recovery Probability ────────────────────────────
            logger.info("Step 2: ML prediction for {}", payment.getPaymentIdentifier());
            double recoveryProbability = predictionModel.predictRecoveryProbability(payment);

            audit(payment, AuditActionType.ML_PREDICTION, "RecoveryPipeline", payment.getId(),
                    Map.of(
                        "recoveryProbability", recoveryProbability,
                        "modelType", "Random Forest (scikit-learn)",
                        "confidence", recoveryProbability > 0.7 ? "HIGH" : recoveryProbability > 0.4 ? "MEDIUM" : "LOW"
                    ),
                    String.format("ML recovery probability: %.2f%%", recoveryProbability * 100));

            // Low probability stop — below threshold, conservative no-action
            if (recoveryProbability < MIN_RECOVERY_PROBABILITY) {
                logger.info("Low probability ({}) for payment {} — marking for review",
                        recoveryProbability, payment.getPaymentIdentifier());
                payment.setStatus(PaymentStatus.UNDER_REVIEW);
                failedPaymentRepository.save(payment);

                audit(payment, AuditActionType.POLICY_VIOLATION, "RecoveryPipeline", payment.getId(),
                        Map.of("recoveryProbability", recoveryProbability, "threshold", MIN_RECOVERY_PROBABILITY),
                        "Recovery probability too low — escalated for review");

                return RecoveryDecision.builder()
                        .failedPaymentId(failedPaymentId)
                        .decision("BLOCKED")
                        .reason(String.format(
                            "ML model predicts only %.0f%% recovery probability — below minimum threshold of %.0f%%",
                            recoveryProbability * 100, MIN_RECOVERY_PROBABILITY * 100))
                        .recoveryProbability(recoveryProbability)
                        .build();
            }

            // ── STEP 3: AI Failure Diagnosis ────────────────────────────────
            logger.info("Step 3: AI diagnosis for {}", payment.getPaymentIdentifier());
            AiDiagnosisResult diagnosis;
            try {
                diagnosis = diagnosisService.diagnose(payment);
                audit(payment, AuditActionType.AI_DIAGNOSIS, "RecoveryPipeline", payment.getId(),
                        Map.of(
                            "diagnosis", diagnosis.getDiagnosis(),
                            "rootCause", diagnosis.getRootCause(),
                            "confidence", diagnosis.getConfidence(),
                            "isRecoverable", diagnosis.getIsRecoverable(),
                            "suggestedAction", diagnosis.getSuggestedAction(),
                            "suggestedDelayMinutes", diagnosis.getSuggestedDelayMinutes()
                        ),
                        String.format("AI diagnosis: %s (confidence %.0f%%)",
                                diagnosis.getDiagnosis(), diagnosis.getConfidence() * 100));
            } catch (Exception e) {
                // CASE D: LLM failure — safe fallback, do NOT execute unsafely
                logger.error("LLM diagnosis failed for {}: {} — using safe fallback",
                        payment.getPaymentIdentifier(), e.getMessage());
                diagnosis = AiRecoveryDiagnosisService.getSafeFallback(payment);
                audit(payment, AuditActionType.AI_DIAGNOSIS, "RecoveryPipeline", payment.getId(),
                        Map.of("llmError", e.getMessage(), "usedFallback", true,
                                "diagnosis", diagnosis.getDiagnosis()),
                        "LLM unavailable — used deterministic fallback diagnosis");
            }

            // ── STEP 4: Build Recovery Recommendation ───────────────────────
            logger.info("Step 4: Building recommendation for {}", payment.getPaymentIdentifier());
            RecoveryRecommendation recommendation = buildRecommendation(diagnosis, recoveryProbability);

            audit(payment, AuditActionType.RECOVERY_RECOMMENDATION, "RecoveryPipeline", payment.getId(),
                    Map.of(
                        "actionType", recommendation.getActionType().name(),
                        "channel", recommendation.getChannel(),
                        "reasoning", recommendation.getReasoning(),
                        "confidence", recommendation.getConfidence(),
                        "estimatedDelayMinutes", recommendation.getEstimatedDelayMinutes()
                    ),
                    String.format("Recommendation: %s via %s",
                            recommendation.getActionType(), recommendation.getChannel()));

            // ── STEP 5: Deterministic Policy Evaluation ─────────────────────
            logger.info("Step 5: Policy evaluation for {}", payment.getPaymentIdentifier());
            RecoveryPolicy policy = policyService.getActivePolicies(payment.getWorkspace().getId())
                    .stream().findFirst().orElse(null);

            PolicyEvaluationResult policyResult = policyEvaluationEngine.evaluateAction(
                    payment, recommendation.getActionType(), policy, recoveryProbability);

            audit(payment, AuditActionType.POLICY_CHECK, "RecoveryPipeline", payment.getId(),
                    Map.of(
                        "allowed", policyResult.getAllowed(),
                        "requiresApproval", policyResult.getRequiresApproval() != null
                                ? policyResult.getRequiresApproval() : false,
                        "reason", policyResult.getReason(),
                        "policyName", policyResult.getPolicyName() != null ? policyResult.getPolicyName() : "DEFAULT"
                    ),
                    String.format("Policy %s: %s",
                            policyResult.getAllowed() ? "ALLOWED" : "BLOCKED",
                            policyResult.getReason()));

            // ── STEP 6: Make Decision ───────────────────────────────────────
            RecoveryDecision.RecoveryDecisionBuilder builder = RecoveryDecision.builder()
                    .failedPaymentId(failedPaymentId)
                    .recoveryProbability(recoveryProbability)
                    .aiDiagnosis(diagnosis)
                    .recommendation(recommendation)
                    .policyResult(policyResult);

            // BLOCKED
            if (!policyResult.getAllowed()) {
                if (payment.getRetryCount() >= (policy != null ? policy.getMaxRetryCount() : 3)) {
                    payment.setStatus(PaymentStatus.ABANDONED);
                } else {
                    payment.setStatus(PaymentStatus.UNDER_REVIEW);
                }
                failedPaymentRepository.save(payment);

                audit(payment, AuditActionType.POLICY_VIOLATION, "RecoveryPipeline", payment.getId(),
                        Map.of("reason", policyResult.getReason(), "policyDecision", "BLOCKED"),
                        "Recovery BLOCKED by policy");

                logger.info("Recovery BLOCKED for {}: {}", payment.getPaymentIdentifier(), policyResult.getReason());
                return builder.decision("BLOCKED").reason(policyResult.getReason()).build();
            }

            // ESCALATE (requires manual approval)
            if (policyResult.getRequiresApproval() != null && policyResult.getRequiresApproval()) {
                payment.setStatus(PaymentStatus.UNDER_REVIEW);
                failedPaymentRepository.save(payment);

                audit(payment, AuditActionType.MANUAL_INTERVENTION, "RecoveryPipeline", payment.getId(),
                        Map.of("reason", policyResult.getReason()),
                        "Recovery ESCALATED — manual approval required");

                logger.info("Recovery ESCALATED for {}: {}", payment.getPaymentIdentifier(), policyResult.getReason());
                return builder.decision("ESCALATE").reason(policyResult.getReason()).build();
            }

            // APPROVED → EXECUTE
            audit(payment, AuditActionType.RECOVERY_APPROVED, "RecoveryPipeline", payment.getId(),
                    Map.of("actionType", recommendation.getActionType().name(),
                            "policyName", policyResult.getPolicyName() != null ? policyResult.getPolicyName() : "DEFAULT"),
                    "Recovery APPROVED — executing bounded action");

            // ── STEP 7: Execute the Bounded Recovery Action ─────────────────
            logger.info("Step 7: Executing recovery action {} for {}",
                    recommendation.getActionType(), payment.getPaymentIdentifier());

            RecoveryAction action = actionExecutor.executeRecoveryAction(
                    payment,
                    recommendation.getActionType(),
                    recommendation.getChannel(),
                    null // system-initiated
            );

            logger.info("Recovery action executed for {}: status={}",
                    payment.getPaymentIdentifier(), action.getStatus());

            // Map action status → execution outcome string
            String executionStatus = switch (action.getStatus()) {
                case COMPLETED_SUCCESS -> "SUCCESS";
                case COMPLETED_FAILURE -> "FAILED";
                case IN_PROGRESS, INITIATED -> "PENDING";
                case FAILED -> "FAILED";
                case BLOCKED -> "BLOCKED";
                case CANCELLED -> "BLOCKED";
            };

            // Reload payment to get updated recovered amount if recovered
            FailedPayment updatedPayment = failedPaymentRepository.findById(payment.getId())
                    .orElse(payment);
            BigDecimal recoveredAmount = null;
            if ("SUCCESS".equals(executionStatus)) {
                // The action executor sets payment status to RECOVERED and creates RecoveredRevenue
                recoveredAmount = updatedPayment.getAmount();
            }

            // Parse outcome details from action
            Map<String, Object> outcomeDetails = new HashMap<>();
            if (action.getOutcome() != null) {
                try {
                    outcomeDetails = objectMapper.readValue(action.getOutcome(),
                            new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
                } catch (Exception ignored) {
                    outcomeDetails = Map.of("raw", action.getOutcome());
                }
            }

            return builder
                    .decision("EXECUTE")
                    .reason("Policy checks passed — recovery action executed")
                    .recoveryActionId(action.getId())
                    .executionStatus(executionStatus)
                    .recoveredAmount(recoveredAmount)
                    .outcomeDetails(outcomeDetails)
                    .testMode(true) // Razorpay TEST MODE
                    .build();

        } catch (Exception e) {
            logger.error("Recovery pipeline error for payment {}: {}",
                    payment.getPaymentIdentifier(), e.getMessage(), e);

            audit(payment, AuditActionType.POLICY_VIOLATION, "RecoveryPipeline", payment.getId(),
                    Map.of("error", e.getMessage(), "stage", "PIPELINE_ERROR"),
                    "Recovery pipeline failed: " + e.getMessage());

            return RecoveryDecision.builder()
                    .failedPaymentId(failedPaymentId)
                    .decision("BLOCKED")
                    .reason("Recovery pipeline error: " + e.getMessage())
                    .build();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // IDEMPOTENCY CHECK
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Prevent duplicate execution.
     *
     * CASE E: If a recovery action is already running or has succeeded,
     * return a BLOCKED decision immediately without executing again.
     */
    private RecoveryDecision checkDuplicateExecution(FailedPayment payment) {
        List<RecoveryAction> existingActions = recoveryActionRepository
                .findByFailedPaymentIdOrderByInitiatedAtDesc(payment.getId());

        for (RecoveryAction action : existingActions) {
            if (action.getStatus() == RecoveryActionStatus.IN_PROGRESS
                    || action.getStatus() == RecoveryActionStatus.INITIATED) {
                logger.info("Duplicate execution blocked for {} — action {} already in progress",
                        payment.getPaymentIdentifier(), action.getId());

                audit(payment, AuditActionType.DUPLICATE_BLOCKED, "RecoveryPipeline", payment.getId(),
                        Map.of("existingActionId", action.getId(),
                                "existingActionStatus", action.getStatus().name()),
                        "Duplicate recovery attempt blocked — action already in progress");

                return RecoveryDecision.builder()
                        .failedPaymentId(payment.getId())
                        .decision("BLOCKED")
                        .reason("Duplicate request — recovery action #" + action.getId() + " is already in progress")
                        .recoveryActionId(action.getId())
                        .build();
            }

            if (action.getStatus() == RecoveryActionStatus.COMPLETED_SUCCESS) {
                logger.info("Duplicate execution blocked for {} — already completed successfully",
                        payment.getPaymentIdentifier());

                audit(payment, AuditActionType.DUPLICATE_BLOCKED, "RecoveryPipeline", payment.getId(),
                        Map.of("existingActionId", action.getId(),
                                "existingActionStatus", action.getStatus().name()),
                        "Duplicate recovery attempt blocked — payment already recovered via action #" + action.getId());

                return RecoveryDecision.builder()
                        .failedPaymentId(payment.getId())
                        .decision("BLOCKED")
                        .reason("Payment already recovered via action #" + action.getId())
                        .recoveryActionId(action.getId())
                        .build();
            }
        }

        return null; // No duplicate — proceed
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RECOMMENDATION BUILDER
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Build a structured recommendation from the AI diagnosis.
     * The LLM suggests the action, but the action type is validated against
     * the finite enum of supported actions before any execution occurs.
     */
    private RecoveryRecommendation buildRecommendation(AiDiagnosisResult diagnosis,
                                                        double recoveryProbability) {
        RecoveryActionType actionType;
        try {
            actionType = RecoveryActionType.valueOf(diagnosis.getSuggestedAction());
        } catch (Exception e) {
            logger.warn("Invalid action type from LLM: '{}' — mapping to safe default",
                    diagnosis.getSuggestedAction());
            // Safe mapping from LLM text → supported enum
            actionType = mapToSupportedAction(diagnosis.getSuggestedAction(), recoveryProbability);
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
     * Map arbitrary LLM action strings → bounded RecoveryActionType enum.
     * Ensures the LLM can never cause execution of an unsupported action.
     */
    private RecoveryActionType mapToSupportedAction(String llmAction, double recoveryProbability) {
        if (llmAction == null) return RecoveryActionType.AUTOMATIC_RETRY;
        String action = llmAction.toUpperCase().replace(" ", "_").replace("-", "_");
        return switch (action) {
            case "RETRY", "RETRY_PAYMENT", "DELAYED_RETRY", "AUTOMATIC_RETRY" -> RecoveryActionType.AUTOMATIC_RETRY;
            case "EMAIL", "EMAIL_REMINDER", "CUSTOMER_NOTIFICATION", "NOTIFICATION" -> RecoveryActionType.EMAIL_REMINDER;
            case "SMS", "SMS_REMINDER", "TEXT", "TEXT_MESSAGE" -> RecoveryActionType.SMS_REMINDER;
            case "PAYMENT_LINK", "NEW_PAYMENT_LINK", "SEND_LINK" -> RecoveryActionType.PAYMENT_LINK;
            case "DISCOUNT", "DISCOUNT_OFFER", "OFFER" -> RecoveryActionType.DISCOUNT_OFFER;
            case "CALL", "PHONE_CALL", "PHONE" -> RecoveryActionType.PHONE_CALL;
            case "ESCALATE", "ESCALATION", "MANUAL_REVIEW", "NO_ACTION" -> RecoveryActionType.ESCALATION;
            default -> recoveryProbability > 0.6
                    ? RecoveryActionType.AUTOMATIC_RETRY
                    : RecoveryActionType.EMAIL_REMINDER;
        };
    }

    private String getChannelForActionType(RecoveryActionType actionType) {
        return switch (actionType) {
            case AUTOMATIC_RETRY -> "PAYMENT_GATEWAY";
            case EMAIL_REMINDER  -> "EMAIL";
            case SMS_REMINDER    -> "SMS";
            case PAYMENT_LINK    -> "EMAIL";
            case DISCOUNT_OFFER  -> "EMAIL";
            case PHONE_CALL      -> "PHONE";
            case ESCALATION      -> "MANUAL";
            case CUSTOM          -> "CUSTOM";
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONVENIENCE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private RecoveryDecision blocked(FailedPayment payment, String stopReason, String message) {
        audit(payment, AuditActionType.POLICY_VIOLATION, "RecoveryPipeline", payment.getId(),
                Map.of("stopReason", stopReason),
                message);
        return RecoveryDecision.blocked(payment.getId(), message);
    }

    private void audit(FailedPayment payment, AuditActionType type, String entityType,
                        Long entityId, Map<String, Object> details, String outcome) {
        try {
            auditTrailService.logAction(null, payment.getWorkspace(), type,
                    entityType, entityId, payment.getPaymentIdentifier(), details, outcome);
        } catch (Exception e) {
            logger.error("Audit logging failed: {}", e.getMessage());
        }
    }
}
