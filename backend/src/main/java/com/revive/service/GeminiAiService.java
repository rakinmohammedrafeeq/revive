package com.revive.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.revive.dto.*;
import com.revive.entity.FinancialRecord;
import com.revive.enums.TransactionType;
import com.revive.repository.FinancialRecordRepository;
import io.github.cdimascio.dotenv.Dotenv;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
public class GeminiAiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiAiService.class);
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    
    private final String geminiApiKey;
    private final String groqApiKey;
    private final ObjectMapper objectMapper;
    private final FinancialRecordRepository financialRecordRepository;
    private final CurrentUserService currentUserService;
    private final AiModelFallbackService fallbackService;

    public GeminiAiService(
            FinancialRecordRepository financialRecordRepository,
            CurrentUserService currentUserService,
            AiModelFallbackService fallbackService) {
        this.financialRecordRepository = financialRecordRepository;
        this.currentUserService = currentUserService;
        this.fallbackService = fallbackService;
        this.objectMapper = new ObjectMapper();
        
        // Load from environment
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        this.geminiApiKey = dotenv.get("GEMINI_API_KEY");
        this.groqApiKey = dotenv.get("GROQ_API_KEY");
        
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            logger.warn("GEMINI_API_KEY not configured. AI features will be disabled.");
        } else if (!geminiApiKey.startsWith("AIza")) {
            logger.warn("GEMINI_API_KEY format looks invalid (should start with 'AIza'). AI features may not work.");
        }
        
        logger.info("Gemini AI Service initialized with fallback support");
    }

    /**
     * Categorize a transaction using AI
     */
    public AiCategorizationResponse categorizeTransaction(AiCategorizationRequest request) {
        if (!isConfigured()) {
            return AiCategorizationResponse.builder()
                    .success(false)
                    .error("AI service not configured")
                    .build();
        }

        try {
            String prompt = buildCategorizationPrompt(request);
            String response = callGeminiApi(prompt);
            return parseCategorizationResponse(response);
        } catch (Exception e) {
            logger.error("Error categorizing transaction", e);
            return AiCategorizationResponse.builder()
                    .success(false)
                    .error("Failed to categorize: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Extract data from receipt image (with automatic fallback)
     */
    public AiReceiptResponse processReceipt(byte[] imageData, String mimeType) {
        if (!isConfigured()) {
            return AiReceiptResponse.builder()
                    .success(false)
                    .error("AI service not configured")
                    .build();
        }

        try {
            String prompt = buildReceiptPrompt();
            
            // Use cross-provider fallback service for vision models
            String response = fallbackService.executeWithVisionFallback((modelName, provider) -> {
                return callAiApiWithImage(prompt, imageData, mimeType, modelName, provider);
            });
            
            return parseReceiptResponse(response);
        } catch (Exception e) {
            logger.error("Error processing receipt after all fallbacks", e);
            return AiReceiptResponse.builder()
                    .success(false)
                    .error("Failed to process receipt: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Generate financial insights for the current workspace
     */
    public AiInsightsResponse generateInsights() {
        if (!isConfigured()) {
            return AiInsightsResponse.builder()
                    .success(false)
                    .error("AI service not configured")
                    .build();
        }

        try {
            // Get workspace from current user
            var currentUser = currentUserService.requireCurrentUser();
            var workspace = currentUser.getCurrentWorkspace();
            
            if (workspace == null) {
                return AiInsightsResponse.builder()
                        .success(false)
                        .error("No workspace selected")
                        .build();
            }

            List<FinancialRecord> recentRecords = financialRecordRepository
                    .findTop50ByWorkspaceIdOrderByDateDesc(workspace.getId());

            // If no records, return a helpful message
            if (recentRecords.isEmpty()) {
                return AiInsightsResponse.builder()
                        .success(true)
                        .summary("No transactions yet in this workspace.")
                        .keyInsights(List.of("Start adding transactions to get AI-powered insights."))
                        .recommendations(List.of("Add your income and expenses to track your financial health."))
                        .spendingAnalysis(AiInsightsResponse.SpendingAnalysis.builder()
                                .topCategory("N/A")
                                .percentageChange(0.0)
                                .comparisonPeriod("No data")
                                .build())
                        .trendAnalysis("Add more transactions to see trends over time.")
                        .build();
            }

            String prompt = buildInsightsPrompt(recentRecords);
            String response = callGeminiApi(prompt);
            return parseInsightsResponse(response);
        } catch (Exception e) {
            logger.error("Error generating insights", e);
            return AiInsightsResponse.builder()
                    .success(false)
                    .error("Failed to generate insights: " + e.getMessage())
                    .build();
        }
    }

    private String buildCategorizationPrompt(AiCategorizationRequest request) {
        return String.format("""
            You are a financial expert AI. Analyze the following transaction and suggest the most appropriate category and type.
            
            Transaction Description: %s
            Amount: %s
            Date: %s
            
            Available INCOME categories:
            - Salary
            - Freelance
            - Business
            - Investment
            - Bonus
            - Interest
            - Rental Income
            - Refund
            - Other
            
            Available EXPENSE categories:
            - Food
            - Groceries
            - Shopping
            - Transportation
            - Fuel
            - Bills
            - Rent
            - EMI
            - Entertainment
            - Healthcare
            - Education
            - Travel
            - Subscription
            - Insurance
            - Gifts
            - Taxes
            - Investment
            - Savings
            - Other
            
            IMPORTANT: Use ONLY the exact category names listed above. Do not use variations like "Food & Dining" (use "Food"), "Bills & Utilities" (use "Bills"), etc.
            
            Respond ONLY with valid JSON in this exact format:
            {
              "category": "category name",
              "type": "INCOME or EXPENSE",
              "confidence": 0.95,
              "reasoning": "brief explanation"
            }
            """,
                request.getDescription(),
                request.getAmount() != null ? request.getAmount() : "unknown",
                request.getDate() != null ? request.getDate() : "unknown");
    }

    private String buildReceiptPrompt() {
        return """
            Extract transaction information from this receipt or document image.
            
            Identify:
            1. Total amount (as decimal number)
            2. Merchant/Employer/Payer name
            3. Date (format: YYYY-MM-DD)
            4. Transaction type and appropriate category:
            
               If this is an INCOME document (salary slip, paycheck, payment receipt, invoice):
               - Salary (for employment salary, wages, paycheck)
               - Freelance (for freelance/contract payments)
               - Business (for business revenue, sales)
               - Investment (for dividends, capital gains)
               - Bonus (for bonuses, commissions)
               - Interest (for bank interest, investment returns)
               - Rental Income (for property rental payments)
               - Refund (for tax refunds, product refunds)
               - Other (if none fit)
               
               If this is an EXPENSE document (purchase receipt, bill, invoice):
               - Food (for restaurants, cafes, fast food)
               - Groceries (for supermarkets, grocery stores)
               - Shopping (for retail, clothing, electronics)
               - Transportation (for taxi, bus, train)
               - Fuel (for gas stations)
               - Bills (for utilities, services)
               - Rent (for housing rent)
               - Entertainment (for movies, games, events)
               - Healthcare (for medical, pharmacy)
               - Education (for school, courses)
               - Travel (for hotels, flights)
               - Subscription (for recurring services)
               - Other (if none fit)
            
            5. Determine if this is INCOME or EXPENSE based on document type:
               - Salary slips, paychecks, pay statements â†’ INCOME + Salary
               - Invoices you sent, payment received â†’ INCOME
               - Purchase receipts, bills you paid â†’ EXPENSE
            
            IMPORTANT: 
            - Use ONLY the exact category names from the lists above
            - For salary documents, ALWAYS use type="INCOME" and category="Salary"
            - Match the category to the correct type (income categories for INCOME, expense categories for EXPENSE)
            
            Respond ONLY with valid JSON in this exact format:
            {
              "amount": 45.50,
              "merchant": "Company Name or Store Name",
              "date": "2026-07-24",
              "category": "Salary",
              "type": "INCOME",
              "description": "Salary from Company Name",
              "confidence": 0.90
            }
            
            If you cannot read the document clearly, set confidence below 0.5.
            """;
    }

    private String buildInsightsPrompt(List<FinancialRecord> records) {
        StringBuilder data = new StringBuilder();
        data.append("Analyze the following financial transactions and provide insights:\n\n");
        
        for (FinancialRecord record : records) {
            data.append(String.format("Date: %s, Type: %s, Category: %s, Amount: %s\n",
                    record.getDate(),
                    record.getType(),
                    record.getCategory(),
                    record.getAmount()));
        }
        
        data.append("""
            
            IMPORTANT: Use the â‚¹ symbol (not INR, not $) for all monetary amounts in your response.
            
            Provide actionable financial insights in JSON format:
            {
              "summary": "One sentence overview of financial health",
              "keyInsights": ["insight 1", "insight 2", "insight 3"],
              "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
              "spendingAnalysis": {
                "topCategory": "category name",
                "percentageChange": 15.5,
                "comparisonPeriod": "vs last month"
              },
              "trendAnalysis": "Description of spending trends"
            }
            
            Focus on practical, actionable advice.
            """);
        
        return data.toString();
    }

    private String callGeminiApi(String prompt) throws Exception {
        return callGeminiApi(prompt, fallbackService.getPrimaryTextModel().modelName);
    }
    
    private String callGeminiApi(String prompt, String model) throws Exception {
        String url = GEMINI_API_URL + model + ":generateContent?key=" + geminiApiKey;
        
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpPost post = new HttpPost(url);
            post.setHeader("Content-Type", "application/json");
            
            String requestBody = objectMapper.writeValueAsString(new GeminiRequest(prompt));
            post.setEntity(new StringEntity(requestBody, java.nio.charset.StandardCharsets.UTF_8));
            
            try (CloseableHttpResponse response = httpClient.execute(post)) {
                int statusCode = response.getCode();
                String responseBody = EntityUtils.toString(response.getEntity(), java.nio.charset.StandardCharsets.UTF_8);
                
                // Log the response for debugging
                logger.debug("Gemini API response status: {}", statusCode);
                logger.debug("Gemini API response body: {}", responseBody);
                
                if (statusCode != 200) {
                    logger.error("Gemini API error: Status {}, Body: {}", statusCode, responseBody);
                    throw new RuntimeException("Gemini API returned status " + statusCode + ": " + responseBody);
                }
                
                return extractTextFromGeminiResponse(responseBody);
            }
        }
    }

    private String callGeminiApiWithImage(String prompt, byte[] imageData, String mimeType) throws Exception {
        return callGeminiApiWithImage(prompt, imageData, mimeType, fallbackService.getPrimaryVisionModel().modelName);
    }
    
    private String callGeminiApiWithImage(String prompt, byte[] imageData, String mimeType, String model) throws Exception {
        String url = GEMINI_API_URL + model + ":generateContent?key=" + geminiApiKey;
        
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpPost post = new HttpPost(url);
            post.setHeader("Content-Type", "application/json");
            
            String base64Image = Base64.getEncoder().encodeToString(imageData);
            String requestBody = objectMapper.writeValueAsString(
                    new GeminiMultimodalRequest(prompt, base64Image, mimeType));
            post.setEntity(new StringEntity(requestBody, java.nio.charset.StandardCharsets.UTF_8));
            
            try (CloseableHttpResponse response = httpClient.execute(post)) {
                int statusCode = response.getCode();
                String responseBody = EntityUtils.toString(response.getEntity(), java.nio.charset.StandardCharsets.UTF_8);
                
                // Log the response for debugging
                logger.debug("Gemini API response status: {}", statusCode);
                logger.debug("Gemini API response body: {}", responseBody);
                
                if (statusCode != 200) {
                    logger.error("Gemini API error: Status {}, Body: {}", statusCode, responseBody);
                    throw new RuntimeException("Gemini API returned status " + statusCode + ": " + responseBody);
                }
                
                return extractTextFromGeminiResponse(responseBody);
            }
        }
    }

    private String extractTextFromGeminiResponse(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode candidates = root.path("candidates");
        
        if (candidates.isArray() && candidates.size() > 0) {
            JsonNode content = candidates.get(0).path("content");
            JsonNode parts = content.path("parts");
            
            if (parts.isArray() && parts.size() > 0) {
                return parts.get(0).path("text").asText();
            }
        }
        
        throw new RuntimeException("Invalid Gemini API response");
    }

    /**
     * Unified method to call AI API with image support across providers
     */
    private String callAiApiWithImage(String prompt, byte[] imageData, String mimeType, 
                                     String modelName, AiModelFallbackService.ModelProvider provider) throws Exception {
        return switch (provider) {
            case GEMINI -> callGeminiApiWithImage(prompt, imageData, mimeType, modelName);
            case GROQ -> callGroqApiWithImage(prompt, imageData, mimeType, modelName);
        };
    }

    /**
     * Call Groq API with vision support
     */
    private String callGroqApiWithImage(String prompt, byte[] imageData, String mimeType, String model) throws Exception {
        if (groqApiKey == null || groqApiKey.isBlank()) {
            throw new RuntimeException("GROQ_API_KEY not configured");
        }

        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpPost post = new HttpPost(GROQ_API_URL);
            post.setHeader("Content-Type", "application/json");
            post.setHeader("Authorization", "Bearer " + groqApiKey);
            
            // Groq uses OpenAI format for vision
            String base64Image = Base64.getEncoder().encodeToString(imageData);
            String imageUrl = "data:" + mimeType + ";base64," + base64Image;
            
            var requestBody = java.util.Map.of(
                "model", model,
                "messages", List.of(
                    java.util.Map.of(
                        "role", "user",
                        "content", List.of(
                            java.util.Map.of("type", "text", "text", prompt),
                            java.util.Map.of("type", "image_url", 
                                "image_url", java.util.Map.of("url", imageUrl))
                        )
                    )
                ),
                "temperature", 0.7,
                "max_tokens", 1000
            );
            
            String requestJson = objectMapper.writeValueAsString(requestBody);
            post.setEntity(new StringEntity(requestJson, java.nio.charset.StandardCharsets.UTF_8));
            
            logger.debug("Sending vision request to Groq API with model: {}", model);
            
            try (CloseableHttpResponse response = httpClient.execute(post)) {
                int statusCode = response.getCode();
                String responseBody = EntityUtils.toString(response.getEntity(), java.nio.charset.StandardCharsets.UTF_8);
                
                logger.debug("Groq API response status: {}", statusCode);
                logger.debug("Groq API response body: {}", responseBody);
                
                if (statusCode != 200) {
                    logger.error("Groq API error: Status {}, Body: {}", statusCode, responseBody);
                    throw new RuntimeException("Groq API returned status " + statusCode + ": " + responseBody);
                }
                
                return extractTextFromGroqResponse(responseBody);
            }
        }
    }

    /**
     * Extract text from Groq API response (OpenAI format)
     */
    private String extractTextFromGroqResponse(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode choices = root.path("choices");
        
        if (choices.isArray() && choices.size() > 0) {
            JsonNode message = choices.get(0).path("message");
            return message.path("content").asText();
        }
        
        throw new RuntimeException("Invalid Groq API response");
    }

    private AiCategorizationResponse parseCategorizationResponse(String response) {
        try {
            // Extract JSON from markdown code blocks if present
            String jsonStr = extractJson(response);
            JsonNode json = objectMapper.readTree(jsonStr);
            
            return AiCategorizationResponse.builder()
                    .category(json.path("category").asText())
                    .type(TransactionType.valueOf(json.path("type").asText().toUpperCase()))
                    .confidence(json.path("confidence").asDouble())
                    .reasoning(json.path("reasoning").asText())
                    .success(true)
                    .build();
        } catch (Exception e) {
            logger.error("Error parsing categorization response: {}", response, e);
            return AiCategorizationResponse.builder()
                    .success(false)
                    .error("Failed to parse AI response")
                    .build();
        }
    }

    private AiReceiptResponse parseReceiptResponse(String response) {
        try {
            String jsonStr = extractJson(response);
            JsonNode json = objectMapper.readTree(jsonStr);
            
            return AiReceiptResponse.builder()
                    .amount(new BigDecimal(json.path("amount").asText()))
                    .merchant(json.path("merchant").asText())
                    .date(LocalDate.parse(json.path("date").asText(), DateTimeFormatter.ISO_LOCAL_DATE))
                    .category(json.path("category").asText())
                    .type(TransactionType.valueOf(json.path("type").asText().toUpperCase()))
                    .description(json.path("description").asText())
                    .confidence(json.path("confidence").asDouble())
                    .success(true)
                    .build();
        } catch (Exception e) {
            logger.error("Error parsing receipt response: {}", response, e);
            return AiReceiptResponse.builder()
                    .success(false)
                    .error("Failed to parse receipt data")
                    .build();
        }
    }

    private AiInsightsResponse parseInsightsResponse(String response) {
        try {
            String jsonStr = extractJson(response);
            JsonNode json = objectMapper.readTree(jsonStr);
            
            List<String> insights = new ArrayList<>();
            json.path("keyInsights").forEach(node -> insights.add(node.asText()));
            
            List<String> recommendations = new ArrayList<>();
            json.path("recommendations").forEach(node -> recommendations.add(node.asText()));
            
            JsonNode spendingNode = json.path("spendingAnalysis");
            AiInsightsResponse.SpendingAnalysis spending = AiInsightsResponse.SpendingAnalysis.builder()
                    .topCategory(spendingNode.path("topCategory").asText())
                    .percentageChange(spendingNode.path("percentageChange").asDouble())
                    .comparisonPeriod(spendingNode.path("comparisonPeriod").asText())
                    .build();
            
            return AiInsightsResponse.builder()
                    .summary(json.path("summary").asText())
                    .keyInsights(insights)
                    .recommendations(recommendations)
                    .spendingAnalysis(spending)
                    .trendAnalysis(json.path("trendAnalysis").asText())
                    .success(true)
                    .build();
        } catch (Exception e) {
            logger.error("Error parsing insights response: {}", response, e);
            return AiInsightsResponse.builder()
                    .success(false)
                    .error("Failed to parse insights")
                    .build();
        }
    }

    private String extractJson(String response) {
        // Remove markdown code blocks if present
        String cleaned = response.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }

    private boolean isConfigured() {
        return geminiApiKey != null && !geminiApiKey.isBlank();
    }

    // Inner classes for Gemini API requests
    private record GeminiRequest(List<Content> contents) {
        public GeminiRequest(String text) {
            this(List.of(new Content(List.of(new Part(text)))));
        }
    }

    private record GeminiMultimodalRequest(List<Content> contents) {
        public GeminiMultimodalRequest(String text, String imageData, String mimeType) {
            this(List.of(new Content(List.of(
                    new Part(text),
                    new Part(new InlineData(mimeType, imageData))
            ))));
        }
    }

    private record Content(List<Part> parts) {}
    private record Part(String text, InlineData inline_data) {
        public Part(String text) {
            this(text, null);
        }
        public Part(InlineData inline_data) {
            this(null, inline_data);
        }
    }
    private record InlineData(String mime_type, String data) {}
}


