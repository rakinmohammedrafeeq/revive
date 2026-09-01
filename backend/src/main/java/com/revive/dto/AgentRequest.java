package com.revive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * Incoming request body for POST /api/ai/agent.
 */
@Getter
@Setter
public class AgentRequest {

    @NotBlank(message = "Message is required")
    private String message;

    @NotNull(message = "Workspace ID is required")
    private Long workspaceId;
}
