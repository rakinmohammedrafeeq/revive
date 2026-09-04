package com.revive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FailedPaymentRequest {
    @NotBlank(message = "Payment identifier is required")
    private String paymentIdentifier;
    
    private String orderIdentifier;
    
    @NotBlank(message = "Customer ID is required")
    private String customerId;
    
    private String customerEmail;
    private String customerPhone;
    private String customerName;
    
    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;
    
    private String currency = "INR";
    
    @NotBlank(message = "Failure reason is required")
    private String failureReason;
    
    private String errorCode;
    private String paymentMethod;
    private String metadata;
}
