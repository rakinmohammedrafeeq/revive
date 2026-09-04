package com.revive.enums;

/**
 * Granular audit action types for the complete recovery pipeline.
 *
 * Maps to the full workflow:
 * DETECT → PREDICT → DIAGNOSE → RECOMMEND → GUARD → ACT → MEASURE → AUDIT
 */
public enum AuditActionType {

    // ── Detection ──────────────────────────────────────────────────────────
    /** A payment failure was detected and registered */
    PAYMENT_FAILED,

    // ── ML Prediction ──────────────────────────────────────────────────────
    /** ML model scored this payment's recovery probability */
    ML_PREDICTION,

    // ── AI Diagnosis ───────────────────────────────────────────────────────
    /** LLM analyzed the failure and produced a diagnosis */
    AI_DIAGNOSIS,

    // ── Recommendation ─────────────────────────────────────────────────────
    /** A recovery action was recommended by the AI system */
    RECOVERY_RECOMMENDATION,

    // ── Policy / Guardrail ─────────────────────────────────────────────────
    /** Policy engine evaluated the recommended action */
    POLICY_CHECK,

    /** A recovery action was allowed by the policy engine */
    RECOVERY_APPROVED,

    /** A recovery action was blocked due to a policy violation */
    POLICY_VIOLATION,

    // ── Action ─────────────────────────────────────────────────────────────
    /** A recovery action was initiated */
    RECOVERY_INITIATED,

    /** Recovery action completed (success or failure) */
    RECOVERY_COMPLETED,

    // ── Outcomes ───────────────────────────────────────────────────────────
    /** Payment was successfully recovered */
    REVENUE_RECOVERED,

    /** Payment was abandoned after exhausting all options */
    PAYMENT_ABANDONED,

    // ── Safety / Idempotency ───────────────────────────────────────────────
    /** Duplicate recovery attempt was detected and blocked */
    DUPLICATE_BLOCKED,

    // ── Human-in-the-loop ──────────────────────────────────────────────────
    /** Manual intervention triggered (escalation, human review) */
    MANUAL_INTERVENTION,

    /** Payment status was updated */
    STATUS_UPDATE
}
