import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendShippingNotification, isEmailConfigured } from '@/lib/email';

// GET /api/orders/[id] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if it's an order number or UUID
    const isOrderNumber = id.startsWith('MKK-');
    
    const serverClient = createServerClient();

    let query = serverClient
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `);

    if (isOrderNumber) {
      query = query.eq('order_number', id);
    } else {
      query = query.eq('id', id);
    }

    const { data: order, error } = await query.single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/orders/[id] - Update order (admin only)
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

    const serverClient = createServerClient();
    const body = await request.json();

    const updateData: any = {};
    
    // Only allow updating certain fields
    if (body.status !== undefined) updateData.status = body.status;
    if (body.payment_status !== undefined) updateData.payment_status = body.payment_status;
    if (body.tracking_number !== undefined) updateData.tracking_number = body.tracking_number;
    if (body.tracking_url !== undefined) updateData.tracking_url = body.tracking_url;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.shipping_method !== undefined) updateData.shipping_method = body.shipping_method;

    const { data: order, error } = await serverClient
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        items:order_items(*)
      `)
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // Send shipping notification if status changed to shipped and send_notification is true
    let emailSent = false;
    if (body.status === 'shipped' && body.send_notification && order) {
      if (isEmailConfigured()) {
        const emailResult = await sendShippingNotification(order);
        emailSent = emailResult.success;
        if (!emailResult.success) {
          console.error('Failed to send shipping notification:', emailResult.error);
        }
      } else {
        console.log('Email not configured, skipping shipping notification');
      }
    }

    return NextResponse.json({ order, emailSent });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

