import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const FREE_SHIPPING_THRESHOLD = 50;

interface ShippingRateRequest {
  address: {
    country: string;
    state: string;
    postalCode: string;
  };
  weight: number;
  subtotal: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ShippingRateRequest = await request.json();
    const { address, weight, subtotal } = body;

    // Determine if free shipping applies
    const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

    // Get shipping zones
    const { data: zones } = await supabase
      .from('shipping_zones')
      .select(`
        *,
        rates:shipping_rates(*)
      `);

    // Find matching zone for the address
    let matchingZone = zones?.find(zone => 
      zone.countries.includes(address.country) &&
      (!zone.states || zone.states.length === 0 || zone.states.includes(address.state))
    );

    // Default rates if no zone found
    if (!matchingZone || !matchingZone.rates || matchingZone.rates.length === 0) {
      const defaultRates = [
        {
          id: 'standard',
          name: 'Standard Shipping',
          price: qualifiesForFreeShipping ? 0 : 5.99,
          estimatedDays: '5-7 business days'
        },
        {
          id: 'express',
          name: 'Express Shipping',
          price: 12.99,
          estimatedDays: '2-3 business days'
        },
        {
          id: 'overnight',
          name: 'Overnight Shipping',
          price: 24.99,
          estimatedDays: '1 business day'
        }
      ];

      return NextResponse.json({
        rates: defaultRates,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        qualifiesForFreeShipping
      });
    }

    // Filter rates based on weight and price conditions
    const applicableRates = matchingZone.rates
      .filter((rate: any) => {
        // Check weight conditions
        if (rate.min_weight !== null && weight < rate.min_weight) return false;
        if (rate.max_weight !== null && weight > rate.max_weight) return false;
        
        // Check price conditions
        if (rate.min_price !== null && subtotal < rate.min_price) return false;
        if (rate.max_price !== null && subtotal > rate.max_price) return false;
        
        return true;
      })
      .map((rate: any) => ({
        id: rate.id,
        name: rate.name,
        price: qualifiesForFreeShipping && rate.name.toLowerCase().includes('standard') ? 0 : rate.price,
        estimatedDays: getEstimatedDays(rate.name)
      }));

    // If no applicable rates, return defaults
    if (applicableRates.length === 0) {
      return NextResponse.json({
        rates: [
          {
            id: 'standard',
            name: 'Standard Shipping',
            price: qualifiesForFreeShipping ? 0 : 5.99,
            estimatedDays: '5-7 business days'
          }
        ],
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        qualifiesForFreeShipping
      });
    }

    return NextResponse.json({
      rates: applicableRates,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      qualifiesForFreeShipping
    });
  } catch (error) {
    console.error('Shipping rates error:', error);
    
    // Return default rates on error
    return NextResponse.json({
      rates: [
        { id: 'standard', name: 'Standard Shipping', price: 5.99, estimatedDays: '5-7 business days' },
        { id: 'express', name: 'Express Shipping', price: 12.99, estimatedDays: '2-3 business days' }
      ],
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      qualifiesForFreeShipping: false
    });
  }
}

function getEstimatedDays(rateName: string): string {
  const name = rateName.toLowerCase();
  if (name.includes('overnight') || name.includes('next day')) return '1 business day';
  if (name.includes('express') || name.includes('priority')) return '2-3 business days';
  if (name.includes('standard')) return '5-7 business days';
  if (name.includes('economy')) return '7-10 business days';
  return '5-7 business days';
}

