-- Create customer_stories table for Write Your Story submissions
CREATE TABLE IF NOT EXISTS customer_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  email TEXT NOT NULL,
  content TEXT NOT NULL,
  products TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  is_starred BOOLEAN DEFAULT FALSE,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('candle-journey', 'kindness-story', 'product-review', 'life-moment', 'other')),
  published_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- For admin export compatibility: name = author, story = content, product_purchased = products
CREATE INDEX IF NOT EXISTS idx_customer_stories_created_at ON customer_stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_stories_status ON customer_stories(status);

ALTER TABLE customer_stories ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public Write Your Story form)
CREATE POLICY "Anyone can submit story"
  ON customer_stories
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Service role has full access (admin operations via API)
CREATE POLICY "Service role full access customer_stories"
  ON customer_stories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated admins to read/update/delete (for admin panel with auth)
CREATE POLICY "Admins can view customer stories"
  ON customer_stories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can update customer stories"
  ON customer_stories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can delete customer stories"
  ON customer_stories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE OR REPLACE FUNCTION update_customer_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_stories_updated_at
  BEFORE UPDATE ON customer_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stories_updated_at();
