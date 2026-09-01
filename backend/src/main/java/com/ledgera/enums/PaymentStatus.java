package com.ledgera.enums;

/**
 * Status of a failed payment in the recovery workflow
 */
public enum PaymentStatus {
    FAILED,              // Initial failure state
    PENDING_RETRY,       // Scheduled for retry attempt
    RETRY_IN_PROGRESS,   // Currently being retried
    RECOVERED,           // Successfully recovered
    ABANDONED,           // Recovery attempts exhausted or stopped
    DISPUTED,            // Customer disputed the charge
    UNDER_REVIEW         // Manual review required
}
