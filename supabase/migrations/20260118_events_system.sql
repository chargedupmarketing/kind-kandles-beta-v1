-- =====================================================
-- Events System Migration
-- My Kind Kandles & Boutique - Event Booking System
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

-- Event types
CREATE TYPE event_type AS ENUM ('workshop', 'class', 'community', 'private', 'other');

-- Location types
CREATE TYPE location_type AS ENUM ('mobile', 'fixed', 'both');

-- Pricing models
CREATE TYPE pricing_model AS ENUM ('per_person', 'flat_rate', 'custom_quote', 'tiered');

-- Occurrence status
CREATE TYPE occurrence_status AS ENUM ('available', 'full', 'cancelled');

-- Booking status
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Payment status
CREATE TYPE payment_status AS ENUM ('unpaid', 'deposit_paid', 'fully_paid', 'refunded');

-- =====================================================
-- EVENT CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS event_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_categories_slug ON event_categories(slug);
CREATE INDEX idx_event_categories_position ON event_categories(position);

-- =====================================================
-- EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  event_type event_type NOT NULL DEFAULT 'workshop',
  location_type location_type NOT NULL DEFAULT 'both',
  fixed_location_address TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 120,
  min_participants INTEGER DEFAULT 1,
  max_participants INTEGER DEFAULT 20,
  pricing_model pricing_model NOT NULL DEFAULT 'per_person',
  base_price DECIMAL(10,2),
  price_tiers JSONB,
  deposit_required BOOLEAN DEFAULT FALSE,
  deposit_amount DECIMAL(10,2),
  image_url TEXT,
  gallery_images TEXT[],
  includes TEXT[],
  requirements TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_location_type ON events(location_type);
CREATE INDEX idx_events_is_active ON events(is_active);
CREATE INDEX idx_events_featured ON events(featured);

-- =====================================================
-- EVENT OCCURRENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS event_occurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  location_type location_type,
  location_address TEXT,
  max_participants INTEGER,
  current_bookings INTEGER DEFAULT 0,
  status occurrence_status DEFAULT 'available',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_occurrences_event_id ON event_occurrences(event_id);
CREATE INDEX idx_event_occurrences_start_datetime ON event_occurrences(start_datetime);
CREATE INDEX idx_event_occurrences_status ON event_occurrences(status);

-- =====================================================
-- EVENT BOOKINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS event_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  occurrence_id UUID REFERENCES event_occurrences(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  num_participants INTEGER NOT NULL DEFAULT 1,
  location_preference location_type,
  requested_address TEXT,
  requested_date DATE,
  requested_time TEXT,
  special_requests TEXT,
  total_price DECIMAL(10,2),
  status booking_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'unpaid',
  confirmation_sent_at TIMESTAMPTZ,
  admin_notes TEXT,
  ip_address TEXT,
  user_agent TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_bookings_event_id ON event_bookings(event_id);
CREATE INDEX idx_event_bookings_occurrence_id ON event_bookings(occurrence_id);
CREATE INDEX idx_event_bookings_customer_email ON event_bookings(customer_email);
CREATE INDEX idx_event_bookings_status ON event_bookings(status);
CREATE INDEX idx_event_bookings_payment_status ON event_bookings(payment_status);
CREATE INDEX idx_event_bookings_submitted_at ON event_bookings(submitted_at DESC);

-- =====================================================
-- EVENT-CATEGORY JUNCTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS event_category_mappings (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES event_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, category_id)
);

CREATE INDEX idx_event_category_mappings_event_id ON event_category_mappings(event_id);
CREATE INDEX idx_event_category_mappings_category_id ON event_category_mappings(category_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Events updated_at trigger
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- Event occurrences updated_at trigger
CREATE OR REPLACE FUNCTION update_event_occurrences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_occurrences_updated_at
  BEFORE UPDATE ON event_occurrences
  FOR EACH ROW
  EXECUTE FUNCTION update_event_occurrences_updated_at();

-- Event bookings updated_at trigger
CREATE OR REPLACE FUNCTION update_event_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_bookings_updated_at
  BEFORE UPDATE ON event_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_event_bookings_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_category_mappings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - EVENT CATEGORIES
-- =====================================================

-- Anyone can view event categories
CREATE POLICY "Anyone can view event categories"
  ON event_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admins can insert event categories
CREATE POLICY "Admins can insert event categories"
  ON event_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Only admins can update event categories
CREATE POLICY "Admins can update event categories"
  ON event_categories
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

-- Only admins can delete event categories
CREATE POLICY "Admins can delete event categories"
  ON event_categories
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
-- RLS POLICIES - EVENTS
-- =====================================================

-- Anyone can view active events
CREATE POLICY "Anyone can view active events"
  ON events
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admins can view all events
CREATE POLICY "Admins can view all events"
  ON events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Only admins can insert events
CREATE POLICY "Admins can insert events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Only admins can update events
CREATE POLICY "Admins can update events"
  ON events
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

-- Only admins can delete events
CREATE POLICY "Admins can delete events"
  ON events
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
-- RLS POLICIES - EVENT OCCURRENCES
-- =====================================================

-- Anyone can view available occurrences for active events
CREATE POLICY "Anyone can view available occurrences"
  ON event_occurrences
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'available' AND
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_occurrences.event_id
      AND events.is_active = true
    )
  );

-- Admins can view all occurrences
CREATE POLICY "Admins can view all occurrences"
  ON event_occurrences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Only admins can insert occurrences
CREATE POLICY "Admins can insert occurrences"
  ON event_occurrences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Only admins can update occurrences
CREATE POLICY "Admins can update occurrences"
  ON event_occurrences
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

-- Only admins can delete occurrences
CREATE POLICY "Admins can delete occurrences"
  ON event_occurrences
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
-- RLS POLICIES - EVENT BOOKINGS
-- =====================================================

-- Anyone can submit bookings (public booking form)
CREATE POLICY "Anyone can submit event bookings"
  ON event_bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view bookings
CREATE POLICY "Admins can view event bookings"
  ON event_bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Only admins can update bookings
CREATE POLICY "Admins can update event bookings"
  ON event_bookings
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

-- Only admins can delete bookings
CREATE POLICY "Admins can delete event bookings"
  ON event_bookings
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
-- RLS POLICIES - EVENT-CATEGORY MAPPINGS
-- =====================================================

-- Anyone can view mappings
CREATE POLICY "Anyone can view event category mappings"
  ON event_category_mappings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admins can manage mappings
CREATE POLICY "Admins can manage event category mappings"
  ON event_category_mappings
  FOR ALL
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

-- =====================================================
-- SEED DATA - DEFAULT EVENT CATEGORIES
-- =====================================================

INSERT INTO event_categories (name, slug, description, icon, color, position) VALUES
  ('Candle Making', 'candle-making', 'Learn to create your own custom candles', '🕯️', '#f59e0b', 1),
  ('Workshops', 'workshops', 'Hands-on learning experiences', '🎨', '#ec4899', 2),
  ('Private Events', 'private-events', 'Exclusive events for your group', '👥', '#8b5cf6', 3),
  ('Community', 'community', 'Connect with fellow craft enthusiasts', '🌸', '#14b8a6', 4)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE events IS 'Core event templates and details';
COMMENT ON TABLE event_occurrences IS 'Specific scheduled instances of events';
COMMENT ON TABLE event_bookings IS 'Customer booking requests and confirmations';
COMMENT ON TABLE event_categories IS 'Categories for organizing events';
COMMENT ON TABLE event_category_mappings IS 'Many-to-many relationship between events and categories';
