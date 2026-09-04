package com.revive.dto;

import com.revive.enums.RecoveryActionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecoveryRecommendation {
    private RecoveryActionType actionType;
    private String channel;
    private String reasoning;
    private Double confidence;
    private String diagnosis;
    private String recommendation;
    private Integer estimatedDelayMinutes;
}
