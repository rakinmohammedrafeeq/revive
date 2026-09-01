package com.ledgera.security;

import com.ledgera.entity.User;
import com.ledgera.enums.WorkspacePermission;
import com.ledgera.repository.WorkspaceMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Evaluates workspace permissions for users
 */
@Component
@RequiredArgsConstructor
public class WorkspacePermissionEvaluator {
    
    private final WorkspaceMemberRepository workspaceMemberRepository;
    
    public boolean hasPermission(User user, Long workspaceId, WorkspacePermission requiredPermission) {
        if (user == null || workspaceId == null || requiredPermission == null) {
            return false;
        }
        
        Optional<WorkspacePermission> userPermission = workspaceMemberRepository
                .findPermissionByWorkspaceAndUser(workspaceId, user.getId());
        
        if (userPermission.isEmpty()) {
            return false;
        }
        
        return hasRequiredPermission(userPermission.get(), requiredPermission);
    }
    
    public boolean hasAnyPermission(User user, Long workspaceId, WorkspacePermission... requiredPermissions) {
        if (user == null || workspaceId == null || requiredPermissions == null || requiredPermissions.length == 0) {
            return false;
        }
        
        Optional<WorkspacePermission> userPermission = workspaceMemberRepository
                .findPermissionByWorkspaceAndUser(workspaceId, user.getId());
        
        if (userPermission.isEmpty()) {
            return false;
        }
        
        for (WorkspacePermission required : requiredPermissions) {
            if (hasRequiredPermission(userPermission.get(), required)) {
                return true;
            }
        }
        
        return false;
    }
    
    private boolean hasRequiredPermission(WorkspacePermission userPermission, WorkspacePermission requiredPermission) {
        // OWNER has all permissions
        if (userPermission == WorkspacePermission.OWNER) {
            return true;
        }
        
        // EDITOR has EDITOR and VIEWER permissions
        if (userPermission == WorkspacePermission.EDITOR) {
            return requiredPermission == WorkspacePermission.EDITOR || 
                   requiredPermission == WorkspacePermission.VIEWER;
        }
        
        // VIEWER only has VIEWER permission
        if (userPermission == WorkspacePermission.VIEWER) {
            return requiredPermission == WorkspacePermission.VIEWER;
        }
        
        return false;
    }
}
