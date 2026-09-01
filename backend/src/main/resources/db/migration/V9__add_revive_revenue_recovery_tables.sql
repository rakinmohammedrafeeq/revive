-- V9: Add Revive Revenue Recovery Tables
-- This migration adds the core domain model for AI-powered revenue recovery
-- while preserving all existing Ledgera functionality

-- ═══════════════════════════════════════════════════════════════════════════
-- FAILED PAYMENTS - Core entity for tracking payment failures
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS failed_payments (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    payment_identifier VARCHAR(255) NOT NULL,
    order_identifier VARCHAR(255),
    customer_id VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_name VARCHAR(255),
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'FAILED',
    failure_reason VARCHAR(500),
    error_code VARCHAR(100),
    payment_method VARCHAR(50),
    retry_count INTEGER NOT NULL DEFAULT 0,
    failed_at TIMESTAMP NOT NULL,
    last_retry_at TIMESTAMP,
    recovered_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for failed_payments
CREATE INDEX idx_failed_payments_workspace ON failed_payments(workspace_id);
CREATE INDEX idx_failed_payments_payment_identifier ON failed_payments(payment_identifier);
CREATE INDEX idx_failed_payments_customer_id ON failed_payments(customer_id);
CREATE INDEX idx_failed_payments_status ON failed_payments(status);
CREATE INDEX idx_failed_payments_error_code ON failed_payments(error_code);
CREATE INDEX idx_failed_payments_payment_method ON failed_payments(payment_method);
CREATE INDEX idx_failed_payments_failed_at ON failed_payments(failed_at DESC);
CREATE INDEX idx_failed_payments_status_retry ON failed_payments(status, last_retry_at) 
    WHERE status = 'PENDING_RETRY';

-- ═══════════════════════════════════════════════════════════════════════════
-- RECOVERY ACTIONS - Track recovery attempts
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS recovery_actions (
    id BIGSERIAL PRIMARY KEY,
    failed_payment_id BIGINT NOT NULL REFERENCES failed_payments(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    channel VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'INITIATED',
    is_automated BOOLEAN NOT NULL DEFAULT TRUE,
    initiated_by BIGINT REFERENCES users(id),
    outcome JSONB,
    cost NUMERIC(10, 2) DEFAULT 0.00,
    initiated_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for recovery_actions
CREATE INDEX idx_recovery_actions_payment ON recovery_actions(failed_payment_id);
CREATE INDEX idx_recovery_actions_status ON recovery_actions(status);
CREATE INDEX idx_recovery_actions_type ON recovery_actions(action_type);
CREATE INDEX idx_recovery_actions_initiated_at ON recovery_actions(initiated_at DESC);
CREATE INDEX idx_recovery_actions_automated ON recovery_actions(is_automated);

-- ═══════════════════════════════════════════════════════════════════════════
-- RECOVERY POLICIES - Configurable guardrails
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS recovery_policies (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    max_retry_count INTEGER NOT NULL DEFAULT 3,
    cooldown_hours INTEGER NOT NULL DEFAULT 24,
    max_recovery_cost_per_payment NUMERIC(10, 2),
    max_total_recovery_budget NUMERIC(15, 2),
    allowed_channels JSONB,
    policy_rules JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, name)
);

-- Indexes for recovery_policies
CREATE INDEX idx_recovery_policies_workspace ON recovery_policies(workspace_id);
CREATE INDEX idx_recovery_policies_active ON recovery_policies(workspace_id, is_active, priority);

-- ═══════════════════════════════════════════════════════════════════════════
-- AUDIT TRAIL - Immutable compliance log
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_trail (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id BIGINT REFERENCES users(id),
    workspace_id BIGINT REFERENCES workspaces(id),
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100),
    entity_id BIGINT,
    payment_identifier VARCHAR(255),
    details JSONB NOT NULL,
    outcome VARCHAR(1000),
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit_trail
CREATE INDEX idx_audit_trail_timestamp ON audit_trail(timestamp DESC);
CREATE INDEX idx_audit_trail_workspace ON audit_trail(workspace_id, timestamp DESC);
CREATE INDEX idx_audit_trail_payment ON audit_trail(payment_identifier);
CREATE INDEX idx_audit_trail_action_type ON audit_trail(action_type);
CREATE INDEX idx_audit_trail_user ON audit_trail(user_id, timestamp DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- RECOVERED REVENUE - ROI tracking
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS recovered_revenue (
    id BIGSERIAL PRIMARY KEY,
    failed_payment_id BIGINT NOT NULL REFERENCES failed_payments(id) ON DELETE CASCADE,
    recovery_action_id BIGINT NOT NULL REFERENCES recovery_actions(id) ON DELETE CASCADE,
    recovered_amount NUMERIC(15, 2) NOT NULL,
    recovery_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_gain NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    recovered_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(failed_payment_id)
);

-- Indexes for recovered_revenue
CREATE INDEX idx_recovered_revenue_payment ON recovered_revenue(failed_payment_id);
CREATE INDEX idx_recovered_revenue_action ON recovered_revenue(recovery_action_id);
CREATE INDEX idx_recovered_revenue_recovered_at ON recovered_revenue(recovered_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS - Auto-update timestamps
-- ═══════════════════════════════════════════════════════════════════════════

-- Trigger for failed_payments
CREATE OR REPLACE FUNCTION update_failed_payments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER failed_payments_update_timestamp
BEFORE UPDATE ON failed_payments
FOR EACH ROW
EXECUTE FUNCTION update_failed_payments_timestamp();

-- Trigger for recovery_actions
CREATE OR REPLACE FUNCTION update_recovery_actions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recovery_actions_update_timestamp
BEFORE UPDATE ON recovery_actions
FOR EACH ROW
EXECUTE FUNCTION update_recovery_actions_timestamp();

-- Trigger for recovery_policies
CREATE OR REPLACE FUNCTION update_recovery_policies_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recovery_policies_update_timestamp
BEFORE UPDATE ON recovery_policies
FOR EACH ROW
EXECUTE FUNCTION update_recovery_policies_timestamp();

-- ═══════════════════════════════════════════════════════════════════════════
-- COMMENTS - Documentation
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE failed_payments IS 'Tracks failed payments requiring recovery action';
COMMENT ON TABLE recovery_actions IS 'Records each recovery attempt with outcome and cost';
COMMENT ON TABLE recovery_policies IS 'Configurable guardrails for recovery automation';
COMMENT ON TABLE audit_trail IS 'Immutable compliance log for all recovery actions';
COMMENT ON TABLE recovered_revenue IS 'Measures successfully recovered revenue and ROI';

COMMENT ON COLUMN failed_payments.metadata IS 'Flexible JSONB storage for gateway responses, customer preferences, etc.';
COMMENT ON COLUMN recovery_actions.outcome IS 'JSONB storage for gateway responses, customer replies, error details';
COMMENT ON COLUMN recovery_policies.allowed_channels IS 'JSONB array of permitted recovery channels (EMAIL, SMS, PHONE, etc.)';
COMMENT ON COLUMN recovery_policies.policy_rules IS 'JSONB storage for complex rules (time windows, payment method restrictions, etc.)';
COMMENT ON COLUMN audit_trail.details IS 'JSONB storage for action parameters, state changes, context';
