package com.ledgera.controller;

import com.ledgera.dto.MessageResponse;
import com.ledgera.dto.WorkspaceRequest;
import com.ledgera.dto.WorkspaceResponse;
import com.ledgera.service.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @PostMapping
    public ResponseEntity<WorkspaceResponse> createWorkspace(@Valid @RequestBody WorkspaceRequest request) {
        WorkspaceResponse response = workspaceService.createWorkspace(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<WorkspaceResponse>> getUserWorkspaces() {
        List<WorkspaceResponse> workspaces = workspaceService.getUserWorkspaces();
        return ResponseEntity.ok(workspaces);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkspaceResponse> getWorkspaceById(@PathVariable Long id) {
        WorkspaceResponse response = workspaceService.getWorkspaceById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkspaceResponse> updateWorkspace(
            @PathVariable Long id,
            @Valid @RequestBody WorkspaceRequest request) {
        WorkspaceResponse response = workspaceService.updateWorkspace(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteWorkspace(@PathVariable Long id) {
        workspaceService.deleteWorkspace(id);
        return ResponseEntity.ok(new MessageResponse("Workspace deleted successfully"));
    }

    @PostMapping("/{id}/switch")
    public ResponseEntity<WorkspaceResponse> switchWorkspace(@PathVariable Long id) {
        WorkspaceResponse response = workspaceService.switchWorkspace(id);
        return ResponseEntity.ok(response);
    }
}
