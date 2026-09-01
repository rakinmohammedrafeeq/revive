package com.ledgera.repository;

import com.ledgera.entity.WorkspaceMember;
import com.ledgera.enums.WorkspacePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> {
    
    List<WorkspaceMember> findByWorkspaceIdAndIsActiveTrue(Long workspaceId);
    
    List<WorkspaceMember> findByUserIdAndIsActiveTrue(Long userId);
    
    Optional<WorkspaceMember> findByWorkspaceIdAndUserId(Long workspaceId, Long userId);
    
    @Query("SELECT wm FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId AND wm.user.id = :userId AND wm.isActive = true")
    Optional<WorkspaceMember> findActiveByWorkspaceAndUser(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);
    
    @Query("SELECT CASE WHEN COUNT(wm) > 0 THEN true ELSE false END FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId AND wm.user.id = :userId AND wm.isActive = true")
    boolean existsByWorkspaceIdAndUserIdAndIsActiveTrue(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);
    
    @Query("SELECT wm.permission FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId AND wm.user.id = :userId AND wm.isActive = true")
    Optional<WorkspacePermission> findPermissionByWorkspaceAndUser(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);
}
