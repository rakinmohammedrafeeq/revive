package com.revive.repository;

import com.revive.entity.MlModelMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MlModelMetricsRepository extends JpaRepository<MlModelMetrics, Long> {

    /**
     * Find all metrics for a workspace, ordered by calculation date
     */
    List<MlModelMetrics> findByWorkspaceIdOrderByCalculatedAtDesc(Long workspaceId);

    /**
     * Find metrics by model version
     */
    List<MlModelMetrics> findByWorkspaceIdAndModelVersionOrderByCalculatedAtDesc(
        Long workspaceId, String modelVersion
    );

    /**
     * Find latest metrics for a model version
     */
    Optional<MlModelMetrics> findFirstByWorkspaceIdAndModelVersionOrderByCalculatedAtDesc(
        Long workspaceId, String modelVersion
    );

    /**
     * Find metrics in date range
     */
    @Query("SELECT mm FROM MlModelMetrics mm WHERE mm.workspace.id = :workspaceId " +
           "AND mm.calculatedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY mm.calculatedAt DESC")
    List<MlModelMetrics> findInDateRange(
        @Param("workspaceId") Long workspaceId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Get latest metrics across all models
     */
    @Query("SELECT mm FROM MlModelMetrics mm WHERE mm.workspace.id = :workspaceId " +
           "AND mm.calculatedAt = (SELECT MAX(mm2.calculatedAt) FROM MlModelMetrics mm2 " +
           "WHERE mm2.workspace.id = :workspaceId AND mm2.modelVersion = mm.modelVersion)")
    List<MlModelMetrics> findLatestByWorkspace(@Param("workspaceId") Long workspaceId);
}
