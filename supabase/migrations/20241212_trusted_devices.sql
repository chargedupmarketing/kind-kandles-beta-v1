-- Create trusted_devices table for "Remember this device" 2FA feature
CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL DEFAULT 'Unknown Device',
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_token ON trusted_devices(device_token);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_expires ON trusted_devices(expires_at);

-- Enable RLS
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own trusted devices
CREATE POLICY "Users can view own trusted devices" ON trusted_devices
  FOR SELECT USING (true);

-- Policy: Allow insert for authenticated requests
CREATE POLICY "Allow insert trusted devices" ON trusted_devices
  FOR INSERT WITH CHECK (true);

-- Policy: Allow update for authenticated requests
CREATE POLICY "Allow update trusted devices" ON trusted_devices
  FOR UPDATE USING (true);

-- Policy: Allow delete for authenticated requests
CREATE POLICY "Allow delete trusted devices" ON trusted_devices
  FOR DELETE USING (true);

-- Function to clean up expired trusted devices (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_trusted_devices()
RETURNS void AS $$
BEGIN
  DELETE FROM trusted_devices WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE trusted_devices IS 'Stores trusted devices for 2FA "Remember this device" feature (30 days)';
COMMENT ON COLUMN trusted_devices.device_token IS 'Secure random token stored in httpOnly cookie';
COMMENT ON COLUMN trusted_devices.device_name IS 'Human-readable device name parsed from user agent';
COMMENT ON COLUMN trusted_devices.expires_at IS 'When this trusted device expires (default 30 days from creation)';

