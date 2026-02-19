import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { notifyCustomerAbandonedCart } from '@/lib/notifications';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kindkandlesboutique.com';

// Parse abandoned cart hours from environment variable (default: 1, 24, 72 hours)
const ABANDONED_CART_HOURS = (process.env.ABANDONED_CART_HOURS || '1,24,72')
  .split(',')
  .map(h => parseInt(h.trim(), 10))
  .filter(h => !isNaN(h));

interface CartItem {
  title: string;
  quantity: number;
  price: number;
}

// POST - Save/update cart for abandoned cart tracking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      session_id,
      customer_email,
      customer_name,
      cart_items,
      cart_total,
    } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Check if cart already exists for this session
    const { data: existingCart } = await supabase
      .from('abandoned_carts')
      .select('id, recovered')
      .eq('session_id', session_id)
      .single();

    // Don't update if cart was already recovered
    if (existingCart?.recovered) {
      return NextResponse.json({ 
        success: true, 
        message: 'Cart already recovered',
        cart_id: existingCart.id 
      });
    }

    const cartData = {
      session_id,
      customer_email: customer_email || null,
      customer_name: customer_name || null,
      cart_data: cart_items || [],
      cart_total: cart_total || 0,
      last_activity_at: new Date().toISOString(),
    };

    if (existingCart) {
      // Update existing cart
      const { error } = await supabase
        .from('abandoned_carts')
        .update(cartData)
        .eq('id', existingCart.id);

      if (error) {
        console.error('Error updating abandoned cart:', error);
        return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Cart updated',
        cart_id: existingCart.id 
      });
    } else {
      // Create new cart
      const { data: newCart, error } = await supabase
        .from('abandoned_carts')
        .insert(cartData)
        .select()
        .single();

      if (error) {
        console.error('Error creating abandoned cart:', error);
        return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Cart created',
        cart_id: newCart.id 
      });
    }
  } catch (error) {
    console.error('Abandoned cart POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Mark cart as recovered (when order is placed)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, order_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from('abandoned_carts')
      .update({
        recovered: true,
        recovered_order_id: order_id || null,
      })
      .eq('session_id', session_id);

    if (error) {
      console.error('Error marking cart as recovered:', error);
      return NextResponse.json({ error: 'Failed to mark cart as recovered' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Cart marked as recovered' });
  } catch (error) {
    console.error('Abandoned cart PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Process abandoned carts and send reminders (called by cron job)
// This endpoint should be called periodically (e.g., every hour) to check for abandoned carts
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();
    const now = new Date();
    const results = {
      processed: 0,
      sent_1h: 0,
      sent_24h: 0,
      sent_72h: 0,
      errors: 0,
    };

    // Get all abandoned carts that haven't been recovered and have an email
    const { data: carts, error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('recovered', false)
      .not('customer_email', 'is', null);

    if (error) {
      console.error('Error fetching abandoned carts:', error);
      return NextResponse.json({ error: 'Failed to fetch carts' }, { status: 500 });
    }

    if (!carts || carts.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No abandoned carts to process',
        results 
      });
    }

    for (const cart of carts) {
      results.processed++;

      const lastActivity = new Date(cart.last_activity_at);
      const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

      // Parse cart data
      let cartItems: CartItem[] = [];
      try {
        cartItems = Array.isArray(cart.cart_data) ? cart.cart_data : [];
      } catch {
        cartItems = [];
      }

      // Skip if cart is empty
      if (cartItems.length === 0) {
        continue;
      }

      // Check which reminders to send based on configured hours
      const [hour1, hour24, hour72] = ABANDONED_CART_HOURS;

      // 1-hour reminder
      if (hour1 && hoursSinceActivity >= hour1 && !cart.reminder_sent_1h) {
        try {
          await notifyCustomerAbandonedCart({
            id: cart.id,
            customer_name: cart.customer_name || 'there',
            customer_email: cart.customer_email,
            cart_url: `${SITE_URL}/cart`,
          });

          await supabase
            .from('abandoned_carts')
            .update({ reminder_sent_1h: true })
            .eq('id', cart.id);

          results.sent_1h++;
        } catch (err) {
          console.error(`Failed to send 1h reminder for cart ${cart.id}:`, err);
          results.errors++;
        }
      }

      // 24-hour reminder
      if (hour24 && hoursSinceActivity >= hour24 && !cart.reminder_sent_24h && cart.reminder_sent_1h) {
        try {
          await notifyCustomerAbandonedCart({
            id: cart.id,
            customer_name: cart.customer_name || 'there',
            customer_email: cart.customer_email,
            cart_url: `${SITE_URL}/cart`,
          });

          await supabase
            .from('abandoned_carts')
            .update({ reminder_sent_24h: true })
            .eq('id', cart.id);

          results.sent_24h++;
        } catch (err) {
          console.error(`Failed to send 24h reminder for cart ${cart.id}:`, err);
          results.errors++;
        }
      }

      // 72-hour reminder
      if (hour72 && hoursSinceActivity >= hour72 && !cart.reminder_sent_72h && cart.reminder_sent_24h) {
        try {
          await notifyCustomerAbandonedCart({
            id: cart.id,
            customer_name: cart.customer_name || 'there',
            customer_email: cart.customer_email,
            cart_url: `${SITE_URL}/cart`,
          });

          await supabase
            .from('abandoned_carts')
            .update({ reminder_sent_72h: true })
            .eq('id', cart.id);

          results.sent_72h++;
        } catch (err) {
          console.error(`Failed to send 72h reminder for cart ${cart.id}:`, err);
          results.errors++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Abandoned cart processing complete',
      results,
    });
  } catch (error) {
    console.error('Abandoned cart GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Clean up old abandoned carts (older than 30 days)
export async function DELETE(request: NextRequest) {
  try {
    // Verify cron secret or admin auth
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const { error, data } = await supabase
      .from('abandoned_carts')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning up abandoned carts:', error);
      return NextResponse.json({ error: 'Failed to clean up carts' }, { status: 500 });
    }

    const deletedCount = data?.length || 0;

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} old abandoned carts`,
      deleted: deletedCount,
    });
  } catch (error) {
    console.error('Abandoned cart DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
