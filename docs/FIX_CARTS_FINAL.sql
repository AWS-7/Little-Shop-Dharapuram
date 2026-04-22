-- FINAL FIX: Carts user_id type change
-- Must drop FK constraint BEFORE changing column type

-- Step 1: Drop foreign key constraint (CRITICAL!)
ALTER TABLE carts DROP CONSTRAINT IF EXISTS carts_user_id_fkey;

-- Step 2: Drop policies
DROP POLICY IF EXISTS "Users can manage own cart" ON carts;

-- Step 3: Change column type to TEXT
ALTER TABLE carts ALTER COLUMN user_id TYPE TEXT;

-- Step 4: Recreate policy
CREATE POLICY "Users can manage own cart"
ON carts FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'carts' AND column_name = 'user_id';
