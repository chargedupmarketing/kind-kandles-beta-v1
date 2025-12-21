import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Default shipping settings
const DEFAULT_SETTINGS = {
  enabled: true,
  freeShippingThreshold: 50,
  freeShippingEnabled: true,
  handlingFee: 0,
  enabledCarriers: ['usps', 'ups', 'fedex'],
  defaultParcelSize: 'auto',
  insuranceEnabled: false,
  signatureRequired: false,
  storeAddress: {
    name: 'Kind Kandles',
    company: 'My Kind Kandles & Boutique',
    street1: '42 2nd Ave',
    street2: 'Unit 29',
    city: 'North Attleboro',
    state: 'MA',
    zip: '02760',
    country: 'US',
    phone: '',
    email: 'orders@kindkandlesboutique.com',
  },
  parcelPresets: [
    { name: 'Small (1-2 items)', length: 6, width: 6, height: 4, weight: 1 },
    { name: 'Medium (3-4 items)', length: 10, width: 8, height: 6, weight: 3 },
    { name: 'Large (5+ items)', length: 14, width: 10, height: 8, weight: 6 },
  ],
  labelFormat: 'PDF',
  testMode: false,
};

// Get shipping settings
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ settings: DEFAULT_SETTINGS });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'shipping_settings')
      .single();

    if (error || !data?.value) {
      return NextResponse.json({ settings: DEFAULT_SETTINGS });
    }

    // Merge with defaults to ensure all fields exist
    const settings = { ...DEFAULT_SETTINGS, ...data.value };

    return NextResponse.json({ settings });

  } catch (error: any) {
    console.error('Error getting shipping settings:', error);
    return NextResponse.json(
      { error: 'Failed to get shipping settings', settings: DEFAULT_SETTINGS },
      { status: 500 }
    );
  }
}

// Update shipping settings
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    // Merge with defaults
    const updatedSettings = { ...DEFAULT_SETTINGS, ...settings };

    const supabase = createServerClient();
    
    // Upsert the settings
    const { error } = await supabase
      .from('store_settings')
      .upsert({
        key: 'shipping_settings',
        value: updatedSettings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key',
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
    });

  } catch (error: any) {
    console.error('Error updating shipping settings:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping settings', details: error.message },
      { status: 500 }
    );
  }
}

