-- Hero Banners Table Setup
-- Run this in Supabase SQL Editor

-- 1. Create hero_banners table
CREATE TABLE IF NOT EXISTS hero_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image TEXT NOT NULL,              -- Banner image URL
  title TEXT NOT NULL,              -- Main title
  subtitle TEXT,                    -- Subtitle text
  cta TEXT DEFAULT 'Shop Now',      -- Button text
  link TEXT DEFAULT '/shop',        -- Button link
  color TEXT DEFAULT 'bg-purple-primary', -- Button/overlay color theme
  sort_order INTEGER DEFAULT 0,     -- Display order
  is_active BOOLEAN DEFAULT true,   -- Active status
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies
DROP POLICY IF EXISTS "Allow public read hero banners" ON hero_banners;
DROP POLICY IF EXISTS "Allow admin manage hero banners" ON hero_banners;

-- 4. Create policies
CREATE POLICY "Allow public read hero banners"
ON hero_banners FOR SELECT TO PUBLIC USING (is_active = true);

CREATE POLICY "Allow admin manage hero banners"
ON hero_banners FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Insert default banners (optional)
INSERT INTO hero_banners (image, title, subtitle, cta, link, color, sort_order, is_active) VALUES
('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop', 
 'Huge Summer Sale', 'Up to 50% Off on All Collections', 'Shop Now', '/shop', 'bg-purple-primary', 1, true),
 
('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2000&auto=format&fit=crop', 
 'New Arrivals 2026', 'Premium Lifestyle Essentials', 'Explore More', '/shop', 'bg-indigo-600', 2, true),
 
('https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=2000&auto=format&fit=crop', 
 'Exclusive Jewellery', 'Timeless Elegance in Every Piece', 'View Collection', '/shop', 'bg-pink-600', 3, true)
ON CONFLICT DO NOTHING;

-- 6. Verify
SELECT * FROM hero_banners WHERE is_active = true ORDER BY sort_order;
