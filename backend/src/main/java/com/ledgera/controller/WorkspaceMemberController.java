package com.ledgera.controller;

import com.ledgera.dto.InviteMemberRequest;
import com.ledgera.dto.MessageResponse;
import com.ledgera.dto.UpdatePermissionRequest;
import com.ledgera.dto.WorkspaceMemberResponse;
import com.ledgera.service.WorkspaceMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/members")
@RequiredArgsConstructor
public class WorkspaceMemberController {

    private final WorkspaceMemberService workspaceMemberService;

    @GetMapping
    public ResponseEntity<List<WorkspaceMemberResponse>> getWorkspaceMembers(@PathVariable Long workspaceId) {
        List<WorkspaceMemberResponse> members = workspaceMemberService.getWorkspaceMembers(workspaceId);
        return ResponseEntity.ok(members);
    }

    @PostMapping("/invite")
    public ResponseEntity<MessageResponse> inviteMember(
            @PathVariable Long workspaceId,
            @Valid @RequestBody InviteMemberRequest request) {
        workspaceMemberService.inviteMember(workspaceId, request);
        return ResponseEntity.ok(new MessageResponse("Member added successfully"));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<MessageResponse> removeMember(
            @PathVariable Long workspaceId,
            @PathVariable Long userId) {
        workspaceMemberService.removeMember(workspaceId, userId);
        return ResponseEntity.ok(new MessageResponse("Member removed successfully"));
    }

    @PutMapping("/{userId}/permission")
    public ResponseEntity<WorkspaceMemberResponse> updateMemberPermission(
            @PathVariable Long workspaceId,
            @PathVariable Long userId,
            @Valid @RequestBody UpdatePermissionRequest request) {
        WorkspaceMemberResponse response = workspaceMemberService.updateMemberPermission(workspaceId, userId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/accept-invitation")
    public ResponseEntity<MessageResponse> acceptInvitation(@RequestParam String token) {
        workspaceMemberService.acceptInvitation(token);
        return ResponseEntity.ok(new MessageResponse("Invitation accepted successfully"));
    }
}
