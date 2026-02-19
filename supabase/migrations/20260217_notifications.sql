-- Migration: Notification System
-- Description: Creates tables for notification preferences, logs, and templates

-- =====================================================
-- NOTIFICATION PREFERENCES TABLE
-- Per-admin notification preferences
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'new_order', 
    'new_review', 
    'new_story', 
    'new_contact', 
    'new_event_booking', 
    'low_inventory', 
    'order_issues', 
    'high_value_order'
  )),
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(admin_user_id, notification_type)
);

-- Indexes for notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_admin ON notification_preferences(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_type ON notification_preferences(notification_type);

-- =====================================================
-- NOTIFICATION LOGS TABLE
-- Track all sent notifications for audit and debugging
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('admin', 'customer')),
  recipient_email TEXT,
  recipient_phone TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  subject TEXT,
  body TEXT,
  error_message TEXT,
  external_id TEXT,
  related_entity_type TEXT CHECK (related_entity_type IN ('order', 'review', 'story', 'contact', 'event', 'product', 'cart')),
  related_entity_id UUID,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notification_logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient_email ON notification_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_entity ON notification_logs(related_entity_type, related_entity_id);

-- =====================================================
-- NOTIFICATION TEMPLATES TABLE
-- Store customizable notification templates
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  subject TEXT,
  body_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for notification_templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_key ON notification_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_notification_templates_channel ON notification_templates(channel);

-- =====================================================
-- ADD PHONE NUMBER TO ADMIN USERS
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_users' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN phone_number VARCHAR(20);
  END IF;
END $$;

-- =====================================================
-- ABANDONED CARTS TABLE
-- Track carts for abandoned cart notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  customer_email TEXT,
  customer_name TEXT,
  cart_data JSONB NOT NULL,
  cart_total DECIMAL(10, 2),
  reminder_sent_1h BOOLEAN DEFAULT FALSE,
  reminder_sent_24h BOOLEAN DEFAULT FALSE,
  reminder_sent_72h BOOLEAN DEFAULT FALSE,
  recovered BOOLEAN DEFAULT FALSE,
  recovered_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for abandoned_carts
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_session ON abandoned_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON abandoned_carts(customer_email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_created ON abandoned_carts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_last_activity ON abandoned_carts(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovered ON abandoned_carts(recovered);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Disable RLS for admin-only tables (accessed via service role)
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_carts DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Notification preferences trigger
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Notification templates trigger
CREATE OR REPLACE FUNCTION update_notification_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notification_templates_updated_at ON notification_templates;
CREATE TRIGGER notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_templates_updated_at();

-- Abandoned carts trigger
CREATE OR REPLACE FUNCTION update_abandoned_carts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS abandoned_carts_updated_at ON abandoned_carts;
CREATE TRIGGER abandoned_carts_updated_at
  BEFORE UPDATE ON abandoned_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_abandoned_carts_updated_at();

-- =====================================================
-- INSERT DEFAULT NOTIFICATION TEMPLATES
-- =====================================================
INSERT INTO notification_templates (template_key, channel, subject, body_template) VALUES
  -- Admin Email Templates
  ('admin_new_order_email', 'email', 'New Order: {{order_number}} - ${{total}}', 
   '<h1>New Order Received!</h1><p>Order Number: {{order_number}}</p><p>Customer: {{customer_name}}</p><p>Total: ${{total}}</p><p><a href="{{admin_url}}">View in Admin</a></p>'),
  
  ('admin_new_review_email', 'email', 'New Review Submitted for {{product_name}}',
   '<h1>New Review Submitted</h1><p>Product: {{product_name}}</p><p>Rating: {{rating}}/5</p><p>Customer: {{customer_name}}</p><p><a href="{{admin_url}}">Review in Admin</a></p>'),
  
  ('admin_new_story_email', 'email', 'New Customer Story: {{title}}',
   '<h1>New Customer Story</h1><p>Title: {{title}}</p><p>Author: {{author}}</p><p><a href="{{admin_url}}">Review in Admin</a></p>'),
  
  ('admin_new_contact_email', 'email', 'New Contact Form: {{subject}}',
   '<h1>New Contact Form Submission</h1><p>From: {{name}}</p><p>Email: {{email}}</p><p>Subject: {{subject}}</p><p>Message: {{message}}</p>'),
  
  ('admin_new_event_booking_email', 'email', 'New Event Booking: {{event_name}}',
   '<h1>New Event Booking Request</h1><p>Event: {{event_name}}</p><p>Customer: {{customer_name}}</p><p>Participants: {{num_participants}}</p><p><a href="{{admin_url}}">View in Admin</a></p>'),
  
  ('admin_low_inventory_email', 'email', 'Low Stock Alert: {{product_name}}',
   '<h1>Low Stock Alert</h1><p>Product: {{product_name}}</p><p>Variant: {{variant_name}}</p><p>Remaining: {{quantity}} units</p><p><a href="{{admin_url}}">Manage Inventory</a></p>'),
  
  ('admin_order_issue_email', 'email', 'Order Issue: {{order_number}} - {{issue_type}}',
   '<h1>Order Issue Alert</h1><p>Order: {{order_number}}</p><p>Issue: {{issue_type}}</p><p>Details: {{details}}</p><p><a href="{{admin_url}}">View Order</a></p>'),
  
  ('admin_high_value_order_email', 'email', 'High Value Order: {{order_number}} - ${{total}}',
   '<h1>High Value Order!</h1><p>Order Number: {{order_number}}</p><p>Customer: {{customer_name}}</p><p>Total: ${{total}}</p><p><a href="{{admin_url}}">View in Admin</a></p>'),

  -- Admin SMS Templates
  ('admin_new_order_sms', 'sms', NULL, 'New order {{order_number}} - ${{total}} from {{customer_name}}'),
  ('admin_high_value_order_sms', 'sms', NULL, 'HIGH VALUE ORDER! {{order_number}} - ${{total}} from {{customer_name}}'),
  ('admin_order_issue_sms', 'sms', NULL, 'Order issue: {{order_number}} - {{issue_type}}'),
  ('admin_low_inventory_sms', 'sms', NULL, 'Low stock: {{product_name}} - {{quantity}} remaining'),

  -- Customer Email Templates
  ('customer_order_delivered_email', 'email', 'Your Order Has Been Delivered! - {{order_number}}',
   '<h1>Your Order Has Been Delivered!</h1><p>Hi {{customer_name}},</p><p>Great news! Your order {{order_number}} has been delivered.</p><p>We hope you love your purchase!</p>'),
  
  ('customer_review_approved_email', 'email', 'Your Review Has Been Published!',
   '<h1>Thank You!</h1><p>Hi {{customer_name}},</p><p>Your review for {{product_name}} has been approved and published.</p><p>Thank you for sharing your feedback!</p>'),
  
  ('customer_story_approved_email', 'email', 'Your Story Has Been Published!',
   '<h1>Your Story is Live!</h1><p>Hi {{author}},</p><p>Your story "{{title}}" has been approved and published on our website.</p><p>Thank you for sharing your experience!</p>'),
  
  ('customer_event_confirmed_email', 'email', 'Your Event Booking is Confirmed! - {{event_name}}',
   '<h1>Booking Confirmed!</h1><p>Hi {{customer_name}},</p><p>Your booking for {{event_name}} on {{event_date}} has been confirmed.</p><p>We look forward to seeing you!</p>'),
  
  ('customer_event_reminder_email', 'email', 'Reminder: {{event_name}} Tomorrow!',
   '<h1>Event Reminder</h1><p>Hi {{customer_name}},</p><p>This is a reminder that {{event_name}} is tomorrow at {{event_time}}.</p><p>See you there!</p>'),
  
  ('customer_abandoned_cart_email', 'email', 'You Left Something Behind!',
   '<h1>Did You Forget Something?</h1><p>Hi {{customer_name}},</p><p>You left some items in your cart. Complete your purchase before they sell out!</p><p><a href="{{cart_url}}">Complete Your Order</a></p>')
ON CONFLICT (template_key) DO NOTHING;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE notification_preferences IS 'Per-admin notification preferences for email and SMS channels';
COMMENT ON TABLE notification_logs IS 'Audit log of all sent notifications with delivery status';
COMMENT ON TABLE notification_templates IS 'Customizable templates for email and SMS notifications';
COMMENT ON TABLE abandoned_carts IS 'Tracks abandoned shopping carts for recovery notifications';
