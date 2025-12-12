import { NextRequest, NextResponse } from 'next/server';
import { 
  getShippingRates, 
  getStoreAddress, 
  createParcel, 
  isShippoConfigured,
  ShippoAddress,
  ShippoParcel 
} from '@/lib/shippo';

// POST /api/shipping/rates - Get shipping rates
export async function POST(request: NextRequest) {
  try {
    // Check if Shippo is configured
    if (!isShippoConfigured()) {
      return NextResponse.json({ 
        error: 'Shipping service not configured. Please add SHIPPO_API_KEY to environment variables.',
        rates: []
      }, { status: 400 });
    }

    const body = await request.json();
    const { 
      to_address, 
      parcel,
      from_address 
    } = body as {
      to_address: ShippoAddress;
      parcel?: ShippoParcel;
      from_address?: ShippoAddress;
    };

    // Validate required fields
    if (!to_address || !to_address.street1 || !to_address.city || !to_address.state || !to_address.zip) {
      return NextResponse.json({ 
        error: 'Missing required destination address fields (street1, city, state, zip)' 
      }, { status: 400 });
    }

    // Use store address as default from address
    const fromAddr = from_address || getStoreAddress();

    // Validate from address has required fields
    if (!fromAddr.street1 || !fromAddr.city || !fromAddr.state || !fromAddr.zip) {
      return NextResponse.json({ 
        error: 'Store address not configured. Please set STORE_ADDRESS_LINE1, STORE_CITY, STORE_STATE, STORE_ZIP environment variables.' 
      }, { status: 400 });
    }

    // Use default parcel if not provided (standard candle box)
    const shipmentParcel = parcel || createParcel(16); // 16 oz default

    // Get rates from Shippo
    const { shipment_id, rates } = await getShippingRates(fromAddr, to_address, shipmentParcel);

    // Format rates for frontend
    const formattedRates = rates.map(rate => ({
      id: rate.object_id,
      carrier: rate.provider,
      carrier_image: rate.provider_image_75,
      service: rate.servicelevel.name,
      service_token: rate.servicelevel.token,
      price: parseFloat(rate.amount),
      currency: rate.currency,
      estimated_days: rate.estimated_days,
      delivery_estimate: rate.duration_terms,
      attributes: rate.attributes,
    }));

    return NextResponse.json({
      success: true,
      shipment_id,
      rates: formattedRates,
    });
  } catch (error) {
    console.error('Error getting shipping rates:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to get shipping rates',
      rates: []
    }, { status: 500 });
  }
}
