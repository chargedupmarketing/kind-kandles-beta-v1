import { NextRequest, NextResponse } from 'next/server';
import { getShippoClient, type ShippingLabel } from '@/lib/shippo';
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

    const shippo = getShippoClient();
    if (!shippo) {
      return NextResponse.json(
        { error: 'Shipping service not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { rateId, orderId, async = false } = body;

    if (!rateId) {
      return NextResponse.json(
        { error: 'Rate ID is required' },
        { status: 400 }
      );
    }

    // Purchase the label (create transaction)
    const transaction = await shippo.transactions.create({
      rate: rateId,
      labelFileType: 'PDF',
      async: async,
    });

    // Check if transaction was successful
    if (transaction.status === 'ERROR') {
      return NextResponse.json(
        { 
          error: 'Failed to create label', 
          details: transaction.messages?.map((m: any) => m.text).join(', ')
        },
        { status: 400 }
      );
    }

    const label: ShippingLabel = {
      objectId: transaction.objectId || '',
      trackingNumber: transaction.trackingNumber || '',
      trackingUrlProvider: transaction.trackingUrlProvider || '',
      labelUrl: transaction.labelUrl || '',
      commercialInvoiceUrl: transaction.commercialInvoiceUrl || undefined,
      carrier: transaction.rate?.provider || '',
      serviceName: transaction.rate?.servicelevel?.name || '',
      rate: transaction.rate?.amount || '0',
      createdAt: new Date().toISOString(),
    };

    // If orderId provided, update the order with tracking info
    if (orderId) {
      try {
        const supabase = createServerClient();
        await supabase
          .from('orders')
          .update({
            tracking_number: label.trackingNumber,
            tracking_url: label.trackingUrlProvider,
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

// Get label details
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shippo = getShippoClient();
    if (!shippo) {
      return NextResponse.json(
        { error: 'Shipping service not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const transaction = await shippo.transactions.get(transactionId);

    return NextResponse.json({
      transaction,
      labelUrl: transaction.labelUrl,
      trackingNumber: transaction.trackingNumber,
      trackingUrl: transaction.trackingUrlProvider,
      status: transaction.status,
    });

  } catch (error: any) {
    console.error('Error getting label details:', error);
    return NextResponse.json(
      { error: 'Failed to get label details', details: error.message },
      { status: 500 }
    );
  }
}
