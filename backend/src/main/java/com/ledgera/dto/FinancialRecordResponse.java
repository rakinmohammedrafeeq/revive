package com.ledgera.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialRecordResponse {
    private Long id;
    private BigDecimal amount;
    private String type;
    private String category;
    private LocalDate date;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long userId;
    private String userName;
    private String userEmail;
}
