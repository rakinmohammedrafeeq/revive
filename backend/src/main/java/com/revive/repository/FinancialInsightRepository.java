package com.revive.repository;

import com.revive.entity.FinancialInsight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FinancialInsightRepository extends JpaRepository<FinancialInsight, Long> {

    List<FinancialInsight> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);

    List<FinancialInsight> findByUserIdAndWorkspaceIdAndStatusOrderByCreatedAtDesc(
            Long userId, Long workspaceId, String status);

    List<FinancialInsight> findByUserIdAndInsightTypeAndStatus(
            Long userId, String insightType, String status);

    void deleteByUserIdAndExpiresAtBefore(Long userId, LocalDateTime now);
}
