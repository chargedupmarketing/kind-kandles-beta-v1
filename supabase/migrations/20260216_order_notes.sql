-- Migration: Order Notes System
-- Description: Creates order_notes table for internal order comments and notes

-- Drop existing table if it exists (for clean re-run)
DROP TABLE IF EXISTS order_notes CASCADE;

-- Create order_notes table (simplified - no foreign key to admin_users)
CREATE TABLE order_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  note_type VARCHAR(20) DEFAULT 'internal' CHECK (note_type IN ('internal', 'packing', 'shipping', 'customer')),
  created_by_name VARCHAR(255) DEFAULT 'Admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster order lookups
CREATE INDEX idx_order_notes_order_id ON order_notes(order_id);

-- Create index for filtering by note type
CREATE INDEX idx_order_notes_type ON order_notes(note_type);

-- Create index for sorting by creation date
CREATE INDEX idx_order_notes_created_at ON order_notes(created_at DESC);

-- Disable RLS for simplicity (admin-only table accessed via service role)
ALTER TABLE order_notes DISABLE ROW LEVEL SECURITY;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_order_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_notes_updated_at ON order_notes;
CREATE TRIGGER order_notes_updated_at
  BEFORE UPDATE ON order_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_order_notes_updated_at();

-- Add comment for documentation
COMMENT ON TABLE order_notes IS 'Internal notes and comments for orders, used by admin staff for fulfillment workflow';
COMMENT ON COLUMN order_notes.note_type IS 'Type of note: internal (general), packing (packing instructions), shipping (shipping notes), customer (customer-related)';
