package com.revive.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.revive.dto.AiDiagnosisResult;
import com.revive.entity.FailedPayment;
import com.revive.enums.RecoveryActionType;
import io.github.cdimascio.dotenv.Dotenv;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * AI-powered recovery diagnosis and recommendation service.
 * Uses LLM to analyze payment failures and recommend recovery strategies.
 */
@Service
public class AiRecoveryDiagnosisService {

    private static final Logger logger = LoggerFactory.getLogger(AiRecoveryDiagnosisService.class);
    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    
    private final String groqApiKey;
    private final String model;
    private final ObjectMapper objectMapper;

    public AiRecoveryDiagnosisService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        this.groqApiKey = dotenv.get("GROQ_API_KEY");
        this.model = dotenv.get("GROQ_TEXT_MODEL", "llama-3.1-70b-versatile");
        
        if (groqApiKey == null || groqApiKey.isBlank()) {
            logger.warn("GROQ_API_KEY not configured. AI recovery diagnosis will return mock results.");
        } else {
            logger.info("AI Recovery Diagnosis Service initialized with model: {}", model);
        }
    }

    /**
     * Diagnose a failed payment and recommend recovery action
     */
    public AiDiagnosisResult diagnose(FailedPayment payment) {
        if (groqApiKey == null || groqApiKey.isBlank()) {
            logger.warn("AI service not configured, returning mock diagnosis");
            return getMockDiagnosis(payment);
        }

        try {
            String prompt = buildDiagnosisPrompt(payment);
            String response = callGroqApi(prompt);
            return parseDiagnosisResponse(response, payment);
        } catch (Exception e) {
            logger.error("Error diagnosing payment failure: {}", e.getMessage(), e);
            return getMockDiagnosis(payment);
        }
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
     * Call Groq API
     */
    private String callGroqApi(String prompt) throws Exception {
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpPost request = new HttpPost(GROQ_API_URL);
            request.setHeader("Authorization", "Bearer " + groqApiKey);
            request.setHeader("Content-Type", "application/json");

            String requestBody = objectMapper.writeValueAsString(new Object() {
                public final String model = AiRecoveryDiagnosisService.this.model;
                public final Object[] messages = new Object[] {
                    new Object() {
                        public final String role = "user";
                        public final String content = prompt;
                    }
                };
                public final double temperature = 0.3;
                public final int max_tokens = 500;
            });

            request.setEntity(new StringEntity(requestBody));

            try (CloseableHttpResponse response = client.execute(request)) {
                String responseBody = EntityUtils.toString(response.getEntity());
                
                if (response.getCode() != 200) {
                    logger.error("Groq API error: {} - {}", response.getCode(), responseBody);
                    throw new Exception("Groq API returned status " + response.getCode());
                }

                JsonNode root = objectMapper.readTree(responseBody);
                return root.path("choices").get(0).path("message").path("content").asText();
            }
        }
    }

    /**
     * Parse AI response into structured diagnosis
     */
    private AiDiagnosisResult parseDiagnosisResponse(String response, FailedPayment payment) {
        try {
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
                    .diagnosis(jsonResponse.path("diagnosis").asText())
                    .rootCause(jsonResponse.path("rootCause").asText())
                    .recommendation(jsonResponse.path("recommendation").asText())
                    .reasoning(jsonResponse.path("reasoning").asText())
                    .confidence(jsonResponse.path("confidence").asDouble(0.7))
                    .isRecoverable(jsonResponse.path("isRecoverable").asBoolean(true))
                    .suggestedAction(jsonResponse.path("suggestedAction").asText("AUTOMATIC_RETRY"))
                    .suggestedDelayMinutes(jsonResponse.path("suggestedDelayMinutes").asInt(60))
                    .build();
        } catch (Exception e) {
            logger.error("Error parsing AI response: {}", e.getMessage());
            logger.debug("Raw response: {}", response);
            return getMockDiagnosis(payment);
        }
    }

    /**
     * Fallback mock diagnosis when AI is unavailable
     */
    private AiDiagnosisResult getMockDiagnosis(FailedPayment payment) {
        String errorCode = payment.getErrorCode() != null ? payment.getErrorCode().toLowerCase() : "";
        
        if (errorCode.contains("temp") || errorCode.contains("timeout") || errorCode.contains("declined_temp")) {
            return AiDiagnosisResult.builder()
                    .diagnosis("Temporary issuer decline detected")
                    .rootCause("Payment gateway or issuer experienced temporary processing issues")
                    .recommendation("Retry payment after cooldown period")
                    .reasoning("Temporary failures typically resolve within hours. Customer's payment history suggests good standing.")
                    .confidence(0.85)
                    .isRecoverable(true)
                    .suggestedAction("AUTOMATIC_RETRY")
                    .suggestedDelayMinutes(120)
                    .build();
        } else if (errorCode.contains("insufficient") || errorCode.contains("funds")) {
            return AiDiagnosisResult.builder()
                    .diagnosis("Insufficient funds at time of payment")
                    .rootCause("Customer's account balance was insufficient")
                    .recommendation("Schedule retry after typical payment cycle")
                    .reasoning("Customers typically receive funds on predictable schedules. Wait 2-3 days before retry.")
                    .confidence(0.72)
                    .isRecoverable(true)
                    .suggestedAction("EMAIL_REMINDER")
                    .suggestedDelayMinutes(2880) // 48 hours
                    .build();
        } else if (errorCode.contains("expired") || errorCode.contains("card_expired")) {
            return AiDiagnosisResult.builder()
                    .diagnosis("Payment method expired")
                    .rootCause("Card expiration date has passed")
                    .recommendation("Request updated payment method")
                    .reasoning("Customer needs to provide new card details. Direct notification is most effective.")
                    .confidence(0.90)
                    .isRecoverable(true)
                    .suggestedAction("EMAIL_REMINDER")
                    .suggestedDelayMinutes(0)
                    .build();
        } else {
            return AiDiagnosisResult.builder()
                    .diagnosis("Payment declined by issuer")
                    .rootCause("General payment failure - requires investigation")
                    .recommendation("Attempt automatic retry with short cooldown")
                    .reasoning("Standard retry approach for unspecified failures")
                    .confidence(0.65)
                    .isRecoverable(true)
                    .suggestedAction("AUTOMATIC_RETRY")
                    .suggestedDelayMinutes(60)
                    .build();
        }
    }
}
