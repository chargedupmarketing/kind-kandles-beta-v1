-- =====================================================
-- Update Events System Enums
-- Fix enum values to match TypeScript implementation
-- =====================================================

-- Update booking_status enum to include 'no_show'
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'no_show';

-- Update payment_status enum values
-- Note: PostgreSQL doesn't allow renaming enum values directly
-- We need to create a new enum and migrate the data

-- Create new payment status enum with correct values
CREATE TYPE payment_status_new AS ENUM ('pending', 'deposit_paid', 'paid', 'refunded', 'failed');

-- Update the event_bookings table to use the new enum
-- First, add a temporary column
ALTER TABLE event_bookings ADD COLUMN payment_status_temp payment_status_new;

-- Migrate existing data with mapping
UPDATE event_bookings SET payment_status_temp = 
  CASE 
    WHEN payment_status = 'unpaid' THEN 'pending'::payment_status_new
    WHEN payment_status = 'deposit_paid' THEN 'deposit_paid'::payment_status_new
    WHEN payment_status = 'fully_paid' THEN 'paid'::payment_status_new
    WHEN payment_status = 'refunded' THEN 'refunded'::payment_status_new
    ELSE 'pending'::payment_status_new
  END;

-- Drop the old column and rename the new one
ALTER TABLE event_bookings DROP COLUMN payment_status;
ALTER TABLE event_bookings RENAME COLUMN payment_status_temp TO payment_status;

-- Set default value
ALTER TABLE event_bookings ALTER COLUMN payment_status SET DEFAULT 'pending'::payment_status_new;

-- Drop the old enum type
DROP TYPE payment_status;

-- Rename the new enum type
ALTER TYPE payment_status_new RENAME TO payment_status;

-- Recreate the index on payment_status
CREATE INDEX IF NOT EXISTS idx_event_bookings_payment_status ON event_bookings(payment_status);

-- Update RLS policies if needed (they should still work as they reference the column, not the enum values)

COMMENT ON TYPE payment_status IS 'Payment status values: pending, deposit_paid, paid, refunded, failed';
COMMENT ON TYPE booking_status IS 'Booking status values: pending, confirmed, cancelled, completed, no_show';
