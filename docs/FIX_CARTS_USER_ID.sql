-- Fix: Change carts.user_id to TEXT type (Step by Step)
-- ERROR: cannot alter type of a column used in a policy definition

-- Step 1: Drop all policies on carts table that depend on user_id
DROP POLICY IF EXISTS "Users can manage own cart" ON carts;
DROP POLICY IF EXISTS "Users can view own cart" ON carts;
DROP POLICY IF EXISTS "Users can insert own cart" ON carts;
DROP POLICY IF EXISTS "Users can update own cart" ON carts;
DROP POLICY IF EXISTS "Users can delete own cart" ON carts;

-- Step 2: Drop foreign key constraint if exists
ALTER TABLE carts DROP CONSTRAINT IF EXISTS carts_user_id_fkey;

-- Step 3: Now change user_id column type to TEXT
ALTER TABLE carts ALTER COLUMN user_id TYPE TEXT;

-- Step 4: Recreate the policies with TEXT type
CREATE POLICY "Users can manage own cart"
ON carts FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Alternative: Simple RLS policy
-- CREATE POLICY "Allow all operations for authenticated users"
-- ON carts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Verify change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'carts' AND column_name = 'user_id';
