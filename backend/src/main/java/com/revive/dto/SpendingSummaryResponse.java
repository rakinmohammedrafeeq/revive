package com.revive.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Aggregated spending summary returned by the agent's get_spending_summary tool.
 * Replaces the planned get_budget_status tool — no budget table exists in the schema.
 * Budget tracking is deferred as a separate future feature.
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SpendingSummaryResponse {
    private BigDecimal totalIncome;
    private BigDecimal totalExpenses;
    private BigDecimal netBalance;
    private List<CategoryTotal> categoryBreakdown;   // Expense categories, sorted by amount desc
    private LocalDate startDate;                      // null means "all time"
    private LocalDate endDate;                        // null means "all time"
    private int recordCount;
}
