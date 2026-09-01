package com.revive.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvisorChatRequest {

    @NotBlank(message = "Message is required")
    private String message;

    private String sessionId;  // Optional: for conversation continuity

    private Long workspaceId;  // Optional: scope to specific workspace
}
