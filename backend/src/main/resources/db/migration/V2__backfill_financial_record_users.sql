-- Backfill existing financial records with the admin user to satisfy ownership
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'financial_records'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'users'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'financial_records'
          AND column_name = 'user_id'
    ) THEN
        UPDATE financial_records
        SET user_id = (SELECT id FROM users WHERE email = 'admin@ledgera.com' LIMIT 1)
        WHERE user_id IS NULL;
    END IF;
END $$;
