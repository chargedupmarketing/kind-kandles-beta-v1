import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Get available carrier accounts
// Pirate Ship only supports USPS and UPS - no need to fetch from API
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.PIRATE_SHIP_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Shipping service not configured' },
        { status: 503 }
      );
    }

    // Pirate Ship supports USPS and UPS carriers
    const carriers = [
      {
        id: 'usps',
        carrier: 'usps',
        carrierName: 'USPS',
        accountId: 'pirateship_usps',
        active: true,
        testMode: false,
        parameters: {},
      },
      {
        id: 'ups',
        carrier: 'ups',
        carrierName: 'UPS',
        accountId: 'pirateship_ups',
        active: true,
        testMode: false,
        parameters: {},
      },
    ];

    return NextResponse.json({
      carriers,
      total: carriers.length,
    });

  } catch (error: any) {
    console.error('Error getting carrier accounts:', error);
    return NextResponse.json(
      { error: 'Failed to get carrier accounts', details: error.message },
      { status: 500 }
    );
  }
}

