-- Add image_url column to products table
-- Run this in Supabase SQL Editor

-- Add image_url column if it doesn't exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Verify column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'image_url';
