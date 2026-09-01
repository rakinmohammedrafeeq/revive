-- V3: Add workspace-based multi-tenant architecture

-- Create workspaces table
CREATE TABLE workspaces (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create workspace_members table
CREATE TABLE workspace_members (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(50) NOT NULL CHECK (permission IN ('OWNER', 'EDITOR', 'VIEWER')),
    invited_by BIGINT REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(workspace_id, user_id)
);

-- Create workspace_invitations table
CREATE TABLE workspace_invitations (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    permission VARCHAR(50) NOT NULL CHECK (permission IN ('OWNER', 'EDITOR', 'VIEWER')),
    invited_by BIGINT NOT NULL REFERENCES users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, email)
);

-- Add workspace_id to financial_records (nullable initially for migration)
ALTER TABLE financial_records 
ADD COLUMN workspace_id BIGINT REFERENCES workspaces(id) ON DELETE CASCADE;

-- Add current_workspace_id to users (for UX convenience)
ALTER TABLE users 
ADD COLUMN current_workspace_id BIGINT REFERENCES workspaces(id);

-- Create indexes for performance
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_invitations_workspace ON workspace_invitations(workspace_id);
CREATE INDEX idx_workspace_invitations_token ON workspace_invitations(token);
CREATE INDEX idx_financial_records_workspace ON financial_records(workspace_id);

-- Data Migration: Create default workspace for each user
INSERT INTO workspaces (name, slug, owner_id, created_at, updated_at)
SELECT 
    CONCAT(u.name, '''s Workspace') as name,
    CONCAT(LOWER(REGEXP_REPLACE(u.name, '[^a-zA-Z0-9]', '-', 'g')), '-', u.id) as slug,
    u.id as owner_id,
    CURRENT_TIMESTAMP as created_at,
    CURRENT_TIMESTAMP as updated_at
FROM users u
WHERE u.active = true;

-- Add all users as OWNER of their default workspace
INSERT INTO workspace_members (workspace_id, user_id, permission, joined_at, is_active)
SELECT 
    w.id as workspace_id,
    w.owner_id as user_id,
    'OWNER' as permission,
    CURRENT_TIMESTAMP as joined_at,
    true as is_active
FROM workspaces w;

-- Migrate financial records to user's default workspace
UPDATE financial_records fr
SET workspace_id = (
    SELECT w.id 
    FROM workspaces w 
    WHERE w.owner_id = fr.user_id 
    LIMIT 1
)
WHERE fr.user_id IS NOT NULL;

-- Set current_workspace_id for all users to their default workspace
UPDATE users u
SET current_workspace_id = (
    SELECT w.id 
    FROM workspaces w 
    WHERE w.owner_id = u.id 
    LIMIT 1
)
WHERE u.active = true;

-- Make workspace_id NOT NULL after migration
ALTER TABLE financial_records 
ALTER COLUMN workspace_id SET NOT NULL;

-- Add trigger to update workspace updated_at timestamp
CREATE OR REPLACE FUNCTION update_workspace_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspace_update_timestamp
BEFORE UPDATE ON workspaces
FOR EACH ROW
EXECUTE FUNCTION update_workspace_timestamp();
