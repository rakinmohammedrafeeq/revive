package com.revive.controller;

import com.revive.dto.*;
import com.revive.entity.AuditTrail;
import com.revive.entity.FailedPayment;
import com.revive.entity.RecoveryAction;
import com.revive.entity.RecoveryPolicy;
import com.revive.entity.User;
import com.revive.entity.Workspace;
import com.revive.enums.PaymentStatus;
import com.revive.enums.RecoveryActionType;
import com.revive.ml.RecoveryPredictionModel;
import com.revive.repository.AuditTrailRepository;
import com.revive.repository.FailedPaymentRepository;
import com.revive.repository.RecoveredRevenueRepository;
import com.revive.repository.RecoveryActionRepository;
import com.revive.repository.RecoveryPolicyRepository;
import com.revive.service.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST API for revenue recovery operations.
 *
 * Provides endpoints for:
 * - Viewing failed payments / recovery cases
 * - Getting AI diagnosis and ML predictions
 * - Executing recovery actions
 * - Viewing recovery metrics and audit trail
 * - Policy management
 * - Demo data generation
 * - Batch evaluation
 */
@RestController
@RequestMapping("/api/recovery")
public class RecoveryController {

    private static final Logger logger = LoggerFactory.getLogger(RecoveryController.class);

    private final FailedPaymentRepository failedPaymentRepository;
    private final RecoveryActionRepository recoveryActionRepository;
    private final RecoveryPolicyRepository recoveryPolicyRepository;
    private final AuditTrailRepository auditTrailRepository;
    private final RecoveredRevenueRepository recoveredRevenueRepository;
    private final RecoveryOrchestrationService orchestrationService;
    private final RecoveryActionExecutor actionExecutor;
    private final RecoveryMetricsService metricsService;
    private final RecoveryPredictionModel predictionModel;
    private final AiRecoveryDiagnosisService diagnosisService;
    private final AuditTrailService auditTrailService;
    private final SyntheticDataGenerator syntheticDataGenerator;
    private final RecoveryPolicyService policyService;
    private final CurrentUserService currentUserService;
    private final WorkspaceService workspaceService;

    public RecoveryController(
            FailedPaymentRepository failedPaymentRepository,
            RecoveryActionRepository recoveryActionRepository,
            RecoveryPolicyRepository recoveryPolicyRepository,
            AuditTrailRepository auditTrailRepository,
            RecoveredRevenueRepository recoveredRevenueRepository,
            RecoveryOrchestrationService orchestrationService,
            RecoveryActionExecutor actionExecutor,
            RecoveryMetricsService metricsService,
            RecoveryPredictionModel predictionModel,
            AiRecoveryDiagnosisService diagnosisService,
            AuditTrailService auditTrailService,
            SyntheticDataGenerator syntheticDataGenerator,
            RecoveryPolicyService policyService,
            CurrentUserService currentUserService,
            WorkspaceService workspaceService) {
        this.failedPaymentRepository = failedPaymentRepository;
        this.recoveryActionRepository = recoveryActionRepository;
        this.recoveryPolicyRepository = recoveryPolicyRepository;
        this.auditTrailRepository = auditTrailRepository;
        this.recoveredRevenueRepository = recoveredRevenueRepository;
        this.orchestrationService = orchestrationService;
        this.actionExecutor = actionExecutor;
        this.metricsService = metricsService;
        this.predictionModel = predictionModel;
        this.diagnosisService = diagnosisService;
        this.auditTrailService = auditTrailService;
        this.syntheticDataGenerator = syntheticDataGenerator;
        this.policyService = policyService;
        this.currentUserService = currentUserService;
        this.workspaceService = workspaceService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RECOVERY CASES
    // ─────────────────────────────────────────────────────────────────────────

    /** Get all failed payments for current workspace */
    @GetMapping("/cases")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<List<FailedPayment>> getRecoveryCases() {
        Workspace workspace = resolveWorkspace();
        List<FailedPayment> payments = failedPaymentRepository
                .findByWorkspaceIdOrderByFailedAtDesc(workspace.getId());
        return ResponseEntity.ok(payments);
    }

    /** Get specific failed payment */
    @GetMapping("/cases/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<FailedPayment> getRecoveryCase(@PathVariable Long id) {
        Workspace workspace = resolveWorkspace();
        FailedPayment payment = requirePaymentInWorkspace(id, workspace);
        return ResponseEntity.ok(payment);
    }

    /**
     * Get ML recovery probability prediction.
     * Calls the trained Python Random Forest model (ml/models/recovery_model.pkl).
     */
    @GetMapping("/cases/{id}/prediction")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getPrediction(@PathVariable Long id) {
        Workspace workspace = resolveWorkspace();
        FailedPayment payment = requirePaymentInWorkspace(id, workspace);

        double probability = predictionModel.predictRecoveryProbability(payment);
        BigDecimal expectedRecoveryValue = payment.getAmount()
                .multiply(BigDecimal.valueOf(probability));

        Map<String, Object> response = new HashMap<>();
        response.put("paymentId", id);
        response.put("paymentIdentifier", payment.getPaymentIdentifier());
        response.put("recoveryProbability", probability);
        response.put("modelType", "Random Forest (scikit-learn)");
        response.put("confidence", probability > 0.7 ? "HIGH" : probability > 0.4 ? "MEDIUM" : "LOW");
        response.put("expectedRecoveryValue", expectedRecoveryValue);
        response.put("modelVersion", "1.0");
        response.put("features", predictionModel.getModelInfo());
        return ResponseEntity.ok(response);
    }

    /**
     * Get AI diagnosis for a payment via Groq LLM.
     */
    @GetMapping("/cases/{id}/diagnosis")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<AiDiagnosisResult> getDiagnosis(@PathVariable Long id) {
        Workspace workspace = resolveWorkspace();
        FailedPayment payment = requirePaymentInWorkspace(id, workspace);
        AiDiagnosisResult diagnosis = diagnosisService.diagnose(payment);
        return ResponseEntity.ok(diagnosis);
    }

    /**
     * Process payment through the complete recovery pipeline:
     * ML prediction → AI diagnosis → policy check → decision
     */
    @PostMapping("/cases/{id}/process")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<RecoveryDecision> processPayment(@PathVariable Long id) {
        Workspace workspace = resolveWorkspace();
        requirePaymentInWorkspace(id, workspace);
        RecoveryDecision decision = orchestrationService.processFailedPayment(id);
        return ResponseEntity.ok(decision);
    }

    /** Execute a specific recovery action */
    @PostMapping("/cases/{id}/execute")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<RecoveryAction> executeRecovery(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        User user = currentUserService.requireCurrentUser();
        Workspace workspace = workspaceService.getUserPrimaryWorkspace(user);
        FailedPayment payment = requirePaymentInWorkspace(id, workspace);

        String actionTypeStr = request.get("actionType");
        if (actionTypeStr == null || actionTypeStr.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        RecoveryActionType actionType;
        try {
            actionType = RecoveryActionType.valueOf(actionTypeStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        String channel = request.getOrDefault("channel", "AUTOMATIC");
        RecoveryAction action = actionExecutor.executeRecoveryAction(payment, actionType, channel, user);
        return ResponseEntity.ok(action);
    }

    /** Get recovery action history for a payment */
    @GetMapping("/cases/{id}/actions")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<List<RecoveryAction>> getRecoveryActions(@PathVariable Long id) {
        Workspace workspace = resolveWorkspace();
        requirePaymentInWorkspace(id, workspace);
        List<RecoveryAction> actions = recoveryActionRepository
                .findByFailedPaymentIdOrderByInitiatedAtDesc(id);
        return ResponseEntity.ok(actions);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // METRICS
    // ─────────────────────────────────────────────────────────────────────────

    /** Get recovery metrics and KPIs */
    @GetMapping("/metrics")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<RecoveryMetricsResponse> getMetrics() {
        Workspace workspace = resolveWorkspace();
        RecoveryMetricsResponse metrics = metricsService.calculateMetrics(workspace.getId());
        return ResponseEntity.ok(metrics);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ML MODEL INFO
    // ─────────────────────────────────────────────────────────────────────────

    /** Get ML model metadata and feature importance */
    @GetMapping("/model/info")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getModelInfo() {
        Map<String, Object> info = predictionModel.getModelInfo();
        info.put("featureImportance", predictionModel.getFeatureImportance());
        info.put("testMetrics", Map.of(
            "precision", 0.6744,
            "recall", 0.8056,
            "f1Score", 0.7342,
            "rocAuc", 0.6895,
            "accuracy", 0.6500
        ));
        info.put("trainSize", 560);
        info.put("valSize", 120);
        info.put("testSize", 120);
        return ResponseEntity.ok(info);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUDIT TRAIL
    // ─────────────────────────────────────────────────────────────────────────

    /** Get workspace audit trail (last 100 entries) */
    @GetMapping("/audit")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<List<AuditTrail>> getAuditTrail() {
        Workspace workspace = resolveWorkspace();
        List<AuditTrail> entries = auditTrailRepository
                .findTop100ByWorkspaceIdOrderByTimestampDesc(workspace.getId());
        return ResponseEntity.ok(entries);
    }

    /** Get audit trail for a specific payment */
    @GetMapping("/audit/{paymentIdentifier}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<List<AuditTrail>> getPaymentAuditTrail(
            @PathVariable String paymentIdentifier) {
        List<AuditTrail> entries = auditTrailRepository
                .findByPaymentIdentifierOrderByTimestampDesc(paymentIdentifier);
        return ResponseEntity.ok(entries);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POLICIES
    // ─────────────────────────────────────────────────────────────────────────

    /** Get all policies */
    @GetMapping("/policies")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<List<RecoveryPolicy>> getPolicies() {
        Workspace workspace = resolveWorkspace();
        List<RecoveryPolicy> policies = recoveryPolicyRepository
                .findByWorkspaceIdOrderByPriorityAsc(workspace.getId());
        return ResponseEntity.ok(policies);
    }

    /** Get active policy */
    @GetMapping("/policies/active")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<RecoveryPolicy> getActivePolicy() {
        Workspace workspace = resolveWorkspace();
        return policyService.getActivePolicies(workspace.getId()).stream()
                .findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DEMO / BATCH
    // ─────────────────────────────────────────────────────────────────────────

    /** Generate synthetic demo data */
    @PostMapping("/demo/generate")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> generateDemoData(
            @RequestBody(required = false) Map<String, Integer> request) {
        Workspace workspace = resolveWorkspace();
        int count = (request != null && request.containsKey("count")) ? request.get("count") : 60;
        count = Math.min(count, 200);

        logger.info("Generating {} demo payment records for workspace {}", count, workspace.getId());
        int generated = syntheticDataGenerator.generateSyntheticDataset(workspace.getId(), count);

        Map<String, Object> response = new HashMap<>();
        response.put("generated", generated);
        response.put("message", "Demo data generated successfully");
        response.put("workspaceId", workspace.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * Batch evaluate all pending payments.
     * Runs the full ML → AI → policy → action pipeline on all FAILED payments.
     */
    @PostMapping("/batch/evaluate")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> runBatchEvaluation() {
        Workspace workspace = resolveWorkspace();
        logger.info("Starting batch evaluation for workspace {}", workspace.getId());

        List<FailedPayment> pendingPayments = failedPaymentRepository
                .findByWorkspaceIdAndStatus(workspace.getId(), PaymentStatus.FAILED);

        int processed = 0;
        int executed = 0;
        int blocked = 0;
        int escalated = 0;

        for (FailedPayment payment : pendingPayments) {
            try {
                RecoveryDecision decision = orchestrationService.processFailedPayment(payment.getId());
                processed++;
                switch (decision.getDecision()) {
                    case "EXECUTE" -> {
                        try {
                            RecoveryActionType actionType = RecoveryActionType.AUTOMATIC_RETRY;
                            if (decision.getRecommendation() != null
                                    && decision.getRecommendation().getActionType() != null) {
                                try {
                                    actionType = RecoveryActionType.valueOf(
                                            decision.getRecommendation().getActionType());
                                } catch (IllegalArgumentException ignored) { /* use default */ }
                            }
                            actionExecutor.executeRecoveryAction(payment, actionType, "AUTO_BATCH", null);
                            executed++;
                        } catch (Exception e) {
                            logger.warn("Batch execute failed for {}: {}",
                                    payment.getPaymentIdentifier(), e.getMessage());
                        }
                    }
                    case "BLOCKED" -> blocked++;
                    case "ESCALATE" -> escalated++;
                    default -> {}
                }
            } catch (Exception e) {
                logger.error("Batch error for {}: {}",
                        payment.getPaymentIdentifier(), e.getMessage());
            }
        }

        RecoveryMetricsResponse metrics = metricsService.calculateMetrics(workspace.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("processed", processed);
        response.put("executed", executed);
        response.put("blocked", blocked);
        response.put("escalated", escalated);
        response.put("metrics", metrics);
        return ResponseEntity.ok(response);
    }

    /** Dataset statistics and ML model summary */
    @GetMapping("/demo/stats")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getDemoStats() {
        Workspace workspace = resolveWorkspace();
        Map<String, Object> stats = syntheticDataGenerator.getDatasetStats(workspace.getId());
        stats.put("mlModelMetrics", Map.of(
            "model", "Random Forest",
            "trainSamples", 560,
            "valSamples", 120,
            "testSamples", 120,
            "precision", 0.6744,
            "recall", 0.8056,
            "f1Score", 0.7342,
            "rocAuc", 0.6895
        ));
        return ResponseEntity.ok(stats);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private Workspace resolveWorkspace() {
        User user = currentUserService.requireCurrentUser();
        return workspaceService.getUserPrimaryWorkspace(user);
    }

    private FailedPayment requirePaymentInWorkspace(Long paymentId, Workspace workspace) {
        FailedPayment payment = failedPaymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));
        if (!payment.getWorkspace().getId().equals(workspace.getId())) {
            throw new RuntimeException("Access denied: payment does not belong to your workspace");
        }
        return payment;
    }
}
