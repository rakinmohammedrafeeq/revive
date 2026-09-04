package com.revive.repository;

import com.revive.entity.AuditTrail;
import com.revive.enums.AuditActionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditTrailRepository extends JpaRepository<AuditTrail, Long> {

    /**
     * Find audit entries for a workspace
     */
    List<AuditTrail> findByWorkspaceIdOrderByTimestampDesc(Long workspaceId);

    /**
     * Find audit entries for a specific payment
     */
    List<AuditTrail> findByPaymentIdentifierOrderByTimestampDesc(String paymentIdentifier);

    /**
     * Find audit entries by action type
     */
    List<AuditTrail> findByWorkspaceIdAndActionTypeOrderByTimestampDesc(
        Long workspaceId, 
        AuditActionType actionType
    );

    /**
     * Find audit entries for a user
     */
    List<AuditTrail> findByUserIdOrderByTimestampDesc(Long userId);

    /**
     * Find audit entries within a time range
     */
    @Query("SELECT at FROM AuditTrail at WHERE at.workspace.id = :workspaceId " +
           "AND at.timestamp BETWEEN :startTime AND :endTime " +
           "ORDER BY at.timestamp DESC")
    List<AuditTrail> findByWorkspaceAndTimeRange(
        @Param("workspaceId") Long workspaceId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );

    /**
     * Find recent audit entries (for monitoring)
     */
    List<AuditTrail> findTop100ByWorkspaceIdOrderByTimestampDesc(Long workspaceId);

    /**
     * Count audit entries by action type
     */
    long countByWorkspaceIdAndActionType(Long workspaceId, AuditActionType actionType);
    
    /**
     * Count all audit entries for workspace
     */
    long countByWorkspaceId(Long workspaceId);
}
