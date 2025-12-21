import { NextRequest, NextResponse } from 'next/server';
import { getShippoClient, formatCarrierName, type TrackingInfo } from '@/lib/shippo';

export const dynamic = 'force-dynamic';

// Get tracking information
export async function GET(request: NextRequest) {
  try {
    const shippo = getShippoClient();
    if (!shippo) {
      return NextResponse.json(
        { error: 'Shipping service not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const carrier = searchParams.get('carrier');
    const trackingNumber = searchParams.get('trackingNumber');

    if (!carrier || !trackingNumber) {
      return NextResponse.json(
        { error: 'Carrier and tracking number are required' },
        { status: 400 }
      );
    }

    // Get tracking status from Shippo
    const trackingStatus = await shippo.trackingStatus.get(carrier, trackingNumber);

    const trackingInfo: TrackingInfo = {
      carrier: formatCarrierName(carrier),
      trackingNumber: trackingNumber,
      trackingStatus: {
        status: trackingStatus.trackingStatus?.status || 'UNKNOWN',
        statusDetails: trackingStatus.trackingStatus?.statusDetails || '',
        statusDate: trackingStatus.trackingStatus?.statusDate || '',
        location: trackingStatus.trackingStatus?.location ? {
          city: trackingStatus.trackingStatus.location.city,
          state: trackingStatus.trackingStatus.location.state,
          country: trackingStatus.trackingStatus.location.country,
        } : undefined,
      },
      trackingHistory: (trackingStatus.trackingHistory || []).map((event: any) => ({
        status: event.status || '',
        statusDetails: event.statusDetails || '',
        statusDate: event.statusDate || '',
        location: event.location ? {
          city: event.location.city,
          state: event.location.state,
          country: event.location.country,
        } : undefined,
      })),
      eta: trackingStatus.eta,
      originalEta: trackingStatus.originalEta,
    };

    return NextResponse.json({
      success: true,
      tracking: trackingInfo,
    });

  } catch (error: any) {
    console.error('Error getting tracking info:', error);
    return NextResponse.json(
      { error: 'Failed to get tracking information', details: error.message },
      { status: 500 }
    );
  }
}

// Register a tracking webhook for an order
export async function POST(request: NextRequest) {
  try {
    const shippo = getShippoClient();
    if (!shippo) {
      return NextResponse.json(
        { error: 'Shipping service not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { carrier, trackingNumber, metadata } = body;

    if (!carrier || !trackingNumber) {
      return NextResponse.json(
        { error: 'Carrier and tracking number are required' },
        { status: 400 }
      );
    }

    // Register the tracking number for webhook updates
    const tracking = await shippo.trackingStatus.create({
      carrier: carrier,
      trackingNumber: trackingNumber,
      metadata: metadata || '',
    });

    return NextResponse.json({
      success: true,
      tracking: {
        carrier: tracking.carrier,
        trackingNumber: tracking.trackingNumber,
        status: tracking.trackingStatus?.status,
      },
    });

  } catch (error: any) {
    console.error('Error registering tracking:', error);
    return NextResponse.json(
      { error: 'Failed to register tracking', details: error.message },
      { status: 500 }
    );
  }
}

