-- Social Media Calendars Schema
-- This schema supports multiple social media platform calendars with posts, scheduling, and notifications

-- ============================================================================
-- Table: social_calendars
-- Stores individual social media platform calendars
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'twitter', 'pinterest', 'linkedin', 'youtube', 'threads')),
  description TEXT,
  color VARCHAR(7) DEFAULT '#db2777',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Table: social_posts
-- Stores scheduled social media posts
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL REFERENCES social_calendars(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[], -- Array of image/video URLs
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'cancelled')),
  post_url TEXT, -- URL after publishing
  hashtags TEXT[], -- Array of hashtags
  mentions TEXT[], -- Array of @mentions
  location VARCHAR(255),
  notes TEXT,
  created_by UUID NOT NULL,
  created_by_name VARCHAR(255),
  published_at TIMESTAMP WITH TIME ZONE,
  published_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Table: social_post_collaborators
-- Track who can edit specific posts
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_post_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name VARCHAR(255),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_social_calendars_platform ON social_calendars(platform);
CREATE INDEX IF NOT EXISTS idx_social_calendars_created_by ON social_calendars(created_by);
CREATE INDEX IF NOT EXISTS idx_social_calendars_is_active ON social_calendars(is_active);

CREATE INDEX IF NOT EXISTS idx_social_posts_calendar_id ON social_posts(calendar_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled_date ON social_posts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_by ON social_posts(created_by);
CREATE INDEX IF NOT EXISTS idx_social_posts_calendar_date ON social_posts(calendar_id, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_social_post_collaborators_post_id ON social_post_collaborators(post_id);
CREATE INDEX IF NOT EXISTS idx_social_post_collaborators_user_id ON social_post_collaborators(user_id);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_social_calendars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_calendars_updated_at
  BEFORE UPDATE ON social_calendars
  FOR EACH ROW
  EXECUTE FUNCTION update_social_calendars_updated_at();

CREATE OR REPLACE FUNCTION update_social_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_posts_updated_at();

-- ============================================================================
-- Notification Trigger for Social Posts
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_social_post_scheduled()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify when post is scheduled (status changed to 'scheduled')
  IF NEW.status = 'scheduled' AND (OLD.status IS NULL OR OLD.status != 'scheduled') THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      created_at
    )
    SELECT 
      NEW.created_by,
      'social_post_scheduled',
      'Post Scheduled',
      'Your post "' || NEW.title || '" is scheduled for ' || TO_CHAR(NEW.scheduled_date, 'Mon DD, YYYY at HH:MI AM'),
      jsonb_build_object(
        'post_id', NEW.id,
        'calendar_id', NEW.calendar_id,
        'scheduled_date', NEW.scheduled_date
      ),
      NOW();
  END IF;

  -- Notify when post is published
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      created_at
    )
    SELECT 
      NEW.created_by,
      'social_post_published',
      'Post Published',
      'Your post "' || NEW.title || '" has been published successfully!',
      jsonb_build_object(
        'post_id', NEW.id,
        'calendar_id', NEW.calendar_id,
        'post_url', NEW.post_url
      ),
      NOW();
  END IF;

  -- Notify when post fails
  IF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      created_at
    )
    SELECT 
      NEW.created_by,
      'social_post_failed',
      'Post Failed',
      'Your post "' || NEW.title || '" failed to publish. Please check and try again.',
      jsonb_build_object(
        'post_id', NEW.id,
        'calendar_id', NEW.calendar_id
      ),
      NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_posts_notification
  AFTER INSERT OR UPDATE ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_social_post_scheduled();

-- ============================================================================
-- Notification Trigger for Post Reminders (24 hours before)
-- This should be called by a cron job
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_upcoming_social_posts()
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    metadata,
    created_at
  )
  SELECT 
    sp.created_by,
    'social_post_reminder',
    'Upcoming Post',
    'Your post "' || sp.title || '" is scheduled to publish in 24 hours on ' || sc.name,
    jsonb_build_object(
      'post_id', sp.id,
      'calendar_id', sp.calendar_id,
      'scheduled_date', sp.scheduled_date
    ),
    NOW()
  FROM social_posts sp
  JOIN social_calendars sc ON sp.calendar_id = sc.id
  WHERE sp.status = 'scheduled'
    AND sp.scheduled_date BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = sp.created_by
        AND n.type = 'social_post_reminder'
        AND n.metadata->>'post_id' = sp.id::text
        AND n.created_at > NOW() - INTERVAL '12 hours'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE social_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_collaborators ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "social_calendars_select" ON social_calendars;
DROP POLICY IF EXISTS "social_calendars_insert" ON social_calendars;
DROP POLICY IF EXISTS "social_calendars_update" ON social_calendars;
DROP POLICY IF EXISTS "social_calendars_delete" ON social_calendars;

DROP POLICY IF EXISTS "social_posts_select" ON social_posts;
DROP POLICY IF EXISTS "social_posts_insert" ON social_posts;
DROP POLICY IF EXISTS "social_posts_update" ON social_posts;
DROP POLICY IF EXISTS "social_posts_delete" ON social_posts;

DROP POLICY IF EXISTS "social_post_collaborators_select" ON social_post_collaborators;
DROP POLICY IF EXISTS "social_post_collaborators_insert" ON social_post_collaborators;
DROP POLICY IF EXISTS "social_post_collaborators_delete" ON social_post_collaborators;

-- Policies for social_calendars
-- All authenticated users can view all calendars
CREATE POLICY "social_calendars_select" ON social_calendars
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create calendars
CREATE POLICY "social_calendars_insert" ON social_calendars
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own calendars, or any calendar if they're super admin
CREATE POLICY "social_calendars_update" ON social_calendars
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'super_admin'
    )
  );

-- Users can delete their own calendars, or any calendar if they're super admin
CREATE POLICY "social_calendars_delete" ON social_calendars
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'super_admin'
    )
  );

-- Policies for social_posts
-- All authenticated users can view all posts
CREATE POLICY "social_posts_select" ON social_posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create posts
CREATE POLICY "social_posts_insert" ON social_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own posts, posts they collaborate on, or any post if they're super admin
CREATE POLICY "social_posts_update" ON social_posts
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM social_post_collaborators spc
      WHERE spc.post_id = id AND spc.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'super_admin'
    )
  );

-- Users can delete their own posts or any post if they're super admin
CREATE POLICY "social_posts_delete" ON social_posts
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'super_admin'
    )
  );

-- Policies for social_post_collaborators
-- All authenticated users can view collaborators
CREATE POLICY "social_post_collaborators_select" ON social_post_collaborators
  FOR SELECT
  TO authenticated
  USING (true);

-- Post creators and super admins can add collaborators
CREATE POLICY "social_post_collaborators_insert" ON social_post_collaborators
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM social_posts sp
      WHERE sp.id = post_id AND sp.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'super_admin'
    )
  );

-- Post creators and super admins can remove collaborators
CREATE POLICY "social_post_collaborators_delete" ON social_post_collaborators
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM social_posts sp
      WHERE sp.id = post_id AND sp.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'super_admin'
    )
  );
