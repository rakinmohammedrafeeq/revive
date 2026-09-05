package com.revive.controller;

import com.revive.entity.MlModelMetrics;
import com.revive.entity.MlPrediction;
import com.revive.entity.User;
import com.revive.entity.Workspace;
import com.revive.repository.WorkspaceRepository;
import com.revive.service.CurrentUserService;
import com.revive.service.MlModelMetricsService;
import com.revive.service.MlPredictionTrackingService;
import com.revive.service.WorkspaceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST API for ML model performance metrics and prediction tracking.
 * Provides endpoints for monitoring ML feedback loop and model performance.
 */
@RestController
@RequestMapping("/api/ml")
public class MlMetricsController {

    private static final Logger logger = LoggerFactory.getLogger(MlMetricsController.class);

    private final MlPredictionTrackingService predictionTrackingService;
    private final MlModelMetricsService modelMetricsService;
    private final CurrentUserService currentUserService;
    private final WorkspaceService workspaceService;
    private final WorkspaceRepository workspaceRepository;

    public MlMetricsController(
            MlPredictionTrackingService predictionTrackingService,
            MlModelMetricsService modelMetricsService,
            CurrentUserService currentUserService,
            WorkspaceService workspaceService,
            WorkspaceRepository workspaceRepository) {
        this.predictionTrackingService = predictionTrackingService;
        this.modelMetricsService = modelMetricsService;
        this.currentUserService = currentUserService;
        this.workspaceService = workspaceService;
        this.workspaceRepository = workspaceRepository;
    }

    /**
     * Get ML prediction for a specific payment
     */
    @GetMapping("/predictions/{failedPaymentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MlPrediction> getPrediction(@PathVariable Long failedPaymentId) {
        Optional<MlPrediction> prediction = predictionTrackingService.getPrediction(failedPaymentId);
        
        if (prediction.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(prediction.get());
    }

    /**
     * Get all ML predictions for workspace
     */
    @GetMapping("/predictions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MlPrediction>> getAllPredictions() {
        Workspace workspace = resolveWorkspace();
        List<MlPrediction> predictions = predictionTrackingService.getAllPredictions(workspace.getId());
        return ResponseEntity.ok(predictions);
    }

    /**
     * Get predictions pending outcome
     */
    @GetMapping("/predictions/pending")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MlPrediction>> getPendingOutcomes() {
        Workspace workspace = resolveWorkspace();
        List<MlPrediction> predictions = predictionTrackingService.getPendingOutcomes(workspace.getId());
        return ResponseEntity.ok(predictions);
    }

    /**
     * Get prediction accuracy summary
     */
    @GetMapping("/predictions/accuracy")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getAccuracyMetrics() {
        Workspace workspace = resolveWorkspace();
        Map<String, Object> metrics = predictionTrackingService.getAccuracyMetrics(workspace.getId());
        return ResponseEntity.ok(metrics);
    }

    /**
     * Calculate model metrics for a time period
     */
    @PostMapping("/metrics/calculate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MlModelMetrics> calculateMetrics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime periodStart,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime periodEnd) {
        
        Workspace workspace = resolveWorkspace();
        MlModelMetrics metrics = modelMetricsService.calculateMetrics(workspace, periodStart, periodEnd);
        
        if (metrics == null) {
            return ResponseEntity.noContent().build();
        }
        
        return ResponseEntity.ok(metrics);
    }

    /**
     * Get latest model metrics
     */
    @GetMapping("/metrics/latest")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MlModelMetrics> getLatestMetrics() {
        Workspace workspace = resolveWorkspace();
        Optional<MlModelMetrics> metrics = modelMetricsService.getLatestMetrics(workspace.getId());
        
        if (metrics.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(metrics.get());
    }

    /**
     * Get all model metrics for workspace
     */
    @GetMapping("/metrics")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MlModelMetrics>> getAllMetrics() {
        Workspace workspace = resolveWorkspace();
        List<MlModelMetrics> metrics = modelMetricsService.getAllMetrics(workspace.getId());
        return ResponseEntity.ok(metrics);
    }

    /**
     * Get model metrics in date range
     */
    @GetMapping("/metrics/range")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MlModelMetrics>> getMetricsInRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        Workspace workspace = resolveWorkspace();
        List<MlModelMetrics> metrics = modelMetricsService.getMetricsInRange(
                workspace.getId(), startDate, endDate);
        return ResponseEntity.ok(metrics);
    }

    // ── Helper Methods ──────────────────────────────────────────────────────────

    private Workspace resolveWorkspace() {
        User user = currentUserService.requireCurrentUser();
        return workspaceService.getUserPrimaryWorkspace(user);
    }
}
