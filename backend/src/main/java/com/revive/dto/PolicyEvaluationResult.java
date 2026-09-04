package com.revive.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PolicyEvaluationResult {
    private Boolean allowed;
    private String reason;
    private String policyName;
    private Boolean requiresApproval;
    
    public static PolicyEvaluationResult allowed() {
        return PolicyEvaluationResult.builder()
                .allowed(true)
                .reason("Policy checks passed")
                .build();
    }
    
    public static PolicyEvaluationResult blocked(String reason) {
        return PolicyEvaluationResult.builder()
                .allowed(false)
                .reason(reason)
                .build();
    }
    
    public static PolicyEvaluationResult requiresApproval(String reason) {
        return PolicyEvaluationResult.builder()
                .allowed(false)
                .requiresApproval(true)
                .reason(reason)
                .build();
    }
}
