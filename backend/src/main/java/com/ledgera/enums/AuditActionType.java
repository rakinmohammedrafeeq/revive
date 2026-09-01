package com.ledgera.enums;

/**
 * Type of action being audited
 */
public enum AuditActionType {
    PAYMENT_FAILED,           // Initial payment failure recorded
    POLICY_CHECK,             // Recovery policy validation
    RECOVERY_INITIATED,       // Recovery action started
    RECOVERY_COMPLETED,       // Recovery action finished
    STATUS_UPDATE,            // Payment status changed
    MANUAL_INTERVENTION,      // Manual action by user
    POLICY_VIOLATION,         // Attempted action violated policy
    REVENUE_RECOVERED,        // Payment successfully recovered
    PAYMENT_ABANDONED         // Payment marked as unrecoverable
}
