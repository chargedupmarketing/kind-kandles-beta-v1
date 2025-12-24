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
export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('admin-token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('admin-token')) {
      console.error('Unauthorized access attempt to maintenance settings');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received maintenance settings update:', body);
    
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

    console.log('Validated settings:', settings);

    // Check if settings exist
    const { data: existing, error: selectError } = await supabase
      .from('store_settings')
      .select('id')
      .eq('key', MAINTENANCE_SETTINGS_KEY)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking existing settings:', selectError);
      return NextResponse.json({ error: 'Database error: ' + selectError.message }, { status: 500 });
    }

    if (existing) {
      console.log('Updating existing maintenance settings with id:', existing.id);
      // Update existing
      const { error } = await supabase
        .from('store_settings')
        .update({ value: settings })
        .eq('key', MAINTENANCE_SETTINGS_KEY);

      if (error) {
        console.error('Error updating maintenance settings:', error);
        return NextResponse.json({ error: 'Failed to update settings: ' + error.message }, { status: 500 });
      }
      console.log('Successfully updated maintenance settings');
    } else {
      console.log('Inserting new maintenance settings');
      // Insert new
      const { error } = await supabase
        .from('store_settings')
        .insert({
          key: MAINTENANCE_SETTINGS_KEY,
          value: settings,
        });

      if (error) {
        console.error('Error inserting maintenance settings:', error);
        return NextResponse.json({ error: 'Failed to save settings: ' + error.message }, { status: 500 });
      }
      console.log('Successfully inserted maintenance settings');
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error in maintenance PUT:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') 
    }, { status: 500 });
  }
}

