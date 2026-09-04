package com.revive.controller;

import com.revive.dto.FailedPaymentRequest;
import com.revive.dto.FailedPaymentResponse;
import com.revive.dto.RecoveryDecision;
import com.revive.entity.FailedPayment;
import com.revive.entity.User;
import com.revive.entity.Workspace;
import com.revive.enums.PaymentStatus;
import com.revive.repository.FailedPaymentRepository;
import com.revive.service.CurrentUserService;
import com.revive.service.RecoveryOrchestrationService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recovery/payments")
public class FailedPaymentController {

    private static final Logger logger = LoggerFactory.getLogger(FailedPaymentController.class);

    private final FailedPaymentRepository failedPaymentRepository;
    private final CurrentUserService currentUserService;
    private final RecoveryOrchestrationService orchestrationService;

    public FailedPaymentController(
            FailedPaymentRepository failedPaymentRepository,
            CurrentUserService currentUserService,
            RecoveryOrchestrationService orchestrationService) {
        this.failedPaymentRepository = failedPaymentRepository;
        this.currentUserService = currentUserService;
        this.orchestrationService = orchestrationService;
    }

    /**
     * Report a failed payment
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<FailedPaymentResponse> reportFailedPayment(
            @Valid @RequestBody FailedPaymentRequest request) {
        
        User currentUser = currentUserService.requireCurrentUser();
        Workspace workspace = currentUser.getCurrentWorkspace();
        
        if (workspace == null) {
            return ResponseEntity.badRequest().build();
        }

        logger.info("Reporting failed payment {} for workspace {}", 
                request.getPaymentIdentifier(), workspace.getId());

        // Check for duplicate
        if (failedPaymentRepository.findByPaymentIdentifier(request.getPaymentIdentifier()).isPresent()) {
            logger.warn("Payment {} already exists", request.getPaymentIdentifier());
            return ResponseEntity.badRequest().build();
        }

        FailedPayment payment = FailedPayment.builder()
                .workspace(workspace)
                .paymentIdentifier(request.getPaymentIdentifier())
                .orderIdentifier(request.getOrderIdentifier())
                .customerId(request.getCustomerId())
                .customerEmail(request.getCustomerEmail())
                .customerPhone(request.getCustomerPhone())
                .customerName(request.getCustomerName())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .status(PaymentStatus.FAILED)
                .failureReason(request.getFailureReason())
                .errorCode(request.getErrorCode())
                .paymentMethod(request.getPaymentMethod())
                .retryCount(0)
                .failedAt(LocalDateTime.now())
                .metadata(request.getMetadata())
                .build();

        payment = failedPaymentRepository.save(payment);
        
        logger.info("Failed payment {} saved with ID {}", payment.getPaymentIdentifier(), payment.getId());

        return ResponseEntity.ok(toResponse(payment));
    }

    /**
     * List all failed payments for current workspace
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    public ResponseEntity<List<FailedPaymentResponse>> listFailedPayments() {
        User currentUser = currentUserService.requireCurrentUser();
        Workspace workspace = currentUser.getCurrentWorkspace();
        
        if (workspace == null) {
            return ResponseEntity.badRequest().build();
        }

        List<FailedPayment> payments = failedPaymentRepository
                .findByWorkspaceIdOrderByFailedAtDesc(workspace.getId());

        return ResponseEntity.ok(
                payments.stream()
                        .map(this::toResponse)
                        .collect(Collectors.toList())
        );
    }

    /**
     * Get specific failed payment
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    public ResponseEntity<FailedPaymentResponse> getFailedPayment(@PathVariable Long id) {
        User currentUser = currentUserService.requireCurrentUser();
        Workspace workspace = currentUser.getCurrentWorkspace();
        
        if (workspace == null) {
            return ResponseEntity.badRequest().build();
        }

        FailedPayment payment = failedPaymentRepository.findById(id)
                .orElse(null);

        if (payment == null || !payment.getWorkspace().getId().equals(workspace.getId())) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(toResponse(payment));
    }

    /**
     * Diagnose a failed payment (triggers recovery orchestration)
     */
    @PostMapping("/{id}/diagnose")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<RecoveryDecision> diagnosePayment(@PathVariable Long id) {
        User currentUser = currentUserService.requireCurrentUser();
        Workspace workspace = currentUser.getCurrentWorkspace();
        
        if (workspace == null) {
            return ResponseEntity.badRequest().build();
        }

        FailedPayment payment = failedPaymentRepository.findById(id)
                .orElse(null);

        if (payment == null || !payment.getWorkspace().getId().equals(workspace.getId())) {
            return ResponseEntity.notFound().build();
        }

        logger.info("Diagnosing payment {} (ID: {})", payment.getPaymentIdentifier(), id);

        RecoveryDecision decision = orchestrationService.processFailedPayment(id);

        return ResponseEntity.ok(decision);
    }

    /**
     * Convert entity to response DTO
     */
    private FailedPaymentResponse toResponse(FailedPayment payment) {
        return FailedPaymentResponse.builder()
                .id(payment.getId())
                .paymentIdentifier(payment.getPaymentIdentifier())
                .orderIdentifier(payment.getOrderIdentifier())
                .customerId(payment.getCustomerId())
                .customerEmail(payment.getCustomerEmail())
                .customerPhone(payment.getCustomerPhone())
                .customerName(payment.getCustomerName())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus().name())
                .failureReason(payment.getFailureReason())
                .errorCode(payment.getErrorCode())
                .paymentMethod(payment.getPaymentMethod())
                .retryCount(payment.getRetryCount())
                .failedAt(payment.getFailedAt())
                .lastRetryAt(payment.getLastRetryAt())
                .recoveredAt(payment.getRecoveredAt())
                .metadata(payment.getMetadata())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
