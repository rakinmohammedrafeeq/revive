package com.revive.repository;

import com.revive.entity.FinancialRecord;
import com.revive.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface FinancialRecordRepository extends JpaRepository<FinancialRecord, Long>,
        JpaSpecificationExecutor<FinancialRecord> {

    @EntityGraph(attributePaths = "user")
    Page<FinancialRecord> findAll(Specification<FinancialRecord> spec, Pageable pageable);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM FinancialRecord r WHERE r.type = :type")
    BigDecimal sumByType(@Param("type") TransactionType type);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM FinancialRecord r WHERE r.type = :type AND r.user.id = :userId")
    BigDecimal sumByTypeAndUser(@Param("type") TransactionType type, @Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM FinancialRecord r WHERE r.type = :type AND r.workspace.id = :workspaceId")
    BigDecimal sumByTypeAndWorkspace(@Param("type") TransactionType type, @Param("workspaceId") Long workspaceId);

    @Query("SELECT r.category, SUM(r.amount) FROM FinancialRecord r GROUP BY r.category ORDER BY SUM(r.amount) DESC")
    List<Object[]> getCategoryTotals();

    @Query("SELECT r.category, SUM(r.amount) FROM FinancialRecord r WHERE r.user.id = :userId GROUP BY r.category ORDER BY SUM(r.amount) DESC")
    List<Object[]> getCategoryTotalsByUser(@Param("userId") Long userId);

    @Query("SELECT r.category, r.type, SUM(r.amount) FROM FinancialRecord r GROUP BY r.category, r.type ORDER BY r.category")
    List<Object[]> getCategoryTotalsByType();

    @Query("SELECT r.category, r.type, SUM(r.amount) FROM FinancialRecord r WHERE r.user.id = :userId GROUP BY r.category, r.type ORDER BY r.category")
    List<Object[]> getCategoryTotalsByTypeAndUser(@Param("userId") Long userId);

    @Query("SELECT r.category, r.type, SUM(r.amount) FROM FinancialRecord r WHERE r.workspace.id = :workspaceId GROUP BY r.category, r.type ORDER BY r.category")
    List<Object[]> getCategoryTotalsByTypeAndWorkspace(@Param("workspaceId") Long workspaceId);

    @EntityGraph(attributePaths = "user")
    List<FinancialRecord> findTop10ByOrderByDateDescIdDesc();

    @EntityGraph(attributePaths = "user")
    List<FinancialRecord> findTop10ByUserIdOrderByDateDescIdDesc(Long userId);

    @EntityGraph(attributePaths = "user")
    List<FinancialRecord> findTop10ByWorkspaceIdOrderByDateDescIdDesc(Long workspaceId);

    @Query("SELECT EXTRACT(YEAR FROM r.date), EXTRACT(MONTH FROM r.date), r.type, SUM(r.amount) " +
           "FROM FinancialRecord r " +
           "GROUP BY EXTRACT(YEAR FROM r.date), EXTRACT(MONTH FROM r.date), r.type " +
           "ORDER BY EXTRACT(YEAR FROM r.date), EXTRACT(MONTH FROM r.date)")
    List<Object[]> getMonthlyTrends();

    @Query("SELECT EXTRACT(YEAR FROM r.date), EXTRACT(MONTH FROM r.date), r.type, SUM(r.amount) " +
           "FROM FinancialRecord r " +
           "WHERE r.user.id = :userId " +
           "GROUP BY EXTRACT(YEAR FROM r.date), EXTRACT(MONTH FROM r.date), r.type " +
           "ORDER BY EXTRACT(YEAR FROM r.date), EXTRACT(MONTH FROM r.date)")
    List<Object[]> getMonthlyTrendsByUser(@Param("userId") Long userId);

    @Query("SELECT EXTRACT(YEAR FROM r.date), EXTRACT(MONTH FROM r.date), r.type, SUM(r.amount) " +
           "FROM FinancialRecord r " +
           "WHERE r.workspace.id = :workspaceId " +
           "GROUP BY EXTRACT(YEAR FROM r.date), EXTRACT(MONTH FROM r.date), r.type " +
           "ORDER BY EXTRACT(YEAR FROM r.date), EXTRACT(MONTH FROM r.date)")
    List<Object[]> getMonthlyTrendsByWorkspace(@Param("workspaceId") Long workspaceId);

    // For AI insights generation
    @EntityGraph(attributePaths = "user")
    List<FinancialRecord> findTop50ByWorkspaceIdOrderByDateDesc(Long workspaceId);

    // For RAG vector search indexing
    List<FinancialRecord> findByWorkspaceIdOrderByDateDesc(Long workspaceId);
    
    List<FinancialRecord> findByUserIdOrderByDateDesc(Long userId);
}
