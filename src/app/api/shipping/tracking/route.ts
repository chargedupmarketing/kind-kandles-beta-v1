import { NextRequest, NextResponse } from 'next/server';
import { getTrackingInfo, formatCarrierName, type TrackingInfo } from '@/lib/pirateship';

export const dynamic = 'force-dynamic';

// Get tracking information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const carrier = searchParams.get('carrier');
    const trackingNumber = searchParams.get('trackingNumber');

    if (!carrier || !trackingNumber) {
      return NextResponse.json(
        { error: 'Carrier and tracking number are required' },
        { status: 400 }
      );
    }

    // Get tracking status from Pirate Ship
    const trackingInfo = await getTrackingInfo(carrier, trackingNumber);

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
    const body = await request.json();
    const { carrier, trackingNumber, metadata } = body;

    if (!carrier || !trackingNumber) {
      return NextResponse.json(
        { error: 'Carrier and tracking number are required' },
        { status: 400 }
      );
    }

    // Get initial tracking status
    const trackingInfo = await getTrackingInfo(carrier, trackingNumber);

    return NextResponse.json({
      success: true,
      tracking: {
        carrier: formatCarrierName(carrier),
        trackingNumber: trackingNumber,
        status: trackingInfo.status,
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

