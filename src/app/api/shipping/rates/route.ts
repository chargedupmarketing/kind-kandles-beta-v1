import { NextRequest, NextResponse } from 'next/server';
import { 
  isPirateShipConfigured,
  getStoreAddress, 
  estimateParcelSize,
  formatShippingRate,
  validateAddress,
  getShippingRates,
  type ShippingRate 
} from '@/lib/pirateship';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!isPirateShipConfigured()) {
      return NextResponse.json(
        { error: 'Shipping service not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { 
      destinationAddress, 
      itemCount = 1, 
      totalWeight,
      parcelDimensions 
    } = body;

    // Validate destination address
    const validation = validateAddress(destinationAddress);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid address', details: validation.errors },
        { status: 400 }
      );
    }

    // Get store address (origin)
    const originAddress = getStoreAddress();

    // Estimate parcel size if not provided
    const parcel = parcelDimensions || estimateParcelSize(itemCount, totalWeight);

    // Get rates from Pirate Ship
    const rates = await getShippingRates(originAddress, destinationAddress, parcel);

    // Sort by price
    const sortedRates = rates.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));

    // Format rates for display
    const formattedRates = sortedRates.map(formatShippingRate);

    return NextResponse.json({
      rates: formattedRates,
      rawRates: sortedRates, // Include raw rates for purchasing
      parcelUsed: parcel,
    });

  } catch (error: any) {
    console.error('Error getting shipping rates:', error);
    return NextResponse.json(
      { error: 'Failed to get shipping rates', details: error.message },
      { status: 500 }
    );
  }
}
