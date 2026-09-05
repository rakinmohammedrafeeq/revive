package com.revive.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.revive.enums.PaymentStatus;
import com.revive.enums.PredictionMethod;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Tracks ML predictions vs actual outcomes for model performance monitoring.
 * Enables feedback loop for continuous model improvement.
 */
@Entity
@Table(name = "ml_predictions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MlPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Failed payment this prediction targets (unique constraint)
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "failed_payment_id", nullable = false, unique = true)
    @JsonIgnore
    private FailedPayment failedPayment;

    /**
     * Workspace this prediction belongs to
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    @JsonIgnore
    private Workspace workspace;

    /**
     * Predicted recovery probability (0.0 to 1.0)
     */
    @Column(name = "predicted_probability", nullable = false, precision = 5, scale = 4)
    private BigDecimal predictedProbability;

    /**
     * Model version used for this prediction
     */
    @Column(name = "model_version", nullable = false, length = 50)
    private String modelVersion;

    /**
     * Model name (e.g., "Random Forest", "Logistic Regression")
     */
    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    /**
     * How prediction was generated (ML_MODEL, RULE_BASED, FALLBACK)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "prediction_method", nullable = false, length = 50)
    @Builder.Default
    private PredictionMethod predictionMethod = PredictionMethod.ML_MODEL;

    /**
     * Snapshot of input features at prediction time (JSONB)
     */
    @Type(JsonBinaryType.class)
    @Column(name = "features", columnDefinition = "jsonb", nullable = false)
    private String features;

    /**
     * Actual outcome (filled in after recovery attempt)
     * RECOVERED, FAILED, ABANDONED, PENDING
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "actual_outcome", length = 50)
    private PaymentStatus actualOutcome;

    /**
     * When outcome was recorded
     */
    @Column(name = "outcome_recorded_at")
    private LocalDateTime outcomeRecordedAt;

    /**
     * Prediction error: abs(predicted - actual)
     * Calculated automatically when outcome is recorded
     */
    @Column(name = "prediction_error", precision = 5, scale = 4)
    private BigDecimal predictionError;

    /**
     * Was the prediction correct?
     * True if predicted class (>= 0.5 = recovered) matches actual outcome
     */
    @Column(name = "was_correct")
    private Boolean wasCorrect;

    /**
     * When prediction was made
     */
    @Column(name = "predicted_at", nullable = false)
    private LocalDateTime predictedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.predictedAt == null) {
            this.predictedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Record actual outcome and calculate metrics
     */
    public void recordOutcome(PaymentStatus outcome) {
        this.actualOutcome = outcome;
        this.outcomeRecordedAt = LocalDateTime.now();
        
        // Calculate was_correct
        boolean predictedRecovery = this.predictedProbability.compareTo(new BigDecimal("0.5")) >= 0;
        boolean actuallyRecovered = (outcome == PaymentStatus.RECOVERED);
        this.wasCorrect = (predictedRecovery == actuallyRecovered);
        
        // Calculate prediction error
        BigDecimal actualValue = actuallyRecovered ? BigDecimal.ONE : BigDecimal.ZERO;
        this.predictionError = this.predictedProbability.subtract(actualValue).abs();
    }
}
