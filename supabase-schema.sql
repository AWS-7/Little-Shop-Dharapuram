-- ══════════════════════════════════════════════════
-- Little Shop — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ══════════════════════════════════════════════════

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  payment_id TEXT,
  status TEXT DEFAULT 'Ordered' CHECK (status IN ('Ordered', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered')),
  total NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  shipping NUMERIC DEFAULT 0,
  items JSONB DEFAULT '[]'::jsonb,
  customer JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════
-- Row Level Security (RLS)
-- ══════════════════════════════════════════════════

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own orders
CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin: full access (use service_role key server-side or create admin role)
-- For client-side admin, you can create a broader policy:
CREATE POLICY "Admin full access"
  ON orders FOR ALL
  USING (true)
  WITH CHECK (true);
-- NOTE: In production, restrict the above policy to admin users only.
-- Example: USING (auth.jwt() ->> 'role' = 'admin')

-- ══════════════════════════════════════════════════
-- Enable Realtime
-- ══════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ══════════════════════════════════════════════════
-- Products Table
-- ══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price > 0),
  original_price NUMERIC,
  category TEXT NOT NULL,
  image_url TEXT,
  badge TEXT CHECK (badge IN ('New', 'Sale', 'Bestseller', NULL)),
  stock_count INTEGER NOT NULL DEFAULT 0,
  fabric JSONB DEFAULT '{}'::jsonb,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone can view products
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);

-- Admin can manage products (insert/update/delete)
CREATE POLICY "Admin manage products" ON products FOR ALL
  USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════
-- Abandoned Carts Table
-- ══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  user_email TEXT,
  user_name TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted')),
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);

CREATE TRIGGER carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart"
  ON carts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin cart access"
  ON carts FOR ALL
  USING (true)
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE carts;

-- ══════════════════════════════════════════════════
-- Banner Settings Table (Admin-managed)
-- ══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read settings"
  ON settings FOR SELECT USING (true);

CREATE POLICY "Admin write settings"
  ON settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- ══════════════════════════════════════════════════
-- Addresses Table (Multi-Address per User)
-- ══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alt_phone TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  relationship_tag TEXT DEFAULT 'self' CHECK (relationship_tag IN ('self', 'father', 'mother', 'friend', 'office')),
  delivery_notes TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

CREATE TRIGGER addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses"
  ON addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
