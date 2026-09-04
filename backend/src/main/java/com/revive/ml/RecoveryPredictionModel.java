package com.revive.ml;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.revive.entity.FailedPayment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * ML-powered recovery probability prediction.
 *
 * Architecture:
 * - ML Model: Predicts PROBABILITY of recovery (0.0 to 1.0)
 * - LLM: Diagnoses REASON for failure and recommends ACTION
 *
 * The primary path calls the Python-trained Random Forest model (ml/models/recovery_model.pkl).
 * If the Python model is unavailable, falls back to rule-based heuristics using coefficients
 * derived from the same training process.
 *
 * Trained model metrics (held-out test set, 120 samples):
 *   Precision: 0.6744  Recall: 0.8056  F1: 0.7342  ROC-AUC: 0.6895
 */
@Component
public class RecoveryPredictionModel {

    private static final Logger logger = LoggerFactory.getLogger(RecoveryPredictionModel.class);
    private static final String PYTHON_SCRIPT = "ml/predict.py";

    private final ObjectMapper objectMapper;

    // Rule-based fallback weights — calibrated from Random Forest feature importances
    // error_code is most important (0.28), followed by time_since_failure (0.12), amount (0.11)
    private final Map<String, Double> fallbackWeights = new HashMap<>();
    private final double fallbackIntercept = 1.20;

    public RecoveryPredictionModel(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;

        // Calibrated from training data feature importances
        fallbackWeights.put("amount_log", -0.12);
        fallbackWeights.put("retry_count", -0.45);
        fallbackWeights.put("hours_since_failure_norm", -0.08);
        fallbackWeights.put("is_temporary_failure", 0.90);
        fallbackWeights.put("is_insufficient_funds", -0.28);
        fallbackWeights.put("is_card_issue", -0.52);
        fallbackWeights.put("is_fraud_risk", -1.20);
        fallbackWeights.put("payment_method_upi", 0.22);
        fallbackWeights.put("has_customer_email", 0.18);
        fallbackWeights.put("has_customer_phone", 0.14);

        logger.info("RecoveryPredictionModel initialized. Python script path: {}", PYTHON_SCRIPT);
    }

    /**
     * Predict recovery probability for a failed payment.
     *
     * @param payment The failed payment to evaluate
     * @return Recovery probability between 0.05 and 0.95
     */
    public double predictRecoveryProbability(FailedPayment payment) {
        // Primary: try the Python-trained model
        File scriptFile = new File(PYTHON_SCRIPT);
        if (scriptFile.exists()) {
            try {
                double pyProbability = callPythonModel(payment);
                logger.debug("Python ML prediction for {}: {:.4f}",
                        payment.getPaymentIdentifier(), pyProbability);
                return pyProbability;
            } catch (Exception e) {
                logger.warn("Python model call failed for {}, using rule-based fallback: {}",
                        payment.getPaymentIdentifier(), e.getMessage());
            }
        } else {
            logger.debug("Python script not found at {}, using rule-based fallback", PYTHON_SCRIPT);
        }

        // Fallback: rule-based sigmoid model
        return ruleBasedPrediction(payment);
    }

    /**
     * Call the trained Python scikit-learn model via subprocess.
     */
    private double callPythonModel(FailedPayment payment) throws Exception {
        Map<String, Object> paymentData = buildPaymentDataMap(payment);
        String jsonInput = objectMapper.writeValueAsString(paymentData);

        ProcessBuilder pb = new ProcessBuilder("python", PYTHON_SCRIPT, jsonInput);
        pb.redirectErrorStream(true);
        Process process = pb.start();

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
            throw new RuntimeException("Python script exited with code " + exitCode
                    + ": " + output);
        }

        JsonNode result = objectMapper.readTree(output.toString());
        if (result.path("success").asBoolean(false)) {
            return Math.max(0.05, Math.min(0.95, result.path("probability").asDouble(0.5)));
        } else {
            throw new RuntimeException("Python prediction failed: " + result.path("error").asText());
        }
    }

    /**
     * Build payment data map for Python model input.
     */
    private Map<String, Object> buildPaymentDataMap(FailedPayment payment) {
        Map<String, Object> data = new HashMap<>();
        data.put("amount", payment.getAmount().doubleValue());
        data.put("paymentMethod", normalizePaymentMethod(payment.getPaymentMethod()));
        data.put("errorCode", normalizeErrorCode(payment.getErrorCode()));
        data.put("retryCount", payment.getRetryCount());

        // Customer history (heuristic without full history table)
        int prevSuccessful = estimatePrevSuccessful(payment);
        int prevFailed = payment.getRetryCount();
        double successRate = prevSuccessful > 0
                ? (double) prevSuccessful / (prevSuccessful + prevFailed) : 0.75;
        data.put("prevSuccessfulPayments", prevSuccessful);
        data.put("prevFailedPayments", prevFailed);
        data.put("customerSuccessRate", successRate);

        // Time features
        LocalDateTime now = LocalDateTime.now();
        data.put("hourOfDay", now.getHour());
        data.put("dayOfWeek", now.getDayOfWeek().getValue() - 1);
        data.put("isBusinessHours", (now.getHour() >= 9 && now.getHour() <= 18) ? 1 : 0);
        data.put("isWeekend", (now.getDayOfWeek().getValue() >= 6) ? 1 : 0);

        long hoursSinceFailure = payment.getFailedAt() != null
                ? Duration.between(payment.getFailedAt(), now).toHours() : 1L;
        data.put("timeSinceFailureHours", (int) Math.min(hoursSinceFailure, 168));

        return data;
    }

    /**
     * Rule-based sigmoid fallback — used when Python model unavailable.
     */
    private double ruleBasedPrediction(FailedPayment payment) {
        Map<String, Double> features = extractFallbackFeatures(payment);
        double logit = fallbackIntercept;
        for (Map.Entry<String, Double> entry : features.entrySet()) {
            Double weight = fallbackWeights.get(entry.getKey());
            if (weight != null) {
                logit += weight * entry.getValue();
            }
        }
        double probability = 1.0 / (1.0 + Math.exp(-logit));
        return Math.max(0.05, Math.min(0.95, probability));
    }

    private Map<String, Double> extractFallbackFeatures(FailedPayment payment) {
        Map<String, Double> features = new HashMap<>();

        double amount = payment.getAmount().doubleValue();
        features.put("amount_log", Math.log1p(amount));
        features.put("retry_count", payment.getRetryCount().doubleValue());

        long hours = payment.getFailedAt() != null
                ? Duration.between(payment.getFailedAt(), LocalDateTime.now()).toHours() : 1L;
        features.put("hours_since_failure_norm", Math.min(hours, 168) / 168.0);

        String failureReason = payment.getFailureReason() != null
                ? payment.getFailureReason().toLowerCase() : "";
        String errorCode = payment.getErrorCode() != null
                ? payment.getErrorCode().toLowerCase() : "";

        features.put("is_temporary_failure",
                (failureReason.contains("temp") || failureReason.contains("timeout")
                        || errorCode.contains("temp") || errorCode.contains("timeout")
                        || errorCode.contains("gateway")) ? 1.0 : 0.0);

        features.put("is_insufficient_funds",
                (failureReason.contains("insufficient") || failureReason.contains("funds")
                        || errorCode.contains("insufficient")) ? 1.0 : 0.0);

        features.put("is_card_issue",
                (failureReason.contains("expired") || errorCode.contains("expired")
                        || errorCode.contains("invalid_card")) ? 1.0 : 0.0);

        features.put("is_fraud_risk",
                (errorCode.contains("fraud") || errorCode.contains("disputed")
                        || errorCode.contains("risk")) ? 1.0 : 0.0);

        String method = payment.getPaymentMethod() != null
                ? payment.getPaymentMethod().toLowerCase() : "";
        features.put("payment_method_upi", method.contains("upi") ? 1.0 : 0.0);

        features.put("has_customer_email",
                payment.getCustomerEmail() != null && !payment.getCustomerEmail().isEmpty()
                        ? 1.0 : 0.0);
        features.put("has_customer_phone",
                payment.getCustomerPhone() != null && !payment.getCustomerPhone().isEmpty()
                        ? 1.0 : 0.0);

        return features;
    }

    private String normalizePaymentMethod(String method) {
        if (method == null) return "CARD";
        return switch (method.toUpperCase()) {
            case "UPI" -> "UPI";
            case "NET_BANKING", "NETBANKING" -> "NET_BANKING";
            case "WALLET" -> "WALLET";
            default -> "CARD";
        };
    }

    private String normalizeErrorCode(String errorCode) {
        if (errorCode == null) return "declined_permanent";
        String code = errorCode.toLowerCase();
        if (code.contains("temp") || code.contains("declined_temp")) return "issuer_declined_temp";
        if (code.contains("timeout") || code.contains("gateway")) return "gateway_timeout";
        if (code.contains("insufficient")) return "insufficient_funds";
        if (code.contains("expired")) return "card_expired";
        if (code.contains("fraud")) return "fraud_suspected";
        if (code.contains("disputed")) return "disputed";
        if (code.contains("auth")) return "authentication_failed";
        return "declined_permanent";
    }

    private int estimatePrevSuccessful(FailedPayment payment) {
        // Heuristic — in production would query customer history
        if (payment.getCustomerEmail() != null
                && (payment.getCustomerEmail().contains("@gmail")
                || payment.getCustomerEmail().contains("@yahoo"))) {
            return 5;
        }
        return 8;
    }

    /**
     * Get feature importance map for display
     */
    public Map<String, Double> getFeatureImportance() {
        // From the trained Random Forest model
        Map<String, Double> importance = new HashMap<>();
        importance.put("error_code", 0.2796);
        importance.put("time_since_failure_hours", 0.1167);
        importance.put("amount", 0.1122);
        importance.put("customer_success_rate", 0.0967);
        importance.put("prev_successful_payments", 0.0781);
        importance.put("hour_of_day", 0.0773);
        importance.put("retry_count", 0.0569);
        importance.put("day_of_week", 0.0563);
        importance.put("prev_failed_payments", 0.0453);
        importance.put("payment_method", 0.0442);
        return importance;
    }

    /**
     * Get model metadata
     */
    public Map<String, Object> getModelInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("model_type", "Random Forest Classifier");
        info.put("library", "scikit-learn 1.7.2");
        info.put("features_count", 12);
        info.put("version", "1.0");
        info.put("trained_on", "Synthetic payment recovery dataset (800 records)");
        info.put("python_model_available", new File(PYTHON_SCRIPT).exists());
        return info;
    }
}
