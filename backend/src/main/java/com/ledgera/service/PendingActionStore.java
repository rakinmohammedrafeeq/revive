package com.ledgera.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledgera.dto.PendingAction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory store for write actions that are awaiting explicit user confirmation.
 *
 * <p><b>Design decisions:</b>
 * <ul>
 *   <li>In-memory (no DB migration needed) — pending actions are intentionally short-lived (10 min TTL).
 *       A server restart or TTL expiry requires the user to re-issue the request, which is acceptable
 *       given the interactive nature of the confirmation flow.</li>
 *   <li>Lazy TTL eviction — expired entries are removed on access and on write when the map exceeds
 *       {@code MAX_SIZE}. No background scheduler required.</li>
 *   <li>User-scoped retrieval — a user can only confirm/cancel their own actions.</li>
 * </ul>
 */
@Component
public class PendingActionStore {

    private static final Logger logger = LoggerFactory.getLogger(PendingActionStore.class);

    /** Minutes until a pending action expires. */
    static final long TTL_MINUTES = 10;

    /** Safety ceiling to prevent unbounded growth under load. */
    private static final int MAX_SIZE = 500;

    private final ConcurrentHashMap<String, StoredEntry> store = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public PendingActionStore(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Bundles the PendingAction DTO with the owner/workspace context needed for validation and
     * execution on confirmation.
     */
    public record StoredEntry(PendingAction action, Long userId, Long workspaceId) {}

    // ── Public API ─────────────────────────────────────────────────────────────

    /**
     * Stores a proposed write action and returns the {@link PendingAction} DTO to send to the frontend.
     */
    public PendingAction store(GroqAiService.ToolCall toolCall, Long workspaceId, Long userId) {
        if (store.size() >= MAX_SIZE) {
            evictExpired();
        }

        String actionId      = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(TTL_MINUTES);
        String summary       = buildSummary(toolCall);

        PendingAction action = PendingAction.builder()
                .actionId(actionId)
                .toolName(toolCall.functionName())
                .toolArguments(toolCall.argumentsJson())
                .summary(summary)
                .expiresAt(expiry)
                .build();

        store.put(actionId, new StoredEntry(action, userId, workspaceId));
        logger.debug("Stored pending action {} for user {} (tool={})", actionId, userId, toolCall.functionName());
        return action;
    }

    /**
     * Retrieves a pending action only if it is non-expired and owned by the requesting user.
     * Returns empty if not found, expired, or owned by a different user.
     */
    public Optional<StoredEntry> retrieveValid(String actionId, Long userId) {
        StoredEntry entry = store.get(actionId);
        if (entry == null) {
            logger.debug("Pending action {} not found", actionId);
            return Optional.empty();
        }
        if (!entry.userId().equals(userId)) {
            logger.warn("User {} attempted to access pending action {} owned by user {}",
                    userId, actionId, entry.userId());
            return Optional.empty();
        }
        if (LocalDateTime.now().isAfter(entry.action().getExpiresAt())) {
            store.remove(actionId);
            logger.debug("Pending action {} expired", actionId);
            return Optional.empty();
        }
        return Optional.of(entry);
    }

    /**
     * Removes a pending action. Call after confirmation or cancellation.
     */
    public void remove(String actionId) {
        store.remove(actionId);
        logger.debug("Removed pending action {}", actionId);
    }

    // ── Internal helpers ───────────────────────────────────────────────────────

    private void evictExpired() {
        LocalDateTime now = LocalDateTime.now();
        int before = store.size();
        store.entrySet().removeIf(e -> now.isAfter(e.getValue().action().getExpiresAt()));
        logger.debug("Evicted {} expired pending actions (store size was {})", before - store.size(), before);
    }

    private String buildSummary(GroqAiService.ToolCall toolCall) {
        try {
            JsonNode args = objectMapper.readTree(toolCall.argumentsJson());
            return switch (toolCall.functionName()) {
                case "create_transaction" -> buildCreateSummary(args);
                case "update_transaction" -> buildUpdateSummary(args);
                default -> "Execute: " + toolCall.functionName();
            };
        } catch (Exception e) {
            logger.debug("Could not build summary for {}: {}", toolCall.functionName(), e.getMessage());
            return "Execute: " + toolCall.functionName();
        }
    }

    private String buildCreateSummary(JsonNode args) {
        String type     = args.path("type").asText("EXPENSE").toLowerCase();
        String category = args.path("category").asText("Unknown");
        String amount   = args.path("amount").asText("?");
        String date     = args.path("date").asText("?");
        String descPart = (args.has("description") && !args.path("description").isNull())
                ? " — \"" + args.path("description").asText() + "\"" : "";
        return String.format("Create %s %s transaction of %s on %s%s", type, category, amount, date, descPart);
    }

    private String buildUpdateSummary(JsonNode args) {
        String txId = args.path("transaction_id").asText("?");
        List<String> changes = new ArrayList<>();
        if (args.has("amount"))      changes.add("amount → " + args.path("amount").asText());
        if (args.has("type"))        changes.add("type → " + args.path("type").asText());
        if (args.has("category"))    changes.add("category → " + args.path("category").asText());
        if (args.has("date"))        changes.add("date → " + args.path("date").asText());
        if (args.has("description")) changes.add("description → \"" + args.path("description").asText() + "\"");
        return String.format("Update transaction #%s: %s",
                txId, changes.isEmpty() ? "(no changes specified)" : String.join(", ", changes));
    }
}
