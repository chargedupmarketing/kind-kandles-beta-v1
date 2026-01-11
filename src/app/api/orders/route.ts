import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServerClient } from '@/lib/supabase';
import type { OrderInsert, OrderItemInsert } from '@/lib/database.types';
import { sendOrderConfirmation, sendAdminOrderNotification, isEmailConfigured } from '@/lib/email';

// GET /api/orders - List orders (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const serverClient = createServerClient();

    let query = serverClient
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      // Support comma-separated status values
      const statuses = status.split(',').map(s => s.trim());
      if (statuses.length === 1) {
        query = query.eq('status', statuses[0]);
      } else {
        query = query.in('status', statuses);
      }
    }

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json({
      orders: orders || [],
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/orders - Create a new order (from checkout)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'customer_email',
      'customer_name',
      'shipping_address_line1',
      'shipping_city',
      'shipping_state',
      'shipping_postal_code',
      'items'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'Order must have at least one item' }, { status: 400 });
    }

    // Calculate totals
    const subtotal = body.items.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);

    const shippingCost = body.shipping_cost || 0;
    const tax = body.tax || 0;
    const discount = body.discount || 0;
    const total = subtotal + shippingCost + tax - discount;

    const serverClient = createServerClient();

    // Create order
    const orderData: OrderInsert = {
      customer_email: body.customer_email,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone || null,
      shipping_address_line1: body.shipping_address_line1,
      shipping_address_line2: body.shipping_address_line2 || null,
      shipping_city: body.shipping_city,
      shipping_state: body.shipping_state,
      shipping_postal_code: body.shipping_postal_code,
      shipping_country: body.shipping_country || 'US',
      billing_address_line1: body.billing_address_line1 || body.shipping_address_line1,
      billing_address_line2: body.billing_address_line2 || body.shipping_address_line2,
      billing_city: body.billing_city || body.shipping_city,
      billing_state: body.billing_state || body.shipping_state,
      billing_postal_code: body.billing_postal_code || body.shipping_postal_code,
      billing_country: body.billing_country || body.shipping_country || 'US',
      subtotal,
      shipping_cost: shippingCost,
      tax,
      discount,
      total,
      status: 'pending',
      payment_status: 'pending',
      shipping_method: body.shipping_method || null,
      discount_code: body.discount_code || null,
      notes: body.notes || null
    };

    const { data: order, error: orderError } = await serverClient
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Create order items
    const orderItems: OrderItemInsert[] = body.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      title: item.title,
      variant_title: item.variant_title || null,
      sku: item.sku || null,
      quantity: item.quantity,
      price: parseFloat(item.price),
      total: parseFloat(item.price) * item.quantity
    }));

    const { error: itemsError } = await serverClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Delete the order if items failed
      await serverClient.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    // Decrement inventory for each item
    for (const item of body.items) {
      if (item.variant_id) {
        // Get current inventory
        const { data: variant } = await serverClient
          .from('product_variants')
          .select('inventory_quantity')
          .eq('id', item.variant_id)
          .single();

        if (variant) {
          const newQuantity = Math.max(0, variant.inventory_quantity - item.quantity);
          
          // Update inventory
          const { error: inventoryError } = await serverClient
            .from('product_variants')
            .update({ 
              inventory_quantity: newQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.variant_id);

          if (inventoryError) {
            console.error(`Failed to update inventory for variant ${item.variant_id}:`, inventoryError);
            // Log but don't fail the order - inventory can be manually adjusted
          } else {
            console.log(`✅ Decremented inventory for variant ${item.variant_id}: ${variant.inventory_quantity} → ${newQuantity}`);
          }
        }
      }
    }

    // Fetch complete order with items
    const { data: completeOrder } = await serverClient
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('id', order.id)
      .single();

    // Send order confirmation emails
    if (completeOrder && isEmailConfigured()) {
      // Send confirmation to customer
      sendOrderConfirmation(completeOrder).catch(err => {
        console.error('Failed to send order confirmation:', err);
      });
      
      // Send notification to admin
      sendAdminOrderNotification(completeOrder).catch(err => {
        console.error('Failed to send admin notification:', err);
      });
    }

    return NextResponse.json({ order: completeOrder }, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

