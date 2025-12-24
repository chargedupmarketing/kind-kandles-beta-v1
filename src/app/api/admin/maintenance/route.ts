import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const MAINTENANCE_SETTINGS_KEY = 'maintenance_settings';

interface MaintenanceSettings {
  enabled: boolean;
  access_code: string;
  message: string;
  estimated_time: string;
}

const DEFAULT_SETTINGS: MaintenanceSettings = {
  enabled: false,
  access_code: process.env.NEXT_PUBLIC_DEFAULT_MAINTENANCE_CODE || 'ADMIN123',
  message: 'We are currently performing scheduled maintenance to improve your experience. Please check back shortly!',
  estimated_time: '2 hours',
};

// GET - Fetch current maintenance settings
export async function GET() {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', MAINTENANCE_SETTINGS_KEY)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is OK
      console.error('Error fetching maintenance settings:', error);
      return NextResponse.json({ settings: DEFAULT_SETTINGS });
    }

    if (data?.value) {
      // Merge with defaults to ensure all fields exist
      const settings = { ...DEFAULT_SETTINGS, ...data.value };
      return NextResponse.json({ settings });
    }

    return NextResponse.json({ settings: DEFAULT_SETTINGS });
  } catch (error) {
    console.error('Error in maintenance GET:', error);
    return NextResponse.json({ settings: DEFAULT_SETTINGS });
  }
}

// PUT - Update maintenance settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    // Validate the incoming data
    const settings: MaintenanceSettings = {
      enabled: typeof body.enabled === 'boolean' ? body.enabled : DEFAULT_SETTINGS.enabled,
      access_code: typeof body.access_code === 'string' && body.access_code.length >= 6 
        ? body.access_code 
        : DEFAULT_SETTINGS.access_code,
      message: typeof body.message === 'string' ? body.message : DEFAULT_SETTINGS.message,
      estimated_time: typeof body.estimated_time === 'string' ? body.estimated_time : DEFAULT_SETTINGS.estimated_time,
    };

    // Check if settings exist
    const { data: existing } = await supabase
      .from('store_settings')
      .select('id')
      .eq('key', MAINTENANCE_SETTINGS_KEY)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('store_settings')
        .update({ value: settings, updated_at: new Date().toISOString() })
        .eq('key', MAINTENANCE_SETTINGS_KEY);

      if (error) {
        console.error('Error updating maintenance settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('store_settings')
        .insert({
          key: MAINTENANCE_SETTINGS_KEY,
          value: settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error inserting maintenance settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error in maintenance PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

