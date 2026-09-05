package com.revive.repository;

import com.revive.entity.MlPrediction;
import com.revive.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MlPredictionRepository extends JpaRepository<MlPrediction, Long> {

    /**
     * Find prediction by failed payment ID
     */
    Optional<MlPrediction> findByFailedPaymentId(Long failedPaymentId);

    /**
     * Find all predictions for a workspace
     */
    List<MlPrediction> findByWorkspaceIdOrderByPredictedAtDesc(Long workspaceId);

    /**
     * Find predictions pending outcome
     */
    @Query("SELECT mp FROM MlPrediction mp WHERE mp.workspace.id = :workspaceId " +
           "AND (mp.actualOutcome IS NULL OR mp.actualOutcome = 'PENDING') " +
           "ORDER BY mp.predictedAt DESC")
    List<MlPrediction> findPendingOutcomes(@Param("workspaceId") Long workspaceId);

    /**
     * Find predictions with outcomes in date range
     */
    @Query("SELECT mp FROM MlPrediction mp WHERE mp.workspace.id = :workspaceId " +
           "AND mp.actualOutcome IS NOT NULL " +
           "AND mp.outcomeRecordedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY mp.predictedAt DESC")
    List<MlPrediction> findWithOutcomesInRange(
        @Param("workspaceId") Long workspaceId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Count predictions with outcomes
     */
    @Query("SELECT COUNT(mp) FROM MlPrediction mp WHERE mp.workspace.id = :workspaceId " +
           "AND mp.actualOutcome IS NOT NULL")
    long countWithOutcomes(@Param("workspaceId") Long workspaceId);

    /**
     * Count correct predictions
     */
    @Query("SELECT COUNT(mp) FROM MlPrediction mp WHERE mp.workspace.id = :workspaceId " +
           "AND mp.wasCorrect = true")
    long countCorrectPredictions(@Param("workspaceId") Long workspaceId);

    /**
     * Calculate average prediction error
     */
    @Query("SELECT AVG(mp.predictionError) FROM MlPrediction mp " +
           "WHERE mp.workspace.id = :workspaceId AND mp.predictionError IS NOT NULL")
    Double getAveragePredictionError(@Param("workspaceId") Long workspaceId);

    /**
     * Find predictions by model version
     */
    List<MlPrediction> findByWorkspaceIdAndModelVersionOrderByPredictedAtDesc(
        Long workspaceId, String modelVersion
    );

    /**
     * Count predictions by model version
     */
    long countByWorkspaceIdAndModelVersion(Long workspaceId, String modelVersion);

    /**
     * Check if prediction exists for payment
     */
    boolean existsByFailedPaymentId(Long failedPaymentId);
}
