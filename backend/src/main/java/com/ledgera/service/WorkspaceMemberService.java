package com.ledgera.service;

import com.ledgera.dto.InviteMemberRequest;
import com.ledgera.dto.UpdatePermissionRequest;
import com.ledgera.dto.WorkspaceMemberResponse;
import com.ledgera.entity.User;
import com.ledgera.entity.Workspace;
import com.ledgera.entity.WorkspaceInvitation;
import com.ledgera.entity.WorkspaceMember;
import com.ledgera.enums.WorkspacePermission;
import com.ledgera.exception.BadRequestException;
import com.ledgera.exception.ForbiddenException;
import com.ledgera.exception.ResourceNotFoundException;
import com.ledgera.repository.UserRepository;
import com.ledgera.repository.WorkspaceInvitationRepository;
import com.ledgera.repository.WorkspaceMemberRepository;
import com.ledgera.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkspaceMemberService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspaceInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<WorkspaceMemberResponse> getWorkspaceMembers(Long workspaceId) {
        User currentUser = currentUserService.requireCurrentUser();
        
        // Check access
        workspaceMemberRepository.findPermissionByWorkspaceAndUser(workspaceId, currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("You don't have access to this workspace"));
        
        List<WorkspaceMember> members = workspaceMemberRepository.findByWorkspaceIdAndIsActiveTrue(workspaceId);
        
        return members.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void inviteMember(Long workspaceId, InviteMemberRequest request) {
        User currentUser = currentUserService.requireCurrentUser();
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        // Check OWNER permission
        WorkspacePermission permission = workspaceMemberRepository
                .findPermissionByWorkspaceAndUser(workspaceId, currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("You don't have access to this workspace"));
        
        if (permission != WorkspacePermission.OWNER) {
            throw new ForbiddenException("Only workspace owners can add members");
        }
        
        // Find user by email
        User userToAdd = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));
        
        // Check if user is already a member
        boolean alreadyMember = workspaceMemberRepository
                .existsByWorkspaceIdAndUserIdAndIsActiveTrue(workspaceId, userToAdd.getId());
        if (alreadyMember) {
            throw new BadRequestException("User is already a member of this workspace");
        }
        
        // Cannot add member as OWNER
        if (request.getPermission() == WorkspacePermission.OWNER) {
            throw new BadRequestException("Cannot add member as OWNER. Only one workspace owner is allowed.");
        }
        
        // Add user directly to workspace
        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(workspace)
                .user(userToAdd)
                .permission(request.getPermission())
                .invitedBy(currentUser)
                .isActive(true)
                .build();
        
        workspaceMemberRepository.save(member);
    }

    @Transactional
    public void removeMember(Long workspaceId, Long userId) {
        User currentUser = currentUserService.requireCurrentUser();
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        // Check OWNER permission
        WorkspacePermission permission = workspaceMemberRepository
                .findPermissionByWorkspaceAndUser(workspaceId, currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("You don't have access to this workspace"));
        
        if (permission != WorkspacePermission.OWNER) {
            throw new ForbiddenException("Only workspace owners can remove members");
        }
        
        // Cannot remove workspace owner
        if (workspace.getOwner().getId().equals(userId)) {
            throw new BadRequestException("Cannot remove workspace owner");
        }
        
        // Cannot remove self
        if (currentUser.getId().equals(userId)) {
            throw new BadRequestException("Cannot remove yourself from workspace");
        }
        
        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in workspace"));
        
        workspaceMemberRepository.delete(member);
    }

    @Transactional
    public WorkspaceMemberResponse updateMemberPermission(Long workspaceId, Long userId, UpdatePermissionRequest request) {
        User currentUser = currentUserService.requireCurrentUser();
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        
        // Check OWNER permission
        WorkspacePermission permission = workspaceMemberRepository
                .findPermissionByWorkspaceAndUser(workspaceId, currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("You don't have access to this workspace"));
        
        if (permission != WorkspacePermission.OWNER) {
            throw new ForbiddenException("Only workspace owners can change member permissions");
        }
        
        // Cannot change workspace owner's permission
        if (workspace.getOwner().getId().equals(userId)) {
            throw new BadRequestException("Cannot change workspace owner's permission");
        }
        
        // Cannot set permission to OWNER through this endpoint
        if (request.getPermission() == WorkspacePermission.OWNER) {
            throw new BadRequestException("Cannot assign OWNER permission. Ownership can only be transferred through workspace settings.");
        }
        
        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in workspace"));
        
        member.setPermission(request.getPermission());
        member = workspaceMemberRepository.save(member);
        
        return mapToResponse(member);
    }

    @Transactional
    public void acceptInvitation(String token) {
        User currentUser = currentUserService.requireCurrentUser();
        
        WorkspaceInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));
        
        if (invitation.isExpired()) {
            throw new BadRequestException("Invitation has expired");
        }
        
        if (invitation.isAccepted()) {
            throw new BadRequestException("Invitation has already been accepted");
        }
        
        if (!invitation.getEmail().equalsIgnoreCase(currentUser.getEmail())) {
            throw new BadRequestException("This invitation is for a different email address");
        }
        
        // Check if already a member
        boolean alreadyMember = workspaceMemberRepository
                .existsByWorkspaceIdAndUserIdAndIsActiveTrue(invitation.getWorkspace().getId(), currentUser.getId());
        if (alreadyMember) {
            throw new BadRequestException("You are already a member of this workspace");
        }
        
        // Add as member
        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(invitation.getWorkspace())
                .user(currentUser)
                .permission(invitation.getPermission())
                .invitedBy(invitation.getInvitedBy())
                .isActive(true)
                .build();
        
        workspaceMemberRepository.save(member);
        
        // Mark invitation as accepted
        invitation.setAcceptedAt(LocalDateTime.now());
        invitationRepository.save(invitation);
    }

    private WorkspaceMemberResponse mapToResponse(WorkspaceMember member) {
        return WorkspaceMemberResponse.builder()
                .id(member.getId())
                .userId(member.getUser().getId())
                .userName(member.getUser().getName())
                .userEmail(member.getUser().getEmail())
                .permission(member.getPermission())
                .invitedById(member.getInvitedBy() != null ? member.getInvitedBy().getId() : null)
                .invitedByName(member.getInvitedBy() != null ? member.getInvitedBy().getName() : null)
                .joinedAt(member.getJoinedAt())
                .isActive(member.getIsActive())
                .build();
    }
}
