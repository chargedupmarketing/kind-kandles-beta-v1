-- =====================================================
-- Enhanced Agenda Items Schema - Advanced Features
-- =====================================================

-- Add new columns to existing agenda_items table
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2);
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,2);
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB; -- {type: 'daily'|'weekly'|'monthly', interval: 1, end_date: '...'}
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES agenda_items(id) ON DELETE CASCADE; -- For subtasks
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0; -- For ordering
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES agenda_items(id) ON DELETE SET NULL;
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3b82f6';
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- ============================================================================
-- Table: agenda_subtasks
-- Checklist items within agenda items
-- ============================================================================
CREATE TABLE IF NOT EXISTS agenda_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_item_id UUID NOT NULL REFERENCES agenda_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  completed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_subtasks_agenda_item_id ON agenda_subtasks(agenda_item_id);
CREATE INDEX IF NOT EXISTS idx_agenda_subtasks_position ON agenda_subtasks(agenda_item_id, position);

-- ============================================================================
-- Table: agenda_tags
-- Custom tags for categorizing agenda items
-- ============================================================================
CREATE TABLE IF NOT EXISTS agenda_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#6b7280',
  created_by UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_tags_name ON agenda_tags(name);

-- ============================================================================
-- Table: agenda_item_tags
-- Many-to-many relationship between items and tags
-- ============================================================================
CREATE TABLE IF NOT EXISTS agenda_item_tags (
  agenda_item_id UUID NOT NULL REFERENCES agenda_items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES agenda_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (agenda_item_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_agenda_item_tags_item ON agenda_item_tags(agenda_item_id);
CREATE INDEX IF NOT EXISTS idx_agenda_item_tags_tag ON agenda_item_tags(tag_id);

-- ============================================================================
-- Table: agenda_attachments
-- File attachments and links for agenda items
-- ============================================================================
CREATE TABLE IF NOT EXISTS agenda_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_item_id UUID NOT NULL REFERENCES agenda_items(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('file', 'link', 'image')),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  file_size BIGINT, -- Size in bytes
  mime_type VARCHAR(100),
  uploaded_by UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_attachments_item ON agenda_attachments(agenda_item_id);
CREATE INDEX IF NOT EXISTS idx_agenda_attachments_type ON agenda_attachments(type);

-- ============================================================================
-- Table: agenda_time_logs
-- Time tracking for agenda items
-- ============================================================================
CREATE TABLE IF NOT EXISTS agenda_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_item_id UUID NOT NULL REFERENCES agenda_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER, -- Calculated on end
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_time_logs_item ON agenda_time_logs(agenda_item_id);
CREATE INDEX IF NOT EXISTS idx_agenda_time_logs_user ON agenda_time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agenda_time_logs_started ON agenda_time_logs(started_at);

-- ============================================================================
-- Table: agenda_activity_log
-- Comprehensive activity history for agenda items
-- ============================================================================
CREATE TABLE IF NOT EXISTS agenda_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_item_id UUID NOT NULL REFERENCES agenda_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'completed', 'commented', 'assigned', 'status_changed', etc.
  field_changed VARCHAR(100), -- Which field was changed
  old_value TEXT,
  new_value TEXT,
  metadata JSONB, -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_activity_log_item ON agenda_activity_log(agenda_item_id);
CREATE INDEX IF NOT EXISTS idx_agenda_activity_log_user ON agenda_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_agenda_activity_log_created ON agenda_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_agenda_activity_log_action ON agenda_activity_log(action);

-- ============================================================================
-- Table: agenda_watchers
-- Users watching specific agenda items for notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS agenda_watchers (
  agenda_item_id UUID NOT NULL REFERENCES agenda_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (agenda_item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_agenda_watchers_item ON agenda_watchers(agenda_item_id);
CREATE INDEX IF NOT EXISTS idx_agenda_watchers_user ON agenda_watchers(user_id);

-- ============================================================================
-- Table: agenda_dependencies
-- Dependencies between agenda items
-- ============================================================================
CREATE TABLE IF NOT EXISTS agenda_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES agenda_items(id) ON DELETE CASCADE,
  depends_on_id UUID NOT NULL REFERENCES agenda_items(id) ON DELETE CASCADE,
  dependency_type VARCHAR(20) DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'relates_to')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, depends_on_id),
  CHECK (item_id != depends_on_id) -- Can't depend on itself
);

CREATE INDEX IF NOT EXISTS idx_agenda_dependencies_item ON agenda_dependencies(item_id);
CREATE INDEX IF NOT EXISTS idx_agenda_dependencies_depends ON agenda_dependencies(depends_on_id);

-- ============================================================================
-- Additional Indexes for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_agenda_items_parent_id ON agenda_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_agenda_items_is_archived ON agenda_items(is_archived);
CREATE INDEX IF NOT EXISTS idx_agenda_items_is_template ON agenda_items(is_template);

-- ============================================================================
-- Trigger: Log all changes to agenda items
-- ============================================================================
CREATE OR REPLACE FUNCTION log_agenda_item_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name VARCHAR(255);
BEGIN
  -- Get user name
  SELECT name INTO v_user_name FROM admin_users WHERE id = auth.uid();

  -- Log creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO agenda_activity_log (
      agenda_item_id, user_id, user_name, action, metadata
    ) VALUES (
      NEW.id, NEW.created_by, v_user_name, 'created',
      jsonb_build_object('title', NEW.title, 'type', NEW.type, 'priority', NEW.priority)
    );
    RETURN NEW;
  END IF;

  -- Log updates
  IF TG_OP = 'UPDATE' THEN
    -- Status changed
    IF OLD.status != NEW.status THEN
      INSERT INTO agenda_activity_log (
        agenda_item_id, user_id, user_name, action, field_changed, old_value, new_value
      ) VALUES (
        NEW.id, auth.uid(), v_user_name, 'status_changed', 'status', OLD.status, NEW.status
      );
      
      -- If completed, set completed_at
      IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
      END IF;
    END IF;

    -- Priority changed
    IF OLD.priority != NEW.priority THEN
      INSERT INTO agenda_activity_log (
        agenda_item_id, user_id, user_name, action, field_changed, old_value, new_value
      ) VALUES (
        NEW.id, auth.uid(), v_user_name, 'priority_changed', 'priority', OLD.priority, NEW.priority
      );
    END IF;

    -- Assignment changed
    IF OLD.assigned_to != NEW.assigned_to THEN
      INSERT INTO agenda_activity_log (
        agenda_item_id, user_id, user_name, action, field_changed, old_value, new_value
      ) VALUES (
        NEW.id, auth.uid(), v_user_name, 'reassigned', 'assigned_to', OLD.assigned_to::text, NEW.assigned_to::text
      );
    END IF;

    -- Due date changed
    IF (OLD.due_date IS DISTINCT FROM NEW.due_date) THEN
      INSERT INTO agenda_activity_log (
        agenda_item_id, user_id, user_name, action, field_changed, old_value, new_value
      ) VALUES (
        NEW.id, auth.uid(), v_user_name, 'due_date_changed', 'due_date', 
        COALESCE(OLD.due_date::text, 'none'), COALESCE(NEW.due_date::text, 'none')
      );
    END IF;

    -- Progress changed
    IF OLD.progress_percentage != NEW.progress_percentage THEN
      INSERT INTO agenda_activity_log (
        agenda_item_id, user_id, user_name, action, field_changed, old_value, new_value
      ) VALUES (
        NEW.id, auth.uid(), v_user_name, 'progress_updated', 'progress_percentage', 
        OLD.progress_percentage::text, NEW.progress_percentage::text
      );
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agenda_items_activity_log ON agenda_items;
CREATE TRIGGER agenda_items_activity_log
  AFTER INSERT OR UPDATE ON agenda_items
  FOR EACH ROW
  EXECUTE FUNCTION log_agenda_item_changes();

-- ============================================================================
-- Trigger: Update subtask completion on agenda item
-- ============================================================================
CREATE OR REPLACE FUNCTION update_agenda_item_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_total_subtasks INTEGER;
  v_completed_subtasks INTEGER;
  v_progress INTEGER;
BEGIN
  -- Count total and completed subtasks
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_completed = true)
  INTO v_total_subtasks, v_completed_subtasks
  FROM agenda_subtasks
  WHERE agenda_item_id = COALESCE(NEW.agenda_item_id, OLD.agenda_item_id);

  -- Calculate progress percentage
  IF v_total_subtasks > 0 THEN
    v_progress := ROUND((v_completed_subtasks::DECIMAL / v_total_subtasks) * 100);
  ELSE
    v_progress := 0;
  END IF;

  -- Update parent item progress
  UPDATE agenda_items
  SET progress_percentage = v_progress
  WHERE id = COALESCE(NEW.agenda_item_id, OLD.agenda_item_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agenda_subtasks_update_progress ON agenda_subtasks;
CREATE TRIGGER agenda_subtasks_update_progress
  AFTER INSERT OR UPDATE OR DELETE ON agenda_subtasks
  FOR EACH ROW
  EXECUTE FUNCTION update_agenda_item_progress();

-- ============================================================================
-- Trigger: Notify watchers on agenda item changes
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_agenda_watchers()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all watchers except the person making the change
  INSERT INTO notifications (user_id, type, title, message, metadata)
  SELECT 
    w.user_id,
    'agenda_item_updated',
    'Agenda Item Updated',
    'An item you are watching has been updated: ' || NEW.title,
    jsonb_build_object(
      'agenda_item_id', NEW.id,
      'updated_by', auth.uid()
    )
  FROM agenda_watchers w
  WHERE w.agenda_item_id = NEW.id
    AND w.user_id != auth.uid();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agenda_items_notify_watchers ON agenda_items;
CREATE TRIGGER agenda_items_notify_watchers
  AFTER UPDATE ON agenda_items
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION notify_agenda_watchers();

-- ============================================================================
-- Function: Generate recurring agenda items
-- Should be called by cron job daily
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_recurring_agenda_items()
RETURNS void AS $$
DECLARE
  v_item RECORD;
  v_next_date TIMESTAMPTZ;
  v_pattern JSONB;
BEGIN
  FOR v_item IN 
    SELECT * FROM agenda_items 
    WHERE recurrence_pattern IS NOT NULL 
      AND status != 'cancelled'
      AND is_template = false
  LOOP
    v_pattern := v_item.recurrence_pattern;
    
    -- Calculate next occurrence date
    CASE v_pattern->>'type'
      WHEN 'daily' THEN
        v_next_date := v_item.due_date + ((v_pattern->>'interval')::INTEGER || ' days')::INTERVAL;
      WHEN 'weekly' THEN
        v_next_date := v_item.due_date + ((v_pattern->>'interval')::INTEGER || ' weeks')::INTERVAL;
      WHEN 'monthly' THEN
        v_next_date := v_item.due_date + ((v_pattern->>'interval')::INTEGER || ' months')::INTERVAL;
      ELSE
        CONTINUE;
    END CASE;

    -- Check if we should create next occurrence
    IF v_next_date <= NOW() + INTERVAL '1 day' 
       AND (v_pattern->>'end_date' IS NULL OR v_next_date <= (v_pattern->>'end_date')::TIMESTAMPTZ) THEN
      
      -- Check if next occurrence doesn't already exist
      IF NOT EXISTS (
        SELECT 1 FROM agenda_items 
        WHERE parent_id = v_item.id 
          AND due_date = v_next_date
      ) THEN
        -- Create next occurrence
        INSERT INTO agenda_items (
          title, description, type, status, priority, due_date, start_date,
          assigned_to, created_by, tags, color, parent_id, recurrence_pattern
        ) VALUES (
          v_item.title, v_item.description, v_item.type, 'pending', v_item.priority,
          v_next_date, v_next_date - INTERVAL '1 day',
          v_item.assigned_to, v_item.created_by, v_item.tags, v_item.color,
          v_item.id, v_item.recurrence_pattern
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Calculate time spent on agenda item
-- ============================================================================
CREATE OR REPLACE FUNCTION get_agenda_item_time_spent(p_item_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total_minutes INTEGER;
BEGIN
  SELECT COALESCE(SUM(duration_minutes), 0)
  INTO v_total_minutes
  FROM agenda_time_logs
  WHERE agenda_item_id = p_item_id;
  
  RETURN v_total_minutes;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Get agenda item completion percentage including subtasks
-- ============================================================================
CREATE OR REPLACE FUNCTION get_agenda_item_completion(p_item_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total_subtasks INTEGER;
  v_completed_subtasks INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_completed = true)
  INTO v_total_subtasks, v_completed_subtasks
  FROM agenda_subtasks
  WHERE agenda_item_id = p_item_id;
  
  IF v_total_subtasks = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((v_completed_subtasks::DECIMAL / v_total_subtasks) * 100);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Row Level Security (RLS) for New Tables
-- ============================================================================

-- agenda_subtasks
ALTER TABLE agenda_subtasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all subtasks" ON agenda_subtasks;
CREATE POLICY "Admins can view all subtasks" ON agenda_subtasks
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true));

DROP POLICY IF EXISTS "Admins can manage subtasks" ON agenda_subtasks;
CREATE POLICY "Admins can manage subtasks" ON agenda_subtasks
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true));

-- agenda_tags
ALTER TABLE agenda_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all tags" ON agenda_tags;
CREATE POLICY "Admins can view all tags" ON agenda_tags
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true));

DROP POLICY IF EXISTS "Admins can manage tags" ON agenda_tags;
CREATE POLICY "Admins can manage tags" ON agenda_tags
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true));

-- agenda_item_tags
ALTER TABLE agenda_item_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage item tags" ON agenda_item_tags;
CREATE POLICY "Admins can manage item tags" ON agenda_item_tags
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true));

-- agenda_attachments
ALTER TABLE agenda_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all attachments" ON agenda_attachments;
CREATE POLICY "Admins can view all attachments" ON agenda_attachments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true));

DROP POLICY IF EXISTS "Admins can manage attachments" ON agenda_attachments;
CREATE POLICY "Admins can manage attachments" ON agenda_attachments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true));

-- agenda_time_logs
ALTER TABLE agenda_time_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all time logs" ON agenda_time_logs;
CREATE POLICY "Admins can view all time logs" ON agenda_time_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true));

DROP POLICY IF EXISTS "Admins can manage time logs" ON agenda_time_logs;
CREATE POLICY "Admins can manage time logs" ON agenda_time_logs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true));

-- agenda_activity_log
ALTER TABLE agenda_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view activity log" ON agenda_activity_log;
CREATE POLICY "Admins can view activity log" ON agenda_activity_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true));

DROP POLICY IF EXISTS "System can insert activity log" ON agenda_activity_log;
CREATE POLICY "System can insert activity log" ON agenda_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true));

-- agenda_watchers
ALTER TABLE agenda_watchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage watchers" ON agenda_watchers;
CREATE POLICY "Admins can manage watchers" ON agenda_watchers
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true));

-- agenda_dependencies
ALTER TABLE agenda_dependencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage dependencies" ON agenda_dependencies;
CREATE POLICY "Admins can manage dependencies" ON agenda_dependencies
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true));

-- ============================================================================
-- Trigger: Auto-complete subtasks when parent is completed
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_complete_subtasks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE agenda_subtasks
    SET is_completed = true,
        completed_by = auth.uid(),
        completed_at = NOW()
    WHERE agenda_item_id = NEW.id
      AND is_completed = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agenda_items_auto_complete_subtasks ON agenda_items;
CREATE TRIGGER agenda_items_auto_complete_subtasks
  AFTER UPDATE ON agenda_items
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION auto_complete_subtasks();

-- ============================================================================
-- Function: Get blocked items (items waiting on dependencies)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_blocked_agenda_items()
RETURNS TABLE (
  item_id UUID,
  item_title TEXT,
  blocked_by_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ai.id,
    ai.title,
    COUNT(ad.depends_on_id)::INTEGER
  FROM agenda_items ai
  JOIN agenda_dependencies ad ON ai.id = ad.item_id
  JOIN agenda_items blocker ON ad.depends_on_id = blocker.id
  WHERE ad.dependency_type = 'blocks'
    AND blocker.status != 'completed'
    AND ai.status NOT IN ('completed', 'cancelled')
  GROUP BY ai.id, ai.title;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- View: Agenda items with computed fields
-- Note: This view is optional and may not work if admin_users schema is different
-- Comment out if you get column errors
-- ============================================================================
-- CREATE OR REPLACE VIEW agenda_items_detailed AS
-- SELECT 
--   ai.*,
--   au_assigned.email as assigned_to_name,
--   au_assigned.email as assigned_to_email,
--   au_created.email as created_by_name,
--   au_created.email as created_by_email,
--   (SELECT COUNT(*) FROM agenda_subtasks WHERE agenda_item_id = ai.id) as subtask_count,
--   (SELECT COUNT(*) FROM agenda_subtasks WHERE agenda_item_id = ai.id AND is_completed = true) as completed_subtask_count,
--   (SELECT COUNT(*) FROM agenda_comments WHERE agenda_item_id = ai.id) as comment_count,
--   (SELECT COUNT(*) FROM agenda_attachments WHERE agenda_item_id = ai.id) as attachment_count,
--   (SELECT COUNT(*) FROM agenda_watchers WHERE agenda_item_id = ai.id) as watcher_count,
--   (SELECT COALESCE(SUM(duration_minutes), 0) FROM agenda_time_logs WHERE agenda_item_id = ai.id) as total_time_minutes,
--   (SELECT COUNT(*) FROM agenda_dependencies WHERE item_id = ai.id) as dependency_count,
--   ARRAY(SELECT t.name FROM agenda_tags t JOIN agenda_item_tags ait ON t.id = ait.tag_id WHERE ait.agenda_item_id = ai.id) as tag_names
-- FROM agenda_items ai
-- LEFT JOIN admin_users au_assigned ON ai.assigned_to = au_assigned.id
-- LEFT JOIN admin_users au_created ON ai.created_by = au_created.id;

-- ============================================================================
-- Sample Data for Testing (Optional - Comment out for production)
-- ============================================================================

-- Insert sample tags
-- INSERT INTO agenda_tags (name, color, created_by) VALUES
--   ('urgent', '#ef4444', (SELECT id FROM admin_users LIMIT 1)),
--   ('marketing', '#8b5cf6', (SELECT id FROM admin_users LIMIT 1)),
--   ('development', '#3b82f6', (SELECT id FROM admin_users LIMIT 1)),
--   ('design', '#ec4899', (SELECT id FROM admin_users LIMIT 1)),
--   ('meeting', '#f59e0b', (SELECT id FROM admin_users LIMIT 1));
