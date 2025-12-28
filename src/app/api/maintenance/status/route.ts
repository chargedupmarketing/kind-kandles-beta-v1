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

/**
 * Public endpoint to check maintenance mode status
 * This is accessible to all users (no authentication required)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', MAINTENANCE_SETTINGS_KEY)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching maintenance settings:', error);
      return NextResponse.json({ 
        enabled: DEFAULT_SETTINGS.enabled,
        message: DEFAULT_SETTINGS.message,
        estimated_time: DEFAULT_SETTINGS.estimated_time
      });
    }

    if (data?.value) {
      const settings = { ...DEFAULT_SETTINGS, ...data.value };
      // Don't expose the access code to public
      return NextResponse.json({
        enabled: settings.enabled,
        message: settings.message,
        estimated_time: settings.estimated_time
      });
    }

    return NextResponse.json({
      enabled: DEFAULT_SETTINGS.enabled,
      message: DEFAULT_SETTINGS.message,
      estimated_time: DEFAULT_SETTINGS.estimated_time
    });
  } catch (error) {
    console.error('Error in maintenance status GET:', error);
    return NextResponse.json({
      enabled: DEFAULT_SETTINGS.enabled,
      message: DEFAULT_SETTINGS.message,
      estimated_time: DEFAULT_SETTINGS.estimated_time
    });
  }
}

