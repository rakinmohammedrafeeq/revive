package com.ledgera.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryTotal {
    private String category;
    private BigDecimal total;
    private BigDecimal income;
    private BigDecimal expense;
}
