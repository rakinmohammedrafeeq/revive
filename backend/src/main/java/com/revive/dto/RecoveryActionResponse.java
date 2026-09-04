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
public class RecoveryActionResponse {
    private Long id;
    private Long failedPaymentId;
    private String actionType;
    private String channel;
    private String status;
    private Boolean isAutomated;
    private Long initiatedBy;
    private String outcome;
    private BigDecimal cost;
    private LocalDateTime initiatedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
