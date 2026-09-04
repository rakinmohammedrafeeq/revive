package com.revive.service;

import com.revive.enums.PaymentStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

/**
 * Validates payment state transitions to ensure only valid state changes occur.
 * 
 * State machine for failed payments:
 * 
 * FAILED → PENDING_RETRY (scheduled for retry)
 * FAILED → RETRY_IN_PROGRESS (retry initiated)
 * FAILED → UNDER_REVIEW (policy block or manual review needed)
 * FAILED → ABANDONED (too many retries or terminal failure)
 * 
 * PENDING_RETRY → RETRY_IN_PROGRESS (retry starting)
 * PENDING_RETRY → ABANDONED (cancelled or expired)
 * 
 * RETRY_IN_PROGRESS → RECOVERED (success!)
 * RETRY_IN_PROGRESS → FAILED (retry failed, back to evaluation)
 * RETRY_IN_PROGRESS → PENDING_RETRY (action pending customer response)
 * RETRY_IN_PROGRESS → UNDER_REVIEW (needs manual intervention)
 * 
 * UNDER_REVIEW → RETRY_IN_PROGRESS (approved for retry)
 * UNDER_REVIEW → ABANDONED (rejected)
 * 
 * RECOVERED → (terminal state, no transitions)
 * ABANDONED → (terminal state, no transitions)
 */
@Service
public class PaymentStateValidator {

    private static final Logger logger = LoggerFactory.getLogger(PaymentStateValidator.class);

    // Valid transitions: current_status → set of allowed next statuses
    private static final Map<PaymentStatus, Set<PaymentStatus>> VALID_TRANSITIONS = Map.of(
        PaymentStatus.FAILED, Set.of(
            PaymentStatus.PENDING_RETRY,
            PaymentStatus.RETRY_IN_PROGRESS,
            PaymentStatus.UNDER_REVIEW,
            PaymentStatus.ABANDONED
        ),
        PaymentStatus.PENDING_RETRY, Set.of(
            PaymentStatus.RETRY_IN_PROGRESS,
            PaymentStatus.ABANDONED
        ),
        PaymentStatus.RETRY_IN_PROGRESS, Set.of(
            PaymentStatus.RECOVERED,
            PaymentStatus.FAILED,
            PaymentStatus.PENDING_RETRY,
            PaymentStatus.UNDER_REVIEW,
            PaymentStatus.ABANDONED
        ),
        PaymentStatus.UNDER_REVIEW, Set.of(
            PaymentStatus.RETRY_IN_PROGRESS,
            PaymentStatus.ABANDONED,
            PaymentStatus.PENDING_RETRY
        ),
        PaymentStatus.RECOVERED, Set.of(),  // terminal state
        PaymentStatus.ABANDONED, Set.of()   // terminal state
    );

    /**
     * Check if a state transition is valid.
     * 
     * @param currentStatus Current payment status
     * @param newStatus Proposed new payment status
     * @return true if transition is allowed, false otherwise
     */
    public boolean isValidTransition(PaymentStatus currentStatus, PaymentStatus newStatus) {
        if (currentStatus == newStatus) {
            // Same state is always valid (idempotent)
            return true;
        }

        Set<PaymentStatus> allowedTransitions = VALID_TRANSITIONS.get(currentStatus);
        if (allowedTransitions == null) {
            logger.warn("Unknown payment status: {}", currentStatus);
            return false;
        }

        boolean valid = allowedTransitions.contains(newStatus);
        if (!valid) {
            logger.warn("Invalid state transition: {} → {} is not allowed", currentStatus, newStatus);
        }

        return valid;
    }

    /**
     * Validate and throw exception if transition is invalid.
     * 
     * @param currentStatus Current payment status
     * @param newStatus Proposed new payment status
     * @throws IllegalStateException if transition is not valid
     */
    public void validateTransition(PaymentStatus currentStatus, PaymentStatus newStatus) {
        if (!isValidTransition(currentStatus, newStatus)) {
            throw new IllegalStateException(
                String.format("Invalid payment state transition: %s → %s is not allowed",
                    currentStatus, newStatus)
            );
        }
    }

    /**
     * Check if a status is terminal (no further transitions allowed).
     * 
     * @param status Payment status to check
     * @return true if status is terminal
     */
    public boolean isTerminalState(PaymentStatus status) {
        return status == PaymentStatus.RECOVERED || status == PaymentStatus.ABANDONED;
    }

    /**
     * Get all valid next states from current state.
     * 
     * @param currentStatus Current payment status
     * @return Set of allowed next statuses
     */
    public Set<PaymentStatus> getAllowedNextStates(PaymentStatus currentStatus) {
        return VALID_TRANSITIONS.getOrDefault(currentStatus, Set.of());
    }
}
