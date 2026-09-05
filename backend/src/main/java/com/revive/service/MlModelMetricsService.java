package com.revive.service;

import com.revive.entity.MlModelMetrics;
import com.revive.entity.MlPrediction;
import com.revive.entity.Workspace;
import com.revive.enums.PaymentStatus;
import com.revive.repository.MlModelMetricsRepository;
import com.revive.repository.MlPredictionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for calculating and storing ML model performance metrics.
 * Tracks accuracy, precision, recall, F1 score, and business impact over time.
 */
@Service
public class MlModelMetricsService {

    private static final Logger logger = LoggerFactory.getLogger(MlModelMetricsService.class);
    
    private static final String CURRENT_MODEL_VERSION = "v1.0";
    private static final String CURRENT_MODEL_NAME = "Random Forest";

    private final MlPredictionRepository mlPredictionRepository;
    private final MlModelMetricsRepository mlModelMetricsRepository;

    public MlModelMetricsService(
            MlPredictionRepository mlPredictionRepository,
            MlModelMetricsRepository mlModelMetricsRepository) {
        this.mlPredictionRepository = mlPredictionRepository;
        this.mlModelMetricsRepository = mlModelMetricsRepository;
    }

    /**
     * Calculate and store metrics for a time period
     */
    @Transactional
    public MlModelMetrics calculateMetrics(
            Workspace workspace,
            LocalDateTime periodStart,
            LocalDateTime periodEnd) {
        
        logger.info("Calculating ML metrics for workspace {} from {} to {}", 
                workspace.getId(), periodStart, periodEnd);

        // Get predictions with outcomes in the period
        List<MlPrediction> predictions = mlPredictionRepository.findWithOutcomesInRange(
                workspace.getId(), periodStart, periodEnd);

        if (predictions.isEmpty()) {
            logger.warn("No predictions with outcomes found in period for workspace {}", 
                    workspace.getId());
            return null;
        }

        // Calculate confusion matrix
        int truePositives = 0;
        int trueNegatives = 0;
        int falsePositives = 0;
        int falseNegatives = 0;
        BigDecimal totalPredictionError = BigDecimal.ZERO;
        BigDecimal expectedRecoveryValue = BigDecimal.ZERO;
        BigDecimal actualRecoveryValue = BigDecimal.ZERO;

        for (MlPrediction prediction : predictions) {
            boolean predictedRecovery = prediction.getPredictedProbability()
                    .compareTo(new BigDecimal("0.5")) >= 0;
            boolean actuallyRecovered = prediction.getActualOutcome() == PaymentStatus.RECOVERED;

            // Confusion matrix
            if (predictedRecovery && actuallyRecovered) {
                truePositives++;
            } else if (!predictedRecovery && !actuallyRecovered) {
                trueNegatives++;
            } else if (predictedRecovery && !actuallyRecovered) {
                falsePositives++;
            } else {
                falseNegatives++;
            }

            // Prediction error
            if (prediction.getPredictionError() != null) {
                totalPredictionError = totalPredictionError.add(prediction.getPredictionError());
            }

            // Business metrics
            BigDecimal paymentAmount = prediction.getFailedPayment().getAmount();
            BigDecimal expectedValue = prediction.getPredictedProbability().multiply(paymentAmount);
            expectedRecoveryValue = expectedRecoveryValue.add(expectedValue);

            if (actuallyRecovered) {
                actualRecoveryValue = actualRecoveryValue.add(paymentAmount);
            }
        }

        int totalPredictions = predictions.size();
        int totalWithOutcomes = truePositives + trueNegatives + falsePositives + falseNegatives;

        // Calculate metrics
        BigDecimal accuracy = calculateSafeRatio(truePositives + trueNegatives, totalWithOutcomes);
        BigDecimal precision = calculateSafeRatio(truePositives, truePositives + falsePositives);
        BigDecimal recall = calculateSafeRatio(truePositives, truePositives + falseNegatives);
        BigDecimal f1Score = calculateF1Score(precision, recall);
        BigDecimal avgPredictionError = totalWithOutcomes > 0 
                ? totalPredictionError.divide(
                        BigDecimal.valueOf(totalWithOutcomes), 4, RoundingMode.HALF_UP)
                : null;
        BigDecimal predictionRoi = expectedRecoveryValue.compareTo(BigDecimal.ZERO) > 0
                ? actualRecoveryValue.divide(expectedRecoveryValue, 4, RoundingMode.HALF_UP)
                : null;

        // Create metrics record
        MlModelMetrics metrics = MlModelMetrics.builder()
                .workspace(workspace)
                .modelVersion(CURRENT_MODEL_VERSION)
                .modelName(CURRENT_MODEL_NAME)
                .periodStart(periodStart)
                .periodEnd(periodEnd)
                .totalPredictions(totalPredictions)
                .predictionsWithOutcomes(totalWithOutcomes)
                .accuracy(accuracy)
                .precisionScore(precision)
                .recallScore(recall)
                .f1Score(f1Score)
                .rocAuc(null) // ROC-AUC requires more complex calculation
                .truePositives(truePositives)
                .trueNegatives(trueNegatives)
                .falsePositives(falsePositives)
                .falseNegatives(falseNegatives)
                .avgPredictionError(avgPredictionError)
                .expectedRecoveryValue(expectedRecoveryValue)
                .actualRecoveryValue(actualRecoveryValue)
                .predictionRoi(predictionRoi)
                .calculatedAt(LocalDateTime.now())
                .build();

        MlModelMetrics saved = mlModelMetricsRepository.save(metrics);

        logger.info("Calculated ML metrics for workspace {}: accuracy={}, precision={}, recall={}, f1={}", 
                workspace.getId(), accuracy, precision, recall, f1Score);
        logger.info("Business impact: expected=₹{}, actual=₹{}, ROI={}", 
                expectedRecoveryValue, actualRecoveryValue, predictionRoi);

        return saved;
    }

    /**
     * Get latest metrics for a workspace
     */
    public Optional<MlModelMetrics> getLatestMetrics(Long workspaceId) {
        return mlModelMetricsRepository.findFirstByWorkspaceIdAndModelVersionOrderByCalculatedAtDesc(
                workspaceId, CURRENT_MODEL_VERSION);
    }

    /**
     * Get all metrics for a workspace
     */
    public List<MlModelMetrics> getAllMetrics(Long workspaceId) {
        return mlModelMetricsRepository.findByWorkspaceIdOrderByCalculatedAtDesc(workspaceId);
    }

    /**
     * Get metrics in date range
     */
    public List<MlModelMetrics> getMetricsInRange(
            Long workspaceId, 
            LocalDateTime startDate, 
            LocalDateTime endDate) {
        return mlModelMetricsRepository.findInDateRange(workspaceId, startDate, endDate);
    }

    /**
     * Calculate safe ratio with division by zero protection
     */
    private BigDecimal calculateSafeRatio(int numerator, int denominator) {
        if (denominator == 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(numerator)
                .divide(BigDecimal.valueOf(denominator), 4, RoundingMode.HALF_UP);
    }

    /**
     * Calculate F1 score from precision and recall
     */
    private BigDecimal calculateF1Score(BigDecimal precision, BigDecimal recall) {
        if (precision.compareTo(BigDecimal.ZERO) == 0 || recall.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal sum = precision.add(recall);
        if (sum.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        
        return BigDecimal.valueOf(2)
                .multiply(precision)
                .multiply(recall)
                .divide(sum, 4, RoundingMode.HALF_UP);
    }
}
