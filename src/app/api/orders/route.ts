import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServerClient } from '@/lib/supabase';
import type { OrderInsert, OrderItemInsert } from '@/lib/database.types';
import { sendOrderConfirmation, sendAdminOrderNotification, isEmailConfigured } from '@/lib/email';
import { notifyAdminsNewOrder } from '@/lib/notifications';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  ValidationError,
  AuthenticationError,
  validateEmail,
  withRetry
} from '@/lib/errors';

// GET /api/orders - List orders (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Cap at 100
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

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
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        query = query.eq('status', statuses[0]);
      } else if (statuses.length > 1) {
        query = query.in('status', statuses);
      }
    }

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          orders: [],
          total: 0,
          limit,
          offset,
          message: 'Orders table not found. Please check your database setup.'
        });
      }
      return NextResponse.json({ 
        error: 'Failed to fetch orders',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      }, { status: 500 });
    }

    // Return in format expected by OrderManagement component
    return NextResponse.json({
      orders: orders || [],
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
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

    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        400,
        'VALIDATION_ERROR',
        { missingFields }
      );
    }

    // Validate email format
    if (!validateEmail(body.customer_email)) {
      return createErrorResponse('Invalid email format', 400, 'VALIDATION_ERROR', { field: 'customer_email' });
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return createErrorResponse('Order must have at least one item', 400, 'VALIDATION_ERROR');
    }

    // Validate each item has required fields
    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i];
      if (!item.title || !item.price || !item.quantity) {
        return createErrorResponse(
          `Item ${i + 1} is missing required fields (title, price, quantity)`,
          400,
          'VALIDATION_ERROR',
          { itemIndex: i }
        );
      }
      if (isNaN(parseFloat(item.price)) || parseFloat(item.price) < 0) {
        return createErrorResponse(`Item ${i + 1} has invalid price`, 400, 'VALIDATION_ERROR', { itemIndex: i });
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return createErrorResponse(`Item ${i + 1} has invalid quantity`, 400, 'VALIDATION_ERROR', { itemIndex: i });
      }
    }

    // Calculate totals
    const subtotal = body.subtotal 
      ? Math.max(0, parseFloat(body.subtotal))
      : body.items.reduce((sum: number, item: any) => {
          return sum + (parseFloat(item.price) * item.quantity);
        }, 0);

    const shippingCost = Math.max(0, parseFloat(body.shipping_cost) || 0);
    const discount = Math.max(0, parseFloat(body.discount) || 0);
    
    // Use provided tax or calculate it (6% default rate)
    const TAX_RATE = 0.06;
    const taxableAmount = subtotal - discount;
    const tax = body.tax !== undefined && body.tax !== null 
      ? Math.max(0, parseFloat(body.tax)) 
      : Math.round(taxableAmount * TAX_RATE * 100) / 100;
    
    const total = Math.max(0, subtotal + shippingCost + tax - discount);

    const serverClient = createServerClient();

    // Create order with retry logic for transient failures
    const orderData: OrderInsert = {
      customer_email: body.customer_email.toLowerCase().trim(),
      customer_name: body.customer_name.trim(),
      customer_phone: body.customer_phone?.trim() || null,
      shipping_address_line1: body.shipping_address_line1.trim(),
      shipping_address_line2: body.shipping_address_line2?.trim() || null,
      shipping_city: body.shipping_city.trim(),
      shipping_state: body.shipping_state.trim().toUpperCase(),
      shipping_postal_code: body.shipping_postal_code.trim(),
      shipping_country: body.shipping_country?.trim() || 'US',
      billing_address_line1: body.billing_address_line1?.trim() || body.shipping_address_line1.trim(),
      billing_address_line2: body.billing_address_line2?.trim() || body.shipping_address_line2?.trim() || null,
      billing_city: body.billing_city?.trim() || body.shipping_city.trim(),
      billing_state: body.billing_state?.trim().toUpperCase() || body.shipping_state.trim().toUpperCase(),
      billing_postal_code: body.billing_postal_code?.trim() || body.shipping_postal_code.trim(),
      billing_country: body.billing_country?.trim() || body.shipping_country?.trim() || 'US',
      subtotal,
      shipping_cost: shippingCost,
      tax,
      discount,
      total,
      status: 'pending',
      payment_status: 'pending',
      shipping_method: body.shipping_method?.trim() || null,
      discount_code: body.discount_code?.trim().toUpperCase() || null,
      notes: body.notes?.trim() || null
    };

    // Use retry for database operations
    const order = await withRetry(async () => {
      const { data, error } = await serverClient
        .from('orders')
        .insert(orderData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }, { maxAttempts: 3, delayMs: 500 });

    if (!order) {
      return createErrorResponse('Failed to create order', 500, 'DATABASE_ERROR');
    }

    // Create order items
    const orderItems: OrderItemInsert[] = body.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id || null,
      variant_id: item.variant_id || null,
      title: item.title.trim(),
      variant_title: item.variant_title?.trim() || null,
      sku: item.sku?.trim() || null,
      quantity: item.quantity,
      price: parseFloat(item.price),
      total: parseFloat(item.price) * item.quantity
    }));

    const { error: itemsError } = await serverClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Delete the order if items failed (rollback)
      await serverClient.from('orders').delete().eq('id', order.id);
      return createErrorResponse('Failed to create order items', 500, 'DATABASE_ERROR');
    }

    // Decrement inventory for each item (non-blocking)
    const inventoryUpdates = body.items.map(async (item: any) => {
      if (!item.variant_id) return;
      
      try {
        const { data: variant } = await serverClient
          .from('product_variants')
          .select('inventory_quantity')
          .eq('id', item.variant_id)
          .single();

        if (variant) {
          const newQuantity = Math.max(0, variant.inventory_quantity - item.quantity);
          
          await serverClient
            .from('product_variants')
            .update({ 
              inventory_quantity: newQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.variant_id);

          console.log(`Decremented inventory for variant ${item.variant_id}: ${variant.inventory_quantity} -> ${newQuantity}`);
        }
      } catch (err) {
        console.error(`Failed to update inventory for variant ${item.variant_id}:`, err);
        // Don't fail the order - inventory can be manually adjusted
      }
    });

    // Wait for inventory updates but don't fail if they error
    await Promise.allSettled(inventoryUpdates);

    // Fetch complete order with items
    const { data: completeOrder } = await serverClient
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('id', order.id)
      .single();

    // Send order confirmation emails (non-blocking)
    if (completeOrder && isEmailConfigured()) {
      // Send customer confirmation
      sendOrderConfirmation(completeOrder).catch(err => {
        console.error('Failed to send customer confirmation email:', err);
      });
    }

    // Send admin notifications via the notification service (respects preferences)
    if (completeOrder) {
      notifyAdminsNewOrder({
        order_number: completeOrder.order_number,
        total: completeOrder.total,
        customer_name: completeOrder.customer_name,
        customer_email: completeOrder.customer_email,
        id: completeOrder.id,
      }).catch(err => {
        console.error('Failed to send admin notifications:', err);
      });
    }

    return createSuccessResponse({ order: completeOrder }, 201);
  } catch (error) {
    console.error('Create order error:', error);
    return createErrorResponse(
      'Failed to create order. Please try again.',
      500,
      'INTERNAL_ERROR',
      process.env.NODE_ENV === 'development' ? { 
        message: (error as Error).message,
        stack: (error as Error).stack 
      } : undefined
    );
  }
}

