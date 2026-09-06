-- V13: Add Performance Indexes for Recovery Cases and Metrics
-- Optimizes queries for dashboard and recovery cases listing

-- Composite index for workspace recovery cases ordered by date (used by GET /api/recovery/cases)
CREATE INDEX IF NOT EXISTS idx_failed_payments_ws_failed_at 
    ON failed_payments(workspace_id, failed_at DESC);

-- Composite index for status aggregation (used by recovery metrics case counts)
CREATE INDEX IF NOT EXISTS idx_failed_payments_ws_status 
    ON failed_payments(workspace_id, status);

-- Composite index for recovery action status queries
CREATE INDEX IF NOT EXISTS idx_recovery_actions_fp_status 
    ON recovery_actions(failed_payment_id, status);
