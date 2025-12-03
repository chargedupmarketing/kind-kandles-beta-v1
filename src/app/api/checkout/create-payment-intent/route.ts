import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase';

interface CartItem {
  productId: string;
  variantId: string;
  title: string;
  variantTitle: string;
  price: number;
  quantity: number;
}

interface CheckoutRequest {
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
    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const body: CheckoutRequest = await request.json();
    const { items, shippingAddress, shippingCost, discountCode, discountAmount } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = discountAmount || 0;
    const taxableAmount = subtotal - discount;
    const tax = Math.round(taxableAmount * 0.06 * 100) / 100; // 6% tax
    const total = subtotal + shippingCost + tax - discount;

    // Convert to cents for Stripe
    const amountInCents = Math.round(total * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customer_email: shippingAddress.email,
        customer_name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        items_count: items.length.toString(),
        subtotal: subtotal.toString(),
        shipping: shippingCost.toString(),
        tax: tax.toString(),
        discount: discount.toString(),
        discount_code: discountCode || '',
      },
      receipt_email: shippingAddress.email,
      shipping: {
        name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        phone: shippingAddress.phone || '',
        address: {
          line1: shippingAddress.address1,
          line2: shippingAddress.address2 || '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postalCode,
          country: shippingAddress.country,
        },
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

