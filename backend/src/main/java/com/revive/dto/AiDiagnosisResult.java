package com.revive.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiDiagnosisResult {
    private String diagnosis;
    private String rootCause;
    private String recommendation;
    private String reasoning;
    private Double confidence;
    private Boolean isRecoverable;
    private String suggestedAction;
    private Integer suggestedDelayMinutes;
}
