import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Calculate shipping rates based on weight and destination
 * 
 * Weight-based USPS rates (approximate):
 * - 0-8 oz: $4.50 (First Class)
 * - 8-16 oz (1 lb): $5.50 (First Class)
 * - 1-2 lbs: $9.00 (Priority Mail)
 * - 2-3 lbs: $11.00 (Priority Mail)
 * - 3-5 lbs: $14.00 (Priority Mail)
 * - 5-10 lbs: $18.00 (Priority Mail)
 * - 10+ lbs: $25.00 (Priority Mail)
 */

interface ShippingRequest {
  weight: number; // in ounces
  state: string;
  postalCode: string;
}

interface ShippingRate {
  id: string;
  name: string;
  carrier: string;
  service: string;
  price: number;
  estimatedDays: string;
}

// Calculate shipping cost based on weight
function calculateShippingCost(weightOz: number, state: string): ShippingRate[] {
  const rates: ShippingRate[] = [];
  
  // Convert to pounds for easier calculation
  const weightLbs = weightOz / 16;
  
  // USPS First Class (under 1 lb only)
  if (weightOz <= 16) {
    let firstClassPrice = 4.50;
    if (weightOz <= 4) firstClassPrice = 3.99;
    else if (weightOz <= 8) firstClassPrice = 4.50;
    else firstClassPrice = 5.50;
    
    rates.push({
      id: 'usps-first-class',
      name: 'USPS First Class',
      carrier: 'USPS',
      service: 'First Class Package',
      price: firstClassPrice,
      estimatedDays: '3-5 business days'
    });
  }
  
  // USPS Priority Mail (any weight)
  let priorityPrice = 9.00;
  if (weightLbs <= 1) priorityPrice = 9.00;
  else if (weightLbs <= 2) priorityPrice = 11.00;
  else if (weightLbs <= 3) priorityPrice = 13.00;
  else if (weightLbs <= 5) priorityPrice = 16.00;
  else if (weightLbs <= 10) priorityPrice = 20.00;
  else priorityPrice = 25.00 + Math.floor((weightLbs - 10) / 5) * 5;
  
  rates.push({
    id: 'usps-priority',
    name: 'USPS Priority Mail',
    carrier: 'USPS',
    service: 'Priority Mail',
    price: priorityPrice,
    estimatedDays: '2-3 business days'
  });
  
  // USPS Priority Mail Express (any weight, faster)
  const expressPrice = priorityPrice * 1.8; // ~80% more expensive
  rates.push({
    id: 'usps-priority-express',
    name: 'USPS Priority Mail Express',
    carrier: 'USPS',
    service: 'Priority Mail Express',
    price: Math.round(expressPrice * 100) / 100,
    estimatedDays: '1-2 business days'
  });
  
  // UPS Ground (for heavier items)
  if (weightLbs >= 2) {
    let upsPrice = 12.00;
    if (weightLbs <= 3) upsPrice = 12.00;
    else if (weightLbs <= 5) upsPrice = 15.00;
    else if (weightLbs <= 10) upsPrice = 22.00;
    else upsPrice = 28.00 + Math.floor((weightLbs - 10) / 5) * 6;
    
    rates.push({
      id: 'ups-ground',
      name: 'UPS Ground',
      carrier: 'UPS',
      service: 'Ground',
      price: upsPrice,
      estimatedDays: '3-5 business days'
    });
  }
  
  return rates;
}

export async function POST(request: NextRequest) {
  try {
    const body: ShippingRequest = await request.json();
    
    const { weight, state, postalCode } = body;
    
    // Validate inputs
    if (!weight || weight <= 0) {
      return NextResponse.json({ 
        error: 'Invalid weight. Weight must be greater than 0.' 
      }, { status: 400 });
    }
    
    if (!state || !postalCode) {
      return NextResponse.json({ 
        error: 'State and postal code are required' 
      }, { status: 400 });
    }
    
    // Calculate rates
    const rates = calculateShippingCost(weight, state);
    
    // Sort by price (cheapest first)
    rates.sort((a, b) => a.price - b.price);
    
    return NextResponse.json({
      success: true,
      weight,
      weightUnit: 'oz',
      rates
    });
    
  } catch (error) {
    console.error('Error calculating shipping:', error);
    return NextResponse.json({ 
      error: 'Failed to calculate shipping rates' 
    }, { status: 500 });
  }
}

