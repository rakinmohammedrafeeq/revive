package com.ledgera.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledgera.dto.FinancialRecordRequest;
import com.ledgera.dto.FinancialRecordResponse;
import com.ledgera.dto.PendingAction;
import com.ledgera.dto.SpendingSummaryResponse;
import com.ledgera.entity.FinancialRecord;
import com.ledgera.entity.User;
import com.ledgera.enums.TransactionType;
import com.ledgera.exception.ForbiddenException;
import com.ledgera.exception.ResourceNotFoundException;
import com.ledgera.repository.FinancialRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Dispatches agent tool calls to the correct service methods and serializes results as JSON strings.
 *
 * <p>Called by {@link AgentOrchestrationService} for:
 * <ul>
 *   <li>Read tools — during the agent loop, results are fed back to the LLM as tool-role messages.</li>
 *   <li>Write tools — after explicit user confirmation (never speculatively).</li>
 * </ul>
 *
 * <p>Both {@link #executeRead} and {@link #executeWrite} are annotated {@code @Transactional}
 * to ensure lazy associations (e.g. FinancialRecord.workspace) load safely within a session.
 */
@Service
public class AgentToolExecutorService {

    private static final Logger logger = LoggerFactory.getLogger(AgentToolExecutorService.class);

    private final FinancialRecordService financialRecordService;
    private final FinancialRecordRepository financialRecordRepository;
    private final DashboardService dashboardService;
    private final VectorSearchService vectorSearchService;
    private final ObjectMapper objectMapper;

    public AgentToolExecutorService(
            FinancialRecordService financialRecordService,
            FinancialRecordRepository financialRecordRepository,
            DashboardService dashboardService,
            VectorSearchService vectorSearchService,
            ObjectMapper objectMapper) {
        this.financialRecordService = financialRecordService;
        this.financialRecordRepository = financialRecordRepository;
        this.dashboardService = dashboardService;
        this.vectorSearchService = vectorSearchService;
        this.objectMapper = objectMapper;
    }

    // ── Read dispatch ──────────────────────────────────────────────────────────

    /**
     * Executes a read tool during the agent loop and returns the result as a JSON string.
     * Write tools must NOT be dispatched here — route them through {@link #executeWrite} after confirmation.
     */
    @Transactional(readOnly = true)
    public String executeRead(GroqAiService.ToolCall toolCall, Long workspaceId, User currentUser) {
        try {
            JsonNode args = objectMapper.readTree(toolCall.argumentsJson());
            Object result = switch (toolCall.functionName()) {
                case "get_transactions"    -> handleGetTransactions(args, workspaceId, currentUser);
                case "get_spending_summary" -> handleGetSpendingSummary(args, workspaceId);
                case "get_monthly_trends"  -> dashboardService.getMonthlyTrends(workspaceId);
                case "search_records"      -> handleSearchRecords(args, workspaceId, currentUser);
                default -> "Error: Unknown read tool '" + toolCall.functionName() + "'";
            };
            return objectMapper.writeValueAsString(result);
        } catch (Exception e) {
            logger.error("Read tool '{}' failed: {}", toolCall.functionName(), e.getMessage(), e);
            return "{\"error\": \"Tool execution failed: " + sanitize(e.getMessage()) + "\"}";
        }
    }

    // ── Write dispatch ─────────────────────────────────────────────────────────

    /**
     * Executes a confirmed write action. Only called after the user has explicitly approved
     * the pending action via the confirm endpoint.
     */
    @Transactional
    public String executeWrite(PendingAction action, Long workspaceId, User currentUser) {
        try {
            JsonNode args = objectMapper.readTree(action.getToolArguments());
            return switch (action.getToolName()) {
                case "create_transaction" -> handleCreateTransaction(args, workspaceId, currentUser);
                case "update_transaction" -> handleUpdateTransaction(args, workspaceId, currentUser);
                case "delete_transaction" -> handleDeleteTransaction(args, workspaceId, currentUser);
                default -> throw new IllegalStateException("Unknown write tool: " + action.getToolName());
            };
        } catch (Exception e) {
            logger.error("Write tool '{}' failed: {}", action.getToolName(), e.getMessage(), e);
            throw new RuntimeException(
                    "Failed to execute " + action.getToolName() + ": " + e.getMessage(), e);
        }
    }

    // ── Read handlers ──────────────────────────────────────────────────────────

    private List<FinancialRecordResponse> handleGetTransactions(
            JsonNode args, Long workspaceId, User currentUser) {

        LocalDate startDate = parseDate(args.path("start_date"));
        LocalDate endDate   = parseDate(args.path("end_date"));
        String category     = nonBlank(args, "category");
        TransactionType type = args.has("type") && !args.path("type").isNull()
                ? TransactionType.valueOf(args.path("type").asText()) : null;
        int page = args.has("page") ? args.path("page").asInt(0) : 0;
        int size = Math.min(args.has("size") ? args.path("size").asInt(20) : 20, 50);

        return financialRecordService.getAllRecordsForWorkspace(
                workspaceId, currentUser, startDate, endDate, category, type, page, size);
    }

    private SpendingSummaryResponse handleGetSpendingSummary(JsonNode args, Long workspaceId) {
        LocalDate startDate = parseDate(args.path("start_date"));
        LocalDate endDate   = parseDate(args.path("end_date"));
        return dashboardService.getSpendingSummary(workspaceId, startDate, endDate);
    }

    private List<FinancialRecordResponse> handleSearchRecords(
            JsonNode args, Long workspaceId, User currentUser) {

        String query = args.path("query").asText();
        int limit = Math.min(args.has("limit") ? args.path("limit").asInt(10) : 10, 20);

        List<FinancialRecord> records =
                vectorSearchService.searchSimilar(query, currentUser.getId(), workspaceId, limit);

        // Only map basic columns — user and workspace are LAZY, don't access them here
        return records.stream()
                .map(r -> FinancialRecordResponse.builder()
                        .id(r.getId())
                        .amount(r.getAmount())
                        .type(r.getType().name())
                        .category(r.getCategory())
                        .date(r.getDate())
                        .description(r.getDescription())
                        .createdAt(r.getCreatedAt())
                        .updatedAt(r.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // ── Write handlers ─────────────────────────────────────────────────────────

    private String handleCreateTransaction(JsonNode args, Long workspaceId, User currentUser) {
        requireField(args, "amount",   "create_transaction");
        requireField(args, "type",     "create_transaction");
        requireField(args, "category", "create_transaction");
        requireField(args, "date",     "create_transaction");

        FinancialRecordRequest request = new FinancialRecordRequest();
        request.setAmount(new BigDecimal(args.path("amount").asText()));
        request.setType(args.path("type").asText());
        request.setCategory(args.path("category").asText());
        request.setDate(LocalDate.parse(args.path("date").asText()));
        if (args.has("description") && !args.path("description").isNull()) {
            request.setDescription(args.path("description").asText());
        }

        FinancialRecordResponse response =
                financialRecordService.createRecordForWorkspace(workspaceId, currentUser, request);

        return String.format(
                "Transaction created successfully. ID: %d | %s — %s | Amount: %s | Date: %s%s",
                response.getId(), response.getType(), response.getCategory(),
                response.getAmount(), response.getDate(),
                response.getDescription() != null ? " | Note: " + response.getDescription() : "");
    }

    private String handleUpdateTransaction(JsonNode args, Long workspaceId, User currentUser) {
        requireField(args, "transaction_id", "update_transaction");

        Long transactionId = args.path("transaction_id").asLong();

        // Fetch existing within the @Transactional boundary to safely access lazy workspace
        FinancialRecord existing = financialRecordRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Transaction not found: " + transactionId));

        if (!existing.getWorkspace().getId().equals(workspaceId)) {
            throw new ForbiddenException(
                    "Transaction #" + transactionId + " does not belong to workspace " + workspaceId);
        }

        // Partial update: fill missing fields from the existing record
        FinancialRecordRequest request = new FinancialRecordRequest();
        request.setAmount(fieldOrDefault(args, "amount")
                ? new BigDecimal(args.path("amount").asText()) : existing.getAmount());
        request.setType(fieldOrDefault(args, "type")
                ? args.path("type").asText() : existing.getType().name());
        request.setCategory(fieldOrDefault(args, "category")
                ? args.path("category").asText() : existing.getCategory());
        request.setDate(fieldOrDefault(args, "date")
                ? LocalDate.parse(args.path("date").asText()) : existing.getDate());
        request.setDescription(fieldOrDefault(args, "description")
                ? args.path("description").asText() : existing.getDescription());

        FinancialRecordResponse updated =
                financialRecordService.updateRecordForWorkspace(
                        workspaceId, transactionId, currentUser, request);

        return String.format(
                "Transaction #%d updated successfully. %s — %s | Amount: %s | Date: %s",
                updated.getId(), updated.getType(), updated.getCategory(),
                updated.getAmount(), updated.getDate());
    }

    private String handleDeleteTransaction(JsonNode args, Long workspaceId, User currentUser) {
        requireField(args, "transaction_id", "delete_transaction");

        Long transactionId = args.path("transaction_id").asLong();

        // Fetch existing within the @Transactional boundary to safely access lazy workspace
        // and store details before deletion for confirmation message
        FinancialRecord existing = financialRecordRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Transaction not found: " + transactionId));

        if (!existing.getWorkspace().getId().equals(workspaceId)) {
            throw new ForbiddenException(
                    "Transaction #" + transactionId + " does not belong to workspace " + workspaceId);
        }

        // Store details before deletion for confirmation message
        String details = String.format(
                "%s — %s | Amount: ₹%s | Date: %s%s",
                existing.getType().name(), existing.getCategory(),
                existing.getAmount(), existing.getDate(),
                existing.getDescription() != null ? " | Note: " + existing.getDescription() : "");

        // Delete the transaction (permission check is done inside this method)
        financialRecordService.deleteRecord(transactionId);

        return String.format(
                "Transaction #%d deleted successfully. Removed: %s",
                transactionId, details);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private LocalDate parseDate(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode()) return null;
        String text = node.asText("").trim();
        if (text.isEmpty()) return null;
        try {
            return LocalDate.parse(text);
        } catch (Exception e) {
            logger.warn("Could not parse date '{}': {}", text, e.getMessage());
            return null;
        }
    }

    private String nonBlank(JsonNode args, String field) {
        if (!args.has(field) || args.path(field).isNull()) return null;
        String v = args.path(field).asText("").trim();
        return v.isEmpty() ? null : v;
    }

    /** Returns true if the field is present and non-null in the args node. */
    private boolean fieldOrDefault(JsonNode args, String field) {
        return args.has(field) && !args.path(field).isNull();
    }

    private void requireField(JsonNode args, String field, String toolName) {
        if (!args.has(field) || args.path(field).isNull()) {
            throw new IllegalArgumentException(
                    "Required field '" + field + "' missing from " + toolName + " arguments");
        }
    }

    private String sanitize(String msg) {
        if (msg == null) return "unknown error";
        return msg.replace("\"", "'").replace("\n", " ").replace("\r", "");
    }
}
