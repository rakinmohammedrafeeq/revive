package com.revive.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revive.entity.*;
import com.revive.enums.*;
import com.revive.repository.*;
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

            // Create realistic sample failed payments
            LocalDateTime now = LocalDateTime.now();
            
            // Payment 1: Temporary issuer decline - high recovery probability
            FailedPayment payment1 = createSampleFailedPayment(
                    workspace, "pay_12500_001", "cust_acme_corp",
                    new BigDecimal("12500.00"), "Temporary issuer decline",
                    "issuer_declined_temp", "CARD");
            payment1.setCustomerName("Acme Corp");
            payment1.setCustomerEmail("billing@acmecorp.com");
            payment1.setFailedAt(now.minusMinutes(12));
            failedPaymentRepository.save(payment1);

            // Payment 2: Insufficient funds
            FailedPayment payment2 = createSampleFailedPayment(
                    workspace, "pay_8200_002", "cust_techsol",
                    new BigDecimal("8200.00"), "Insufficient funds",
                    "insufficient_funds", "UPI");
            payment2.setCustomerName("Tech Solutions Inc");
            payment2.setCustomerEmail("payments@techsol.com");
            payment2.setFailedAt(now.minusHours(1));
            payment2.setStatus(PaymentStatus.PENDING_RETRY);
            failedPaymentRepository.save(payment2);

            // Payment 3: Expired card
            FailedPayment payment3 = createSampleFailedPayment(
                    workspace, "pay_15750_003", "cust_global",
                    new BigDecimal("15750.00"), "Card expired",
                    "card_expired", "CARD");
            payment3.setCustomerName("Global Services LLC");
            payment3.setCustomerEmail("finance@globalservices.com");
            payment3.setFailedAt(now.minusHours(3));
            failedPaymentRepository.save(payment3);

            // Payment 4: Bank timeout
            FailedPayment payment4 = createSampleFailedPayment(
                    workspace, "pay_4500_004", "cust_startup",
                    new BigDecimal("4500.00"), "Bank timeout",
                    "gateway_timeout", "NET_BANKING");
            payment4.setCustomerName("StartupCo");
            payment4.setCustomerEmail("admin@startupco.com");
            payment4.setFailedAt(now.minusMinutes(45));
            failedPaymentRepository.save(payment4);

            // Payment 5: Payment disputed
            FailedPayment payment5 = createSampleFailedPayment(
                    workspace, "pay_25000_005", "cust_enterprise",
                    new BigDecimal("25000.00"), "Payment disputed",
                    "disputed", "CARD");
            payment5.setCustomerName("Enterprise Solutions");
            payment5.setCustomerEmail("payments@enterprise.com");
            payment5.setFailedAt(now.minusHours(6));
            payment5.setStatus(PaymentStatus.UNDER_REVIEW);
            failedPaymentRepository.save(payment5);

            // Create some recovered payments for metrics
            FailedPayment payment6 = createSampleFailedPayment(
                    workspace, "pay_3500_006", "cust_recovered1",
                    new BigDecimal("3500.00"), "Temporary decline",
                    "issuer_declined_temp", "UPI");
            payment6.setStatus(PaymentStatus.RECOVERED);
            payment6.setRetryCount(1);
            payment6.setRecoveredAt(now.minusHours(2));
            payment6.setLastRetryAt(now.minusHours(2));
            failedPaymentRepository.save(payment6);

            FailedPayment payment7 = createSampleFailedPayment(
                    workspace, "pay_7800_007", "cust_recovered2",
                    new BigDecimal("7800.00"), "Bank timeout",
                    "gateway_timeout", "CARD");
            payment7.setStatus(PaymentStatus.RECOVERED);
            payment7.setRetryCount(1);
            payment7.setRecoveredAt(now.minusHours(4));
            payment7.setLastRetryAt(now.minusHours(4));
            failedPaymentRepository.save(payment7);

            logger.info("Created {} sample failed payments", 7);

            // Create sample audit trail entries
            Map<String, Object> auditDetails = new HashMap<>();
            auditDetails.put("payment_amount", "12500.00");
            auditDetails.put("payment_method", "CARD");
            auditDetails.put("error_code", "issuer_declined_temp");

            AuditTrail audit1 = AuditTrail.builder()
                    .user(owner)
                    .workspace(workspace)
                    .actionType(AuditActionType.PAYMENT_FAILED)
                    .entityType("FailedPayment")
                    .entityId(payment1.getId())
                    .paymentIdentifier(payment1.getPaymentIdentifier())
                    .details(objectMapper.writeValueAsString(auditDetails))
                    .outcome("Payment failure recorded")
                    .timestamp(now.minusMinutes(12))
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
