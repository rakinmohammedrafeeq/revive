package com.ledgera.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCategorizationRequest {
    
    @NotBlank(message = "Description is required")
    private String description;
    
    private String amount;
    
    private String date;
}
