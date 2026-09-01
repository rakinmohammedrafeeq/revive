package com.ledgera.dto;

import com.ledgera.enums.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCategorizationResponse {
    
    private String category;
    
    private TransactionType type;
    
    private Double confidence;
    
    private String reasoning;
    
    private boolean success;
    
    private String error;
}
