package com.revive.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiInsightsResponse {
    
    private String summary;
    
    private List<String> keyInsights;
    
    private List<String> recommendations;
    
    private SpendingAnalysis spendingAnalysis;
    
    private String trendAnalysis;
    
    private boolean success;
    
    private String error;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SpendingAnalysis {
        private String topCategory;
        private Double percentageChange;
        private String comparisonPeriod;
    }
}
