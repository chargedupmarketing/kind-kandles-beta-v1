import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import crypto from 'crypto';

const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '';

// In-memory store for processed webhook events (idempotency)
// In production, use Redis or database for multi-instance support
const processedEvents = new Map<string, { timestamp: number; result: string }>();
const EVENT_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Clean up old processed events periodically
function cleanupProcessedEvents() {
  const now = Date.now();
  for (const [eventId, data] of processedEvents.entries()) {
    if (now - data.timestamp > EVENT_TTL) {
      processedEvents.delete(eventId);
    }
  }
}

// Verify Square webhook signature
// Square uses: HMAC-SHA256(webhookUrl + body, signatureKey)
function verifySignature(body: string, signature: string, webhookUrl: string): boolean {
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
    
    // Use timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

// Log webhook event for audit trail
async function logWebhookEvent(supabase: any, eventId: string, eventType: string, status: string, details?: any) {
  try {
    // Try to log to webhook_logs table if it exists
    await supabase.from('webhook_logs').insert({
      event_id: eventId,
      event_type: eventType,
      status,
      details,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    // Table might not exist, just log to console
    console.log(`Webhook event logged: ${eventId} - ${eventType} - ${status}`);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.text();
    const signature = request.headers.get('x-square-hmacsha256-signature') || '';
    
    // Construct the webhook URL from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'www.kindkandlesboutique.com';
    const webhookUrl = `${protocol}://${host}/api/webhooks/square`;

    // Parse the event
    let event;
    try {
      event = JSON.parse(body);
    } catch (parseError) {
      console.error('Failed to parse webhook body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Extract event ID for idempotency
    const eventId = event.event_id || event.id || `${event.type}-${Date.now()}`;
    
    // Check if we've already processed this event (idempotency)
    if (processedEvents.has(eventId)) {
      const cached = processedEvents.get(eventId)!;
      console.log(`Duplicate webhook event ${eventId} - returning cached result`);
      return NextResponse.json({ 
        received: true, 
        status: 'already_processed',
        result: cached.result 
      }, { status: 200 });
    }

    console.log(`Square webhook received: ${event.type} (${eventId})`);

    // Handle webhook validation/test events immediately
    if (event.type === 'webhook.test' || event.type === 'webhook.subscription.created') {
      console.log('Webhook test/validation event received');
      processedEvents.set(eventId, { timestamp: Date.now(), result: 'test_acknowledged' });
      return NextResponse.json({ received: true, status: 'ok' }, { status: 200 });
    }

    // Verify webhook signature for actual events
    if (webhookSignatureKey) {
      if (!signature) {
        console.error('Missing Square webhook signature header');
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }
      
      if (!verifySignature(body, signature, webhookUrl)) {
        console.error('Invalid Square webhook signature');
        // In sandbox mode, we might want to still process the webhook
        if (process.env.SQUARE_ENVIRONMENT === 'sandbox') {
          console.warn('Proceeding anyway in sandbox mode...');
        } else {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
      }
    }

    const supabase = createServerClient();
    let result = 'processed';

    switch (event.type) {
      case 'payment.completed': {
        const payment = event.data.object.payment;
        console.log('Payment completed:', payment.id);

        // Update order status to paid (with retry)
        let retries = 3;
        let updateError = null;
        
        while (retries > 0) {
          const { error } = await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'processing',
              updated_at: new Date().toISOString()
            })
            .eq('payment_id', payment.id);

          if (!error) {
            result = 'payment_completed';
            break;
          }
          
          updateError = error;
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        if (updateError) {
          console.error('Error updating order after retries:', updateError);
          result = 'payment_completed_update_failed';
        }

        await logWebhookEvent(supabase, eventId, event.type, result, { paymentId: payment.id });
        break;
      }

      case 'payment.updated': {
        const payment = event.data.object.payment;
        console.log('Payment updated:', payment.id, payment.status);

        if (payment.status === 'FAILED' || payment.status === 'CANCELED') {
          const { error } = await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('payment_id', payment.id);

          result = error ? 'payment_failed_update_error' : 'payment_failed';
        } else {
          result = 'payment_updated';
        }

        await logWebhookEvent(supabase, eventId, event.type, result, { 
          paymentId: payment.id, 
          status: payment.status 
        });
        break;
      }

      case 'refund.created':
      case 'refund.updated': {
        const refund = event.data.object.refund;
        console.log('Refund event:', refund.id, refund.status);

        if (refund.status === 'COMPLETED') {
          const { error } = await supabase
            .from('orders')
            .update({
              payment_status: 'refunded',
              status: 'refunded',
              updated_at: new Date().toISOString()
            })
            .eq('payment_id', refund.payment_id);

          result = error ? 'refund_update_error' : 'refund_completed';
        } else {
          result = 'refund_pending';
        }

        await logWebhookEvent(supabase, eventId, event.type, result, { 
          refundId: refund.id, 
          status: refund.status 
        });
        break;
      }

      default:
        console.log(`Unhandled Square event type: ${event.type}`);
        result = 'unhandled_event_type';
    }

    // Mark event as processed (idempotency)
    processedEvents.set(eventId, { timestamp: Date.now(), result });
    
    // Periodic cleanup
    if (processedEvents.size > 1000) {
      cleanupProcessedEvents();
    }

    const duration = Date.now() - startTime;
    console.log(`Webhook processed in ${duration}ms: ${eventId} -> ${result}`);

    return NextResponse.json({ 
      received: true, 
      status: 'ok',
      result,
      processingTime: duration
    }, { status: 200 });
  } catch (error) {
    console.error('Square webhook error:', error);
    // Still return 200 to prevent Square from retrying on our internal errors
    return NextResponse.json({ 
      received: true, 
      error: 'Internal processing error',
      processingTime: Date.now() - startTime
    }, { status: 200 });
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  console.log('Square webhook GET request received (verification)');
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Square webhook endpoint is active' 
  }, { status: 200 });
}
