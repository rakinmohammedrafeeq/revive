-- Clear old OTP data to fix cooldown issues
-- This will allow users to request new OTPs immediately after deployment

UPDATE users 
SET otp_code = NULL,
    otp_expiry = NULL,
    otp_attempts = 0,
    otp_last_sent = NULL
WHERE otp_last_sent IS NOT NULL;
