package com.revive.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.revive.entity.FailedPayment;
import com.revive.entity.MlPrediction;
import com.revive.entity.Workspace;
import com.revive.enums.PaymentStatus;
import com.revive.enums.PredictionMethod;
import com.revive.repository.MlPredictionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for tracking ML predictions vs actual outcomes.
 * Enables ML feedback loop and model performance monitoring.
 */
@Service
public class MlPredictionTrackingService {

    private static final Logger logger = LoggerFactory.getLogger(MlPredictionTrackingService.class);
    
    // Model version from current trained model
    private static final String CURRENT_MODEL_VERSION = "v1.0";
    private static final String CURRENT_MODEL_NAME = "Random Forest";

    private final MlPredictionRepository mlPredictionRepository;
    private final ObjectMapper objectMapper;

    public MlPredictionTrackingService(
            MlPredictionRepository mlPredictionRepository,
            ObjectMapper objectMapper) {
        this.mlPredictionRepository = mlPredictionRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Track a new ML prediction
     */
    @Transactional
    public MlPrediction trackPrediction(
            FailedPayment payment,
            double predictedProbability,
            PredictionMethod method,
            Workspace workspace) {
        
        // Check if prediction already exists
        Optional<MlPrediction> existing = mlPredictionRepository.findByFailedPaymentId(payment.getId());
        if (existing.isPresent()) {
            logger.debug("Prediction already exists for payment {}", payment.getId());
            return existing.get();
        }

        // Build feature snapshot
        Map<String, Object> features = buildFeatureSnapshot(payment);
        String featuresJson;
        try {
            featuresJson = objectMapper.writeValueAsString(features);
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize features for payment {}: {}", 
                payment.getId(), e.getMessage());
            featuresJson = "{}";
        }

        // Create prediction record
        MlPrediction prediction = MlPrediction.builder()
                .failedPayment(payment)
                .workspace(workspace)
                .predictedProbability(BigDecimal.valueOf(predictedProbability)
                        .setScale(4, RoundingMode.HALF_UP))
                .modelVersion(CURRENT_MODEL_VERSION)
                .modelName(CURRENT_MODEL_NAME)
                .predictionMethod(method)
                .features(featuresJson)
                .actualOutcome(null) // Will be filled later
                .predictedAt(LocalDateTime.now())
                .build();

        MlPrediction saved = mlPredictionRepository.save(prediction);
        
        logger.info("Tracked ML prediction for payment {}: probability={}, method={}", 
                payment.getPaymentIdentifier(), predictedProbability, method);
        
        return saved;
    }

    /**
     * Record actual outcome for a prediction
     */
    @Transactional
    public void recordOutcome(Long failedPaymentId, PaymentStatus actualOutcome) {
        Optional<MlPrediction> predictionOpt = mlPredictionRepository.findByFailedPaymentId(failedPaymentId);
        
        if (predictionOpt.isEmpty()) {
            logger.warn("No ML prediction found for payment {}, cannot record outcome", failedPaymentId);
            return;
        }

        MlPrediction prediction = predictionOpt.get();
        
        // Only record outcome if not already recorded
        if (prediction.getActualOutcome() != null) {
            logger.debug("Outcome already recorded for payment {}", failedPaymentId);
            return;
        }

        // Record outcome and calculate metrics
        prediction.recordOutcome(actualOutcome);
        mlPredictionRepository.save(prediction);
        
        logger.info("Recorded outcome for payment {}: predicted={}, actual={}, correct={}", 
                failedPaymentId, 
                prediction.getPredictedProbability(), 
                actualOutcome, 
                prediction.getWasCorrect());
    }

    /**
     * Get prediction for a payment
     */
    public Optional<MlPrediction> getPrediction(Long failedPaymentId) {
        return mlPredictionRepository.findByFailedPaymentId(failedPaymentId);
    }

    /**
     * Get all predictions for a workspace
     */
    public List<MlPrediction> getAllPredictions(Long workspaceId) {
        return mlPredictionRepository.findByWorkspaceIdOrderByPredictedAtDesc(workspaceId);
    }

    /**
     * Get predictions pending outcome
     */
    public List<MlPrediction> getPendingOutcomes(Long workspaceId) {
        return mlPredictionRepository.findPendingOutcomes(workspaceId);
    }

    /**
     * Get prediction accuracy metrics for workspace
     */
    public Map<String, Object> getAccuracyMetrics(Long workspaceId) {
        long totalWithOutcomes = mlPredictionRepository.countWithOutcomes(workspaceId);
        long correctPredictions = mlPredictionRepository.countCorrectPredictions(workspaceId);
        Double avgError = mlPredictionRepository.getAveragePredictionError(workspaceId);

        double accuracy = totalWithOutcomes > 0 
            ? (double) correctPredictions / totalWithOutcomes 
            : 0.0;

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalPredictionsWithOutcomes", totalWithOutcomes);
        metrics.put("correctPredictions", correctPredictions);
        metrics.put("accuracy", BigDecimal.valueOf(accuracy).setScale(4, RoundingMode.HALF_UP));
        metrics.put("averagePredictionError", avgError != null 
            ? BigDecimal.valueOf(avgError).setScale(4, RoundingMode.HALF_UP) 
            : null);

        return metrics;
    }

    /**
     * Build feature snapshot at prediction time
     */
    private Map<String, Object> buildFeatureSnapshot(FailedPayment payment) {
        Map<String, Object> features = new HashMap<>();

        // Payment attributes
        features.put("amount", payment.getAmount());
        features.put("currency", payment.getCurrency());
        features.put("payment_method", payment.getPaymentMethod());
        features.put("error_code", payment.getErrorCode());
        features.put("failure_reason", payment.getFailureReason());
        features.put("retry_count", payment.getRetryCount());

        // Customer attributes
        features.put("customer_id", payment.getCustomerId());
        features.put("has_email", payment.getCustomerEmail() != null);
        features.put("has_phone", payment.getCustomerPhone() != null);

        // Time-based features
        if (payment.getFailedAt() != null) {
            long hoursSinceFailure = Duration.between(payment.getFailedAt(), LocalDateTime.now()).toHours();
            features.put("hours_since_failure", hoursSinceFailure);
            features.put("day_of_week", payment.getFailedAt().getDayOfWeek().getValue());
            features.put("hour_of_day", payment.getFailedAt().getHour());
            features.put("is_weekend", payment.getFailedAt().getDayOfWeek().getValue() >= 6);
            features.put("is_business_hours", 
                payment.getFailedAt().getHour() >= 9 && payment.getFailedAt().getHour() < 18);
        }

        // Error code categorization
        if (payment.getErrorCode() != null) {
            String errorCode = payment.getErrorCode().toLowerCase();
            features.put("is_temporary", errorCode.contains("temp") || errorCode.contains("timeout"));
            features.put("is_insufficient_funds", errorCode.contains("insufficient"));
            features.put("is_fraud_risk", errorCode.contains("fraud") || errorCode.contains("risk"));
            features.put("is_card_issue", errorCode.contains("card") || errorCode.contains("expired"));
        }

        features.put("snapshot_timestamp", LocalDateTime.now().toString());

        return features;
    }

    /**
     * Check if prediction exists for payment
     */
    public boolean hasPrediction(Long failedPaymentId) {
        return mlPredictionRepository.existsByFailedPaymentId(failedPaymentId);
    }

    /**
     * Get predictions with outcomes in date range
     */
    public List<MlPrediction> getPredictionsInRange(
            Long workspaceId, 
            LocalDateTime startDate, 
            LocalDateTime endDate) {
        return mlPredictionRepository.findWithOutcomesInRange(workspaceId, startDate, endDate);
    }
}
