import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Check if table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('product_inquiries')
      .select('id')
      .limit(1);

    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: 'Table product_inquiries already exists',
        alreadyExists: true,
      });
    }

    // Create the table using raw SQL
    const migrationSQL = `
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
CREATE INDEX IF NOT EXISTS idx_product_inquiries_status ON product_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_product_inquiries_created_at ON product_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_inquiries_priority ON product_inquiries(priority);
CREATE INDEX IF NOT EXISTS idx_product_inquiries_product_id ON product_inquiries(product_id);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_product_inquiries_updated_at ON product_inquiries;
CREATE TRIGGER update_product_inquiries_updated_at
  BEFORE UPDATE ON product_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE product_inquiries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin users have full access to product inquiries" ON product_inquiries;
DROP POLICY IF EXISTS "Service role has full access to product inquiries" ON product_inquiries;

-- RLS Policies
-- Admin users can do everything
CREATE POLICY "Admin users have full access to product inquiries"
  ON product_inquiries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('super_admin', 'admin')
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
    `;

    // Execute the migration
    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (migrationError) {
      console.error('Migration error:', migrationError);
      
      // If exec_sql doesn't exist, provide manual instructions
      if (migrationError.message?.includes('exec_sql')) {
        return NextResponse.json({
          success: false,
          error: 'Cannot run migration automatically',
          message: 'Please run the migration manually in Supabase SQL Editor',
          instructions: [
            '1. Go to your Supabase Dashboard',
            '2. Navigate to SQL Editor',
            '3. Click "New Query"',
            '4. Copy the migration SQL from supabase/migrations/20260201_product_inquiries.sql',
            '5. Paste and click "Run"'
          ],
          migrationPath: 'supabase/migrations/20260201_product_inquiries.sql'
        }, { status: 400 });
      }

      throw migrationError;
    }

    return NextResponse.json({
      success: true,
      message: 'Product inquiries table created successfully',
      details: 'Table, indexes, triggers, and RLS policies have been set up',
    });

  } catch (error) {
    console.error('Error setting up product inquiries:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to setup product inquiries table',
      instructions: [
        'Please run the migration manually:',
        '1. Open Supabase Dashboard → SQL Editor',
        '2. Copy contents from supabase/migrations/20260201_product_inquiries.sql',
        '3. Paste and execute'
      ]
    }, { status: 500 });
  }
}
