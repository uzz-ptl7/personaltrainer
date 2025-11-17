-- Run this in Supabase SQL Editor to test notifications manually

-- 1. First, check if you have admin users
SELECT user_id, email, is_admin FROM profiles WHERE is_admin = true;

-- 2. Test inserting a notification directly (replace YOUR_ADMIN_USER_ID with actual ID from step 1)
-- INSERT INTO notifications (user_id, title, message, type)
-- VALUES ('YOUR_ADMIN_USER_ID', 'Test Notification', 'This is a test notification', 'info');

-- 3. Check if notifications exist
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

-- 4. Check RLS policies on notifications
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'notifications';
