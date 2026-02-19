import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * Calculate shipping rates based on weight and destination
 * 
 * Weight-based shipping rates (doubled for profit margin):
 * - 0-4 oz: $7.98 (First Class)
 * - 4-8 oz: $9.00 (First Class)
 * - 8-16 oz (1 lb): $11.00 (First Class)
 * - 1-2 lbs: $18.00 (Priority Mail)
 * - 2-3 lbs: $22.00 (Priority Mail)
 * - 3-5 lbs: $26.00 (Priority Mail)
 * - 5-10 lbs: $32.00 (Priority Mail)
 * - 10+ lbs: $40.00+ (Priority Mail)
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

// Simple in-memory cache for shipping rates
const rateCache = new Map<string, { rates: ShippingRate[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fallback rates if calculation fails
const FALLBACK_RATES: ShippingRate[] = [
  {
    id: 'standard-shipping',
    name: 'Standard Shipping',
    carrier: 'USPS',
    service: 'Standard',
    price: 9.99,
    estimatedDays: '5-7 business days'
  },
  {
    id: 'priority-shipping',
    name: 'Priority Shipping',
    carrier: 'USPS',
    service: 'Priority',
    price: 14.99,
    estimatedDays: '2-3 business days'
  }
];

// Valid US state codes
const VALID_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'PR', 'VI', 'GU', 'AS', 'MP' // Include territories
]);

// Validate postal code format
function isValidPostalCode(postalCode: string): boolean {
  // US ZIP code: 5 digits or 5+4 format
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(postalCode.trim());
}

// Calculate shipping cost based on weight
function calculateShippingCost(weightOz: number, state: string): ShippingRate[] {
  const rates: ShippingRate[] = [];
  
  // Validate weight bounds
  const safeWeight = Math.max(0.1, Math.min(weightOz, 1600)); // Max 100 lbs
  
  // Convert to pounds for easier calculation
  const weightLbs = safeWeight / 16;
  
  // USPS First Class (under 1 lb only)
  if (safeWeight <= 16) {
    let firstClassPrice = 9.00;
    if (safeWeight <= 4) firstClassPrice = 7.98;
    else if (safeWeight <= 8) firstClassPrice = 9.00;
    else firstClassPrice = 11.00;
    
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
  let priorityPrice = 18.00;
  if (weightLbs <= 1) priorityPrice = 18.00;
  else if (weightLbs <= 2) priorityPrice = 22.00;
  else if (weightLbs <= 3) priorityPrice = 26.00;
  else if (weightLbs <= 5) priorityPrice = 32.00;
  else if (weightLbs <= 10) priorityPrice = 40.00;
  else priorityPrice = 50.00 + Math.floor((weightLbs - 10) / 5) * 10;
  
  rates.push({
    id: 'usps-priority',
    name: 'USPS Priority Mail',
    carrier: 'USPS',
    service: 'Priority Mail',
    price: priorityPrice,
    estimatedDays: '2-3 business days'
  });
  
  // USPS Priority Mail Express (any weight, faster)
  const expressPrice = priorityPrice * 1.8;
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
    let upsPrice = 24.00;
    if (weightLbs <= 3) upsPrice = 24.00;
    else if (weightLbs <= 5) upsPrice = 30.00;
    else if (weightLbs <= 10) upsPrice = 44.00;
    else upsPrice = 56.00 + Math.floor((weightLbs - 10) / 5) * 12;
    
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
    let body: ShippingRequest;
    
    try {
      body = await request.json();
    } catch (parseError) {
      return createErrorResponse('Invalid JSON in request body', 400, 'VALIDATION_ERROR');
    }
    
    const { weight, state, postalCode } = body;
    
    // Validate weight
    if (weight === undefined || weight === null) {
      return createErrorResponse('Weight is required', 400, 'VALIDATION_ERROR', { field: 'weight' });
    }
    
    const numWeight = Number(weight);
    if (isNaN(numWeight) || numWeight <= 0) {
      return createErrorResponse(
        'Invalid weight. Weight must be a positive number.',
        400,
        'VALIDATION_ERROR',
        { field: 'weight', value: weight }
      );
    }
    
    if (numWeight > 1600) { // 100 lbs max
      return createErrorResponse(
        'Weight exceeds maximum allowed (100 lbs). Please contact us for large orders.',
        400,
        'VALIDATION_ERROR',
        { field: 'weight', maxWeight: 1600 }
      );
    }
    
    // Validate state
    if (!state || typeof state !== 'string') {
      return createErrorResponse('State is required', 400, 'VALIDATION_ERROR', { field: 'state' });
    }
    
    const normalizedState = state.trim().toUpperCase();
    if (!VALID_STATES.has(normalizedState)) {
      return createErrorResponse(
        'Invalid state code. Please use a valid US state abbreviation.',
        400,
        'VALIDATION_ERROR',
        { field: 'state', value: state }
      );
    }
    
    // Validate postal code
    if (!postalCode || typeof postalCode !== 'string') {
      return createErrorResponse('Postal code is required', 400, 'VALIDATION_ERROR', { field: 'postalCode' });
    }
    
    const normalizedPostalCode = postalCode.trim();
    if (!isValidPostalCode(normalizedPostalCode)) {
      return createErrorResponse(
        'Invalid postal code format. Please use a valid US ZIP code.',
        400,
        'VALIDATION_ERROR',
        { field: 'postalCode', value: postalCode }
      );
    }
    
    // Check cache
    const cacheKey = `${numWeight}-${normalizedState}-${normalizedPostalCode.substring(0, 3)}`;
    const cached = rateCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return createSuccessResponse({
        weight: numWeight,
        weightUnit: 'oz',
        rates: cached.rates,
        cached: true
      });
    }
    
    // Calculate rates
    let rates: ShippingRate[];
    try {
      rates = calculateShippingCost(numWeight, normalizedState);
    } catch (calcError) {
      console.error('Error calculating shipping rates:', calcError);
      // Return fallback rates instead of failing
      rates = FALLBACK_RATES;
    }
    
    // Sort by price (cheapest first)
    rates.sort((a, b) => a.price - b.price);
    
    // Cache the result
    rateCache.set(cacheKey, { rates, timestamp: Date.now() });
    
    // Clean old cache entries periodically
    if (rateCache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of rateCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          rateCache.delete(key);
        }
      }
    }
    
    return createSuccessResponse({
      weight: numWeight,
      weightUnit: 'oz',
      rates
    });
    
  } catch (error) {
    console.error('Error calculating shipping:', error);
    
    // Return fallback rates instead of error for better UX
    return createSuccessResponse({
      weight: 0,
      weightUnit: 'oz',
      rates: FALLBACK_RATES,
      fallback: true,
      message: 'Using standard shipping rates'
    });
  }
}

