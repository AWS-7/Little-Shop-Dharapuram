-- Fix: Change orders.user_id to TEXT type to accept Firebase UIDs
-- This fixes order history not showing in profile section

-- 1. Change user_id column type from UUID to TEXT
ALTER TABLE orders ALTER COLUMN user_id TYPE TEXT;

-- 2. Remove any foreign key constraints on user_id
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- 3. Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'user_id';

-- Alternative: If you want to keep UUID format, you need to map Firebase UID to Supabase UUID
-- But TEXT is simpler for Firebase Auth integration
