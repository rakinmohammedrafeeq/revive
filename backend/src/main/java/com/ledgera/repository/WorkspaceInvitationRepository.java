package com.ledgera.repository;

import com.ledgera.entity.WorkspaceInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceInvitationRepository extends JpaRepository<WorkspaceInvitation, Long> {
    
    Optional<WorkspaceInvitation> findByToken(String token);
    
    List<WorkspaceInvitation> findByWorkspaceIdAndAcceptedAtIsNull(Long workspaceId);
    
    Optional<WorkspaceInvitation> findByWorkspaceIdAndEmail(Long workspaceId, String email);
    
    @Query("SELECT wi FROM WorkspaceInvitation wi WHERE wi.workspace.id = :workspaceId AND wi.email = :email AND wi.acceptedAt IS NULL AND wi.expiresAt > :now")
    Optional<WorkspaceInvitation> findPendingInvitation(@Param("workspaceId") Long workspaceId, @Param("email") String email, @Param("now") LocalDateTime now);
    
    @Query("SELECT CASE WHEN COUNT(wi) > 0 THEN true ELSE false END FROM WorkspaceInvitation wi WHERE wi.workspace.id = :workspaceId AND wi.email = :email AND wi.acceptedAt IS NULL AND wi.expiresAt > :now")
    boolean hasPendingInvitation(@Param("workspaceId") Long workspaceId, @Param("email") String email, @Param("now") LocalDateTime now);
}
