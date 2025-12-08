import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import crypto from 'crypto';

const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '';

// Verify Square webhook signature
function verifySignature(body: string, signature: string): boolean {
  if (!webhookSignatureKey) {
    console.warn('Square webhook signature key not configured');
    return true; // Allow in development
  }

  const hmac = crypto.createHmac('sha256', webhookSignatureKey);
  hmac.update(body);
  const expectedSignature = hmac.digest('base64');
  
  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-square-hmacsha256-signature') || '';

    // Verify webhook signature
    if (webhookSignatureKey && !verifySignature(body, signature)) {
      console.error('Invalid Square webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const supabase = createServerClient();

    console.log('Square webhook event:', event.type);

    switch (event.type) {
      case 'payment.completed': {
        const payment = event.data.object.payment;
        console.log('Payment completed:', payment.id);

        // Update order status to paid
        const { error } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'processing',
          })
          .eq('payment_id', payment.id);

        if (error) {
          console.error('Error updating order:', error);
        }

        // TODO: Send order confirmation email
        break;
      }

      case 'payment.updated': {
        const payment = event.data.object.payment;
        console.log('Payment updated:', payment.id, payment.status);

        if (payment.status === 'FAILED' || payment.status === 'CANCELED') {
          await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              status: 'cancelled',
            })
            .eq('payment_id', payment.id);
        }
        break;
      }

      case 'refund.created':
      case 'refund.updated': {
        const refund = event.data.object.refund;
        console.log('Refund event:', refund.id, refund.status);

        if (refund.status === 'COMPLETED') {
          await supabase
            .from('orders')
            .update({
              payment_status: 'refunded',
              status: 'refunded',
            })
            .eq('payment_id', refund.payment_id);
        }
        break;
      }

      default:
        console.log(`Unhandled Square event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Square webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

