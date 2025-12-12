-- Shipments table for shipping label and tracking management
-- Run this in your Supabase SQL Editor

-- Create shipments table
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  shippo_shipment_id TEXT,
  shippo_transaction_id TEXT,
  carrier TEXT NOT NULL,
  service TEXT NOT NULL,
  tracking_number TEXT,
  tracking_url TEXT,
  label_url TEXT,
  label_format TEXT DEFAULT 'PDF_4x6',
  rate_amount DECIMAL(10,2),
  rate_currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  estimated_delivery DATE,
  ship_date TIMESTAMPTZ,
  delivered_date TIMESTAMPTZ,
  tracking_history JSONB DEFAULT '[]'::jsonb,
  package_weight DECIMAL(10,2),
  package_dimensions JSONB,
  from_address JSONB,
  to_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier ON shipments(carrier);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (admin panel)
CREATE POLICY "Allow all shipment operations" ON shipments FOR ALL USING (true);

-- Add shipped_at column to orders table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'shipped_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipped_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shipments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS shipments_updated_at ON shipments;
CREATE TRIGGER shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_shipments_updated_at();

-- Comments for documentation
COMMENT ON TABLE shipments IS 'Stores shipping labels and tracking information from Shippo';
COMMENT ON COLUMN shipments.shippo_shipment_id IS 'Shippo shipment object ID';
COMMENT ON COLUMN shipments.shippo_transaction_id IS 'Shippo transaction (label purchase) object ID';
COMMENT ON COLUMN shipments.carrier IS 'Shipping carrier (usps, ups, fedex, dhl_express)';
COMMENT ON COLUMN shipments.service IS 'Service level (Priority Mail, Ground, etc.)';
COMMENT ON COLUMN shipments.label_url IS 'URL to download the shipping label PDF';
COMMENT ON COLUMN shipments.tracking_history IS 'Array of tracking events from Shippo webhooks';
COMMENT ON COLUMN shipments.package_dimensions IS 'JSON object with length, width, height, unit';

