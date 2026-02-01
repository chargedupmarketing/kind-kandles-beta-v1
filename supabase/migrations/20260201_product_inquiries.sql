-- Create or replace the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create product_inquiries table for AI-detected products awaiting review
CREATE TABLE IF NOT EXISTS product_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- AI Extracted Information
  ai_product_name TEXT,
  ai_scent_name TEXT,
  ai_product_type TEXT,
  ai_colors TEXT[], -- Array of detected colors
  ai_container_type TEXT,
  ai_size TEXT,
  
  -- Image Information
  image_url TEXT NOT NULL,
  image_alt_text TEXT,
  
  -- Suggested Product Data (pre-filled from AI)
  suggested_title TEXT,
  suggested_price DECIMAL(10, 2),
  suggested_description TEXT,
  suggested_product_type TEXT,
  suggested_tags TEXT[],
  
  -- Status and Metadata
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'completed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  notes TEXT, -- Admin notes
  
  -- Tracking
  created_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  
  -- If approved and product created
  product_id UUID REFERENCES products(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_product_inquiries_status ON product_inquiries(status);
CREATE INDEX idx_product_inquiries_created_at ON product_inquiries(created_at DESC);
CREATE INDEX idx_product_inquiries_priority ON product_inquiries(priority);
CREATE INDEX idx_product_inquiries_product_id ON product_inquiries(product_id);

-- Create updated_at trigger
CREATE TRIGGER update_product_inquiries_updated_at
  BEFORE UPDATE ON product_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE product_inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin users can do everything
CREATE POLICY "Admin users have full access to product inquiries"
  ON product_inquiries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Allow service role full access
CREATE POLICY "Service role has full access to product inquiries"
  ON product_inquiries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON product_inquiries TO authenticated;
GRANT ALL ON product_inquiries TO service_role;

-- Add comment
COMMENT ON TABLE product_inquiries IS 'Stores AI-detected product information awaiting business owner review and completion';
