-- =====================================================
-- My Kind Kandles & Boutique - Schema Additions
-- Run this in your Supabase SQL Editor AFTER the main schema
-- =====================================================

-- =====================================================
-- ADMIN USERS TABLE (for RBAC)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- =====================================================
-- STORE SETTINGS TABLE (key-value store)
-- =====================================================
CREATE TABLE IF NOT EXISTS store_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Insert default settings
INSERT INTO store_settings (key, value, description) VALUES
  ('store_info', '{"name": "My Kind Kandles & Boutique", "email": "info@kindkandlesboutique.com", "phone": "", "address": {"line1": "9505 Reisterstown Rd", "line2": "Suite 2SE", "city": "Owings Mills", "state": "MD", "postal_code": "21117", "country": "US"}, "logo_url": "/logos/logo.png", "tagline": "Do All Things With Kindness"}', 'Store information and branding'),
  ('tax_settings', '{"default_rate": 0.06, "tax_inclusive": false, "tax_shipping": false}', 'Tax configuration'),
  ('email_settings', '{"from_email": "orders@kindkandlesboutique.com", "from_name": "My Kind Kandles", "admin_email": "admin@kindkandlesboutique.com"}', 'Email configuration'),
  ('checkout_settings', '{"free_shipping_threshold": 50, "allow_guest_checkout": true, "require_phone": false}', 'Checkout configuration')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- PRODUCT REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(255),
  content TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verified_purchase BOOLEAN DEFAULT FALSE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  admin_response TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON product_reviews(created_at DESC);

-- =====================================================
-- CUSTOMER TAGS TABLE (for CRM)
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#db2777',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for customer-tag relationship
CREATE TABLE IF NOT EXISTS customer_tag_assignments (
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES customer_tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (customer_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_tags_customer ON customer_tag_assignments(customer_id);

-- Insert default customer tags
INSERT INTO customer_tags (name, color) VALUES
  ('VIP', '#fbbf24'),
  ('Wholesale', '#3b82f6'),
  ('Repeat Customer', '#10b981'),
  ('Newsletter', '#8b5cf6'),
  ('Local', '#ec4899')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- CUSTOMER NOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON customer_notes(customer_id);

-- =====================================================
-- ADD MISSING COLUMNS TO CUSTOMERS TABLE
-- =====================================================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_order_at TIMESTAMPTZ;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE TRIGGER update_admin_users_updated_at 
  BEFORE UPDATE ON admin_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_store_settings_updated_at 
  BEFORE UPDATE ON store_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_product_reviews_updated_at 
  BEFORE UPDATE ON product_reviews 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running the script)
DROP POLICY IF EXISTS "Service role full access admin_users" ON admin_users;
DROP POLICY IF EXISTS "Service role full access audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Service role full access store_settings" ON store_settings;
DROP POLICY IF EXISTS "Service role full access product_reviews" ON product_reviews;
DROP POLICY IF EXISTS "Service role full access customer_tags" ON customer_tags;
DROP POLICY IF EXISTS "Service role full access customer_tag_assignments" ON customer_tag_assignments;
DROP POLICY IF EXISTS "Service role full access customer_notes" ON customer_notes;
DROP POLICY IF EXISTS "Public read approved reviews" ON product_reviews;

-- Service role has full access
CREATE POLICY "Service role full access admin_users" ON admin_users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access audit_logs" ON audit_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access store_settings" ON store_settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access product_reviews" ON product_reviews FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access customer_tags" ON customer_tags FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access customer_tag_assignments" ON customer_tag_assignments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access customer_notes" ON customer_notes FOR ALL USING (auth.role() = 'service_role');

-- Public read access for approved reviews
CREATE POLICY "Public read approved reviews" ON product_reviews FOR SELECT USING (status = 'approved');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get customer stats
CREATE OR REPLACE FUNCTION get_customer_stats(customer_email_param VARCHAR)
RETURNS TABLE (
  total_orders BIGINT,
  total_spent NUMERIC,
  avg_order_value NUMERIC,
  first_order_date TIMESTAMPTZ,
  last_order_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_orders,
    COALESCE(SUM(total), 0)::NUMERIC as total_spent,
    COALESCE(AVG(total), 0)::NUMERIC as avg_order_value,
    MIN(created_at) as first_order_date,
    MAX(created_at) as last_order_date
  FROM orders
  WHERE customer_email = customer_email_param
    AND payment_status = 'paid';
END;
$$ LANGUAGE plpgsql;

-- Function to get analytics overview
CREATE OR REPLACE FUNCTION get_analytics_overview(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS TABLE (
  total_revenue NUMERIC,
  total_orders BIGINT,
  avg_order_value NUMERIC,
  total_customers BIGINT,
  new_customers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(o.total), 0)::NUMERIC as total_revenue,
    COUNT(DISTINCT o.id)::BIGINT as total_orders,
    COALESCE(AVG(o.total), 0)::NUMERIC as avg_order_value,
    COUNT(DISTINCT o.customer_email)::BIGINT as total_customers,
    (SELECT COUNT(DISTINCT customer_email)::BIGINT FROM orders 
     WHERE created_at >= start_date AND created_at <= end_date
     AND customer_email NOT IN (
       SELECT DISTINCT customer_email FROM orders WHERE created_at < start_date
     )) as new_customers
  FROM orders o
  WHERE o.created_at >= start_date 
    AND o.created_at <= end_date
    AND o.payment_status = 'paid';
END;
$$ LANGUAGE plpgsql;

-- Function to get top products
CREATE OR REPLACE FUNCTION get_top_products(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  product_id UUID,
  product_title VARCHAR,
  total_quantity BIGINT,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.product_id,
    oi.title::VARCHAR as product_title,
    SUM(oi.quantity)::BIGINT as total_quantity,
    SUM(oi.total)::NUMERIC as total_revenue
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.created_at >= start_date 
    AND o.created_at <= end_date
    AND o.payment_status = 'paid'
  GROUP BY oi.product_id, oi.title
  ORDER BY total_revenue DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get low stock products
CREATE OR REPLACE FUNCTION get_low_stock_products(threshold INTEGER DEFAULT 5)
RETURNS TABLE (
  product_id UUID,
  product_title VARCHAR,
  variant_id UUID,
  variant_title VARCHAR,
  sku VARCHAR,
  inventory_quantity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.title::VARCHAR as product_title,
    pv.id as variant_id,
    pv.title::VARCHAR as variant_title,
    pv.sku::VARCHAR,
    pv.inventory_quantity
  FROM product_variants pv
  JOIN products p ON p.id = pv.product_id
  WHERE pv.inventory_quantity <= threshold
    AND p.status = 'active'
  ORDER BY pv.inventory_quantity ASC;
END;
$$ LANGUAGE plpgsql;

