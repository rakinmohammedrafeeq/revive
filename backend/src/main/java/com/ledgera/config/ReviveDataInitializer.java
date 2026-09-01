package com.ledgera.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledgera.entity.*;
import com.ledgera.enums.*;
import com.ledgera.repository.*;
import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Seeds sample Revive revenue recovery data for development/testing.
 * 
 * IMPORTANT: Only runs if REVIVE_SEED_DATA=true in environment.
 * This is a separate initializer from DataInitializer to avoid interference.
 */
@Configuration
public class ReviveDataInitializer {

    private static final Logger logger = LoggerFactory.getLogger(ReviveDataInitializer.class);

    @Bean
    @Order(2) // Run after DataInitializer
    public CommandLineRunner initReviveData(
            WorkspaceRepository workspaceRepository,
            UserRepository userRepository,
            FailedPaymentRepository failedPaymentRepository,
            RecoveryPolicyRepository policyRepository,
            RecoveryActionRepository actionRepository,
            AuditTrailRepository auditTrailRepository,
            ObjectMapper objectMapper) {
        
        return args -> {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            boolean seedReviveData = "true".equalsIgnoreCase(
                    dotenv.get("REVIVE_SEED_DATA", "false"));

            if (!seedReviveData) {
                logger.info("Revive data seeding disabled (set REVIVE_SEED_DATA=true to enable)");
                return;
            }

            // Check if Revive data already exists
            if (failedPaymentRepository.count() > 0) {
                logger.info("Revive data already exists, skipping initialization");
                return;
            }

            logger.info("Seeding sample Revive revenue recovery data...");

            // Find first active workspace and user
            List<Workspace> workspaces = workspaceRepository.findAll();
            if (workspaces.isEmpty()) {
                logger.warn("No workspaces found, skipping Revive data seeding");
                return;
            }

            Workspace workspace = workspaces.get(0);
            User owner = workspace.getOwner();

            logger.info("Seeding Revive data for workspace: {}", workspace.getName());

            // Create default recovery policy
            RecoveryPolicy defaultPolicy = RecoveryPolicy.builder()
                    .workspace(workspace)
                    .name("Default Recovery Policy")
                    .description("Standard guardrails for revenue recovery")
                    .maxRetryCount(3)
                    .cooldownHours(24)
                    .maxRecoveryCostPerPayment(new BigDecimal("100.00"))
                    .maxTotalRecoveryBudget(new BigDecimal("50000.00"))
                    .allowedChannels(objectMapper.writeValueAsString(
                            List.of("EMAIL", "SMS", "AUTOMATIC_RETRY", "PAYMENT_LINK")))
                    .isActive(true)
                    .priority(1)
                    .build();
            policyRepository.save(defaultPolicy);
            logger.info("Created default recovery policy");

            // Create sample failed payments
            FailedPayment payment1 = createSampleFailedPayment(
                    workspace, "pay_order_001", "cust_12345",
                    new BigDecimal("2500.00"), "insufficient_funds",
                    "INSUFFICIENT_FUNDS", "UPI");
            failedPaymentRepository.save(payment1);

            FailedPayment payment2 = createSampleFailedPayment(
                    workspace, "pay_order_002", "cust_67890",
                    new BigDecimal("5000.00"), "card_declined",
                    "CARD_DECLINED", "CARD");
            failedPaymentRepository.save(payment2);

            FailedPayment payment3 = createSampleFailedPayment(
                    workspace, "pay_order_003", "cust_11111",
                    new BigDecimal("1200.00"), "bank_timeout",
                    "GATEWAY_TIMEOUT", "NET_BANKING");
            payment3.setStatus(PaymentStatus.PENDING_RETRY);
            payment3.setRetryCount(1);
            failedPaymentRepository.save(payment3);

            logger.info("Created {} sample failed payments", 3);

            // Create sample audit trail entries
            Map<String, Object> auditDetails = new HashMap<>();
            auditDetails.put("payment_amount", "2500.00");
            auditDetails.put("payment_method", "UPI");
            auditDetails.put("error_code", "INSUFFICIENT_FUNDS");

            AuditTrail audit1 = AuditTrail.builder()
                    .user(owner)
                    .workspace(workspace)
                    .actionType(AuditActionType.PAYMENT_FAILED)
                    .entityType("FailedPayment")
                    .entityId(payment1.getId())
                    .paymentIdentifier(payment1.getPaymentIdentifier())
                    .details(objectMapper.writeValueAsString(auditDetails))
                    .outcome("Payment failure recorded")
                    .timestamp(LocalDateTime.now())
                    .build();
            auditTrailRepository.save(audit1);

            logger.info("Created sample audit trail entries");
            logger.info("✅ Revive sample data seeding completed successfully");
        };
    }

    private FailedPayment createSampleFailedPayment(
            Workspace workspace,
            String paymentId,
            String customerId,
            BigDecimal amount,
            String failureReason,
            String errorCode,
            String paymentMethod) {
        
        return FailedPayment.builder()
                .workspace(workspace)
                .paymentIdentifier(paymentId)
                .orderIdentifier("order_" + paymentId.substring(4))
                .customerId(customerId)
                .customerEmail(customerId + "@example.com")
                .customerPhone("+91" + String.format("%010d", customerId.hashCode() % 10000000000L))
                .customerName("Customer " + customerId)
                .amount(amount)
                .currency("INR")
                .status(PaymentStatus.FAILED)
                .failureReason(failureReason)
                .errorCode(errorCode)
                .paymentMethod(paymentMethod)
                .retryCount(0)
                .failedAt(LocalDateTime.now().minusHours(6))
                .build();
    }
}
