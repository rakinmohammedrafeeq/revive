package com.revive.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Stores batch evaluation results for historical tracking and comparison.
 * Auto-deleted after 90 days to prevent storage bloat.
 */
@Entity
@Table(name = "batch_evaluation_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchEvaluationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    @JsonIgnore
    private Workspace workspace;

    @Column(name = "evaluated_at", nullable = false)
    private LocalDateTime evaluatedAt;

    @Column(name = "total_payments_evaluated", nullable = false)
    private Integer totalPaymentsEvaluated;

    @Column(name = "auto_approved", nullable = false)
    private Integer autoApproved;

    @Column(name = "requires_review", nullable = false)
    private Integer requiresReview;

    @Column(name = "blocked", nullable = false)
    private Integer blocked;

    @Column(name = "ml_accuracy")
    private Double mlAccuracy;

    @Column(name = "ml_precision")
    private Double mlPrecision;

    @Column(name = "ml_recall")
    private Double mlRecall;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "outcome_breakdown", columnDefinition = "jsonb")
    private Map<String, Integer> outcomeBreakdown;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "blocked_reasons", columnDefinition = "jsonb")
    private Map<String, Integer> blockedReasons;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "detailed_metrics", columnDefinition = "jsonb")
    private Map<String, Object> detailedMetrics;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
