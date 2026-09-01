package com.ledgera.repository;

import com.ledgera.entity.RecoveredRevenue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecoveredRevenueRepository extends JpaRepository<RecoveredRevenue, Long> {

    /**
     * Find by failed payment
     */
    Optional<RecoveredRevenue> findByFailedPaymentId(Long failedPaymentId);

    /**
     * Find all recovered revenue for a workspace
     */
    @Query("SELECT rr FROM RecoveredRevenue rr " +
           "JOIN rr.failedPayment fp " +
           "WHERE fp.workspace.id = :workspaceId " +
           "ORDER BY rr.recoveredAt DESC")
    List<RecoveredRevenue> findByWorkspace(@Param("workspaceId") Long workspaceId);

    /**
     * Calculate total recovered amount for a workspace
     */
    @Query("SELECT COALESCE(SUM(rr.recoveredAmount), 0) FROM RecoveredRevenue rr " +
           "JOIN rr.failedPayment fp " +
           "WHERE fp.workspace.id = :workspaceId")
    BigDecimal calculateTotalRecoveredAmount(@Param("workspaceId") Long workspaceId);

    /**
     * Calculate total recovery cost for a workspace
     */
    @Query("SELECT COALESCE(SUM(rr.recoveryCost), 0) FROM RecoveredRevenue rr " +
           "JOIN rr.failedPayment fp " +
           "WHERE fp.workspace.id = :workspaceId")
    BigDecimal calculateTotalRecoveryCost(@Param("workspaceId") Long workspaceId);

    /**
     * Calculate total net gain for a workspace
     */
    @Query("SELECT COALESCE(SUM(rr.netGain), 0) FROM RecoveredRevenue rr " +
           "JOIN rr.failedPayment fp " +
           "WHERE fp.workspace.id = :workspaceId")
    BigDecimal calculateTotalNetGain(@Param("workspaceId") Long workspaceId);

    /**
     * Find recovered revenue within a time range
     */
    @Query("SELECT rr FROM RecoveredRevenue rr " +
           "JOIN rr.failedPayment fp " +
           "WHERE fp.workspace.id = :workspaceId " +
           "AND rr.recoveredAt BETWEEN :startTime AND :endTime " +
           "ORDER BY rr.recoveredAt DESC")
    List<RecoveredRevenue> findByWorkspaceAndTimeRange(
        @Param("workspaceId") Long workspaceId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );

    /**
     * Count recoveries for a workspace
     */
    @Query("SELECT COUNT(rr) FROM RecoveredRevenue rr " +
           "JOIN rr.failedPayment fp " +
           "WHERE fp.workspace.id = :workspaceId")
    long countByWorkspace(@Param("workspaceId") Long workspaceId);
}
