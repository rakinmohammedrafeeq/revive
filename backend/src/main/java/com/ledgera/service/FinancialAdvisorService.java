package com.ledgera.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledgera.dto.AdvisorChatRequest;
import com.ledgera.dto.AdvisorChatResponse;
import com.ledgera.dto.FinancialInsightResponse;
import com.ledgera.entity.AdvisorConversation;
import com.ledgera.entity.FinancialInsight;
import com.ledgera.entity.FinancialRecord;
import com.ledgera.entity.User;
import com.ledgera.enums.TransactionType;
import com.ledgera.repository.AdvisorConversationRepository;
import com.ledgera.repository.FinancialInsightRepository;
import com.ledgera.repository.FinancialRecordRepository;
import com.ledgera.repository.WorkspaceMemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * RAG-powered Financial Advisor Service
 * Provides personalized financial advice using Retrieval-Augmented Generation
 */
@Service
public class FinancialAdvisorService {

    private static final Logger logger = LoggerFactory.getLogger(FinancialAdvisorService.class);
    private static final int MAX_CONTEXT_RECORDS = 10;
    private static final int MAX_CONVERSATION_HISTORY = 5;

    private final VectorSearchService vectorSearchService;
    private final GroqAiService groqAiService;
    private final AdvisorConversationRepository conversationRepository;
    private final FinancialInsightRepository insightRepository;
    private final FinancialRecordRepository financialRecordRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;

    public FinancialAdvisorService(
            VectorSearchService vectorSearchService,
            GroqAiService groqAiService,
            AdvisorConversationRepository conversationRepository,
            FinancialInsightRepository insightRepository,
            FinancialRecordRepository financialRecordRepository,
            WorkspaceMemberRepository workspaceMemberRepository,
            CurrentUserService currentUserService,
            ObjectMapper objectMapper) {
        this.vectorSearchService = vectorSearchService;
        this.groqAiService = groqAiService;
        this.conversationRepository = conversationRepository;
        this.insightRepository = insightRepository;
        this.financialRecordRepository = financialRecordRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
        this.currentUserService = currentUserService;
        this.objectMapper = objectMapper;
    }

    /**
     * Main RAG chat endpoint - retrieves context and generates response
     */
    @Transactional(rollbackFor = Exception.class)
    public AdvisorChatResponse chat(AdvisorChatRequest request) {
        User currentUser = currentUserService.requireCurrentUser();
        Long userId = currentUser.getId();
        Long workspaceId = request.getWorkspaceId();

        logger.info("Chat request from user {} for workspace {}", userId, workspaceId);

        // Verify workspace access if workspaceId is provided
        if (workspaceId != null) {
            workspaceMemberRepository.findPermissionByWorkspaceAndUser(workspaceId, userId)
                    .orElseThrow(() -> new RuntimeException("You don't have access to this workspace"));
        }

        // Generate or use existing session ID
        String sessionId = request.getSessionId() != null 
                ? request.getSessionId() 
                : UUID.randomUUID().toString();

        // STEP 1: Retrieve relevant context using vector search (RAG)
        String relevantContext = vectorSearchService.getRelevantContext(
                request.getMessage(), userId, workspaceId, MAX_CONTEXT_RECORDS);

        // STEP 2: Get conversation history for context
        List<AdvisorConversation> recentHistory = getRecentConversations(sessionId, workspaceId);
        String conversationContext = buildConversationContext(recentHistory);

        // STEP 3: Get financial summary statistics
        String financialSummary = getFinancialSummary(userId, workspaceId);

        // STEP 4: Build enhanced prompt with retrieved context
        String enhancedPrompt = buildRagPrompt(
                request.getMessage(),
                relevantContext,
                conversationContext,
                financialSummary,
                currentUser.getName()
        );

        // STEP 5: Generate AI response using Groq
        String aiResponse;
        try {
            aiResponse = groqAiService.generateAdvisorResponse(enhancedPrompt);
        } catch (Exception e) {
            logger.error("Failed to generate AI response: {}", e.getMessage(), e);
            throw new RuntimeException("AI service error: " + e.getMessage(), e);
        }

        // STEP 6: Save conversation history
        // Note: contextUsed should be JSON or null for JSONB column
        saveConversation(userId, workspaceId, sessionId, request.getMessage(), "user", null);
        saveConversation(userId, workspaceId, sessionId, aiResponse, "assistant", null);

        // Build response
        List<String> contextSummary = Arrays.asList(
                "Retrieved " + MAX_CONTEXT_RECORDS + " similar financial records",
                "Analyzed spending patterns",
                "Reviewed conversation history"
        );

        return AdvisorChatResponse.builder()
                .success(true)
                .response(aiResponse)
                .sessionId(sessionId)
                .contextUsed(contextSummary)
                .build();
    }

    /**
     * Generate proactive financial insights
     */
    @Transactional(rollbackFor = Exception.class)
    public List<FinancialInsightResponse> generateInsights(Long workspaceId) {
        User currentUser = currentUserService.requireCurrentUser();
        Long userId = currentUser.getId();

        // Verify workspace access if workspaceId is provided
        if (workspaceId != null) {
            workspaceMemberRepository.findPermissionByWorkspaceAndUser(workspaceId, userId)
                    .orElseThrow(() -> new RuntimeException("You don't have access to this workspace"));
        }

        logger.info("Generating insights for userId={}, workspaceId={}", userId, workspaceId);

        // Delete old active insights before generating new ones
        if (workspaceId != null) {
            List<FinancialInsight> oldInsights = insightRepository.findByUserIdAndWorkspaceIdAndStatusOrderByCreatedAtDesc(
                    userId, workspaceId, "active");
            if (!oldInsights.isEmpty()) {
                logger.info("Deleting {} old insights before generating new ones", oldInsights.size());
                insightRepository.deleteAll(oldInsights);
                insightRepository.flush(); // Force delete to complete before creating new insights
            }
        } else {
            List<FinancialInsight> oldInsights = insightRepository.findByUserIdAndStatusOrderByCreatedAtDesc(
                    userId, "active");
            if (!oldInsights.isEmpty()) {
                logger.info("Deleting {} old insights before generating new ones", oldInsights.size());
                insightRepository.deleteAll(oldInsights);
                insightRepository.flush(); // Force delete to complete before creating new insights
            }
        }

        // Get recent financial records
        List<FinancialRecord> records;
        if (workspaceId != null) {
            records = financialRecordRepository.findByWorkspaceIdOrderByDateDesc(workspaceId);
        } else {
            records = financialRecordRepository.findByUserIdOrderByDateDesc(userId);
        }

        logger.info("Found {} financial records", records.size());

        if (records.isEmpty()) {
            logger.warn("No records found, returning empty insights");
            return Collections.emptyList();
        }

        // Analyze spending patterns
        List<FinancialInsight> insights = new ArrayList<>();

        // Budget insight
        FinancialInsight budgetInsight = analyzeBudget(records, userId, workspaceId);
        insights.add(budgetInsight);
        logger.debug("Created budget insight: {}", budgetInsight);

        // Savings insight
        FinancialInsight savingsInsight = analyzeSavings(records, userId, workspaceId);
        insights.add(savingsInsight);
        logger.debug("Created savings insight: {}", savingsInsight);

        // Spending insight
        FinancialInsight spendingInsight = analyzeSpending(records, userId, workspaceId);
        insights.add(spendingInsight);
        logger.debug("Created spending insight: {}", spendingInsight);

        // Save insights
        logger.info("Saving {} insights to database", insights.size());
        List<FinancialInsight> savedInsights = insightRepository.saveAll(insights);
        logger.info("Successfully saved {} insights", savedInsights.size());

        return savedInsights.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get active insights for user
     * Auto-regenerates if insights are stale (older than today)
     */
    public List<FinancialInsightResponse> getActiveInsights(Long workspaceId) {
        User currentUser = currentUserService.requireCurrentUser();
        Long userId = currentUser.getId();

        List<FinancialInsight> insights;
        if (workspaceId != null) {
            insights = insightRepository.findByUserIdAndWorkspaceIdAndStatusOrderByCreatedAtDesc(
                    userId, workspaceId, "active");
        } else {
            insights = insightRepository.findByUserIdAndStatusOrderByCreatedAtDesc(
                    userId, "active");
        }

        // Check if insights are stale (older than today) or don't exist
        boolean needsRefresh = insights.isEmpty() || 
                insights.stream().allMatch(insight -> 
                    insight.getCreatedAt().toLocalDate().isBefore(LocalDateTime.now().toLocalDate())
                );

        if (needsRefresh) {
            logger.info("Insights are stale or missing, regenerating for userId={}, workspaceId={}", 
                    userId, workspaceId);
            // Regenerate insights
            return generateInsights(workspaceId);
        }

        return insights.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Reindex all financial records for current workspace (manual trigger)
     */
    public void reindexWorkspace(Long workspaceId) {
        User currentUser = currentUserService.requireCurrentUser();
        Long userId = currentUser.getId();
        
        try {
            vectorSearchService.reindexAllRecords(userId, workspaceId);
        } catch (Exception e) {
            logger.error("Error reindexing workspace: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to reindex workspace");
        }
    }

    /**
     * Clean up duplicate insights - keep only the most recent per user/workspace/type
     */
    @Transactional
    public int cleanupDuplicateInsights(Long workspaceId) {
        User currentUser = currentUserService.requireCurrentUser();
        Long userId = currentUser.getId();
        
        logger.info("Cleaning up duplicate insights for user {} workspace {}", userId, workspaceId);
        
        // Get all active insights
        List<FinancialInsight> allInsights;
        if (workspaceId != null) {
            allInsights = insightRepository.findByUserIdAndWorkspaceIdAndStatusOrderByCreatedAtDesc(
                    userId, workspaceId, "active");
        } else {
            allInsights = insightRepository.findByUserIdAndStatusOrderByCreatedAtDesc(
                    userId, "active");
        }
        
        // Group by insight type and keep only the most recent
        Map<String, FinancialInsight> latestByType = new HashMap<>();
        List<FinancialInsight> duplicates = new ArrayList<>();
        
        for (FinancialInsight insight : allInsights) {
            String key = insight.getInsightType();
            if (!latestByType.containsKey(key)) {
                latestByType.put(key, insight);
            } else {
                // This is a duplicate (older one since results are DESC by created_at)
                duplicates.add(insight);
            }
        }
        
        // Delete duplicates
        if (!duplicates.isEmpty()) {
            logger.info("Deleting {} duplicate insights", duplicates.size());
            insightRepository.deleteAll(duplicates);
            insightRepository.flush();
        }
        
        return duplicates.size();
    }

    /**
     * Build RAG prompt with retrieved context
     */
    private String buildRagPrompt(String userMessage, String relevantContext, 
                                   String conversationContext, String financialSummary,
                                   String userName) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("You are a professional financial advisor having a natural conversation with your client.\n\n");
        prompt.append("IMPORTANT: Always use the ₹ symbol (not 'INR', not '$') when displaying any monetary amount.\n\n");
        
        prompt.append("CLIENT: ").append(userName).append("\n\n");
        
        prompt.append("=== CLIENT'S FINANCIAL SNAPSHOT ===\n");
        prompt.append(financialSummary).append("\n\n");
        
        if (!relevantContext.isEmpty()) {
            prompt.append("=== RELEVANT TRANSACTION HISTORY ===\n");
            prompt.append(relevantContext).append("\n\n");
        }
        
        if (!conversationContext.isEmpty()) {
            prompt.append("=== CONVERSATION SO FAR ===\n");
            prompt.append(conversationContext).append("\n\n");
        }
        
        prompt.append("=== CLIENT'S QUESTION ===\n");
        prompt.append(userMessage).append("\n\n");
        
        prompt.append("=== YOUR TASK ===\n");
        prompt.append("Answer their SPECIFIC question directly and conversationally.\n");
        prompt.append("- Focus on what they actually asked\n");
        prompt.append("- Use their financial data to personalize your answer\n");
        prompt.append("- Keep it concise (2-3 paragraphs maximum)\n");
        prompt.append("- Be practical and actionable\n");
        prompt.append("- If they ask for comparison (like stocks vs real estate), compare both options clearly\n");
        prompt.append("- Avoid giving generic advice they didn't ask for\n");
        prompt.append("- Think like a real advisor in a conversation, not a comprehensive report generator\n\n");
        
        prompt.append("Respond naturally and directly to their question:");
        
        return prompt.toString();
    }

    /**
     * Get financial summary statistics
     */
    private String getFinancialSummary(Long userId, Long workspaceId) {
        List<FinancialRecord> records;
        if (workspaceId != null) {
            records = financialRecordRepository.findByWorkspaceIdOrderByDateDesc(workspaceId);
        } else {
            records = financialRecordRepository.findByUserIdOrderByDateDesc(userId);
        }

        if (records.isEmpty()) {
            return "No financial records yet.";
        }

        double totalIncome = records.stream()
                .filter(r -> r.getType() == TransactionType.INCOME)
                .mapToDouble(r -> r.getAmount().doubleValue())
                .sum();

        double totalExpenses = records.stream()
                .filter(r -> r.getType() == TransactionType.EXPENSE)
                .mapToDouble(r -> r.getAmount().doubleValue())
                .sum();

        long recordCount = records.size();

        return String.format(
                "Total Records: %d\nTotal Income: ₹%.2f\nTotal Expenses: ₹%.2f\nNet Balance: ₹%.2f",
                recordCount, totalIncome, totalExpenses, (totalIncome - totalExpenses)
        );
    }

    /**
     * Build conversation context from history
     */
    private String buildConversationContext(List<AdvisorConversation> history) {
        if (history.isEmpty()) {
            return "";
        }

        StringBuilder context = new StringBuilder();
        for (AdvisorConversation conv : history) {
            context.append(conv.getRole().toUpperCase())
                    .append(": ")
                    .append(conv.getMessage())
                    .append("\n");
        }
        return context.toString();
    }

    /**
     * Get recent conversations
     */
    private List<AdvisorConversation> getRecentConversations(String sessionId, Long workspaceId) {
        List<AdvisorConversation> all;
        
        if (workspaceId != null) {
            all = conversationRepository.findBySessionIdAndWorkspaceIdOrderByCreatedAtAsc(sessionId, workspaceId);
        } else {
            all = conversationRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        }
        
        if (all.size() <= MAX_CONVERSATION_HISTORY * 2) {
            return all;
        }
        
        return all.subList(all.size() - (MAX_CONVERSATION_HISTORY * 2), all.size());
    }

    /**
     * Save conversation message
     */
    private void saveConversation(Long userId, Long workspaceId, String sessionId, 
                                   String message, String role, String contextUsed) {
        try {
            AdvisorConversation conversation = AdvisorConversation.builder()
                    .userId(userId)
                    .workspaceId(workspaceId)
                    .sessionId(sessionId)
                    .message(message)
                    .role(role)
                    .contextUsed(contextUsed) // Can be null or JSON string
                    .build();
            
            conversationRepository.save(conversation);
            logger.debug("Saved conversation: role={}, sessionId={}", role, sessionId);
        } catch (Exception e) {
            logger.error("Error saving conversation: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save conversation: " + e.getMessage(), e);
        }
    }

    // Insight analysis methods
    private FinancialInsight analyzeBudget(List<FinancialRecord> records, Long userId, Long workspaceId) {
        double totalExpenses = records.stream()
                .filter(r -> r.getType() == TransactionType.EXPENSE)
                .mapToDouble(r -> r.getAmount().doubleValue())
                .sum();

        String description = totalExpenses > 1000 
                ? "Your team's expenses are quite high. Consider setting a budget to track spending better."
                : "You're doing well with managing expenses!";

        return FinancialInsight.builder()
                .userId(userId)
                .workspaceId(workspaceId)
                .insightType("budget")
                .title("Budget Analysis")
                .description(description)
                .priority(totalExpenses > 1000 ? "high" : "medium")
                .status("active")
                .build();
    }

    private FinancialInsight analyzeSavings(List<FinancialRecord> records, Long userId, Long workspaceId) {
        double totalIncome = records.stream()
                .filter(r -> r.getType() == TransactionType.INCOME)
                .mapToDouble(r -> r.getAmount().doubleValue())
                .sum();

        double totalExpenses = records.stream()
                .filter(r -> r.getType() == TransactionType.EXPENSE)
                .mapToDouble(r -> r.getAmount().doubleValue())
                .sum();

        double savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;

        return FinancialInsight.builder()
                .userId(userId)
                .workspaceId(workspaceId)
                .insightType("savings")
                .title("Savings Rate")
                .description(String.format("Your savings rate is %.1f%%. Aim for at least 20%% for healthy finances.", savingsRate))
                .priority(savingsRate < 20 ? "high" : "low")
                .status("active")
                .build();
    }

    private FinancialInsight analyzeSpending(List<FinancialRecord> records, Long userId, Long workspaceId) {
        Map<String, Double> categorySpending = records.stream()
                .filter(r -> r.getType() == TransactionType.EXPENSE)
                .collect(Collectors.groupingBy(
                        FinancialRecord::getCategory,
                        Collectors.summingDouble(r -> r.getAmount().doubleValue())
                ));

        String topCategory = categorySpending.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("None");
        
        double topAmount = categorySpending.getOrDefault(topCategory, 0.0);

        return FinancialInsight.builder()
                .userId(userId)
                .workspaceId(workspaceId)
                .insightType("spending")
                .title("Top Spending Category")
                .description(String.format("Your highest spending is in %s (₹%.2f).", topCategory, topAmount))
                .priority("medium")
                .status("active")
                .build();
    }

    private FinancialInsightResponse convertToResponse(FinancialInsight insight) {
        return FinancialInsightResponse.builder()
                .id(insight.getId())
                .insightType(insight.getInsightType())
                .title(insight.getTitle())
                .description(insight.getDescription())
                .priority(insight.getPriority())
                .status(insight.getStatus())
                .createdAt(insight.getCreatedAt())
                .expiresAt(insight.getExpiresAt())
                .build();
    }
}
