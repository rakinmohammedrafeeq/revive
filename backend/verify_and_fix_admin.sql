-- Verify and Fix Admin Role in Neon DB
-- Run this SQL script in your Neon DB console to ensure the admin role is correctly set

-- 1. Check current role for your account
SELECT id, name, email, role, active 
FROM users 
WHERE email = 'rakinmohammedrafeeq@gmail.com';

-- 2. Update to ADMIN role if not already set (run this if the role is not ADMIN)
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'rakinmohammedrafeeq@gmail.com';

-- 3. Verify the update
SELECT id, name, email, role, active 
FROM users 
WHERE email = 'rakinmohammedrafeeq@gmail.com';

-- Expected result: role should be 'ADMIN'
