-- =====================================================
-- My Kind Kandles & Boutique - Database Schema
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- COLLECTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  handle VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_collections_handle ON collections(handle);
CREATE INDEX idx_collections_parent ON collections(parent_id);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  handle VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  tags TEXT[],
  vendor VARCHAR(255),
  product_type VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  featured BOOLEAN DEFAULT FALSE,
  weight DECIMAL(10,2),
  weight_unit VARCHAR(5) DEFAULT 'oz' CHECK (weight_unit IN ('lb', 'oz', 'kg', 'g')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_handle ON products(handle);
CREATE INDEX idx_products_collection ON products(collection_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(featured);

-- =====================================================
-- PRODUCT VARIANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'Default Title',
  sku VARCHAR(255),
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  inventory_quantity INTEGER DEFAULT 0,
  weight DECIMAL(10,2),
  weight_unit VARCHAR(5) DEFAULT 'oz' CHECK (weight_unit IN ('lb', 'oz', 'kg', 'g')),
  option1_name VARCHAR(255),
  option1_value VARCHAR(255),
  option2_name VARCHAR(255),
  option2_value VARCHAR(255),
  option3_name VARCHAR(255),
  option3_value VARCHAR(255),
  available_for_sale BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);

-- =====================================================
-- PRODUCT IMAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text VARCHAR(255),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_images_product ON product_images(product_id);

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(50),
  accepts_marketing BOOLEAN DEFAULT FALSE,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);

-- =====================================================
-- ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  shipping_address_line1 VARCHAR(255) NOT NULL,
  shipping_address_line2 VARCHAR(255),
  shipping_city VARCHAR(255) NOT NULL,
  shipping_state VARCHAR(100) NOT NULL,
  shipping_postal_code VARCHAR(20) NOT NULL,
  shipping_country VARCHAR(100) DEFAULT 'US',
  billing_address_line1 VARCHAR(255),
  billing_address_line2 VARCHAR(255),
  billing_city VARCHAR(255),
  billing_state VARCHAR(100),
  billing_postal_code VARCHAR(20),
  billing_country VARCHAR(100),
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_intent_id VARCHAR(255),
  shipping_method VARCHAR(255),
  tracking_number VARCHAR(255),
  tracking_url TEXT,
  notes TEXT,
  discount_code VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- =====================================================
-- ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  variant_id UUID,
  title VARCHAR(255) NOT NULL,
  variant_title VARCHAR(255),
  sku VARCHAR(255),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- =====================================================
-- SHIPPING ZONES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shipping_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  countries TEXT[] NOT NULL,
  states TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SHIPPING RATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shipping_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  min_weight DECIMAL(10,2),
  max_weight DECIMAL(10,2),
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shipping_rates_zone ON shipping_rates(zone_id);

-- =====================================================
-- DISCOUNT CODES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_shipping')),
  value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2),
  max_uses INTEGER,
  uses INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discount_codes_code ON discount_codes(code);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'MKK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
DROP TRIGGER IF EXISTS set_order_number ON orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to decrease inventory on order
CREATE OR REPLACE FUNCTION decrease_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.variant_id IS NOT NULL THEN
    UPDATE product_variants
    SET inventory_quantity = inventory_quantity - NEW.quantity,
        available_for_sale = CASE WHEN inventory_quantity - NEW.quantity > 0 THEN TRUE ELSE FALSE END
    WHERE id = NEW.variant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to decrease inventory when order item is created
CREATE TRIGGER decrease_inventory_on_order
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION decrease_inventory();

-- Function to update customer stats
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    INSERT INTO customers (email, first_name, total_orders, total_spent)
    VALUES (NEW.customer_email, SPLIT_PART(NEW.customer_name, ' ', 1), 1, NEW.total)
    ON CONFLICT (email) DO UPDATE
    SET total_orders = customers.total_orders + 1,
        total_spent = customers.total_spent + NEW.total,
        updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update customer stats when order is paid
CREATE TRIGGER update_customer_on_order
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Public read access for products, collections, shipping
CREATE POLICY "Public read access for products" ON products FOR SELECT USING (status = 'active');
CREATE POLICY "Public read access for variants" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Public read access for images" ON product_images FOR SELECT USING (true);
CREATE POLICY "Public read access for collections" ON collections FOR SELECT USING (true);
CREATE POLICY "Public read access for shipping zones" ON shipping_zones FOR SELECT USING (true);
CREATE POLICY "Public read access for shipping rates" ON shipping_rates FOR SELECT USING (true);
CREATE POLICY "Public read access for active discounts" ON discount_codes FOR SELECT USING (active = true);

-- Service role has full access (for admin operations)
CREATE POLICY "Service role full access products" ON products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access variants" ON product_variants FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access images" ON product_images FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access collections" ON collections FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access orders" ON orders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access order_items" ON order_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access customers" ON customers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access shipping_zones" ON shipping_zones FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access shipping_rates" ON shipping_rates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access discount_codes" ON discount_codes FOR ALL USING (auth.role() = 'service_role');

-- Allow inserting orders from anon users (checkout)
CREATE POLICY "Allow order creation" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow order item creation" ON order_items FOR INSERT WITH CHECK (true);

-- =====================================================
-- SEED DATA - Default Collections
-- =====================================================
INSERT INTO collections (title, handle, description, position) VALUES
  ('All Products', 'all', 'Browse all our products', 0),
  ('Candles', 'candles', 'Handmade natural candles', 1),
  ('Skincare', 'skincare', 'Natural skincare products', 2),
  ('Body Oils', 'body-oils', 'Nourishing body oils', 3),
  ('Room Sprays', 'room-sprays', 'Fresh room sprays', 4),
  ('Calm Down Girl', 'calm-down-girl', 'Our signature collection', 5)
ON CONFLICT (handle) DO NOTHING;

-- Seed default shipping zones
INSERT INTO shipping_zones (name, countries) VALUES
  ('Domestic', ARRAY['US']),
  ('International', ARRAY['CA', 'GB', 'AU', 'DE', 'FR'])
ON CONFLICT DO NOTHING;

-- Seed default shipping rates
INSERT INTO shipping_rates (zone_id, name, min_price, max_price, price)
SELECT z.id, 'Standard Shipping', 0, 49.99, 5.99
FROM shipping_zones z WHERE z.name = 'Domestic'
ON CONFLICT DO NOTHING;

INSERT INTO shipping_rates (zone_id, name, min_price, price)
SELECT z.id, 'Free Shipping', 50, 0
FROM shipping_zones z WHERE z.name = 'Domestic'
ON CONFLICT DO NOTHING;

INSERT INTO shipping_rates (zone_id, name, price)
SELECT z.id, 'International Standard', 15.99
FROM shipping_zones z WHERE z.name = 'International'
ON CONFLICT DO NOTHING;

