package com.revive.dto;

import com.revive.enums.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiReceiptResponse {
    
    private BigDecimal amount;
    
    private String merchant;
    
    private LocalDate date;
    
    private String category;
    
    private TransactionType type;
    
    private String description;
    
    private Double confidence;
    
    private boolean success;
    
    private String error;
    
    // Cloudinary fields
    private String cloudinaryUrl;
    
    private String cloudinaryPublicId;
}
