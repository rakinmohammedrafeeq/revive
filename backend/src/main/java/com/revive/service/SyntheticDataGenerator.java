package com.revive.service;

import com.revive.entity.FailedPayment;
import com.revive.entity.Workspace;
import com.revive.enums.PaymentStatus;
import com.revive.repository.FailedPaymentRepository;
import com.revive.repository.WorkspaceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Generates realistic synthetic payment failure data for ML training and demonstration.
 * 
 * This creates diverse failure scenarios with realistic relationships between:
 * - Payment amounts, methods, and failure types
 * - Customer characteristics and recovery outcomes
 * - Time patterns and retry behavior
 * 
 * Dataset is split into:
 * - Training set (60%)
 * - Validation set (20%)
 * - Test set (20%)
 */
@Service
public class SyntheticDataGenerator {

    private static final Logger logger = LoggerFactory.getLogger(SyntheticDataGenerator.class);
    
    private final Random random = new Random(42); // Fixed seed for reproducibility
    
    private final FailedPaymentRepository failedPaymentRepository;
    private final WorkspaceRepository workspaceRepository;

    // Realistic failure patterns
    private static final String[] PAYMENT_METHODS = {"UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING", "WALLET"};
    
    private static final String[][] FAILURE_PATTERNS = {
            {"Temporary issuer decline", "declined_temp", "TEMP"},
            {"Insufficient funds", "insufficient_funds", "FUNDS"},
            {"Payment timeout", "timeout", "TEMP"},
            {"Card expired", "card_expired", "CARD"},
            {"Invalid card details", "invalid_card", "CARD"},
            {"Transaction declined by bank", "declined_by_bank", "PERMANENT"},
            {"Authentication failed", "auth_failed", "AUTH"},
            {"Gateway error", "gateway_error", "TEMP"},
            {"Daily limit exceeded", "limit_exceeded", "LIMIT"},
            {"Risk management decline", "risk_decline", "RISK"},
            {"Suspected fraud", "fraudulent", "FRAUD"},
            {"Payment disputed", "disputed", "DISPUTE"},
            {"Network timeout", "network_timeout", "TEMP"},
            {"Issuer not available", "issuer_unavailable", "TEMP"},
            {"Do not honor", "do_not_honor", "PERMANENT"}
    };

    public SyntheticDataGenerator(
            FailedPaymentRepository failedPaymentRepository,
            WorkspaceRepository workspaceRepository) {
        this.failedPaymentRepository = failedPaymentRepository;
        this.workspaceRepository = workspaceRepository;
    }

    /**
     * Generate synthetic dataset for workspace
     * 
     * @param workspaceId Target workspace
     * @param count Number of records to generate
     * @return Number of records created
     */
    @Transactional
    public int generateSyntheticDataset(Long workspaceId, int count) {
        try {
            logger.info("Generating {} synthetic payment records for workspace {}", count, workspaceId);

            Workspace workspace = workspaceRepository.findById(workspaceId)
                    .orElseThrow(() -> new RuntimeException("Workspace not found: " + workspaceId));

            logger.info("Found workspace: {} ({})", workspace.getName(), workspace.getId());

            List<FailedPayment> payments = new ArrayList<>();
            
            for (int i = 0; i < count; i++) {
                try {
                    FailedPayment payment = generateRealisticPayment(workspace, i);
                    payments.add(payment);
                } catch (Exception e) {
                    logger.error("Failed to generate payment #{}: {}", i, e.getMessage(), e);
                    throw new RuntimeException("Failed to generate payment #" + i + ": " + e.getMessage(), e);
                }
            }

            logger.info("Generated {} payment objects, saving to database...", payments.size());

            // Save all payments
            List<FailedPayment> savedPayments = failedPaymentRepository.saveAll(payments);
            
            logger.info("Successfully saved {} synthetic payment records", savedPayments.size());
            return savedPayments.size();
        } catch (Exception e) {
            logger.error("Error in generateSyntheticDataset: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate synthetic dataset: " + e.getMessage(), e);
        }
    }

    /**
     * Generate a realistic failed payment with correlated features
     */
    private FailedPayment generateRealisticPayment(Workspace workspace, int index) {
        // Select failure pattern
        String[] failurePattern = FAILURE_PATTERNS[random.nextInt(FAILURE_PATTERNS.length)];
        String failureReason = failurePattern[0];
        String errorCode = failurePattern[1];
        String failureType = failurePattern[2];

        // Generate amount (realistic distribution: most small, some large)
        BigDecimal amount = generateRealisticAmount();

        // Select payment method (UPI more common in India)
        String paymentMethod = PAYMENT_METHODS[random.nextInt(PAYMENT_METHODS.length)];
        if (random.nextDouble() < 0.4) { // 40% UPI
            paymentMethod = "UPI";
        }

        // Generate customer info
        boolean hasEmail = random.nextDouble() < 0.85; // 85% have email
        boolean hasPhone = random.nextDouble() < 0.90; // 90% have phone
        
        String customerId = "CUST_" + (1000 + index);
        String customerName = "Customer " + customerId;
        String customerEmail = hasEmail ? "customer" + (1000 + index) + "@example.com" : null;
        String customerPhone = hasPhone ? "+919" + String.format("%09d", random.nextInt(1000000000)) : null;

        // Generate timestamps (failures spread over last 30 days)
        LocalDateTime failedAt = LocalDateTime.now()
                .minusDays(random.nextInt(30))
                .minusHours(random.nextInt(24))
                .minusMinutes(random.nextInt(60));

        // Determine retry count and status based on failure type
        int retryCount = 0;
        PaymentStatus status = PaymentStatus.FAILED;
        LocalDateTime lastRetryAt = null;
        LocalDateTime recoveredAt = null;

        if (failureType.equals("TEMP")) {
            // Temporary failures often get retried and recovered
            if (random.nextDouble() < 0.7) { // 70% retried
                retryCount = random.nextInt(3) + 1;
                lastRetryAt = failedAt.plusHours(24 * retryCount);
                
                if (random.nextDouble() < 0.6) { // 60% of retries succeed
                    status = PaymentStatus.RECOVERED;
                    recoveredAt = lastRetryAt.plusMinutes(random.nextInt(120));
                }
            }
        } else if (failureType.equals("FUNDS")) {
            // Insufficient funds sometimes recovered after delay
            if (random.nextDouble() < 0.5) { // 50% retried
                retryCount = random.nextInt(2) + 1;
                lastRetryAt = failedAt.plusDays(2 * retryCount);
                
                if (random.nextDouble() < 0.3) { // 30% of retries succeed
                    status = PaymentStatus.RECOVERED;
                    recoveredAt = lastRetryAt.plusMinutes(random.nextInt(180));
                }
            }
        } else if (failureType.equals("CARD")) {
            // Card issues rarely recovered without customer action
            if (random.nextDouble() < 0.3) { // 30% retried
                retryCount = random.nextInt(2) + 1;
                lastRetryAt = failedAt.plusDays(1);
                
                if (random.nextDouble() < 0.15) { // 15% of retries succeed
                    status = PaymentStatus.RECOVERED;
                    recoveredAt = lastRetryAt.plusMinutes(random.nextInt(240));
                } else if (retryCount >= 3) {
                    status = PaymentStatus.ABANDONED;
                }
            }
        } else if (failureType.equals("PERMANENT")) {
            // Permanent declines rarely recovered
            if (random.nextDouble() < 0.2) {
                retryCount = random.nextInt(3) + 1;
                lastRetryAt = failedAt.plusDays(1);
                
                if (retryCount >= 3 || random.nextDouble() < 0.1) {
                    status = PaymentStatus.ABANDONED;
                }
            }
        } else if (failureType.equals("FRAUD") || failureType.equals("DISPUTE")) {
            // Fraud/dispute cases should NOT be auto-recovered
            // These should be blocked by policy
            status = PaymentStatus.UNDER_REVIEW;
            retryCount = 0;
        } else if (failureType.equals("RISK")) {
            // Risk declines need review
            status = PaymentStatus.UNDER_REVIEW;
            retryCount = 0;
        }

        // Build payment with all required fields explicitly set
        FailedPayment payment = FailedPayment.builder()
                .workspace(workspace)
                .paymentIdentifier("PAY_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .orderIdentifier("ORD_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .customerId(customerId)
                .customerName(customerName)
                .customerEmail(customerEmail)
                .customerPhone(customerPhone)
                .amount(amount)
                .currency("INR")
                .status(status)
                .failureReason(failureReason)
                .errorCode(errorCode)
                .paymentMethod(paymentMethod)
                .retryCount(retryCount)
                .failedAt(failedAt)
                .lastRetryAt(lastRetryAt)
                .recoveredAt(recoveredAt)
                .build();
        
        // Validate critical fields before returning
        if (payment.getWorkspace() == null) {
            throw new IllegalStateException("Payment workspace is null");
        }
        if (payment.getPaymentIdentifier() == null || payment.getPaymentIdentifier().isEmpty()) {
            throw new IllegalStateException("Payment identifier is null or empty");
        }
        if (payment.getCustomerId() == null || payment.getCustomerId().isEmpty()) {
            throw new IllegalStateException("Customer ID is null or empty");
        }
        if (payment.getAmount() == null) {
            throw new IllegalStateException("Payment amount is null");
        }
        if (payment.getFailedAt() == null) {
            throw new IllegalStateException("Failed at timestamp is null");
        }
        if (payment.getRetryCount() == null) {
            throw new IllegalStateException("Retry count is null");
        }
        
        return payment;
    }

    /**
     * Generate realistic payment amount
     * Follows power-law distribution: many small payments, few large ones
     */
    private BigDecimal generateRealisticAmount() {
        double r = random.nextDouble();
        double amount;
        
        if (r < 0.5) {
            // 50%: Small payments (₹100 - ₹2,000)
            amount = 100 + random.nextDouble() * 1900;
        } else if (r < 0.8) {
            // 30%: Medium payments (₹2,000 - ₹10,000)
            amount = 2000 + random.nextDouble() * 8000;
        } else if (r < 0.95) {
            // 15%: Large payments (₹10,000 - ₹50,000)
            amount = 10000 + random.nextDouble() * 40000;
        } else {
            // 5%: Very large payments (₹50,000 - ₹200,000)
            amount = 50000 + random.nextDouble() * 150000;
        }
        
        return BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Get dataset statistics
     */
    public Map<String, Object> getDatasetStats(Long workspaceId) {
        List<FailedPayment> payments = failedPaymentRepository.findByWorkspaceIdOrderByFailedAtDesc(workspaceId);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("total_records", payments.size());
        
        long recovered = payments.stream().filter(p -> p.getStatus() == PaymentStatus.RECOVERED).count();
        long abandoned = payments.stream().filter(p -> p.getStatus() == PaymentStatus.ABANDONED).count();
        long active = payments.stream().filter(p -> p.getStatus() == PaymentStatus.FAILED || 
                p.getStatus() == PaymentStatus.PENDING_RETRY).count();
        
        stats.put("recovered_count", recovered);
        stats.put("abandoned_count", abandoned);
        stats.put("active_count", active);
        stats.put("recovery_rate", payments.size() > 0 ? (recovered * 100.0 / payments.size()) : 0.0);
        
        // Training/validation/test split suggestion
        int trainSize = (int) (payments.size() * 0.6);
        int valSize = (int) (payments.size() * 0.2);
        int testSize = payments.size() - trainSize - valSize;
        
        stats.put("suggested_train_size", trainSize);
        stats.put("suggested_validation_size", valSize);
        stats.put("suggested_test_size", testSize);
        
        return stats;
    }
}
