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
      title: 'HOLIDAY SALE',
      emoji_left: '🎄',
      emoji_right: '🎁',
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
      title: '🔥 HOLIDAY SALE ENDS SOON! 🔥',
      subtitle: 'Holiday Special - Save 25% on everything + FREE shipping over $50!',
      end_date: '2025-12-31',
      end_time: '23:59',
      background_style: 'teal'
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
  },
  featured_products: {
    enabled: true,
    title: 'Featured Products',
    subtitle: 'Our most beloved handmade treasures, crafted with love and flying off the shelves',
    tagline: 'Each piece tells a story of kindness',
    show_emojis: true,
    categories: [
      {
        id: 'candles',
        name: 'Candles',
        icon: '🕯️',
        color: 'from-amber-500 to-orange-500',
        collectionHandle: 'candles',
        enabled: true,
        order: 0
      },
      {
        id: 'skincare',
        name: 'Skincare',
        icon: '✨',
        color: 'from-teal-500 to-cyan-500',
        collectionHandle: 'skincare',
        enabled: true,
        order: 1
      },
      {
        id: 'body-oils',
        name: 'Body Oils',
        icon: '🌿',
        color: 'from-green-500 to-emerald-500',
        collectionHandle: 'body-oils',
        enabled: true,
        order: 2
      }
    ],
    products_per_category: 3,
    show_sale_badge: true,
    show_stock_alert: true,
    stock_alert_threshold: 5
  },
  square_settings: {
    application_id: '',
    access_token: '',
    location_id: '',
    webhook_signature_key: '',
    mode: 'sandbox'
  },
  blog: {
    posts: [
      {
        id: 'the-thoughtful-gift-that-always-wins',
        title: 'The Thoughtful Gift That Always Wins',
        slug: 'the-thoughtful-gift-that-always-wins',
        author: 'Kia Wells',
        date: 'March 30, 2025',
        excerpt: 'Candles are like the little black dress of gift-giving—always appropriate, always appreciated. But with so many options, how do you choose the right one?',
        content: '',
        image: '/logos/1.webp',
        status: 'published',
        featured: true,
        tags: ['gifts', 'candles'],
        created_at: '2025-03-30',
        updated_at: '2025-03-30'
      },
      {
        id: 'candles-color-psychology',
        title: 'Candles & Color Psychology: How to Design Your Space with Wax & Wick',
        slug: 'candles-color-psychology',
        author: 'Kia Wells',
        date: 'March 30, 2025',
        excerpt: 'Color psychology applies to candles too. Studies show that different colors evoke specific emotional responses. Design your space with intention.',
        content: '',
        image: '/logos/2.webp',
        status: 'published',
        featured: false,
        tags: ['design', 'psychology', 'candles'],
        created_at: '2025-03-30',
        updated_at: '2025-03-30'
      },
      {
        id: 'emotions-are-triggered-by-what',
        title: 'Emotions are triggered by - WHAT?',
        slug: 'emotions-are-triggered-by-what',
        author: 'Kia Wells',
        date: 'March 30, 2025',
        excerpt: 'Studies show that 75% of emotions are triggered by scent. The right fragrance makes your home feel inviting and luxurious.',
        content: '',
        image: '/logos/3.webp',
        status: 'published',
        featured: false,
        tags: ['scent', 'emotions', 'wellness'],
        created_at: '2025-03-30',
        updated_at: '2025-03-30'
      }
    ],
    hero_title: 'KKB Blog',
    hero_subtitle: 'Insights, tips, and inspiration from the world of candles and self-care'
  }
};

// Public settings that don't require authentication
const publicSettings = ['promotions', 'featured_products'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    
    // Special handling for square_status - check if Square is configured
    if (key === 'square_status') {
      const hasApplicationId = !!process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
      const hasAccessToken = !!process.env.SQUARE_ACCESS_TOKEN;
      const hasLocationId = !!process.env.SQUARE_LOCATION_ID;
      return NextResponse.json({
        configured: hasApplicationId && hasAccessToken && hasLocationId,
        hasApplicationId,
        hasAccessToken,
        hasLocationId,
        mode: process.env.SQUARE_ENVIRONMENT === 'production' ? 'production' : 'sandbox'
      });
    }
    
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

    const response = NextResponse.json({ key: setting.key, value: setting.value });
    // Prevent caching for dynamic settings
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    console.error('Error in settings GET route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Disable static generation for this route
export const dynamic = 'force-dynamic';

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

