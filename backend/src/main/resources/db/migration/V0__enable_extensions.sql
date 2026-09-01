-- Enable required PostgreSQL extensions
-- This must run before any tables with vector columns are created

-- PGVector extension for AI embeddings (required for financial_embeddings table)
CREATE EXTENSION IF NOT EXISTS vector;

-- Optional: Full-text search extension (useful for searching descriptions)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
