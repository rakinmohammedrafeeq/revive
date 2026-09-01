-- V5: Update workspace names to use first name only

-- Update existing workspace names to use first name only
UPDATE workspaces
SET name = CONCAT(
    SPLIT_PART(TRIM(BOTH FROM REPLACE(name, '''s Workspace', '')), ' ', 1),
    '''s Workspace'
)
WHERE name LIKE '%''s Workspace';

-- Update slugs to match new names
UPDATE workspaces w
SET slug = CONCAT(
    LOWER(REGEXP_REPLACE(
        SPLIT_PART(TRIM(BOTH FROM REPLACE(w.name, '''s Workspace', '')), ' ', 1),
        '[^a-zA-Z0-9]',
        '-',
        'g'
    )),
    '-',
    w.owner_id
)
WHERE w.name LIKE '%''s Workspace';
