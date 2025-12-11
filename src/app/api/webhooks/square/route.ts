import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import crypto from 'crypto';

const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '';
const webhookUrl = 'https://kind-kandles-beta-v1.vercel.app/api/webhooks/square';

// Verify Square webhook signature
// Square uses: HMAC-SHA256(webhookUrl + body, signatureKey)
function verifySignature(body: string, signature: string): boolean {
  if (!webhookSignatureKey) {
    console.warn('Square webhook signature key not configured');
    return false;
  }

  try {
    // Square signature format: webhookUrl + body
    const payload = webhookUrl + body;
    const hmac = crypto.createHmac('sha256', webhookSignatureKey);
    hmac.update(payload);
    const expectedSignature = hmac.digest('base64');
    
    console.log('Webhook signature verification:');
    console.log('- Received signature:', signature);
    console.log('- Expected signature:', expectedSignature);
    console.log('- Match:', signature === expectedSignature);
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-square-hmacsha256-signature') || '';

    console.log('Square webhook received');
    console.log('- Has signature key:', !!webhookSignatureKey);
    console.log('- Has signature header:', !!signature);

    // Verify webhook signature
    if (webhookSignatureKey) {
      if (!signature) {
        console.error('Missing Square webhook signature header');
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }
      
      if (!verifySignature(body, signature)) {
        console.error('Invalid Square webhook signature');
        // In sandbox mode, we might want to still process the webhook
        // but log the error for debugging
        if (process.env.SQUARE_ENVIRONMENT === 'sandbox') {
          console.warn('Proceeding anyway in sandbox mode...');
        } else {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
      }
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
