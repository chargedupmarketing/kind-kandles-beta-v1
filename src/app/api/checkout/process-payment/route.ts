import { NextRequest, NextResponse } from 'next/server';
import { createSquareClient, getSquareConfig, isSquareConfiguredAsync, toSquareAmount, generateIdempotencyKey } from '@/lib/square';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import type { Square } from 'square';

export const dynamic = 'force-dynamic';

interface TaxSettings {
  default_rate: number;
  tax_shipping: boolean;
}

async function getTaxSettings(): Promise<TaxSettings> {
  const defaults: TaxSettings = { default_rate: 0.06, tax_shipping: false };
  
  if (!isSupabaseConfigured()) {
    return defaults;
  }
  
  try {
    const serverClient = createServerClient();
    const { data } = await serverClient
      .from('store_settings')
      .select('value')
      .eq('key', 'tax_settings')
      .single();
    
    if (data?.value) {
      return {
        default_rate: data.value.default_rate ?? defaults.default_rate,
        tax_shipping: data.value.tax_shipping ?? defaults.tax_shipping
      };
    }
  } catch (error) {
    console.error('Error fetching tax settings:', error);
  }
  
  return defaults;
}

interface CartItem {
  productId: string;
  variantId: string;
  title: string;
  variantTitle: string;
  price: number;
  quantity: number;
}

interface PaymentRequest {
  sourceId: string;
  items: CartItem[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  shippingCost: number;
  discountCode?: string;
  discountAmount?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Square is configured (checks both DB and env vars)
    const isConfigured = await isSquareConfiguredAsync();
    if (!isConfigured) {
      return NextResponse.json({ error: 'Square is not configured' }, { status: 500 });
    }

    // Create Square client with current settings
    const squareClient = await createSquareClient();
    if (!squareClient) {
      return NextResponse.json({ error: 'Failed to initialize Square client' }, { status: 500 });
    }

    // Get current config for location ID
    const config = await getSquareConfig();

    const body: PaymentRequest = await request.json();
    const { sourceId, items, shippingAddress, shippingCost, discountAmount } = body;

    if (!sourceId) {
      return NextResponse.json({ error: 'Payment source is required' }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    // Get tax settings from database
    const taxSettings = await getTaxSettings();
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = discountAmount || 0;
    const taxableAmount = subtotal - discount + (taxSettings.tax_shipping ? shippingCost : 0);
    const tax = Math.round(taxableAmount * taxSettings.default_rate * 100) / 100;
    const total = subtotal + shippingCost + tax - discount;

    // Convert to cents for Square
    const amountInCents = toSquareAmount(total);

    console.log('Processing payment with Square:', {
      mode: config.mode,
      locationId: config.locationId,
      amount: total,
    });

    // Create payment with Square
    const response = await squareClient.payments.create({
      sourceId,
      idempotencyKey: generateIdempotencyKey(),
      amountMoney: {
        amount: amountInCents,
        currency: 'USD',
      },
      locationId: config.locationId,
      buyerEmailAddress: shippingAddress.email,
      shippingAddress: {
        addressLine1: shippingAddress.address1,
        addressLine2: shippingAddress.address2 || undefined,
        locality: shippingAddress.city,
        administrativeDistrictLevel1: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country as Square.Country,
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
      },
      note: `Order: ${items.length} items`,
    });

    const payment = response.payment;

    if (payment?.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        receiptUrl: payment.receiptUrl,
        amount: total,
      });
    } else if (payment?.status === 'APPROVED') {
      // Payment approved but needs completion (for some payment methods)
      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        receiptUrl: payment.receiptUrl,
        amount: total,
        status: 'approved',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Payment was not completed',
        status: payment?.status,
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Square payment error:', error);
    
    // Handle Square API errors
    if (error.errors) {
      const errorMessages = error.errors.map((e: any) => e.detail || e.message).join(', ');
      return NextResponse.json({ 
        success: false, 
        error: errorMessages 
      }, { status: 400 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
