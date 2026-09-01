-- Cleanup duplicate financial insights
-- This will keep only the most recent insight per user/workspace/type combination

-- First, let's see what we have
SELECT user_id, workspace_id, insight_type, status, COUNT(*) as count, MAX(created_at) as latest
FROM financial_insights
WHERE status = 'active'
GROUP BY user_id, workspace_id, insight_type, status
HAVING COUNT(*) > 1;

-- Delete duplicates, keeping only the most recent one per user/workspace/type
DELETE FROM financial_insights
WHERE id IN (
    SELECT fi.id
    FROM financial_insights fi
    LEFT JOIN (
        SELECT user_id, workspace_id, insight_type, MAX(created_at) as max_created_at
        FROM financial_insights
        WHERE status = 'active'
        GROUP BY user_id, workspace_id, insight_type
    ) latest ON fi.user_id = latest.user_id 
        AND (fi.workspace_id = latest.workspace_id OR (fi.workspace_id IS NULL AND latest.workspace_id IS NULL))
        AND fi.insight_type = latest.insight_type 
        AND fi.created_at = latest.max_created_at
    WHERE fi.status = 'active' 
        AND latest.max_created_at IS NULL
);

-- Verify cleanup
SELECT user_id, workspace_id, insight_type, status, COUNT(*) as count
FROM financial_insights
WHERE status = 'active'
GROUP BY user_id, workspace_id, insight_type, status
ORDER BY user_id, workspace_id, insight_type;
