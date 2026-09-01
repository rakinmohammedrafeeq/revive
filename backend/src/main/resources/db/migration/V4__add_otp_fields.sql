-- V4: Add OTP fields for password reset

-- Add OTP fields to users table
ALTER TABLE users 
ADD COLUMN otp_code VARCHAR(6),
ADD COLUMN otp_expiry TIMESTAMP,
ADD COLUMN otp_attempts INTEGER DEFAULT 0,
ADD COLUMN otp_last_sent TIMESTAMP;

-- Remove old token-based fields (keep for backward compatibility during migration)
-- ALTER TABLE users DROP COLUMN reset_token;
-- ALTER TABLE users DROP COLUMN reset_token_expiry;

-- Create index for OTP lookups
CREATE INDEX idx_users_otp_code ON users(otp_code) WHERE otp_code IS NOT NULL;
