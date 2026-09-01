package com.revive.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Represents a write action (create_transaction or update_transaction) that has been proposed by
 * the agent but not yet executed — it is waiting for explicit user confirmation.
 *
 * <p>The frontend should display {@code summary} to the user and present Confirm / Cancel options.
 * On confirm: POST /api/ai/agent/confirm with { "actionId": "..." }
 * On cancel:  DELETE /api/ai/agent/cancel/{actionId}
 *
 * <p>Actions expire after 10 minutes; attempting to confirm an expired action returns 404.
 */
@Getter
@Builder
public class PendingAction {
    /** Opaque UUID identifying this pending action. */
    private String actionId;

    /** Internal tool name (e.g. "create_transaction"). Not shown to user directly. */
    private String toolName;

    /** Raw JSON arguments string from the LLM — used when executing on confirmation. */
    private String toolArguments;

    /** Human-readable description of what will happen, e.g. "Create expense Food of 250.00 on 2026-07-26". */
    private String summary;

    /** When this action expires (10 minutes from creation). */
    private LocalDateTime expiresAt;
}
