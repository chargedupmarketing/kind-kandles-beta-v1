import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      // Return mock data when Supabase is not configured
      return NextResponse.json({
        discounts: [
          {
            id: '1',
            code: 'WELCOME10',
            type: 'percentage',
            value: 10,
            min_purchase: 25,
            max_uses: 100,
            uses: 45,
            starts_at: null,
            ends_at: null,
            active: true,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            code: 'FREESHIP',
            type: 'free_shipping',
            value: 0,
            min_purchase: 50,
            max_uses: null,
            uses: 23,
            starts_at: null,
            ends_at: null,
            active: true,
            created_at: new Date().toISOString()
          }
        ]
      });
    }

    const serverClient = createServerClient();

    const { data: discounts, error } = await serverClient
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching discounts:', error);
      return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
    }

    return NextResponse.json({ discounts: discounts || [] });
  } catch (error) {
    console.error('Error in discounts route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Validate required fields
    if (!body.code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Check if code already exists
    const { data: existing } = await serverClient
      .from('discount_codes')
      .select('id')
      .eq('code', body.code.toUpperCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Discount code already exists' }, { status: 400 });
    }

    const { data: discount, error } = await serverClient
      .from('discount_codes')
      .insert({
        code: body.code.toUpperCase(),
        type: body.type || 'percentage',
        value: body.value || 0,
        min_purchase: body.min_purchase || null,
        max_uses: body.max_uses || null,
        uses: 0,
        starts_at: body.starts_at || null,
        ends_at: body.ends_at || null,
        active: body.active !== undefined ? body.active : true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating discount:', error);
      return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
    }

    return NextResponse.json({ discount }, { status: 201 });
  } catch (error) {
    console.error('Error in discounts POST route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

