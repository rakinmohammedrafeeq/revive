-- Initialize Ledgera Database with PGVector Extension

-- Create vector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE ledgera TO ledgera;
GRANT ALL ON SCHEMA public TO ledgera;

-- Set timezone
SET timezone = 'UTC';

-- Display database info
SELECT version();
SELECT current_database();
SELECT current_user;
