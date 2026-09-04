package com.revive.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.revive.entity.FailedPayment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for predicting recovery probability using trained ML model.
 * Calls Python script with trained model to generate predictions.
 */
@Service
public class RecoveryProbabilityService {

    private static final Logger logger = LoggerFactory.getLogger(RecoveryProbabilityService.class);
    private static final String PYTHON_SCRIPT_PATH = "ml/predict.py";
    private static final double DEFAULT_PROBABILITY = 0.65; // Fallback if ML unavailable

    private final ObjectMapper objectMapper;

    public RecoveryProbabilityService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Predict recovery probability for a failed payment
     */
    public double predictRecoveryProbability(FailedPayment payment) {
        // Check if ML model is available
        File scriptFile = new File(PYTHON_SCRIPT_PATH);
        if (!scriptFile.exists()) {
            logger.warn("ML model script not found at {}, using rule-based fallback", PYTHON_SCRIPT_PATH);
            return getRuleBasedProbability(payment);
        }

        try {
            // Prepare payment data for ML model
            Map<String, Object> paymentData = preparePaymentData(payment);
            String jsonInput = objectMapper.writeValueAsString(paymentData);

            // Call Python script
            ProcessBuilder processBuilder = new ProcessBuilder(
                    "python", PYTHON_SCRIPT_PATH, jsonInput
            );
            processBuilder.redirectErrorStream(true);

            Process process = processBuilder.start();

            // Read output
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                }
            }

            int exitCode = process.waitFor();

            if (exitCode != 0) {
                logger.error("Python script failed with exit code: {}", exitCode);
                logger.error("Output: {}", output);
                return getRuleBasedProbability(payment);
            }

            // Parse result
            JsonNode result = objectMapper.readTree(output.toString());
            
            if (result.path("success").asBoolean(false)) {
                double probability = result.path("probability").asDouble(DEFAULT_PROBABILITY);
                logger.info("ML prediction for payment {}: {:.2f}", 
                        payment.getPaymentIdentifier(), probability);
                return probability;
            } else {
                logger.error("ML prediction failed: {}", result.path("error").asText());
                return getRuleBasedProbability(payment);
            }

        } catch (Exception e) {
            logger.error("Error calling ML model: {}", e.getMessage(), e);
            return getRuleBasedProbability(payment);
        }
    }

    /**
     * Prepare payment data for ML model input
     */
    private Map<String, Object> preparePaymentData(FailedPayment payment) {
        Map<String, Object> data = new HashMap<>();

        data.put("amount", payment.getAmount().doubleValue());
        data.put("paymentMethod", payment.getPaymentMethod() != null ? payment.getPaymentMethod() : "CARD");
        data.put("errorCode", normalizeErrorCode(payment.getErrorCode()));
        data.put("retryCount", payment.getRetryCount());
        
        // Customer history (simplified - would come from customer repository in production)
        data.put("prevSuccessfulPayments", estimatePreviousSuccessful(payment));
        data.put("prevFailedPayments", payment.getRetryCount());
        data.put("customerSuccessRate", estimateCustomerSuccessRate(payment));
        
        // Time features
        LocalDateTime now = LocalDateTime.now();
        data.put("hourOfDay", now.getHour());
        data.put("dayOfWeek", now.getDayOfWeek().getValue() - 1); // 0=Monday
        data.put("isBusinessHours", (now.getHour() >= 9 && now.getHour() <= 18) ? 1 : 0);
        data.put("isWeekend", (now.getDayOfWeek().getValue() >= 6) ? 1 : 0);
        
        // Time since failure
        long hoursSinceFailure = ChronoUnit.HOURS.between(payment.getFailedAt(), now);
        data.put("timeSinceFailureHours", (int) hoursSinceFailure);

        return data;
    }

    /**
     * Normalize error codes to match training data
     */
    private String normalizeErrorCode(String errorCode) {
        if (errorCode == null) {
            return "declined_permanent";
        }
        
        String normalized = errorCode.toLowerCase();
        
        // Map various error codes to standard categories
        if (normalized.contains("temp") || normalized.contains("timeout")) {
            return "issuer_declined_temp";
        } else if (normalized.contains("timeout") || normalized.contains("gateway")) {
            return "gateway_timeout";
        } else if (normalized.contains("insufficient") || normalized.contains("funds")) {
            return "insufficient_funds";
        } else if (normalized.contains("expired")) {
            return "card_expired";
        } else if (normalized.contains("fraud")) {
            return "fraud_suspected";
        } else if (normalized.contains("disputed")) {
            return "disputed";
        } else if (normalized.contains("auth")) {
            return "authentication_failed";
        } else {
            return "declined_permanent";
        }
    }

    /**
     * Estimate previous successful payments (simplified)
     */
    private int estimatePreviousSuccessful(FailedPayment payment) {
        // In production, would query customer payment history
        // For now, use heuristic based on customer email domain
        if (payment.getCustomerEmail() != null && 
            (payment.getCustomerEmail().contains("@gmail") || 
             payment.getCustomerEmail().contains("@yahoo"))) {
            return 5; // Individual customers
        } else {
            return 10; // Business customers typically have more history
        }
    }

    /**
     * Estimate customer success rate (simplified)
     */
    private double estimateCustomerSuccessRate(FailedPayment payment) {
        // In production, would calculate from customer history
        // For now, use heuristic
        if (payment.getRetryCount() == 0) {
            return 0.80; // First failure, assume good history
        } else if (payment.getRetryCount() == 1) {
            return 0.65;
        } else {
            return 0.45; // Multiple failures indicate issues
        }
    }

    /**
     * Rule-based fallback when ML model is unavailable
     */
    private double getRuleBasedProbability(FailedPayment payment) {
        String errorCode = payment.getErrorCode() != null ? 
                payment.getErrorCode().toLowerCase() : "";
        
        // Base probability on error type
        double baseProbability;
        if (errorCode.contains("temp") || errorCode.contains("timeout")) {
            baseProbability = 0.82;
        } else if (errorCode.contains("insufficient")) {
            baseProbability = 0.58;
        } else if (errorCode.contains("expired")) {
            baseProbability = 0.45;
        } else if (errorCode.contains("fraud") || errorCode.contains("disputed")) {
            baseProbability = 0.10;
        } else {
            baseProbability = 0.50;
        }
        
        // Adjust for retry count
        baseProbability -= (payment.getRetryCount() * 0.10);
        
        // Adjust for amount
        if (payment.getAmount().doubleValue() > 50000) {
            baseProbability -= 0.08;
        }
        
        // Clip to valid range
        return Math.max(0.05, Math.min(0.95, baseProbability));
    }
}
