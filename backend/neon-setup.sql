-- ============================================
-- Neon Database Setup for Ledgera
-- ============================================
-- Run this in Neon SQL Editor:
-- https://console.neon.tech → SQL Editor
-- ============================================

-- 1. Enable PGVector extension (REQUIRED)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Verify extension is enabled
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

-- 3. Grant permissions (if needed)
GRANT ALL ON SCHEMA public TO neondb_owner;

-- 4. Show current database info
SELECT 
    current_database() as database,
    current_user as user,
    version() as postgres_version;

-- ============================================
-- Expected Output:
-- ============================================
-- extname | extversion
-- --------+-----------
-- vector  | 0.5.1 (or similar)
-- ============================================

-- After running this:
-- 1. Close this SQL Editor
-- 2. Restart your Spring Boot backend
-- 3. Test: curl http://localhost:8080/actuator/health
-- ============================================
