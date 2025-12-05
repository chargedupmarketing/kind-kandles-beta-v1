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
  },
  promotions: {
    top_bar_banner: {
      enabled: true,
      title: 'PRE-BLACK FRIDAY SALE',
      emoji_left: '🔥',
      emoji_right: '🔥',
      highlight_text: 'Save 25% on everything',
      secondary_text: 'FREE shipping on orders $50+',
      tertiary_text: '',
      background_gradient_from: '#0d9488',
      background_gradient_via: '#14b8a6',
      background_gradient_to: '#2dd4bf',
      text_color: '#ffffff',
      dismissible: true,
      dismiss_duration_hours: 24
    },
    countdown_promo: {
      enabled: true,
      title: '🔥 PRE-BLACK FRIDAY SALE ENDS SOON! 🔥',
      subtitle: 'Early Bird Special - Save 25% on everything + FREE shipping over $50!',
      end_date: '2025-11-27',
      end_time: '23:59',
      background_style: 'pink-purple'
    },
    flash_sale_urgency: {
      enabled: true,
      text: 'Flash sale ends in 24 hours - Don\'t miss out!',
      show_icon: true
    },
    popup_promo: {
      enabled: false,
      title: 'Special Offer!',
      description: 'Get an exclusive discount on your first order',
      discount_percent: 15,
      min_order_amount: 25,
      end_date: '2025-12-31',
      end_time: '23:59',
      trigger: 'delay',
      trigger_delay_seconds: 10,
      trigger_scroll_percent: 50
    }
  }
};

// Public settings that don't require authentication
const publicSettings = ['promotions'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    
    // Check if this is a public setting (no auth required)
    const isPublicSetting = publicSettings.includes(key);
    
    // Verify admin authentication for non-public settings
    if (!isPublicSetting) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
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

