package com.ledgera.enums;

/**
 * Status of a recovery action
 */
public enum RecoveryActionStatus {
    INITIATED,           // Recovery action started
    IN_PROGRESS,         // Action being executed
    COMPLETED_SUCCESS,   // Action completed, payment recovered
    COMPLETED_FAILURE,   // Action completed but did not recover payment
    CANCELLED,           // Action was cancelled
    FAILED               // Action failed to execute due to error
}
