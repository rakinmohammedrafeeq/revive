package com.ledgera.enums;

/**
 * Type of recovery action attempted
 */
public enum RecoveryActionType {
    AUTOMATIC_RETRY,     // Automated payment retry
    EMAIL_REMINDER,      // Email notification to customer
    SMS_REMINDER,        // SMS notification to customer
    DISCOUNT_OFFER,      // Offer discount to incentivize payment
    PAYMENT_LINK,        // Send new payment link
    PHONE_CALL,          // Manual phone call
    ESCALATION,          // Escalate to collections or manager
    CUSTOM              // Custom recovery action
}
