-- V6: Ensure all workspace owners have workspace_member records

-- Insert workspace_member records for workspace owners who don't have one
INSERT INTO workspace_members (workspace_id, user_id, permission, is_active, joined_at)
SELECT 
    w.id as workspace_id,
    w.owner_id as user_id,
    'OWNER' as permission,
    true as is_active,
    w.created_at as joined_at
FROM workspaces w
WHERE NOT EXISTS (
    SELECT 1 
    FROM workspace_members wm 
    WHERE wm.workspace_id = w.id 
    AND wm.user_id = w.owner_id
);
