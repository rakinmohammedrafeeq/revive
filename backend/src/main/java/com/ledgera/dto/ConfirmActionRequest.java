package com.ledgera.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * Request body for POST /api/ai/agent/confirm.
 */
@Getter
@Setter
public class ConfirmActionRequest {

    @NotBlank(message = "Action ID is required")
    private String actionId;
}
