package com.revive.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FailedPaymentResponse {
    private Long id;
    private String paymentIdentifier;
    private String orderIdentifier;
    private String customerId;
    private String customerEmail;
    private String customerPhone;
    private String customerName;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String failureReason;
    private String errorCode;
    private String paymentMethod;
    private Integer retryCount;
    private LocalDateTime failedAt;
    private LocalDateTime lastRetryAt;
    private LocalDateTime recoveredAt;
    private String metadata;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Recovery-specific fields
    private Double recoveryProbability;
    private String aiDiagnosis;
    private String recommendedAction;
    private String policyStatus;
}
