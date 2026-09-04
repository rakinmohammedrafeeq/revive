package com.revive.service;

import com.revive.entity.FailedPayment;
import com.revive.entity.RecoveryAction;
import com.revive.enums.RecoveryActionType;
import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

/**
 * Razorpay TEST MODE recovery service.
 * 
 * IMPORTANT: This uses RAZORPAY TEST MODE credentials.
 * All payments are simulated and no real money is processed.
 * 
 * In production, this would integrate with Razorpay's actual API to:
 * - Retry payment charges
 * - Create new payment links
 * - Check payment status
 */
@Service
public class RazorpayRecoveryService {

    private static final Logger logger = LoggerFactory.getLogger(RazorpayRecoveryService.class);
    
    private final String razorpayKeyId;
    private final String razorpayKeySecret;
    private final boolean isTestMode;
    private final Random random = new Random();

    public RazorpayRecoveryService() {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        this.razorpayKeyId = dotenv.get("RAZORPAY_KEY_ID", "rzp_test_demo");
        this.razorpayKeySecret = dotenv.get("RAZORPAY_KEY_SECRET", "test_secret");
        this.isTestMode = razorpayKeyId.startsWith("rzp_test_") || razorpayKeyId.equals("rzp_test_demo");
        
        if (isTestMode) {
            logger.info("Razorpay Recovery Service initialized in TEST MODE");
        } else {
            logger.warn("Razorpay Recovery Service configured with LIVE credentials - review security!");
        }
    }

    /**
     * Execute recovery action on Razorpay
     * 
     * @param payment The failed payment to recover
     * @param action The recovery action being attempted
     * @return Result of the recovery attempt
     */
    public RecoveryExecutionResult executeRecovery(FailedPayment payment, RecoveryAction action) {
        logger.info("Executing recovery for payment {} using action type {}", 
                payment.getPaymentIdentifier(), action.getActionType());

        if (!isTestMode) {
            logger.error("Cannot execute recovery - not in test mode. Set RAZORPAY_KEY_ID to test mode key.");
            return RecoveryExecutionResult.failure(
                    "Recovery execution requires TEST MODE credentials", null);
        }

        return switch (action.getActionType()) {
            case AUTOMATIC_RETRY -> executeAutomaticRetry(payment);
            case EMAIL_REMINDER -> executeEmailReminder(payment);
            case SMS_REMINDER -> executeSmsReminder(payment);
            case PAYMENT_LINK -> executePaymentLink(payment);
            case DISCOUNT_OFFER -> executeDiscountOffer(payment);
            case PHONE_CALL -> executePhoneCall(payment);
            default -> RecoveryExecutionResult.failure("Action type not supported for automated execution", null);
        };
    }

    /**
     * Simulate automatic payment retry
     */
    private RecoveryExecutionResult executeAutomaticRetry(FailedPayment payment) {
        logger.info("[TEST MODE] Simulating automatic retry for payment {}", payment.getPaymentIdentifier());
        
        // Simulate Razorpay API call
        try {
            Thread.sleep(500); // Simulate network delay
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Simulate success/failure based on failure reason
        String errorCode = payment.getErrorCode() != null ? payment.getErrorCode().toLowerCase() : "";
        double successProbability;
        
        if (errorCode.contains("temp") || errorCode.contains("timeout")) {
            successProbability = 0.75; // Temporary failures often resolve
        } else if (errorCode.contains("insufficient") || errorCode.contains("funds")) {
            successProbability = 0.30; // Funds issues less likely to resolve immediately
        } else if (errorCode.contains("expired") || errorCode.contains("card")) {
            successProbability = 0.10; // Card issues unlikely to resolve without customer action
        } else {
            successProbability = 0.50; // Unknown failures - 50/50
        }

        boolean success = random.nextDouble() < successProbability;
        
        if (success) {
            Map<String, Object> details = new HashMap<>();
            details.put("payment_id", payment.getPaymentIdentifier());
            details.put("razorpay_payment_id", "pay_test_" + System.currentTimeMillis());
            details.put("status", "captured");
            details.put("amount", payment.getAmount());
            details.put("currency", payment.getCurrency());
            details.put("method", payment.getPaymentMethod());
            details.put("test_mode", true);
            
            return RecoveryExecutionResult.success(payment.getAmount(), details);
        } else {
            Map<String, Object> details = new HashMap<>();
            details.put("payment_id", payment.getPaymentIdentifier());
            details.put("error_code", "payment_failed");
            details.put("error_description", "Payment declined by issuer (simulated)");
            details.put("test_mode", true);
            
            return RecoveryExecutionResult.failure("Payment retry declined (simulated failure)", details);
        }
    }

    /**
     * Simulate sending email reminder
     */
    private RecoveryExecutionResult executeEmailReminder(FailedPayment payment) {
        logger.info("[TEST MODE] Simulating email reminder for payment {}", payment.getPaymentIdentifier());
        
        if (payment.getCustomerEmail() == null || payment.getCustomerEmail().isEmpty()) {
            return RecoveryExecutionResult.failure("No customer email available", null);
        }

        Map<String, Object> details = new HashMap<>();
        details.put("payment_id", payment.getPaymentIdentifier());
        details.put("email", payment.getCustomerEmail());
        details.put("email_sent", true);
        details.put("template", "recovery_reminder");
        details.put("test_mode", true);
        
        // Email sent successfully, but payment not yet recovered
        return RecoveryExecutionResult.pending(details);
    }

    /**
     * Simulate sending SMS reminder
     */
    private RecoveryExecutionResult executeSmsReminder(FailedPayment payment) {
        logger.info("[TEST MODE] Simulating SMS reminder for payment {}", payment.getPaymentIdentifier());
        
        if (payment.getCustomerPhone() == null || payment.getCustomerPhone().isEmpty()) {
            return RecoveryExecutionResult.failure("No customer phone available", null);
        }

        Map<String, Object> details = new HashMap<>();
        details.put("payment_id", payment.getPaymentIdentifier());
        details.put("phone", payment.getCustomerPhone());
        details.put("sms_sent", true);
        details.put("test_mode", true);
        
        return RecoveryExecutionResult.pending(details);
    }

    /**
     * Simulate creating payment link
     */
    private RecoveryExecutionResult executePaymentLink(FailedPayment payment) {
        logger.info("[TEST MODE] Simulating payment link creation for payment {}", payment.getPaymentIdentifier());
        
        Map<String, Object> details = new HashMap<>();
        details.put("payment_id", payment.getPaymentIdentifier());
        details.put("payment_link_id", "plink_test_" + System.currentTimeMillis());
        details.put("short_url", "https://rzp.io/i/test" + random.nextInt(100000));
        details.put("amount", payment.getAmount());
        details.put("currency", payment.getCurrency());
        details.put("status", "created");
        details.put("test_mode", true);
        
        return RecoveryExecutionResult.pending(details);
    }

    /**
     * Simulate discount offer
     */
    private RecoveryExecutionResult executeDiscountOffer(FailedPayment payment) {
        logger.info("[TEST MODE] Simulating discount offer for payment {}", payment.getPaymentIdentifier());
        
        BigDecimal discountAmount = payment.getAmount().multiply(new BigDecimal("0.10")); // 10% discount
        BigDecimal newAmount = payment.getAmount().subtract(discountAmount);
        
        Map<String, Object> details = new HashMap<>();
        details.put("payment_id", payment.getPaymentIdentifier());
        details.put("original_amount", payment.getAmount());
        details.put("discount_amount", discountAmount);
        details.put("new_amount", newAmount);
        details.put("discount_percent", 10);
        details.put("coupon_code", "RECOVER10");
        details.put("test_mode", true);
        
        return RecoveryExecutionResult.pending(details);
    }

    /**
     * Simulate phone call scheduling
     */
    private RecoveryExecutionResult executePhoneCall(FailedPayment payment) {
        logger.info("[TEST MODE] Simulating phone call scheduling for payment {}", payment.getPaymentIdentifier());
        
        if (payment.getCustomerPhone() == null || payment.getCustomerPhone().isEmpty()) {
            return RecoveryExecutionResult.failure("No customer phone available", null);
        }

        Map<String, Object> details = new HashMap<>();
        details.put("payment_id", payment.getPaymentIdentifier());
        details.put("phone", payment.getCustomerPhone());
        details.put("call_scheduled", true);
        details.put("scheduled_for", "next_business_hour");
        details.put("test_mode", true);
        
        return RecoveryExecutionResult.pending(details);
    }

    /**
     * Result of a recovery execution attempt
     */
    public static class RecoveryExecutionResult {
        private final boolean success;
        private final boolean pending;
        private final BigDecimal recoveredAmount;
        private final String errorMessage;
        private final Map<String, Object> details;

        private RecoveryExecutionResult(boolean success, boolean pending, BigDecimal recoveredAmount, 
                                        String errorMessage, Map<String, Object> details) {
            this.success = success;
            this.pending = pending;
            this.recoveredAmount = recoveredAmount;
            this.errorMessage = errorMessage;
            this.details = details != null ? details : new HashMap<>();
        }

        public static RecoveryExecutionResult success(BigDecimal amount, Map<String, Object> details) {
            return new RecoveryExecutionResult(true, false, amount, null, details);
        }

        public static RecoveryExecutionResult pending(Map<String, Object> details) {
            return new RecoveryExecutionResult(false, true, null, null, details);
        }

        public static RecoveryExecutionResult failure(String errorMessage, Map<String, Object> details) {
            return new RecoveryExecutionResult(false, false, null, errorMessage, details);
        }

        public boolean isSuccess() { return success; }
        public boolean isPending() { return pending; }
        public BigDecimal getRecoveredAmount() { return recoveredAmount; }
        public String getErrorMessage() { return errorMessage; }
        public Map<String, Object> getDetails() { return details; }
    }
}
