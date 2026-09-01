package com.ledgera.repository;

import com.ledgera.entity.RecoveryAction;
import com.ledgera.enums.RecoveryActionStatus;
import com.ledgera.enums.RecoveryActionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RecoveryActionRepository extends JpaRepository<RecoveryAction, Long> {

    /**
     * Find all actions for a failed payment
     */
    List<RecoveryAction> findByFailedPaymentIdOrderByInitiatedAtDesc(Long failedPaymentId);

    /**
     * Find by status
     */
    List<RecoveryAction> findByStatus(RecoveryActionStatus status);

    /**
     * Find in-progress actions
     */
    @Query("SELECT ra FROM RecoveryAction ra " +
           "JOIN ra.failedPayment fp " +
           "WHERE fp.workspace.id = :workspaceId " +
           "AND ra.status IN ('INITIATED', 'IN_PROGRESS')")
    List<RecoveryAction> findInProgressActions(@Param("workspaceId") Long workspaceId);

    /**
     * Count successful recoveries for a workspace
     */
    @Query("SELECT COUNT(ra) FROM RecoveryAction ra " +
           "JOIN ra.failedPayment fp " +
           "WHERE fp.workspace.id = :workspaceId " +
           "AND ra.status = 'COMPLETED_SUCCESS'")
    long countSuccessfulRecoveries(@Param("workspaceId") Long workspaceId);

    /**
     * Find actions by type
     */
    @Query("SELECT ra FROM RecoveryAction ra " +
           "JOIN ra.failedPayment fp " +
           "WHERE fp.workspace.id = :workspaceId " +
           "AND ra.actionType = :actionType")
    List<RecoveryAction> findByWorkspaceAndActionType(
        @Param("workspaceId") Long workspaceId,
        @Param("actionType") RecoveryActionType actionType
    );

    /**
     * Find recent actions (for dashboard)
     */
    @Query("SELECT ra FROM RecoveryAction ra " +
           "JOIN ra.failedPayment fp " +
           "WHERE fp.workspace.id = :workspaceId " +
           "ORDER BY ra.initiatedAt DESC")
    List<RecoveryAction> findRecentActions(@Param("workspaceId") Long workspaceId);
}
