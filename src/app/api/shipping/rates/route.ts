import { NextRequest, NextResponse } from 'next/server';
import Shippo from 'shippo';
import { 
  getShippoClient, 
  getStoreAddress, 
  estimateParcelSize,
  formatShippingRate,
  validateAddress,
  type ShippingAddress,
  type ShippingRate 
} from '@/lib/shippo';

export const dynamic = 'force-dynamic';

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

    // Create shipment to get rates
    const shipment = await shippo.shipments.create({
      addressFrom: {
        name: originAddress.name,
        company: originAddress.company,
        street1: originAddress.street1,
        street2: originAddress.street2,
        city: originAddress.city,
        state: originAddress.state,
        zip: originAddress.zip,
        country: originAddress.country,
        phone: originAddress.phone,
        email: originAddress.email,
      },
      addressTo: {
        name: destinationAddress.name,
        company: destinationAddress.company,
        street1: destinationAddress.street1,
        street2: destinationAddress.street2,
        city: destinationAddress.city,
        state: destinationAddress.state,
        zip: destinationAddress.zip,
        country: destinationAddress.country,
        phone: destinationAddress.phone,
        email: destinationAddress.email,
      },
      parcels: [{
        length: String(parcel.length),
        width: String(parcel.width),
        height: String(parcel.height),
        distanceUnit: parcel.distanceUnit || 'in',
        weight: String(parcel.weight),
        massUnit: parcel.massUnit || 'lb',
      }],
      async: false,
    });

    // Filter and format rates
    const rates: ShippingRate[] = (shipment.rates || [])
      .filter((rate: any) => rate.amount && parseFloat(rate.amount) > 0)
      .map((rate: any) => ({
        id: rate.objectId,
        carrier: rate.provider,
        carrierAccount: rate.carrierAccount,
        serviceName: rate.servicelevel?.name || rate.servicelevelName || 'Standard',
        serviceToken: rate.servicelevel?.token || '',
        amount: rate.amount,
        currency: rate.currency || 'USD',
        estimatedDays: rate.estimatedDays || rate.durationTerms ? parseInt(rate.durationTerms) : 5,
        durationTerms: rate.durationTerms,
        provider: rate.provider,
        providerImage75: rate.providerImage75,
        providerImage200: rate.providerImage200,
      }))
      .sort((a: ShippingRate, b: ShippingRate) => parseFloat(a.amount) - parseFloat(b.amount));

    // Format rates for display
    const formattedRates = rates.map(formatShippingRate);

    return NextResponse.json({
      shipmentId: shipment.objectId,
      rates: formattedRates,
      rawRates: rates, // Include raw rates for purchasing
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
