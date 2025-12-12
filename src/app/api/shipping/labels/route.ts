import { NextRequest, NextResponse } from 'next/server';
import { 
  purchaseLabel, 
  registerTrackingWebhook,
  isShippoConfigured 
} from '@/lib/shippo';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';

// POST /api/shipping/labels - Purchase a shipping label
export async function POST(request: NextRequest) {
  try {
    // Check if Shippo is configured
    if (!isShippoConfigured()) {
      return NextResponse.json({ 
        error: 'Shipping service not configured. Please add SHIPPO_API_KEY to environment variables.' 
      }, { status: 400 });
    }

    const body = await request.json();
    const { 
      rate_id, 
      order_id,
      label_format = 'PDF_4x6',
      carrier,
      service,
      rate_amount,
      estimated_days,
      from_address,
      to_address,
      package_weight,
      package_dimensions
    } = body;

    if (!rate_id) {
      return NextResponse.json({ error: 'Rate ID is required' }, { status: 400 });
    }

    // Purchase the label from Shippo
    const transaction = await purchaseLabel(rate_id, label_format);

    // Register for tracking updates webhook
    if (transaction.tracking_number) {
      try {
        await registerTrackingWebhook(
          carrier || 'usps',
          transaction.tracking_number,
          order_id
        );
      } catch (webhookError) {
        console.error('Failed to register tracking webhook:', webhookError);
        // Don't fail the label purchase if webhook registration fails
      }
    }

    // Store shipment in database if configured
    let shipment_id = null;
    if (isSupabaseConfigured() && order_id) {
      try {
        const supabase = createServerClient();
        const { data: shipment, error } = await supabase
          .from('shipments')
          .insert({
            order_id,
            shippo_transaction_id: transaction.object_id,
            carrier: carrier || 'unknown',
            service: service || 'unknown',
            tracking_number: transaction.tracking_number,
            tracking_url: transaction.tracking_url_provider,
            label_url: transaction.label_url,
            label_format,
            rate_amount: rate_amount || 0,
            rate_currency: 'USD',
            status: 'label_created',
            estimated_delivery: estimated_days 
              ? new Date(Date.now() + estimated_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              : null,
            ship_date: new Date().toISOString(),
            package_weight,
            package_dimensions,
            from_address,
            to_address,
          })
          .select()
          .single();

        if (error) {
          console.error('Failed to store shipment:', error);
        } else {
          shipment_id = shipment?.id;
        }

        // Update order with tracking info
        if (order_id) {
          await supabase
            .from('orders')
            .update({
              status: 'shipped',
              tracking_number: transaction.tracking_number,
              tracking_url: transaction.tracking_url_provider,
              shipped_at: new Date().toISOString(),
            })
            .eq('id', order_id);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      shipment_id,
      transaction_id: transaction.object_id,
      tracking_number: transaction.tracking_number,
      tracking_url: transaction.tracking_url_provider,
      label_url: transaction.label_url,
      status: transaction.status,
    });
  } catch (error) {
    console.error('Error purchasing label:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to purchase label' 
    }, { status: 500 });
  }
}

// GET /api/shipping/labels - Get all shipments/labels
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ shipments: [] });
    }

    const { searchParams } = new URL(request.url);
    const order_id = searchParams.get('order_id');
    const status = searchParams.get('status');
    const carrier = searchParams.get('carrier');

    const supabase = createServerClient();
    let query = supabase
      .from('shipments')
      .select('*, orders(order_number, customer_name, customer_email)')
      .order('created_at', { ascending: false });

    if (order_id) {
      query = query.eq('order_id', order_id);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (carrier) {
      query = query.eq('carrier', carrier);
    }

    const { data: shipments, error } = await query;

    if (error) {
      console.error('Error fetching shipments:', error);
      return NextResponse.json({ shipments: [] });
    }

    return NextResponse.json({ shipments: shipments || [] });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json({ shipments: [] });
  }
}

