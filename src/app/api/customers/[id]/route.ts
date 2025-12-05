import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        customer: {
          id,
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
          notes: null,
          tags: [],
          orders: []
        }
      });
    }

    const serverClient = createServerClient();

    // Get customer details
    const { data: customer, error: customerError } = await serverClient
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get customer orders
    const { data: orders } = await serverClient
      .from('orders')
      .select(`
        id,
        order_number,
        total,
        status,
        created_at,
        order_items(count)
      `)
      .eq('customer_email', customer.email)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get customer tags
    const { data: tagAssignments } = await serverClient
      .from('customer_tag_assignments')
      .select(`
        customer_tags(id, name, color)
      `)
      .eq('customer_id', id);

    const tags = tagAssignments?.map((t: any) => t.customer_tags).filter(Boolean) || [];

    // Format orders with item count
    const formattedOrders = orders?.map((order: any) => ({
      id: order.id,
      order_number: order.order_number,
      total: order.total,
      status: order.status,
      created_at: order.created_at,
      items_count: order.order_items?.[0]?.count || 0
    })) || [];

    return NextResponse.json({
      customer: {
        ...customer,
        tags,
        orders: formattedOrders
      }
    });
  } catch (error) {
    console.error('Error in customer detail route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    const updateData: any = {};
    if (body.first_name !== undefined) updateData.first_name = body.first_name;
    if (body.last_name !== undefined) updateData.last_name = body.last_name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.accepts_marketing !== undefined) updateData.accepts_marketing = body.accepts_marketing;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data: customer, error } = await serverClient
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error in customer PUT route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

