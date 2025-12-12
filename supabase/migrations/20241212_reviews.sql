-- =====================================================
-- REVIEW TOKENS TABLE
-- Stores tokens for verified purchase review requests
-- =====================================================
CREATE TABLE IF NOT EXISTS review_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  token TEXT NOT NULL UNIQUE,
  product_ids UUID[] NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_review_tokens_token ON review_tokens(token);
CREATE INDEX IF NOT EXISTS idx_review_tokens_order ON review_tokens(order_id);
CREATE INDEX IF NOT EXISTS idx_review_tokens_email ON review_tokens(customer_email);
CREATE INDEX IF NOT EXISTS idx_review_tokens_expires ON review_tokens(expires_at);

-- RLS policies
ALTER TABLE review_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all review tokens operations" ON review_tokens
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- PRODUCT REVIEWS TABLE (ensure it exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  content TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verified_purchase BOOLEAN DEFAULT FALSE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  review_token_id UUID REFERENCES review_tokens(id) ON DELETE SET NULL,
  admin_response TEXT,
  helpful_count INTEGER DEFAULT 0,
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for product reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON product_reviews(verified_purchase);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON product_reviews(created_at DESC);

-- RLS policies for product reviews
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all product reviews operations" ON product_reviews
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- SCHEDULED REVIEW REQUESTS TABLE
-- For tracking 24-hour delayed review email sends
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduled_review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'cancelled', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_reviews_status ON scheduled_review_requests(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_reviews_scheduled ON scheduled_review_requests(scheduled_for);

ALTER TABLE scheduled_review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all scheduled review requests operations" ON scheduled_review_requests
  FOR ALL USING (true) WITH CHECK (true);

