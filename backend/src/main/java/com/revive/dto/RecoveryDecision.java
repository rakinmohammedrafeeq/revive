package com.revive.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Complete result from the recovery decision pipeline.
 *
 * decision values:
 *   EXECUTE   – policy approved, bounded action was run
 *   BLOCKED   – policy blocked the action (or duplicate / terminal state)
 *   ESCALATE  – requires manual approval
 *
 * executionStatus (only meaningful when decision == EXECUTE):
 *   SUCCESS   – payment recovered, revenue recorded
 *   PENDING   – action sent (email/SMS/link), awaiting customer response
 *   FAILED    – action ran but payment declined again
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecoveryDecision {

    // ── Pipeline inputs ────────────────────────────────────────────────────
    private Long failedPaymentId;
    private Double recoveryProbability;

    // ── Pipeline stages ────────────────────────────────────────────────────
    private AiDiagnosisResult aiDiagnosis;
    private RecoveryRecommendation recommendation;
    private PolicyEvaluationResult policyResult;

    // ── Final decision ─────────────────────────────────────────────────────
    /** EXECUTE / BLOCKED / ESCALATE */
    private String decision;
    private String reason;

    // ── Execution outcome (populated when decision == EXECUTE) ─────────────
    /** SUCCESS / PENDING / FAILED – the actual result of running the action */
    private String executionStatus;
    /** Amount recovered (only when executionStatus == SUCCESS) */
    private BigDecimal recoveredAmount;
    /** Raw outcome details from the executor (JSON-able) */
    private Map<String, Object> outcomeDetails;

    /** ID of the RecoveryAction record created during execution */
    private Long recoveryActionId;

    // ── Test-mode marker ──────────────────────────────────────────────────
    private Boolean testMode;

    // ── Convenience factories ──────────────────────────────────────────────

    public static RecoveryDecision executed(Long failedPaymentId, Long recoveryActionId) {
        return RecoveryDecision.builder()
                .failedPaymentId(failedPaymentId)
                .decision("EXECUTE")
                .executionStatus("PENDING")
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
