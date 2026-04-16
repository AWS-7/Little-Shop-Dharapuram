-- Create product-images storage bucket for product images
-- Run this in Supabase SQL Editor

-- Step 1: Create the storage bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create policy to allow ANYONE to upload images (for admin without auth)
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'product-images');

-- Step 3: Create policy to allow public access to read images
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

-- Step 4: Allow anyone to update/delete uploads
CREATE POLICY "Allow public updates"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Allow public deletes"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'product-images');
