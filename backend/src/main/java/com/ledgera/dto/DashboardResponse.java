package com.ledgera.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {
    private BigDecimal totalIncome;
    private BigDecimal totalExpenses;
    private BigDecimal netBalance;
    private List<CategoryTotal> categoryTotals;
    private List<MonthlyTrend> monthlyTrends;
    private List<FinancialRecordResponse> recentTransactions;
}
