-- =====================================================
-- Agenda Items and Comments Schema Migration
-- =====================================================

-- Create agenda_items table
CREATE TABLE IF NOT EXISTS agenda_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('task', 'note', 'reminder')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  assigned_to UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  notify_on_due BOOLEAN DEFAULT true,
  notify_on_update BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agenda_items
CREATE INDEX IF NOT EXISTS idx_agenda_items_assigned_to ON agenda_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_agenda_items_created_by ON agenda_items(created_by);
CREATE INDEX IF NOT EXISTS idx_agenda_items_due_date ON agenda_items(due_date);
CREATE INDEX IF NOT EXISTS idx_agenda_items_status ON agenda_items(status);
CREATE INDEX IF NOT EXISTS idx_agenda_items_priority ON agenda_items(priority);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_agenda_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for agenda_items
DROP TRIGGER IF EXISTS agenda_items_updated_at ON agenda_items;
CREATE TRIGGER agenda_items_updated_at
  BEFORE UPDATE ON agenda_items
  FOR EACH ROW
  EXECUTE FUNCTION update_agenda_items_updated_at();

-- Create agenda_comments table
CREATE TABLE IF NOT EXISTS agenda_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agenda_item_id UUID NOT NULL REFERENCES agenda_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agenda_comments
CREATE INDEX IF NOT EXISTS idx_agenda_comments_agenda_item_id ON agenda_comments(agenda_item_id);
CREATE INDEX IF NOT EXISTS idx_agenda_comments_user_id ON agenda_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_agenda_comments_created_at ON agenda_comments(created_at);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on agenda_items
ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all agenda items" ON agenda_items;
DROP POLICY IF EXISTS "Admins can create agenda items" ON agenda_items;
DROP POLICY IF EXISTS "Admins can update agenda items" ON agenda_items;
DROP POLICY IF EXISTS "Admins can delete agenda items" ON agenda_items;

-- Policy: Admins can view all agenda items
CREATE POLICY "Admins can view all agenda items"
  ON agenda_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Policy: Admins can create agenda items
CREATE POLICY "Admins can create agenda items"
  ON agenda_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Policy: Admins can update agenda items
CREATE POLICY "Admins can update agenda items"
  ON agenda_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Policy: Admins can delete agenda items
CREATE POLICY "Admins can delete agenda items"
  ON agenda_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Enable RLS on agenda_comments
ALTER TABLE agenda_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all comments" ON agenda_comments;
DROP POLICY IF EXISTS "Admins can create comments" ON agenda_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON agenda_comments;

-- Policy: Admins can view all comments
CREATE POLICY "Admins can view all comments"
  ON agenda_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Policy: Admins can create comments
CREATE POLICY "Admins can create comments"
  ON agenda_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON agenda_comments
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- Verification Queries (Optional - for testing)
-- =====================================================

-- Uncomment these to verify the tables were created successfully:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('agenda_items', 'agenda_comments');
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('agenda_items', 'agenda_comments');
