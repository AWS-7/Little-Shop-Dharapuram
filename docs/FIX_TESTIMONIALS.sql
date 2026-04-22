-- Create testimonials table with RLS
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  avatar TEXT,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  review TEXT NOT NULL,
  product TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Public can read active testimonials
CREATE POLICY "Allow public read active testimonials"
ON testimonials
FOR SELECT
TO PUBLIC
USING (is_active = true);

-- Authenticated users (Admin) can do ALL operations
CREATE POLICY "Allow admin full access to testimonials"
ON testimonials
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert sample testimonials
INSERT INTO testimonials (name, location, avatar, rating, title, review, product, is_active, sort_order, verified)
VALUES 
  ('Priya Sharma', 'Mumbai, India', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', 5, 'Amazing quality saree!', 'The Banarasi silk saree exceeded my expectations. The quality is premium and the delivery was super fast. Will definitely order again!', 'Banarasi Silk Saree', true, 1, true),
  ('Rajesh Kumar', 'Delhi, India', NULL, 5, 'Perfect fit and great fabric', 'Ordered a cotton kurta set for my wife. The fabric quality is excellent and the fit was perfect. Highly recommend!', 'Cotton Kurta Set', true, 2, true),
  ('Ananya Patel', 'Bangalore, India', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200', 4, 'Beautiful design', 'Loved the designer lehenga I purchased. The embroidery work is intricate and beautiful. Minor delay in delivery but worth the wait.', 'Designer Lehenga', true, 3, true),
  ('Vikram Singh', 'Chennai, India', NULL, 5, 'Excellent customer service', 'Had an issue with sizing and the customer support team resolved it immediately. Exchange process was smooth. Great experience!', 'Men''s Ethnic Wear', true, 4, true);
