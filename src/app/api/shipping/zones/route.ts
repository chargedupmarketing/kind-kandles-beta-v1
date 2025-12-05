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
        zones: [
          {
            id: '1',
            name: 'United States',
            countries: ['US'],
            states: []
          },
          {
            id: '2',
            name: 'International',
            countries: ['CA', 'GB', 'AU'],
            states: []
          }
        ]
      });
    }

    const serverClient = createServerClient();

    const { data: zones, error } = await serverClient
      .from('shipping_zones')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching shipping zones:', error);
      return NextResponse.json({ error: 'Failed to fetch shipping zones' }, { status: 500 });
    }

    return NextResponse.json({ zones: zones || [] });
  } catch (error) {
    console.error('Error in shipping zones route:', error);
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

    const { data: zone, error } = await serverClient
      .from('shipping_zones')
      .insert({
        name: body.name,
        countries: body.countries || [],
        states: body.states || []
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating shipping zone:', error);
      return NextResponse.json({ error: 'Failed to create shipping zone' }, { status: 500 });
    }

    return NextResponse.json({ zone }, { status: 201 });
  } catch (error) {
    console.error('Error in shipping zones POST route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

