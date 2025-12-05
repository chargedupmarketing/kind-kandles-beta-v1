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
        customers: [
          {
            id: '1',
            email: 'customer@example.com',
            first_name: 'Jane',
            last_name: 'Doe',
            phone: '555-123-4567',
            accepts_marketing: true,
            total_orders: 5,
            total_spent: 250.00,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_order_at: new Date().toISOString(),
            notes: null
          }
        ]
      });
    }

    const serverClient = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get('sort') || 'total_spent';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    let query = serverClient
      .from('customers')
      .select('*')
      .order(sort, { ascending: order === 'asc' });

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    const { data: customers, error } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    return NextResponse.json({ customers: customers || [] });
  } catch (error) {
    console.error('Error in customers route:', error);
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

    const { data: customer, error } = await serverClient
      .from('customers')
      .insert({
        email: body.email,
        first_name: body.first_name || null,
        last_name: body.last_name || null,
        phone: body.phone || null,
        accepts_marketing: body.accepts_marketing || false,
        notes: body.notes || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Error in customers POST route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

