package com.revive.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Aggregated ML model performance metrics over time.
 * Tracks accuracy, precision, recall, F1, ROC-AUC, and business impact.
 */
@Entity
@Table(name = "ml_model_metrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MlModelMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Workspace these metrics belong to
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    @JsonIgnore
    private Workspace workspace;

    /**
     * Model version
     */
    @Column(name = "model_version", nullable = false, length = 50)
    private String modelVersion;

    /**
     * Model name (e.g., "Random Forest")
     */
    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    /**
     * Performance measurement period start
     */
    @Column(name = "period_start", nullable = false)
    private LocalDateTime periodStart;

    /**
     * Performance measurement period end
     */
    @Column(name = "period_end", nullable = false)
    private LocalDateTime periodEnd;

    // ── Prediction Counts ──────────────────────────────────────────────

    @Column(name = "total_predictions", nullable = false)
    @Builder.Default
    private Integer totalPredictions = 0;

    @Column(name = "predictions_with_outcomes", nullable = false)
    @Builder.Default
    private Integer predictionsWithOutcomes = 0;

    // ── Accuracy Metrics ───────────────────────────────────────────────

    /**
     * Accuracy: (TP + TN) / Total
     */
    @Column(name = "accuracy", precision = 5, scale = 4)
    private BigDecimal accuracy;

    /**
     * Precision: TP / (TP + FP)
     */
    @Column(name = "precision_score", precision = 5, scale = 4)
    private BigDecimal precisionScore;

    /**
     * Recall: TP / (TP + FN)
     */
    @Column(name = "recall_score", precision = 5, scale = 4)
    private BigDecimal recallScore;

    /**
     * F1 Score: 2 * (Precision * Recall) / (Precision + Recall)
     */
    @Column(name = "f1_score", precision = 5, scale = 4)
    private BigDecimal f1Score;

    /**
     * ROC-AUC: Area under ROC curve
     */
    @Column(name = "roc_auc", precision = 5, scale = 4)
    private BigDecimal rocAuc;

    // ── Confusion Matrix ───────────────────────────────────────────────

    @Column(name = "true_positives")
    @Builder.Default
    private Integer truePositives = 0;

    @Column(name = "true_negatives")
    @Builder.Default
    private Integer trueNegatives = 0;

    @Column(name = "false_positives")
    @Builder.Default
    private Integer falsePositives = 0;

    @Column(name = "false_negatives")
    @Builder.Default
    private Integer falseNegatives = 0;

    // ── Business Metrics ───────────────────────────────────────────────

    /**
     * Average prediction error across all predictions
     */
    @Column(name = "avg_prediction_error", precision = 5, scale = 4)
    private BigDecimal avgPredictionError;

    /**
     * Expected recovery value: SUM(predicted_prob * amount)
     */
    @Column(name = "expected_recovery_value", precision = 15, scale = 2)
    private BigDecimal expectedRecoveryValue;

    /**
     * Actual recovery value: SUM(recovered amounts)
     */
    @Column(name = "actual_recovery_value", precision = 15, scale = 2)
    private BigDecimal actualRecoveryValue;

    /**
     * Prediction ROI: actual / expected
     */
    @Column(name = "prediction_roi", precision = 10, scale = 4)
    private BigDecimal predictionRoi;

    // ── Metadata ───────────────────────────────────────────────────────

    @Column(name = "calculated_at", nullable = false)
    private LocalDateTime calculatedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.calculatedAt == null) {
            this.calculatedAt = LocalDateTime.now();
        }
    }
}
