-- Add batch evaluation results table for historical tracking
-- Auto-cleanup deletes results older than 90 days

CREATE TABLE IF NOT EXISTS batch_evaluation_results (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    evaluated_at TIMESTAMP NOT NULL,
    total_payments_evaluated INTEGER NOT NULL DEFAULT 0,
    auto_approved INTEGER NOT NULL DEFAULT 0,
    requires_review INTEGER NOT NULL DEFAULT 0,
    blocked INTEGER NOT NULL DEFAULT 0,
    ml_accuracy DOUBLE PRECISION,
    ml_precision DOUBLE PRECISION,
    ml_recall DOUBLE PRECISION,
    outcome_breakdown JSONB,
    blocked_reasons JSONB,
    detailed_metrics JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster workspace queries
CREATE INDEX IF NOT EXISTS idx_batch_results_workspace ON batch_evaluation_results(workspace_id);

-- Index for date-based queries and cleanup
CREATE INDEX IF NOT EXISTS idx_batch_results_evaluated_at ON batch_evaluation_results(evaluated_at);

-- Index for history queries (workspace + date)
CREATE INDEX IF NOT EXISTS idx_batch_results_workspace_date 
    ON batch_evaluation_results(workspace_id, evaluated_at DESC);

COMMENT ON TABLE batch_evaluation_results IS 'Stores batch evaluation results for historical tracking. Auto-deleted after 90 days.';
COMMENT ON COLUMN batch_evaluation_results.evaluated_at IS 'When the batch evaluation was run';
COMMENT ON COLUMN batch_evaluation_results.auto_approved IS 'Number of payments that were auto-approved and executed';
COMMENT ON COLUMN batch_evaluation_results.requires_review IS 'Number of payments escalated for manual review';
COMMENT ON COLUMN batch_evaluation_results.blocked IS 'Number of payments blocked by policy';
