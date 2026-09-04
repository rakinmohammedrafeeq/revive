package com.revive.repository;

import com.revive.entity.RecoveryAction;
import com.revive.enums.RecoveryActionStatus;
import com.revive.enums.RecoveryActionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecoveryActionRepository extends JpaRepository<RecoveryAction, Long> {

    /** Find all actions for a specific failed payment, newest first */
    List<RecoveryAction> findByFailedPaymentIdOrderByInitiatedAtDesc(Long failedPaymentId);

    /** Find by status across all workspaces */
    List<RecoveryAction> findByStatus(RecoveryActionStatus status);

    /** Find in-progress actions for a workspace */
    @Query("SELECT ra FROM RecoveryAction ra " +
           "JOIN ra.failedPayment fp " +
           "WHERE fp.workspace.id = :workspaceId " +
           "AND ra.status IN ('INITIATED', 'IN_PROGRESS')")
    List<RecoveryAction> findInProgressActions(@Param("workspaceId") Long workspaceId);

    /** Find actions by type for a workspace */
    @Query("SELECT ra FROM RecoveryAction ra " +
           "JOIN ra.failedPayment fp " +
           "WHERE fp.workspace.id = :workspaceId " +
           "AND ra.actionType = :actionType")
    List<RecoveryAction> findByWorkspaceAndActionType(
        @Param("workspaceId") Long workspaceId,
        @Param("actionType") RecoveryActionType actionType
    );

    /** Find all recent actions for a workspace (for dashboard) */
    @Query("SELECT ra FROM RecoveryAction ra " +
           "JOIN ra.failedPayment fp " +
           "WHERE fp.workspace.id = :workspaceId " +
           "ORDER BY ra.initiatedAt DESC")
    List<RecoveryAction> findRecentActions(@Param("workspaceId") Long workspaceId);

    // ── Count queries used by RecoveryMetricsService ──────────────────────

    /** Total recovery action attempts for a workspace */
    @Query("SELECT COUNT(ra) FROM RecoveryAction ra " +
           "JOIN ra.failedPayment fp " +
           "WHERE fp.workspace.id = :workspaceId")
    long countByFailedPaymentWorkspaceId(@Param("workspaceId") Long workspaceId);

    /** Count actions by status for a workspace */
    @Query("SELECT COUNT(ra) FROM RecoveryAction ra " +
           "JOIN ra.failedPayment fp " +
           "WHERE fp.workspace.id = :workspaceId " +
           "AND ra.status = :status")
    long countByFailedPaymentWorkspaceIdAndStatus(
        @Param("workspaceId") Long workspaceId,
        @Param("status") RecoveryActionStatus status
    );

    /** Count successful recoveries for a workspace (convenience alias) */
    @Query("SELECT COUNT(ra) FROM RecoveryAction ra " +
           "JOIN ra.failedPayment fp " +
           "WHERE fp.workspace.id = :workspaceId " +
           "AND ra.status = 'COMPLETED_SUCCESS'")
    long countSuccessfulRecoveries(@Param("workspaceId") Long workspaceId);
}
