-- =====================================================
-- FILE UPLOADS TABLE
-- Track all uploaded files for easy management
-- =====================================================
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  bucket TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  public_url TEXT,
  uploaded_by TEXT,
  tags TEXT[],
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_file_uploads_bucket ON file_uploads(bucket);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created ON file_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_uploads_type ON file_uploads(file_type);

-- RLS policies
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all file uploads operations" ON file_uploads
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- STORAGE BUCKETS SETUP
-- Note: These need to be created via Supabase Dashboard or API
-- The API will auto-create them if they don't exist
-- =====================================================

-- Buckets to create:
-- 1. product-images - For product photos
-- 2. marketing-assets - For banners, promotions, social media
-- 3. documents - For PDFs, spreadsheets, documents
-- 4. blog-images - For blog post images

