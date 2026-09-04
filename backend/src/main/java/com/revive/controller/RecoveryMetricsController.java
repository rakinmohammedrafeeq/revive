package com.revive.controller;

import com.revive.dto.RecoveryMetricsResponse;
import com.revive.entity.User;
import com.revive.entity.Workspace;
import com.revive.service.CurrentUserService;
import com.revive.service.RecoveryMetricsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recovery/metrics")
public class RecoveryMetricsController {

    private final RecoveryMetricsService metricsService;
    private final CurrentUserService currentUserService;

    public RecoveryMetricsController(
            RecoveryMetricsService metricsService,
            CurrentUserService currentUserService) {
        this.metricsService = metricsService;
        this.currentUserService = currentUserService;
    }

    /**
     * Get recovery metrics for current workspace
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    public ResponseEntity<RecoveryMetricsResponse> getMetrics() {
        User currentUser = currentUserService.requireCurrentUser();
        Workspace workspace = currentUser.getCurrentWorkspace();
        
        if (workspace == null) {
            return ResponseEntity.badRequest().build();
        }

        RecoveryMetricsResponse metrics = metricsService.calculateMetrics(workspace.getId());
        return ResponseEntity.ok(metrics);
    }
}
