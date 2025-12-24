import { NextRequest, NextResponse } from 'next/server';
import { 
  isPirateShipConfigured,
  createShippingLabel,
  getStoreAddress,
  estimateParcelSize,
  type ShippingLabel 
} from '@/lib/pirateship';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Create a shipping label from a rate
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isPirateShipConfigured()) {
      return NextResponse.json(
        { error: 'Shipping service not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { rateId, orderId, toAddress, parcel } = body;

    if (!rateId || !toAddress) {
      return NextResponse.json(
        { error: 'Rate ID and destination address are required' },
        { status: 400 }
      );
    }

    // Get store address as origin
    const fromAddress = getStoreAddress();

    // Use provided parcel or estimate
    const parcelDimensions = parcel || estimateParcelSize(1, 1);

    // Create the shipping label
    const label = await createShippingLabel(fromAddress, toAddress, parcelDimensions, rateId);

    // If orderId provided, update the order with tracking info
    if (orderId) {
      try {
        const supabase = createServerClient();
        await supabase
          .from('orders')
          .update({
            tracking_number: label.trackingNumber,
            tracking_url: label.trackingUrl,
            shipping_label_url: label.labelUrl,
            carrier: label.carrier,
            shipping_service: label.serviceName,
            status: 'shipped',
            shipped_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      } catch (dbError) {
        console.error('Error updating order with tracking:', dbError);
        // Don't fail the request, label was still created
      }
    }

    return NextResponse.json({
      success: true,
      label,
      message: 'Shipping label created successfully',
    });

  } catch (error: any) {
    console.error('Error creating shipping label:', error);
    return NextResponse.json(
      { error: 'Failed to create shipping label', details: error.message },
      { status: 500 }
    );
  }
}

// Get label details (not supported by Pirate Ship API - labels are immediate)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      error: 'Label retrieval not supported. Labels are created immediately and returned in the POST response.',
    }, { status: 501 });

  } catch (error: any) {
    console.error('Error getting label details:', error);
    return NextResponse.json(
      { error: 'Failed to get label details', details: error.message },
      { status: 500 }
    );
  }
}
