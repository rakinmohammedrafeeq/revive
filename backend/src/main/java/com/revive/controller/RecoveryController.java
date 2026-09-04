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
import java.time.LocalDateTime;
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
    private final BatchValidationService batchValidationService;
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
            BatchValidationService batchValidationService,
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
        this.batchValidationService = batchValidationService;
        this.policyService = policyService;
        this.currentUserService = currentUserService;
        this.workspaceService = workspaceService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RECOVERY CASES
    // ─────────────────────────────────────────────────────────────────────────

    /** Get all failed payments for current workspace */
    @GetMapping("/cases")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    public ResponseEntity<List<FailedPayment>> getRecoveryCases() {
        Workspace workspace = resolveWorkspace();
        List<FailedPayment> payments = failedPaymentRepository
                .findByWorkspaceIdOrderByFailedAtDesc(workspace.getId());
        return ResponseEntity.ok(payments);
    }

    /** Get specific failed payment */
    @GetMapping("/cases/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
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
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
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
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
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
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    public ResponseEntity<RecoveryDecision> processPayment(@PathVariable Long id) {
        Workspace workspace = resolveWorkspace();
        requirePaymentInWorkspace(id, workspace);
        RecoveryDecision decision = orchestrationService.processFailedPayment(id);
        return ResponseEntity.ok(decision);
    }

    /** Execute a specific recovery action */
    @PostMapping("/cases/{id}/execute")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
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
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
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
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
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
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
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
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    public ResponseEntity<List<AuditTrailDto>> getAuditTrail() {
        Workspace workspace = resolveWorkspace();
        List<AuditTrail> entries = auditTrailRepository
                .findTop100ByWorkspaceIdOrderByTimestampDesc(workspace.getId());
        return ResponseEntity.ok(entries.stream().map(this::toDto).toList());
    }

    /** Get audit trail for a specific payment */
    @GetMapping("/audit/{paymentIdentifier}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    public ResponseEntity<List<AuditTrailDto>> getPaymentAuditTrail(
            @PathVariable String paymentIdentifier) {
        List<AuditTrail> entries = auditTrailRepository
                .findByPaymentIdentifierOrderByTimestampDesc(paymentIdentifier);
        return ResponseEntity.ok(entries.stream().map(this::toDto).toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POLICIES
    // ─────────────────────────────────────────────────────────────────────────

    /** Get all policies */
    @GetMapping("/policies")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    public ResponseEntity<List<RecoveryPolicy>> getPolicies() {
        Workspace workspace = resolveWorkspace();
        List<RecoveryPolicy> policies = recoveryPolicyRepository
                .findByWorkspaceIdOrderByPriorityAsc(workspace.getId());
        return ResponseEntity.ok(policies);
    }

    /** Get active policy */
    @GetMapping("/policies/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
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
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    public ResponseEntity<Map<String, Object>> generateDemoData(
            @RequestBody(required = false) Map<String, Integer> request) {
        try {
            Workspace workspace = resolveWorkspace();
            if (workspace == null) {
                logger.error("No workspace found for current user");
                throw new RuntimeException("No workspace available. Please create a workspace first.");
            }
            
            int count = (request != null && request.containsKey("count")) ? request.get("count") : 60;
            count = Math.min(count, 200);

            logger.info("Generating {} demo payment records for workspace {} ({})", 
                    count, workspace.getId(), workspace.getName());
            
            int generated = syntheticDataGenerator.generateSyntheticDataset(workspace.getId(), count);

            Map<String, Object> response = new HashMap<>();
            response.put("generated", generated);
            response.put("message", "Generated " + generated + " synthetic recovery cases with seed 42");
            response.put("workspace", workspace.getName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to generate demo data", e);
            throw new RuntimeException("Failed to generate demo data: " + e.getMessage(), e);
        }
    }

    /**
     * Batch evaluate all pending payments.
     *
     * Runs the full ML → AI → policy → action pipeline on all FAILED payments.
     * Returns detailed evidence: per-outcome counts, total recovered, blocked reasons, ML metrics.
     *
     * This is the CORE demonstration endpoint for the Buildathon:
     *   DETECT → ML PREDICT → AI DIAGNOSE → POLICY GUARD → ACT → MEASURE
     */
    @PostMapping("/batch/evaluate")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    public ResponseEntity<BatchValidationService.BatchValidationResult> runBatchEvaluation() {
        Workspace workspace = resolveWorkspace();
        logger.info("Starting batch evaluation for workspace {}", workspace.getId());
        
        LocalDateTime batchStartTime = LocalDateTime.now();
        BatchValidationService.BatchValidationResult result = 
                batchValidationService.runBatchValidation(workspace.getId(), batchStartTime);
        
        return ResponseEntity.ok(result);
    }

    /** Dataset statistics and ML model summary */
    @GetMapping("/demo/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
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

    private AuditTrailDto toDto(AuditTrail a) {
        return AuditTrailDto.builder()
                .id(a.getId())
                .timestamp(a.getTimestamp())
                .actionType(a.getActionType())
                .entityType(a.getEntityType())
                .entityId(a.getEntityId())
                .paymentIdentifier(a.getPaymentIdentifier())
                .details(a.getDetails())
                .outcome(a.getOutcome())
                .workspaceId(a.getWorkspace() != null ? a.getWorkspace().getId() : null)
                .userEmail(a.getUser() != null ? a.getUser().getEmail() : null)
                .build();
    }
}
