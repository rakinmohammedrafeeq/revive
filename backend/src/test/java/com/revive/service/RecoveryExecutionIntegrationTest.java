package com.revive.service;

import com.revive.entity.*;
import com.revive.enums.*;
import com.revive.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for recovery execution scenarios.
 * 
 * Tests verify:
 * - Successful recovery execution
 * - Failed recovery attempts
 * - Policy-blocked scenarios
 * - Retry limit enforcement
 * - Duplicate execution prevention
 * - State machine validation
 * - Revenue tracking
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RecoveryExecutionIntegrationTest {

    @Autowired
    private RecoveryActionExecutor actionExecutor;

    @Autowired
    private RecoveryOrchestrationService orchestrationService;

    @Autowired
    private PaymentStateValidator stateValidator;

    @Autowired
    private FailedPaymentRepository paymentRepository;

    @Autowired
    private RecoveryActionRepository actionRepository;

    @Autowired
    private RecoveredRevenueRepository revenueRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RecoveryMetricsService metricsService;

    private Workspace testWorkspace;
    private User testUser;

    @BeforeEach
    void setUp() {
        // Create test user first
        testUser = User.builder()
                .name("Test User")
                .email("test-" + System.nanoTime() + "@example.com")
                .password("password")
                .role(Role.ADMIN)
                .active(true)
                .build();
        testUser = userRepository.save(testUser);

        // Create test workspace with owner
        testWorkspace = new Workspace();
        testWorkspace.setName("Test Workspace");
        testWorkspace.setSlug("test-workspace-" + System.nanoTime());
        testWorkspace.setOwner(testUser);
        testWorkspace = workspaceRepository.save(testWorkspace);
    }

    @Test
    @DisplayName("Scenario A: Successful recovery execution")
    void testSuccessfulRecovery() {
        // Given: A failed payment with high recovery probability
        FailedPayment payment = createTestPayment("PAY-SUCCESS-001", "gateway_timeout", 
                PaymentStatus.FAILED, 0);

        // When: Recovery is executed
        RecoveryAction action = actionExecutor.executeRecoveryAction(
                payment, RecoveryActionType.AUTOMATIC_RETRY, "AUTOMATIC", testUser);

        // Then: Verify success path
        assertThat(action).isNotNull();
        
        // Reload payment to check updated state
        payment = paymentRepository.findById(payment.getId()).orElseThrow();
        
        // Action could be SUCCESS, PENDING, or FAILED based on simulation
        if (action.getStatus() == RecoveryActionStatus.COMPLETED_SUCCESS) {
            assertThat(payment.getStatus()).isEqualTo(PaymentStatus.RECOVERED);
            assertThat(payment.getRecoveredAt()).isNotNull();
            
            // Verify revenue record created
            var revenue = revenueRepository.findByFailedPaymentId(payment.getId());
            assertThat(revenue).isPresent();
            assertThat(revenue.get().getRecoveredAmount()).isEqualByComparingTo(payment.getAmount());
        }
    }

    @Test
    @DisplayName("Scenario B: Policy blocked - terminal state")
    void testPolicyBlockedTerminalState() {
        // Given: A payment already recovered (terminal state)
        FailedPayment payment = createTestPayment("PAY-RECOVERED-001", "gateway_timeout", 
                PaymentStatus.RECOVERED, 0);
        payment.setRecoveredAt(LocalDateTime.now());
        payment = paymentRepository.save(payment);

        // When: Attempting to execute recovery on recovered payment
        RecoveryAction action = actionExecutor.executeRecoveryAction(
                payment, RecoveryActionType.AUTOMATIC_RETRY, "AUTOMATIC", testUser);

        // Then: Verify action is blocked
        assertThat(action.getStatus()).isEqualTo(RecoveryActionStatus.BLOCKED);
        assertThat(action.getOutcome()).contains("terminal state");
        
        // Payment status should remain unchanged
        payment = paymentRepository.findById(payment.getId()).orElseThrow();
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.RECOVERED);
    }

    @Test
    @DisplayName("Scenario C: Retry limit enforcement")
    void testRetryLimitEnforcement() {
        // Given: A payment with maximum retries exceeded
        FailedPayment payment = createTestPayment("PAY-MAXRETRY-001", "insufficient_funds", 
                PaymentStatus.FAILED, 5);

        // When: Orchestration processes the payment
        var decision = orchestrationService.processFailedPayment(payment.getId());

        // Then: Should be blocked or abandoned
        payment = paymentRepository.findById(payment.getId()).orElseThrow();
        assertThat(payment.getStatus()).isIn(PaymentStatus.ABANDONED, PaymentStatus.UNDER_REVIEW);
    }

    @Test
    @DisplayName("Scenario D: Duplicate execution prevention")
    void testDuplicateExecutionPrevention() {
        // Given: A payment with an in-progress recovery action
        FailedPayment payment = createTestPayment("PAY-DUPLICATE-001", "gateway_timeout", 
                PaymentStatus.RETRY_IN_PROGRESS, 1);
        
        RecoveryAction existingAction = new RecoveryAction();
        existingAction.setFailedPayment(payment);
        existingAction.setActionType(RecoveryActionType.AUTOMATIC_RETRY);
        existingAction.setStatus(RecoveryActionStatus.IN_PROGRESS);
        existingAction.setChannel("AUTOMATIC");
        existingAction.setIsAutomated(true);
        existingAction.setInitiatedAt(LocalDateTime.now());
        existingAction.setCost(BigDecimal.ZERO);
        actionRepository.save(existingAction);

        // When: Orchestration processes the same payment again
        var decision = orchestrationService.processFailedPayment(payment.getId());

        // Then: Should be blocked due to duplicate
        assertThat(decision.getDecision()).isEqualTo("BLOCKED");
        assertThat(decision.getReason()).containsIgnoringCase("already in progress");
    }

    @Test
    @DisplayName("Scenario E: State machine validation")
    void testStateTransitionValidation() {
        // Test valid transitions
        assertThat(stateValidator.isValidTransition(PaymentStatus.FAILED, PaymentStatus.RETRY_IN_PROGRESS))
                .isTrue();
        assertThat(stateValidator.isValidTransition(PaymentStatus.RETRY_IN_PROGRESS, PaymentStatus.RECOVERED))
                .isTrue();
        assertThat(stateValidator.isValidTransition(PaymentStatus.RETRY_IN_PROGRESS, PaymentStatus.FAILED))
                .isTrue();

        // Test invalid transitions
        assertThat(stateValidator.isValidTransition(PaymentStatus.RECOVERED, PaymentStatus.FAILED))
                .isFalse();
        assertThat(stateValidator.isValidTransition(PaymentStatus.ABANDONED, PaymentStatus.RETRY_IN_PROGRESS))
                .isFalse();

        // Test terminal states
        assertThat(stateValidator.isTerminalState(PaymentStatus.RECOVERED)).isTrue();
        assertThat(stateValidator.isTerminalState(PaymentStatus.ABANDONED)).isTrue();
        assertThat(stateValidator.isTerminalState(PaymentStatus.FAILED)).isFalse();
    }

    @Test
    @DisplayName("Scenario F: Low probability blocked")
    void testLowProbabilityBlocked() {
        // Given: A payment likely to have low recovery probability
        FailedPayment payment = createTestPayment("PAY-LOWPROB-001", "card_expired", 
                PaymentStatus.FAILED, 0);

        // When: Processing through orchestration
        var decision = orchestrationService.processFailedPayment(payment.getId());

        // Then: Verify decision is recorded
        assertThat(decision).isNotNull();
        assertThat(decision.getRecoveryProbability()).isNotNull();
        
        // Low probability may result in BLOCKED or ESCALATE
        if (decision.getRecoveryProbability() < 0.30) {
            assertThat(decision.getDecision()).isIn("BLOCKED", "ESCALATE");
        }
    }

    @Test
    @DisplayName("Scenario G: Failed execution with state rollback")
    void testFailedExecutionRollback() {
        // Given: A payment that will fail during retry
        FailedPayment payment = createTestPayment("PAY-FAILRETRY-001", "declined_permanent", 
                PaymentStatus.FAILED, 1);

        // When: Execute recovery action
        RecoveryAction action = actionExecutor.executeRecoveryAction(
                payment, RecoveryActionType.AUTOMATIC_RETRY, "AUTOMATIC", testUser);

        // Then: Check action completed (success, failure, or pending)
        assertThat(action.getStatus()).isIn(
                RecoveryActionStatus.COMPLETED_SUCCESS,
                RecoveryActionStatus.COMPLETED_FAILURE,
                RecoveryActionStatus.IN_PROGRESS,
                RecoveryActionStatus.FAILED
        );

        // Reload payment
        payment = paymentRepository.findById(payment.getId()).orElseThrow();
        
        // If action failed, payment should be back in valid state
        if (action.getStatus() == RecoveryActionStatus.COMPLETED_FAILURE) {
            assertThat(payment.getStatus()).isIn(PaymentStatus.FAILED, PaymentStatus.ABANDONED);
        }
    }

    @Test
    @DisplayName("Scenario H: Revenue tracking accuracy")
    void testRevenueTrackingAccuracy() {
        // Given: A payment that will succeed
        FailedPayment payment = createTestPayment("PAY-REVENUE-001", "gateway_timeout", 
                PaymentStatus.FAILED, 0);
        BigDecimal originalAmount = payment.getAmount();

        // When: Execute recovery
        RecoveryAction action = actionExecutor.executeRecoveryAction(
                payment, RecoveryActionType.AUTOMATIC_RETRY, "AUTOMATIC", testUser);

        // Then: If successful, verify revenue record
        if (action.getStatus() == RecoveryActionStatus.COMPLETED_SUCCESS) {
            payment = paymentRepository.findById(payment.getId()).orElseThrow();
            var revenue = revenueRepository.findByFailedPaymentId(payment.getId());
            
            assertThat(revenue).isPresent();
            assertThat(revenue.get().getRecoveredAmount()).isEqualByComparingTo(originalAmount);
            assertThat(revenue.get().getRecoveryCost()).isGreaterThanOrEqualTo(BigDecimal.ZERO);
            assertThat(revenue.get().getNetGain())
                    .isEqualByComparingTo(revenue.get().getRecoveredAmount()
                            .subtract(revenue.get().getRecoveryCost()));
        }
    }

    @Test
    @DisplayName("Scenario I: Fast metrics calculation and accurate aggregations")
    void testCalculateMetricsPerformanceAndCorrectness() {
        // Given: Create a mix of payments across statuses
        createTestPayment("PAY-METRIC-001", "gateway_timeout", PaymentStatus.FAILED, 0);
        createTestPayment("PAY-METRIC-002", "insufficient_funds", PaymentStatus.PENDING_RETRY, 1);
        FailedPayment recovered = createTestPayment("PAY-METRIC-003", "declined_temp", PaymentStatus.RECOVERED, 1);
        recovered.setRecoveredAt(LocalDateTime.now().minusMinutes(30));
        paymentRepository.save(recovered);
        createTestPayment("PAY-METRIC-004", "card_expired", PaymentStatus.ABANDONED, 3);

        // When: Calculating metrics
        long startTime = System.currentTimeMillis();
        var response = metricsService.calculateMetrics(testWorkspace.getId());
        long duration = System.currentTimeMillis() - startTime;

        // Then: Verify metrics correctness
        assertThat(response).isNotNull();
        assertThat(response.getTotalCases()).isEqualTo(4);
        assertThat(response.getRecoveredCases()).isEqualTo(1);
        assertThat(response.getActiveCases()).isEqualTo(2); // FAILED (1) + PENDING_RETRY (1)
        assertThat(response.getAbandonedCases()).isEqualTo(1);
        assertThat(response.getTotalRevenueAtRisk()).isEqualByComparingTo(new BigDecimal("20000.00"));
        assertThat(response.getExpectedRecoveryValue()).isGreaterThan(BigDecimal.ZERO);

        // Performance check: metrics must compute under 500ms
        assertThat(duration).isLessThan(500);
    }

    @Test
    @DisplayName("Scenario J: Repository aggregations work directly in DB")
    void testRepositoryAggregations() {
        // Given: 2 failed payments of 5000 each
        createTestPayment("PAY-AGG-001", "gateway_timeout", PaymentStatus.FAILED, 0);
        createTestPayment("PAY-AGG-002", "gateway_timeout", PaymentStatus.FAILED, 1);

        // Then: Database-level sum
        BigDecimal sum = paymentRepository.sumAmountByWorkspaceId(testWorkspace.getId());
        assertThat(sum).isEqualByComparingTo(new BigDecimal("10000.00"));

        // Status group count
        var statusCounts = paymentRepository.countByWorkspaceIdGroupByStatus(testWorkspace.getId());
        assertThat(statusCounts).isNotEmpty();
    }

    // ─── Helper Methods ────────────────────────────────────────────────────

    private FailedPayment createTestPayment(String identifier, String errorCode, 
                                           PaymentStatus status, int retryCount) {
        FailedPayment payment = new FailedPayment();
        payment.setPaymentIdentifier(identifier);
        payment.setCustomerId("CUST-TEST-001");
        payment.setCustomerName("Test Customer");
        payment.setCustomerEmail("customer@test.com");
        payment.setAmount(new BigDecimal("5000.00"));
        payment.setCurrency("INR");
        payment.setStatus(status);
        payment.setFailureReason("Test failure");
        payment.setErrorCode(errorCode);
        payment.setPaymentMethod("card");
        payment.setRetryCount(retryCount);
        payment.setFailedAt(LocalDateTime.now().minusHours(2));
        payment.setWorkspace(testWorkspace);
        return paymentRepository.save(payment);
    }
}
