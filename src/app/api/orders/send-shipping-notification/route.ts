import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendShippingNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Fetch the order with items
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Send shipping notification
    const result = await sendShippingNotification(order);

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Notification sent' });
    } else {
      return NextResponse.json({ error: result.error || 'Failed to send notification' }, { status: 500 });
    }
  } catch (error) {
    console.error('Send shipping notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

