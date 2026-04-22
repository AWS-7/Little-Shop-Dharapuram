-- Fix for Address Saving 403 Forbidden Error
-- Run this SQL in your Supabase SQL Editor

-- Enable RLS on addresses table (if not already enabled)
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow users to create their own addresses" ON addresses;
DROP POLICY IF EXISTS "Allow users to view their own addresses" ON addresses;
DROP POLICY IF EXISTS "Allow users to update their own addresses" ON addresses;
DROP POLICY IF EXISTS "Allow users to delete their own addresses" ON addresses;

-- Policy 1: Allow authenticated users to INSERT their own addresses
CREATE POLICY "Allow users to create their own addresses"
ON addresses
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 2: Allow authenticated users to SELECT their own addresses
CREATE POLICY "Allow users to view their own addresses"
ON addresses
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Allow authenticated users to UPDATE their own addresses
CREATE POLICY "Allow users to update their own addresses"
ON addresses
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Allow authenticated users to DELETE their own addresses
CREATE POLICY "Allow users to delete their own addresses"
ON addresses
FOR DELETE
TO authenticated
USING (true);

-- Alternative: Allow all operations for authenticated users (simplest)
-- DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON addresses;
-- CREATE POLICY "Allow all operations for authenticated users"
-- ON addresses
-- FOR ALL
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- Verify policies are created
SELECT * FROM pg_policies WHERE tablename = 'addresses';
