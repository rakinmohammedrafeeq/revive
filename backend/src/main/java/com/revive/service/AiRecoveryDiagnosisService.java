package com.revive.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.revive.dto.AiDiagnosisResult;
import com.revive.entity.FailedPayment;
import io.github.cdimascio.dotenv.Dotenv;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.apache.hc.core5.util.Timeout;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * AI-powered recovery diagnosis and recommendation service.
 * Analyzes payment failures with LLMs using a cascading cross-provider
 * fallback strategy: Groq models -> Gemini models -> Deterministic rule-based fallback.
 */
@Service
public class AiRecoveryDiagnosisService {

    private static final Logger logger = LoggerFactory.getLogger(AiRecoveryDiagnosisService.class);
    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

    private final String groqApiKey;
    private final String geminiApiKey;
    private final List<String> groqModels;
    private final List<String> geminiModels;
    private final ObjectMapper objectMapper;

    public AiRecoveryDiagnosisService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;

        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        this.groqApiKey = dotenv.get("GROQ_API_KEY");
        this.geminiApiKey = dotenv.get("GEMINI_API_KEY");

        // Build prioritized list of Groq models
        Set<String> groqSet = new LinkedHashSet<>();
        addIfValid(groqSet, dotenv.get("GROQ_TEXT_MODEL", "llama-3.3-70b-versatile"));
        addIfValid(groqSet, dotenv.get("GROQ_TEXT_FALLBACK1", "llama-3.1-70b-versatile"));
        addIfValid(groqSet, dotenv.get("GROQ_TEXT_FALLBACK2", "openai/gpt-oss-20b"));
        addIfValid(groqSet, "mixtral-8x7b-32768");
        this.groqModels = new ArrayList<>(groqSet);

        // Build prioritized list of Gemini models
        Set<String> geminiSet = new LinkedHashSet<>();
        addIfValid(geminiSet, dotenv.get("GEMINI_TEXT_PRIMARY", "gemini-2.5-flash"));
        addIfValid(geminiSet, dotenv.get("GEMINI_TEXT_FALLBACK1", "gemini-2.5-flash-lite"));
        addIfValid(geminiSet, dotenv.get("GEMINI_TEXT_FALLBACK2", "gemini-2.0-flash"));
        addIfValid(geminiSet, dotenv.get("GEMINI_TEXT_FALLBACK3", "gemini-1.5-flash"));
        this.geminiModels = new ArrayList<>(geminiSet);

        logger.info("AI Recovery Diagnosis Service initialized. Groq models: {}, Gemini models: {}",
                groqModels, geminiModels);
    }

    private void addIfValid(Set<String> set, String modelName) {
        if (modelName != null && !modelName.isBlank() && !modelName.startsWith("your_")) {
            set.add(modelName.trim());
        }
    }

    private final Set<String> disabledModels = java.util.concurrent.ConcurrentHashMap.newKeySet();
    private volatile boolean groqDisabled = false;
    private volatile boolean geminiDisabled = false;

    /**
     * Diagnose a failed payment and recommend recovery action.
     * Tries Groq models first, cascades to Gemini, and defaults to deterministic safe fallback.
     */
    public AiDiagnosisResult diagnose(FailedPayment payment) {
        String prompt = buildDiagnosisPrompt(payment);

        // 1. Try Groq models first (lowest latency)
        if (groqApiKey != null && !groqApiKey.isBlank() && !groqDisabled) {
            for (String model : groqModels) {
                if (disabledModels.contains(model)) {
                    continue;
                }
                try {
                    logger.debug("Attempting AI recovery diagnosis with Groq model: {}", model);
                    String response = callGroqApi(prompt, model);
                    AiDiagnosisResult result = parseDiagnosisResponse(response, payment);
                    if (result != null && result.getDiagnosis() != null && !result.getDiagnosis().isBlank()) {
                        logger.info("AI diagnosis successful using Groq model [{}] for payment {}",
                                model, payment.getPaymentIdentifier());
                        return result;
                    }
                } catch (Exception e) {
                    String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
                    if (msg.contains("404") || msg.contains("model_not_found") || msg.contains("does not exist")) {
                        logger.warn("Groq model [{}] does not exist (404). Disabling it for future calls.", model);
                        disabledModels.add(model);
                    } else if (msg.contains("401") || msg.contains("invalid api key") || msg.contains("unauthorized")) {
                        logger.warn("Groq authentication failed (401). Disabling Groq and switching directly to Gemini.");
                        groqDisabled = true;
                        break;
                    } else {
                        logger.warn("Groq model [{}] failed for payment {}: {}. Trying next fallback...",
                                model, payment.getPaymentIdentifier(), e.getMessage());
                    }
                }
            }
        }

        // 2. Try Gemini models as cross-provider fallback
        if (geminiApiKey != null && !geminiApiKey.isBlank() && !geminiDisabled) {
            for (String model : geminiModels) {
                if (disabledModels.contains(model)) {
                    continue;
                }
                try {
                    logger.debug("Attempting AI recovery diagnosis with Gemini model: {}", model);
                    String response = callGeminiApi(prompt, model);
                    AiDiagnosisResult result = parseDiagnosisResponse(response, payment);
                    if (result != null && result.getDiagnosis() != null && !result.getDiagnosis().isBlank()) {
                        logger.info("AI diagnosis successful using Gemini model [{}] for payment {}",
                                model, payment.getPaymentIdentifier());
                        return result;
                    }
                } catch (Exception e) {
                    String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
                    if (msg.contains("404") || msg.contains("not found") || msg.contains("does not exist")) {
                        logger.warn("Gemini model [{}] does not exist (404). Disabling it for future calls.", model);
                        disabledModels.add(model);
                    } else if (msg.contains("401") || msg.contains("invalid key") || msg.contains("unauthorized")) {
                        logger.warn("Gemini authentication failed (401). Disabling Gemini.");
                        geminiDisabled = true;
                        break;
                    } else {
                        logger.warn("Gemini model [{}] failed for payment {}: {}. Trying next fallback...",
                                model, payment.getPaymentIdentifier(), e.getMessage());
                    }
                }
            }
        }

        // 3. Fallback to calibrated deterministic rule-based diagnosis
        logger.info("Using calibrated deterministic rule-based fallback diagnosis for payment {}",
                payment.getPaymentIdentifier());
        return getSafeFallback(payment);
    }

    /**
     * Build prompt for AI diagnosis
     */
    private String buildDiagnosisPrompt(FailedPayment payment) {
        return String.format("""
                You are an AI revenue recovery expert analyzing a failed payment. Provide a structured diagnosis and recovery recommendation.
                
                Payment Details:
                - Amount: ₹%s
                - Payment Method: %s
                - Failure Reason: %s
                - Error Code: %s
                - Retry Count: %d
                - Customer: %s (%s)
                - Failed At: %s
                
                Analyze this failure and respond with ONLY a valid JSON object (no markdown, no explanation):
                {
                  "diagnosis": "brief diagnosis of what happened",
                  "rootCause": "likely root cause",
                  "recommendation": "recommended recovery action",
                  "reasoning": "why this recommendation makes sense",
                  "confidence": 0.85,
                  "isRecoverable": true,
                  "suggestedAction": "AUTOMATIC_RETRY",
                  "suggestedDelayMinutes": 60
                }
                
                Suggested action must be one of: AUTOMATIC_RETRY, EMAIL_REMINDER, SMS_REMINDER, PAYMENT_LINK, DISCOUNT_OFFER, PHONE_CALL, ESCALATION
                
                Consider:
                - Is this a temporary or permanent failure?
                - What's the recovery probability based on failure type?
                - What action has the best chance of success?
                - Should we wait before retrying?
                """,
                payment.getAmount(),
                payment.getPaymentMethod() != null ? payment.getPaymentMethod() : "unknown",
                payment.getFailureReason() != null ? payment.getFailureReason() : "unknown",
                payment.getErrorCode() != null ? payment.getErrorCode() : "unknown",
                payment.getRetryCount(),
                payment.getCustomerName() != null ? payment.getCustomerName() : "Unknown",
                payment.getCustomerEmail() != null ? payment.getCustomerEmail() : "unknown",
                payment.getFailedAt()
        );
    }

    /**
     * Call Groq API with specific model and strict timeout
     */
    private String callGroqApi(String prompt, String model) throws Exception {
        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectTimeout(Timeout.ofSeconds(4))
                .setResponseTimeout(Timeout.ofSeconds(6))
                .build();

        try (CloseableHttpClient client = HttpClients.custom()
                .setDefaultRequestConfig(requestConfig)
                .build()) {
            HttpPost request = new HttpPost(GROQ_API_URL);
            request.setHeader("Authorization", "Bearer " + groqApiKey);
            request.setHeader("Content-Type", "application/json");

            Map<String, Object> body = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "user", "content", prompt)
                    ),
                    "temperature", 0.3,
                    "max_tokens", 500
            );

            request.setEntity(new StringEntity(objectMapper.writeValueAsString(body), StandardCharsets.UTF_8));

            try (CloseableHttpResponse response = client.execute(request)) {
                String responseBody = EntityUtils.toString(response.getEntity(), StandardCharsets.UTF_8);
                if (response.getCode() != 200) {
                    throw new RuntimeException("Groq API returned status " + response.getCode() + ": " + responseBody);
                }

                JsonNode root = objectMapper.readTree(responseBody);
                return root.path("choices").get(0).path("message").path("content").asText();
            }
        }
    }

    /**
     * Call Gemini API with specific model and strict timeout
     */
    private String callGeminiApi(String prompt, String model) throws Exception {
        String url = GEMINI_API_URL + model + ":generateContent?key=" + geminiApiKey;

        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectTimeout(Timeout.ofSeconds(4))
                .setResponseTimeout(Timeout.ofSeconds(6))
                .build();

        try (CloseableHttpClient client = HttpClients.custom()
                .setDefaultRequestConfig(requestConfig)
                .build()) {
            HttpPost request = new HttpPost(url);
            request.setHeader("Content-Type", "application/json");

            Map<String, Object> body = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", prompt)
                            ))
                    ),
                    "generationConfig", Map.of(
                            "temperature", 0.3,
                            "maxOutputTokens", 500
                    )
            );

            request.setEntity(new StringEntity(objectMapper.writeValueAsString(body), StandardCharsets.UTF_8));

            try (CloseableHttpResponse response = client.execute(request)) {
                String responseBody = EntityUtils.toString(response.getEntity(), StandardCharsets.UTF_8);
                if (response.getCode() != 200) {
                    throw new RuntimeException("Gemini API returned status " + response.getCode() + ": " + responseBody);
                }

                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && candidates.size() > 0) {
                    JsonNode parts = candidates.get(0).path("content").path("parts");
                    if (parts.isArray() && parts.size() > 0) {
                        return parts.get(0).path("text").asText();
                    }
                }
                throw new RuntimeException("Empty or invalid candidate content from Gemini API");
            }
        }
    }

    /**
     * Parse AI response into structured diagnosis
     */
    private AiDiagnosisResult parseDiagnosisResponse(String response, FailedPayment payment) {
        try {
            if (response == null || response.isBlank()) {
                return null;
            }

            // Remove markdown code blocks if present
            String cleanJson = response.trim();
            if (cleanJson.startsWith("```json")) {
                cleanJson = cleanJson.substring(7);
            }
            if (cleanJson.startsWith("```")) {
                cleanJson = cleanJson.substring(3);
            }
            if (cleanJson.endsWith("```")) {
                cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
            }
            cleanJson = cleanJson.trim();

            JsonNode jsonResponse = objectMapper.readTree(cleanJson);

            return AiDiagnosisResult.builder()
                    .diagnosis(jsonResponse.path("diagnosis").asText("AI Analysis Complete"))
                    .rootCause(jsonResponse.path("rootCause").asText("Payment gateway or issuer decline"))
                    .recommendation(jsonResponse.path("recommendation").asText("Execute recovery"))
                    .reasoning(jsonResponse.path("reasoning").asText("Analysis based on error codes and payment characteristics."))
                    .confidence(jsonResponse.path("confidence").asDouble(0.75))
                    .isRecoverable(jsonResponse.path("isRecoverable").asBoolean(true))
                    .suggestedAction(jsonResponse.path("suggestedAction").asText("AUTOMATIC_RETRY"))
                    .suggestedDelayMinutes(jsonResponse.path("suggestedDelayMinutes").asInt(60))
                    .build();
        } catch (Exception e) {
            logger.warn("Could not parse AI response JSON: {}. Falling back.", e.getMessage());
            return null;
        }
    }

    /**
     * Fallback mock diagnosis when AI is unavailable
     */
    private AiDiagnosisResult getMockDiagnosis(FailedPayment payment) {
        return getSafeFallback(payment);
    }

    /**
     * Static safe fallback — used by orchestrator when LLM call fails.
     * Returns a conservative, safe recommendation based on the error code.
     * Never recommends dangerous actions when the LLM is unavailable.
     */
    public static AiDiagnosisResult getSafeFallback(FailedPayment payment) {
        String errorCode = payment.getErrorCode() != null ? payment.getErrorCode().toLowerCase() : "";

        if (errorCode.contains("temp") || errorCode.contains("timeout") || errorCode.contains("declined_temp")
                || errorCode.contains("gateway")) {
            return AiDiagnosisResult.builder()
                    .diagnosis("Temporary issuer decline detected")
                    .rootCause("Payment gateway or issuer experienced temporary processing issues")
                    .recommendation("Retry payment after cooldown period")
                    .reasoning("Temporary failures typically resolve within hours. Customer's payment history suggests good standing. [Fallback diagnosis - LLM unavailable]")
                    .confidence(0.80)
                    .isRecoverable(true)
                    .suggestedAction("AUTOMATIC_RETRY")
                    .suggestedDelayMinutes(120)
                    .build();
        } else if (errorCode.contains("insufficient") || errorCode.contains("funds")) {
            return AiDiagnosisResult.builder()
                    .diagnosis("Insufficient funds at time of payment")
                    .rootCause("Customer's account balance was insufficient")
                    .recommendation("Notify customer via email to retry when funds are available")
                    .reasoning("Customers typically receive funds on predictable schedules. An email reminder is safe and non-intrusive. [Fallback diagnosis - LLM unavailable]")
                    .confidence(0.70)
                    .isRecoverable(true)
                    .suggestedAction("EMAIL_REMINDER")
                    .suggestedDelayMinutes(2880)
                    .build();
        } else if (errorCode.contains("expired") || errorCode.contains("card_expired")) {
            return AiDiagnosisResult.builder()
                    .diagnosis("Payment method expired")
                    .rootCause("Card expiration date has passed")
                    .recommendation("Send payment link for customer to update payment method")
                    .reasoning("Customer needs to provide new card details. A payment link is the safest approach. [Fallback diagnosis - LLM unavailable]")
                    .confidence(0.88)
                    .isRecoverable(true)
                    .suggestedAction("PAYMENT_LINK")
                    .suggestedDelayMinutes(0)
                    .build();
        } else if (errorCode.contains("auth") || errorCode.contains("authentication")) {
            return AiDiagnosisResult.builder()
                    .diagnosis("Authentication challenge failed")
                    .rootCause("3DS or OTP authentication was not completed")
                    .recommendation("Send a fresh payment link to allow the customer to re-authenticate")
                    .reasoning("A fresh payment link bypasses the failed challenge. [Fallback diagnosis - LLM unavailable]")
                    .confidence(0.75)
                    .isRecoverable(true)
                    .suggestedAction("PAYMENT_LINK")
                    .suggestedDelayMinutes(0)
                    .build();
        } else if (errorCode.contains("fraud") || errorCode.contains("risk") || errorCode.contains("dispute")) {
            return AiDiagnosisResult.builder()
                    .diagnosis("Risk or fraud flag detected")
                    .rootCause("Risk management system declined the transaction")
                    .recommendation("Escalate for manual review — do not auto-retry")
                    .reasoning("Fraud/risk flags require manual investigation before any retry. [Fallback diagnosis - LLM unavailable]")
                    .confidence(0.90)
                    .isRecoverable(false)
                    .suggestedAction("ESCALATION")
                    .suggestedDelayMinutes(0)
                    .build();
        } else {
            return AiDiagnosisResult.builder()
                    .diagnosis("Payment declined by issuer")
                    .rootCause("General payment failure — requires investigation")
                    .recommendation("Send customer notification with payment retry link")
                    .reasoning("Conservative approach: notify customer and provide payment link for safe recovery. [Fallback diagnosis - LLM unavailable]")
                    .confidence(0.60)
                    .isRecoverable(true)
                    .suggestedAction("PAYMENT_LINK")
                    .suggestedDelayMinutes(60)
                    .build();
        }
    }
}
