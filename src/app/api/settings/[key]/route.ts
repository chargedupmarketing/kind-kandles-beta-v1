import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';

// Default settings values
const defaultSettings: Record<string, any> = {
  store_info: {
    name: 'My Kind Kandles & Boutique',
    email: 'info@kindkandlesboutique.com',
    phone: '',
    address: {
      line1: '9505 Reisterstown Rd',
      line2: 'Suite 2SE',
      city: 'Owings Mills',
      state: 'MD',
      postal_code: '21117',
      country: 'US'
    },
    logo_url: '/logos/logo.png',
    tagline: 'Do All Things With Kindness'
  },
  tax_settings: {
    default_rate: 0.06,
    tax_inclusive: false,
    tax_shipping: false
  },
  email_settings: {
    from_email: 'orders@kindkandlesboutique.com',
    from_name: 'My Kind Kandles',
    admin_email: 'admin@kindkandlesboutique.com'
  },
  checkout_settings: {
    free_shipping_threshold: 50,
    allow_guest_checkout: true,
    require_phone: false
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      // Return default settings when Supabase is not configured
      const value = defaultSettings[key];
      if (value) {
        return NextResponse.json({ key, value });
      }
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    const serverClient = createServerClient();

    const { data: setting, error } = await serverClient
      .from('store_settings')
      .select('*')
      .eq('key', key)
      .single();

    if (error || !setting) {
      // Return default if exists
      const defaultValue = defaultSettings[key];
      if (defaultValue) {
        return NextResponse.json({ key, value: defaultValue });
      }
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    return NextResponse.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error('Error in settings GET route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const serverClient = createServerClient();
    const body = await request.json();

    if (!body.value) {
      return NextResponse.json({ error: 'Value is required' }, { status: 400 });
    }

    // Upsert the setting
    const { data: setting, error } = await serverClient
      .from('store_settings')
      .upsert({
        key,
        value: body.value,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating setting:', error);
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }

    return NextResponse.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error('Error in settings PUT route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

