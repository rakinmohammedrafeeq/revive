package com.revive.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvisorChatResponse {

    private boolean success;
    
    private String response;
    
    private String sessionId;
    
    private List<String> contextUsed;  // For debugging: what data was retrieved
    
    private String error;
    
    private Integer tokensUsed;
}
