-- Check if pgvector extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if financial_insights table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'financial_insights'
);

-- Check financial_insights table structure if it exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'financial_insights'
ORDER BY ordinal_position;

-- Check Flyway migration history
SELECT version, description, success, installed_on 
FROM flyway_schema_history 
ORDER BY installed_rank;
