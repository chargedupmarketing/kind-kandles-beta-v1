import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = createServerClient();

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);

        // Update order status to paid
        const { error } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'processing',
          })
          .eq('payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Error updating order:', error);
        }

        // TODO: Send order confirmation email
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', paymentIntent.id);

        // Update order status to failed
        await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            status: 'cancelled',
          })
          .eq('payment_intent_id', paymentIntent.id);

        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('Charge refunded:', charge.id);

        if (charge.payment_intent) {
          await supabase
            .from('orders')
            .update({
              payment_status: 'refunded',
              status: 'refunded',
            })
            .eq('payment_intent_id', charge.payment_intent);
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

// Note: In Next.js App Router, body parsing is handled automatically
// by using request.text() instead of request.json()

