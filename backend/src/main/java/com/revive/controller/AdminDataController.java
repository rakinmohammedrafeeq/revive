package com.revive.controller;

import com.revive.entity.User;
import com.revive.entity.Workspace;
import com.revive.service.CurrentUserService;
import com.revive.service.SyntheticDataGenerator;
import com.revive.service.WorkspaceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin endpoints for data management and demo setup.
 */
@RestController
@RequestMapping("/api/admin/data")
public class AdminDataController {

    private final SyntheticDataGenerator dataGenerator;
    private final CurrentUserService currentUserService;
    private final WorkspaceService workspaceService;

    public AdminDataController(
            SyntheticDataGenerator dataGenerator,
            CurrentUserService currentUserService,
            WorkspaceService workspaceService) {
        this.dataGenerator = dataGenerator;
        this.currentUserService = currentUserService;
        this.workspaceService = workspaceService;
    }

    /**
     * Generate synthetic dataset for demonstration and testing
     */
    @PostMapping("/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> generateData(
            @RequestParam(defaultValue = "100") int count) {

        User user = currentUserService.requireCurrentUser();
        Workspace workspace = workspaceService.getUserPrimaryWorkspace(user);

        int generated = dataGenerator.generateSyntheticDataset(workspace.getId(), count);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "generated", generated,
                "message", "Generated " + generated + " synthetic payment records"
        ));
    }

    /**
     * Get dataset statistics
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getDatasetStats() {
        User user = currentUserService.requireCurrentUser();
        Workspace workspace = workspaceService.getUserPrimaryWorkspace(user);

        Map<String, Object> stats = dataGenerator.getDatasetStats(workspace.getId());

        return ResponseEntity.ok(stats);
    }
}
