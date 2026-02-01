-- Create event_forms table for customizable in-person event forms
CREATE TABLE IF NOT EXISTS event_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  form_type TEXT NOT NULL CHECK (form_type IN ('review', 'waiver', 'feedback', 'registration', 'custom')),
  
  -- Form Configuration (JSON structure for fields)
  form_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example structure:
  -- [
  --   {
  --     "id": "name",
  --     "type": "text",
  --     "label": "Full Name",
  --     "required": true,
  --     "placeholder": "Enter your name"
  --   },
  --   {
  --     "id": "email",
  --     "type": "email",
  --     "label": "Email Address",
  --     "required": true
  --   },
  --   {
  --     "id": "rating",
  --     "type": "rating",
  --     "label": "How would you rate this event?",
  --     "required": true,
  --     "max": 5
  --   },
  --   {
  --     "id": "signature",
  --     "type": "signature",
  --     "label": "Signature",
  --     "required": true
  --   }
  -- ]
  
  -- Customization
  header_text TEXT,
  footer_text TEXT,
  submit_button_text TEXT DEFAULT 'Submit',
  success_message TEXT DEFAULT 'Thank you for your submission!',
  
  -- Branding
  primary_color TEXT DEFAULT '#ec4899', -- pink-500
  logo_url TEXT,
  background_image_url TEXT,
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  require_event_code BOOLEAN DEFAULT false, -- Require event-specific code to access
  allow_multiple_submissions BOOLEAN DEFAULT false,
  collect_email BOOLEAN DEFAULT true,
  send_confirmation_email BOOLEAN DEFAULT false,
  
  -- QR Code
  qr_code_url TEXT, -- Generated QR code image URL
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  submission_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Optional event association
  event_id UUID REFERENCES events(id) ON DELETE SET NULL
);

-- Create event_form_submissions table for form responses
CREATE TABLE IF NOT EXISTS event_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Form reference
  form_id UUID NOT NULL REFERENCES event_forms(id) ON DELETE CASCADE,
  
  -- Submission data (JSON structure matching form_fields)
  submission_data JSONB NOT NULL,
  -- Example:
  -- {
  --   "name": "John Doe",
  --   "email": "john@example.com",
  --   "rating": 5,
  --   "comments": "Great event!",
  --   "signature": "data:image/png;base64,..."
  -- }
  
  -- Metadata
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  
  -- Optional user association
  user_email TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Event context
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  event_code TEXT, -- If form required an event code
  
  -- Status
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'archived')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT
);

-- Create indexes
CREATE INDEX idx_event_forms_slug ON event_forms(slug);
CREATE INDEX idx_event_forms_type ON event_forms(form_type);
CREATE INDEX idx_event_forms_active ON event_forms(is_active);
CREATE INDEX idx_event_forms_event ON event_forms(event_id);

CREATE INDEX idx_form_submissions_form ON event_form_submissions(form_id);
CREATE INDEX idx_form_submissions_submitted_at ON event_form_submissions(submitted_at DESC);
CREATE INDEX idx_form_submissions_status ON event_form_submissions(status);
CREATE INDEX idx_form_submissions_event ON event_form_submissions(event_id);
CREATE INDEX idx_form_submissions_email ON event_form_submissions(user_email);

-- Create updated_at trigger for event_forms
CREATE TRIGGER update_event_forms_updated_at
  BEFORE UPDATE ON event_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE event_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_form_submissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - EVENT_FORMS
-- =====================================================

-- Anyone can view active forms
CREATE POLICY "Anyone can view active event forms"
  ON event_forms
  FOR SELECT
  USING (is_active = true);

-- Admins can view all forms
CREATE POLICY "Admins can view all event forms"
  ON event_forms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Admins can create forms
CREATE POLICY "Admins can create event forms"
  ON event_forms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Admins can update forms
CREATE POLICY "Admins can update event forms"
  ON event_forms
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

-- Admins can delete forms
CREATE POLICY "Admins can delete event forms"
  ON event_forms
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- RLS POLICIES - EVENT_FORM_SUBMISSIONS
-- =====================================================

-- Anyone can submit to active forms (public access)
CREATE POLICY "Anyone can submit event forms"
  ON event_form_submissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_forms
      WHERE event_forms.id = form_id
      AND event_forms.is_active = true
    )
  );

-- Admins can view all submissions
CREATE POLICY "Admins can view all form submissions"
  ON event_form_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Admins can update submissions (for review status)
CREATE POLICY "Admins can update form submissions"
  ON event_form_submissions
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

-- Admins can delete submissions
CREATE POLICY "Admins can delete form submissions"
  ON event_form_submissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to event forms"
  ON event_forms
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to form submissions"
  ON event_form_submissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON event_forms TO authenticated;
GRANT ALL ON event_forms TO service_role;
GRANT ALL ON event_form_submissions TO authenticated;
GRANT ALL ON event_form_submissions TO service_role;

-- Add comments
COMMENT ON TABLE event_forms IS 'Customizable forms for in-person events (reviews, waivers, feedback)';
COMMENT ON TABLE event_form_submissions IS 'Submitted responses to event forms';

-- =====================================================
-- SEED DATA - DEFAULT FORM TEMPLATES
-- =====================================================

-- Insert default review form template
INSERT INTO event_forms (title, slug, form_type, description, form_fields, header_text, footer_text)
VALUES (
  'Event Review Form',
  'event-review',
  'review',
  'Share your experience at our event',
  '[
    {
      "id": "name",
      "type": "text",
      "label": "Full Name",
      "required": true,
      "placeholder": "Enter your name"
    },
    {
      "id": "email",
      "type": "email",
      "label": "Email Address",
      "required": true,
      "placeholder": "your@email.com"
    },
    {
      "id": "rating",
      "type": "rating",
      "label": "How would you rate this event?",
      "required": true,
      "max": 5
    },
    {
      "id": "favorite_part",
      "type": "textarea",
      "label": "What was your favorite part?",
      "required": false,
      "placeholder": "Tell us what you enjoyed most..."
    },
    {
      "id": "improvements",
      "type": "textarea",
      "label": "What could we improve?",
      "required": false,
      "placeholder": "Any suggestions for next time?"
    },
    {
      "id": "recommend",
      "type": "radio",
      "label": "Would you recommend this event to a friend?",
      "required": true,
      "options": ["Yes", "Maybe", "No"]
    }
  ]'::jsonb,
  'Thank you for attending our event!',
  'Your feedback helps us create better experiences.'
);

-- Insert default waiver form template
INSERT INTO event_forms (title, slug, form_type, description, form_fields, header_text, footer_text)
VALUES (
  'Event Waiver & Release',
  'event-waiver',
  'waiver',
  'Please read and sign the waiver to participate',
  '[
    {
      "id": "name",
      "type": "text",
      "label": "Full Name",
      "required": true,
      "placeholder": "Enter your full legal name"
    },
    {
      "id": "email",
      "type": "email",
      "label": "Email Address",
      "required": true,
      "placeholder": "your@email.com"
    },
    {
      "id": "phone",
      "type": "tel",
      "label": "Phone Number",
      "required": true,
      "placeholder": "(555) 123-4567"
    },
    {
      "id": "emergency_contact",
      "type": "text",
      "label": "Emergency Contact Name",
      "required": true,
      "placeholder": "Name"
    },
    {
      "id": "emergency_phone",
      "type": "tel",
      "label": "Emergency Contact Phone",
      "required": true,
      "placeholder": "(555) 123-4567"
    },
    {
      "id": "waiver_agreement",
      "type": "checkbox",
      "label": "I understand and agree to the terms of this waiver",
      "required": true,
      "description": "By checking this box, I acknowledge that I have read and agree to release My Kind Kandles & Boutique from any liability."
    },
    {
      "id": "signature",
      "type": "signature",
      "label": "Signature",
      "required": true,
      "description": "Please sign above"
    }
  ]'::jsonb,
  'Liability Waiver & Release Form',
  'By signing this form, you agree to participate at your own risk.'
);
