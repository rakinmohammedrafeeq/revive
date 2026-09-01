package com.ledgera.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialInsightResponse {

    private Long id;
    
    private String insightType;
    
    private String title;
    
    private String description;
    
    private String priority;
    
    private String status;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime expiresAt;
}
