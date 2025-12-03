import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface DiscountValidationRequest {
  code: string;
  subtotal: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: DiscountValidationRequest = await request.json();
    const { code, subtotal } = body;

    if (!code) {
      return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 });
    }

    // Look up discount code
    const { data: discount, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .single();

    if (error || !discount) {
      return NextResponse.json({ valid: false, error: 'Invalid discount code' });
    }

    // Check if code has reached max uses
    if (discount.max_uses !== null && discount.uses >= discount.max_uses) {
      return NextResponse.json({ valid: false, error: 'This code has reached its maximum uses' });
    }

    // Check date validity
    const now = new Date();
    if (discount.starts_at && new Date(discount.starts_at) > now) {
      return NextResponse.json({ valid: false, error: 'This code is not yet active' });
    }
    if (discount.ends_at && new Date(discount.ends_at) < now) {
      return NextResponse.json({ valid: false, error: 'This code has expired' });
    }

    // Check minimum purchase
    if (discount.min_purchase !== null && subtotal < discount.min_purchase) {
      return NextResponse.json({ 
        valid: false, 
        error: `Minimum purchase of $${discount.min_purchase.toFixed(2)} required` 
      });
    }

    // Calculate discount value
    let discountValue = discount.value;
    if (discount.type === 'percentage') {
      discountValue = subtotal * (discount.value / 100);
    } else if (discount.type === 'fixed') {
      discountValue = Math.min(discount.value, subtotal);
    }

    return NextResponse.json({
      valid: true,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discountValue,
      message: getDiscountMessage(discount)
    });
  } catch (error) {
    console.error('Discount validation error:', error);
    return NextResponse.json({ valid: false, error: 'Failed to validate code' }, { status: 500 });
  }
}

function getDiscountMessage(discount: any): string {
  switch (discount.type) {
    case 'percentage':
      return `${discount.value}% off your order!`;
    case 'fixed':
      return `$${discount.value.toFixed(2)} off your order!`;
    case 'free_shipping':
      return 'Free shipping on your order!';
    default:
      return 'Discount applied!';
  }
}

