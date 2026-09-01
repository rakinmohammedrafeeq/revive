package com.ledgera.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyTrend {
    private Integer year;
    private Integer month;
    private String monthName;
    private BigDecimal income;
    private BigDecimal expense;
}
