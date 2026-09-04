package com.revive.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecoveryDecision {
    private Long failedPaymentId;
    private String decision; // EXECUTE, BLOCKED, ESCALATE
    private String reason;
    private Double recoveryProbability;
    private AiDiagnosisResult aiDiagnosis;
    private RecoveryRecommendation recommendation;
    private PolicyEvaluationResult policyResult;
    private Long recoveryActionId;
    
    public static RecoveryDecision executed(Long failedPaymentId, Long recoveryActionId) {
        return RecoveryDecision.builder()
                .failedPaymentId(failedPaymentId)
                .decision("EXECUTE")
                .recoveryActionId(recoveryActionId)
                .reason("Recovery action executed successfully")
                .build();
    }
    
    public static RecoveryDecision blocked(Long failedPaymentId, String reason) {
        return RecoveryDecision.builder()
                .failedPaymentId(failedPaymentId)
                .decision("BLOCKED")
                .reason(reason)
                .build();
    }
    
    public static RecoveryDecision escalate(Long failedPaymentId, String reason) {
        return RecoveryDecision.builder()
                .failedPaymentId(failedPaymentId)
                .decision("ESCALATE")
                .reason(reason)
                .build();
    }
}
