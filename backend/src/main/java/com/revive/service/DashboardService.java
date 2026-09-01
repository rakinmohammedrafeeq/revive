package com.revive.service;

import com.revive.dto.*;
import com.revive.dto.SpendingSummaryResponse;
import com.revive.entity.FinancialRecord;
import com.revive.entity.User;
import com.revive.entity.Workspace;
import com.revive.enums.Role;
import com.revive.enums.TransactionType;
import com.revive.enums.WorkspacePermission;
import com.revive.exception.ForbiddenException;
import com.revive.repository.FinancialRecordRepository;
import com.revive.repository.FinancialRecordSpecification;
import com.revive.repository.UserRepository;
import com.revive.repository.WorkspaceMemberRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.time.LocalDate;

import java.math.BigDecimal;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final FinancialRecordRepository recordRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final CurrentUserService currentUserService;

    public DashboardService(FinancialRecordRepository recordRepository, 
                           UserRepository userRepository,
                           WorkspaceMemberRepository workspaceMemberRepository,
                           CurrentUserService currentUserService) {
        this.recordRepository = recordRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
        this.currentUserService = currentUserService;
    }

    public DashboardResponse getDashboardData() {
        User currentUser = currentUserService.requireCurrentUser();
        
        // Get current workspace
        Workspace workspace = currentUser.getCurrentWorkspace();
        if (workspace == null) {
            throw new ForbiddenException("No workspace selected");
        }
        
        // Check workspace access
        workspaceMemberRepository
                .findPermissionByWorkspaceAndUser(workspace.getId(), currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("You don't have access to this workspace"));
        
        // All data is scoped to current workspace
        Long workspaceId = workspace.getId();

        BigDecimal totalIncome = recordRepository.sumByTypeAndWorkspace(TransactionType.INCOME, workspaceId);
        BigDecimal totalExpenses = recordRepository.sumByTypeAndWorkspace(TransactionType.EXPENSE, workspaceId);
        
        if (totalIncome == null) {
            totalIncome = BigDecimal.ZERO;
        }
        if (totalExpenses == null) {
            totalExpenses = BigDecimal.ZERO;
        }
        BigDecimal netBalance = totalIncome.subtract(totalExpenses);

        List<CategoryTotal> categoryTotals = buildCategoryTotals(workspaceId);
        List<MonthlyTrend> monthlyTrends = buildMonthlyTrends(workspaceId);
        List<FinancialRecordResponse> recentTransactions = buildRecentTransactions(workspaceId);

        return DashboardResponse.builder()
                .totalIncome(totalIncome)
                .totalExpenses(totalExpenses)
                .netBalance(netBalance)
                .categoryTotals(categoryTotals)
                .monthlyTrends(monthlyTrends)
                .recentTransactions(recentTransactions)
                .build();
    }

    private List<CategoryTotal> buildCategoryTotals(Long workspaceId) {
        List<Object[]> results = recordRepository.getCategoryTotalsByTypeAndWorkspace(workspaceId);
        Map<String, CategoryTotal> categoryMap = new LinkedHashMap<>();

        for (Object[] row : results) {
            if (row == null || row.length < 3) {
                continue;
            }
            String category = row[0] != null ? row[0].toString() : "Uncategorized";
            TransactionType type = row[1] instanceof TransactionType
                    ? (TransactionType) row[1]
                    : null;
            BigDecimal amount = row[2] instanceof BigDecimal
                    ? (BigDecimal) row[2]
                    : BigDecimal.ZERO;
            if (type == null) {
                continue;
            }

            CategoryTotal ct = categoryMap.computeIfAbsent(category,
                    k -> CategoryTotal.builder()
                            .category(k)
                            .total(BigDecimal.ZERO)
                            .income(BigDecimal.ZERO)
                            .expense(BigDecimal.ZERO)
                            .build());

            if (type == TransactionType.INCOME) {
                ct.setIncome(amount);
            } else {
                ct.setExpense(amount);
            }
        }

        // Filter to only include expense categories and set total = expense for the chart
        // The "Top categories" chart is meant to show spending by category
        return categoryMap.values().stream()
                .filter(ct -> ct.getExpense().compareTo(BigDecimal.ZERO) > 0)
                .peek(ct -> ct.setTotal(ct.getExpense()))
                .collect(Collectors.toList());
    }

    private List<MonthlyTrend> buildMonthlyTrends(Long workspaceId) {
        List<Object[]> results = recordRepository.getMonthlyTrendsByWorkspace(workspaceId);
        Map<String, MonthlyTrend> trendMap = new LinkedHashMap<>();

        for (Object[] row : results) {
            if (row == null || row.length < 4) {
                continue;
            }
            int year = row[0] instanceof Number ? ((Number) row[0]).intValue() : 0;
            int month = row[1] instanceof Number ? ((Number) row[1]).intValue() : 0;
            TransactionType type = row[2] instanceof TransactionType
                    ? (TransactionType) row[2]
                    : null;
            BigDecimal amount = row[3] instanceof BigDecimal
                    ? (BigDecimal) row[3]
                    : BigDecimal.ZERO;
            if (type == null || year == 0 || month == 0) {
                continue;
            }

            String key = year + "-" + month;
            String monthName = month >= 1 && month <= 12
                    ? Month.of(month).getDisplayName(TextStyle.SHORT, Locale.ENGLISH)
                    : "N/A";
            MonthlyTrend trend = trendMap.computeIfAbsent(key,
                    k -> MonthlyTrend.builder()
                            .year(year)
                            .month(month)
                            .monthName(monthName)
                            .income(BigDecimal.ZERO)
                            .expense(BigDecimal.ZERO)
                            .build());

            if (type == TransactionType.INCOME) {
                trend.setIncome(amount);
            } else {
                trend.setExpense(amount);
            }
        }

        return new ArrayList<>(trendMap.values());
    }

    // ── Agent explicit-workspace read methods ─────────────────────────────────
    // getDashboardData() is unchanged — these are purely additive for the agent tools.

    /**
     * Returns income/expense totals and category breakdown for a specific workspace,
     * optionally filtered to a date range. Backing the agent's get_spending_summary tool.
     *
     * <p>Uses recordRepository.findAll(Specification) for date-aware aggregation,
     * rather than the workspace-total repo methods which have no date params.
     */
    public SpendingSummaryResponse getSpendingSummary(
            Long workspaceId, LocalDate startDate, LocalDate endDate) {

        Specification<FinancialRecord> spec =
                FinancialRecordSpecification.withFilters(startDate, endDate, null, null, workspaceId);

        java.util.List<FinancialRecord> records = recordRepository.findAll(spec);

        java.math.BigDecimal totalIncome = records.stream()
                .filter(r -> r.getType() == TransactionType.INCOME)
                .map(FinancialRecord::getAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        java.math.BigDecimal totalExpenses = records.stream()
                .filter(r -> r.getType() == TransactionType.EXPENSE)
                .map(FinancialRecord::getAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        // Expense breakdown by category, sorted desc
        java.util.Map<String, java.math.BigDecimal> expenseByCategory = records.stream()
                .filter(r -> r.getType() == TransactionType.EXPENSE)
                .collect(java.util.stream.Collectors.groupingBy(
                        FinancialRecord::getCategory,
                        java.util.stream.Collectors.reducing(
                                java.math.BigDecimal.ZERO,
                                FinancialRecord::getAmount,
                                java.math.BigDecimal::add)));

        java.util.List<CategoryTotal> breakdown = expenseByCategory.entrySet().stream()
                .map(e -> CategoryTotal.builder()
                        .category(e.getKey())
                        .expense(e.getValue())
                        .income(java.math.BigDecimal.ZERO)
                        .total(e.getValue())
                        .build())
                .sorted(java.util.Comparator.comparing(CategoryTotal::getExpense).reversed())
                .collect(java.util.stream.Collectors.toList());

        return SpendingSummaryResponse.builder()
                .totalIncome(totalIncome)
                .totalExpenses(totalExpenses)
                .netBalance(totalIncome.subtract(totalExpenses))
                .categoryBreakdown(breakdown)
                .startDate(startDate)
                .endDate(endDate)
                .recordCount(records.size())
                .build();
    }

    /**
     * Public wrapper that exposes the private buildMonthlyTrends helper for the agent.
     * Backing the get_monthly_trends tool. Zero logic change — pure visibility promotion.
     */
    public java.util.List<MonthlyTrend> getMonthlyTrends(Long workspaceId) {
        return buildMonthlyTrends(workspaceId);
    }

    private List<FinancialRecordResponse> buildRecentTransactions(Long workspaceId) {
        List<FinancialRecord> records = recordRepository.findTop10ByWorkspaceIdOrderByDateDescIdDesc(workspaceId);
        return records.stream().map(record -> FinancialRecordResponse.builder()
                .id(record.getId())
                .amount(record.getAmount())
                .type(record.getType().name())
                .category(record.getCategory())
                .date(record.getDate())
                .description(record.getDescription())
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .userId(record.getUser() != null ? record.getUser().getId() : null)
                .userName(record.getUser() != null ? record.getUser().getName() : null)
                .userEmail(record.getUser() != null ? record.getUser().getEmail() : null)
                .build()).collect(Collectors.toList());
    }
}
