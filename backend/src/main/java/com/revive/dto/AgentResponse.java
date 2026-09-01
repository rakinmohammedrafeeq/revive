package com.revive.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

/**
 * Response returned by the agent endpoint.
 *
 * <p>Two possible shapes:
 * <ul>
 *   <li>{@code FINAL_ANSWER} — the agent finished; {@code answer} contains the text response.</li>
 *   <li>{@code PENDING_CONFIRMATION} — the agent wants to perform a write (create/update); the
 *       frontend must display {@code pendingAction.summary} and let the user confirm or cancel
 *       before posting to /api/ai/agent/confirm or /api/ai/agent/cancel.</li>
 * </ul>
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AgentResponse {

    public enum ResponseType {
        FINAL_ANSWER,
        PENDING_CONFIRMATION
    }

    private ResponseType responseType;

    /** Non-null when responseType == FINAL_ANSWER. */
    private String answer;

    /** Non-null when responseType == PENDING_CONFIRMATION. */
    private PendingAction pendingAction;

    // ── Factory methods ────────────────────────────────────────────────────────

    public static AgentResponse finalAnswer(String answer) {
        return AgentResponse.builder()
                .responseType(ResponseType.FINAL_ANSWER)
                .answer(answer)
                .build();
    }

    public static AgentResponse pendingConfirmation(PendingAction action) {
        return AgentResponse.builder()
                .responseType(ResponseType.PENDING_CONFIRMATION)
                .pendingAction(action)
                .build();
    }
}
