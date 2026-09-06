package com.revive.repository;

import com.revive.entity.BatchEvaluationResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BatchEvaluationResultRepository extends JpaRepository<BatchEvaluationResult, Long> {

    /**
     * Get all batch results for a workspace, ordered by newest first
     */
    @Query("SELECT b FROM BatchEvaluationResult b WHERE b.workspace.id = :workspaceId ORDER BY b.evaluatedAt DESC")
    List<BatchEvaluationResult> findByWorkspaceIdOrderByEvaluatedAtDesc(@Param("workspaceId") Long workspaceId);

    /**
     * Delete all batch results for a workspace
     */
    @Modifying
    @Query("DELETE FROM BatchEvaluationResult b WHERE b.workspace.id = :workspaceId")
    void deleteAllByWorkspaceId(@Param("workspaceId") Long workspaceId);

    /**
     * Auto-cleanup: Delete results older than specified date
     */
    @Modifying
    @Query("DELETE FROM BatchEvaluationResult b WHERE b.evaluatedAt < :cutoffDate")
    int deleteOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Count results for workspace
     */
    @Query("SELECT COUNT(b) FROM BatchEvaluationResult b WHERE b.workspace.id = :workspaceId")
    long countByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
