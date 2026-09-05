-- V10: Add ML Prediction Tracking for Feedback Loop
-- This migration enables tracking ML predictions vs actual outcomes
-- to support model retraining and performance monitoring

-- ═══════════════════════════════════════════════════════════════════════════
-- ML_PREDICTIONS - Track predictions vs actual outcomes
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ml_predictions (
    id BIGSERIAL PRIMARY KEY,
    failed_payment_id BIGINT NOT NULL REFERENCES failed_payments(id) ON DELETE CASCADE,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Prediction details
    predicted_probability NUMERIC(5, 4) NOT NULL CHECK (predicted_probability >= 0 AND predicted_probability <= 1),
    model_version VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    prediction_method VARCHAR(50) NOT NULL DEFAULT 'ML_MODEL', -- ML_MODEL, RULE_BASED, FALLBACK
    
    -- Input features (snapshot at prediction time)
    features JSONB NOT NULL,
    
    -- Actual outcome (filled in later)
    actual_outcome VARCHAR(50), -- RECOVERED, FAILED, ABANDONED, PENDING
    outcome_recorded_at TIMESTAMP,
    
    -- Model performance tracking
    prediction_error NUMERIC(5, 4), -- abs(predicted - actual), filled after outcome
    was_correct BOOLEAN, -- true if prediction matched outcome
    
    -- Metadata
    predicted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint: one prediction per payment
    UNIQUE(failed_payment_id)
);

-- Indexes for ml_predictions
CREATE INDEX idx_ml_predictions_payment ON ml_predictions(failed_payment_id);
CREATE INDEX idx_ml_predictions_workspace ON ml_predictions(workspace_id);
CREATE INDEX idx_ml_predictions_predicted_at ON ml_predictions(predicted_at DESC);
CREATE INDEX idx_ml_predictions_outcome ON ml_predictions(actual_outcome);
CREATE INDEX idx_ml_predictions_model_version ON ml_predictions(model_version);
CREATE INDEX idx_ml_predictions_accuracy ON ml_predictions(was_correct, predicted_at) 
    WHERE was_correct IS NOT NULL;
CREATE INDEX idx_ml_predictions_pending ON ml_predictions(predicted_at) 
    WHERE actual_outcome IS NULL OR actual_outcome = 'PENDING';

-- ═══════════════════════════════════════════════════════════════════════════
-- ML_MODEL_METRICS - Track model performance over time
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ml_model_metrics (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Model identification
    model_version VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    
    -- Performance period
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    
    -- Prediction counts
    total_predictions INTEGER NOT NULL DEFAULT 0,
    predictions_with_outcomes INTEGER NOT NULL DEFAULT 0,
    
    -- Accuracy metrics
    accuracy NUMERIC(5, 4), -- (TP + TN) / Total
    precision_score NUMERIC(5, 4), -- TP / (TP + FP)
    recall_score NUMERIC(5, 4), -- TP / (TP + FN)
    f1_score NUMERIC(5, 4), -- 2 * (Precision * Recall) / (Precision + Recall)
    roc_auc NUMERIC(5, 4), -- Area under ROC curve
    
    -- Confusion matrix
    true_positives INTEGER DEFAULT 0,
    true_negatives INTEGER DEFAULT 0,
    false_positives INTEGER DEFAULT 0,
    false_negatives INTEGER DEFAULT 0,
    
    -- Business metrics
    avg_prediction_error NUMERIC(5, 4),
    expected_recovery_value NUMERIC(15, 2), -- SUM(predicted_prob * amount)
    actual_recovery_value NUMERIC(15, 2), -- SUM(actual recovered amounts)
    prediction_roi NUMERIC(10, 4), -- actual / expected
    
    -- Metadata
    calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for ml_model_metrics
CREATE INDEX idx_ml_model_metrics_workspace ON ml_model_metrics(workspace_id);
CREATE INDEX idx_ml_model_metrics_version ON ml_model_metrics(model_version, calculated_at DESC);
CREATE INDEX idx_ml_model_metrics_period ON ml_model_metrics(period_start, period_end);

-- ═══════════════════════════════════════════════════════════════════════════
-- TRAINING_DATA_EXPORTS - Track training data exports for retraining
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS training_data_exports (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Export details
    export_name VARCHAR(255) NOT NULL,
    export_path VARCHAR(500), -- File path or S3 URL
    
    -- Data range
    data_start_date TIMESTAMP NOT NULL,
    data_end_date TIMESTAMP NOT NULL,
    
    -- Counts
    total_records INTEGER NOT NULL,
    recovered_records INTEGER NOT NULL,
    failed_records INTEGER NOT NULL,
    
    -- Export metadata
    export_format VARCHAR(50) NOT NULL DEFAULT 'CSV', -- CSV, PARQUET, JSON
    feature_columns JSONB NOT NULL,
    export_filters JSONB,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'INITIATED', -- INITIATED, COMPLETED, FAILED
    error_message TEXT,
    
    -- Timestamps
    exported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for training_data_exports
CREATE INDEX idx_training_exports_workspace ON training_data_exports(workspace_id);
CREATE INDEX idx_training_exports_exported_at ON training_data_exports(exported_at DESC);
CREATE INDEX idx_training_exports_status ON training_data_exports(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS - Auto-update timestamps
-- ═══════════════════════════════════════════════════════════════════════════

-- Trigger for ml_predictions
CREATE OR REPLACE FUNCTION update_ml_predictions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    -- Auto-calculate prediction error and correctness when outcome is recorded
    IF NEW.actual_outcome IS NOT NULL AND OLD.actual_outcome IS NULL THEN
        NEW.outcome_recorded_at = CURRENT_TIMESTAMP;
        
        -- Calculate was_correct
        IF (NEW.predicted_probability >= 0.5 AND NEW.actual_outcome = 'RECOVERED') OR
           (NEW.predicted_probability < 0.5 AND NEW.actual_outcome IN ('FAILED', 'ABANDONED')) THEN
            NEW.was_correct = TRUE;
        ELSE
            NEW.was_correct = FALSE;
        END IF;
        
        -- Calculate prediction error (simplified: 1.0 for recovered, 0.0 for failed)
        IF NEW.actual_outcome = 'RECOVERED' THEN
            NEW.prediction_error = ABS(NEW.predicted_probability - 1.0);
        ELSIF NEW.actual_outcome IN ('FAILED', 'ABANDONED') THEN
            NEW.prediction_error = ABS(NEW.predicted_probability - 0.0);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ml_predictions_update_timestamp
BEFORE UPDATE ON ml_predictions
FOR EACH ROW
EXECUTE FUNCTION update_ml_predictions_timestamp();

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEWS - Convenient queries for ML performance
-- ═══════════════════════════════════════════════════════════════════════════

-- View: Recent prediction accuracy by model version
CREATE OR REPLACE VIEW ml_prediction_accuracy AS
SELECT 
    workspace_id,
    model_version,
    model_name,
    COUNT(*) as total_predictions,
    COUNT(*) FILTER (WHERE actual_outcome IS NOT NULL) as predictions_with_outcome,
    COUNT(*) FILTER (WHERE was_correct = TRUE) as correct_predictions,
    ROUND(
        COUNT(*) FILTER (WHERE was_correct = TRUE)::numeric / 
        NULLIF(COUNT(*) FILTER (WHERE actual_outcome IS NOT NULL), 0),
        4
    ) as accuracy_rate,
    AVG(prediction_error) FILTER (WHERE prediction_error IS NOT NULL) as avg_error,
    MIN(predicted_at) as first_prediction,
    MAX(predicted_at) as last_prediction
FROM ml_predictions
GROUP BY workspace_id, model_version, model_name;

-- View: Predictions pending outcome
CREATE OR REPLACE VIEW ml_predictions_pending_outcome AS
SELECT 
    mp.id,
    mp.failed_payment_id,
    mp.workspace_id,
    mp.predicted_probability,
    mp.model_version,
    mp.predicted_at,
    fp.payment_identifier,
    fp.customer_id,
    fp.amount,
    fp.status as payment_status,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - mp.predicted_at)) / 3600 as hours_since_prediction
FROM ml_predictions mp
JOIN failed_payments fp ON mp.failed_payment_id = fp.id
WHERE mp.actual_outcome IS NULL OR mp.actual_outcome = 'PENDING'
ORDER BY mp.predicted_at DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- COMMENTS - Documentation
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE ml_predictions IS 'Tracks ML predictions vs actual outcomes for model performance monitoring';
COMMENT ON TABLE ml_model_metrics IS 'Aggregated model performance metrics over time';
COMMENT ON TABLE training_data_exports IS 'Tracks training data exports for model retraining';

COMMENT ON COLUMN ml_predictions.features IS 'JSONB snapshot of input features at prediction time';
COMMENT ON COLUMN ml_predictions.prediction_error IS 'Absolute difference between predicted probability and actual outcome (0 or 1)';
COMMENT ON COLUMN ml_predictions.was_correct IS 'True if predicted class matches actual outcome';

COMMENT ON VIEW ml_prediction_accuracy IS 'Aggregated accuracy metrics by workspace and model version';
COMMENT ON VIEW ml_predictions_pending_outcome IS 'Predictions awaiting actual recovery outcome';
