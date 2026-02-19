import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import crypto from 'crypto';

// Pingram/NotificationAPI webhook handler
// This endpoint receives delivery status updates for SMS notifications

interface PingramWebhookPayload {
  event: 'delivered' | 'failed' | 'sent' | 'clicked' | 'opened';
  notificationId: string;
  userId: string;
  channel: 'sms' | 'email' | 'push';
  timestamp: string;
  metadata?: {
    messageId?: string;
    error?: string;
    errorCode?: string;
  };
}

// Verify webhook signature from Pingram
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-pingram-signature') || 
                     request.headers.get('x-notificationapi-signature');
    
    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.PINGRAM_WEBHOOK_SECRET;
    if (webhookSecret && !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload: PingramWebhookPayload = JSON.parse(rawBody);
    
    // Only process SMS delivery events
    if (payload.channel !== 'sms') {
      return NextResponse.json({ success: true, message: 'Ignored non-SMS event' });
    }

    const supabase = createServerClient();

    // Map Pingram event to our status
    let status: 'sent' | 'delivered' | 'failed';
    switch (payload.event) {
      case 'delivered':
        status = 'delivered';
        break;
      case 'failed':
        status = 'failed';
        break;
      case 'sent':
        status = 'sent';
        break;
      default:
        // Ignore other events like clicked, opened
        return NextResponse.json({ success: true, message: `Ignored event: ${payload.event}` });
    }

    // Find the notification log by external_id (message ID)
    const messageId = payload.metadata?.messageId || payload.notificationId;
    
    const { data: logs, error: findError } = await supabase
      .from('notification_logs')
      .select('id, status')
      .eq('external_id', messageId)
      .eq('channel', 'sms');

    if (findError) {
      console.error('Error finding notification log:', findError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!logs || logs.length === 0) {
      // Try finding by recipient phone (userId in Pingram is often the phone number)
      const { data: logsByPhone, error: phoneError } = await supabase
        .from('notification_logs')
        .select('id, status')
        .eq('recipient_phone', payload.userId)
        .eq('channel', 'sms')
        .eq('status', 'sent')
        .order('created_at', { ascending: false })
        .limit(1);

      if (phoneError || !logsByPhone || logsByPhone.length === 0) {
        console.warn('No matching notification log found for:', messageId);
        return NextResponse.json({ success: true, message: 'No matching log found' });
      }

      // Update the found log
      const updateData: any = { status };
      if (status === 'delivered') {
        updateData.delivered_at = payload.timestamp || new Date().toISOString();
      }
      if (status === 'failed' && payload.metadata?.error) {
        updateData.error_message = payload.metadata.error;
      }

      const { error: updateError } = await supabase
        .from('notification_logs')
        .update(updateData)
        .eq('id', logsByPhone[0].id);

      if (updateError) {
        console.error('Error updating notification log:', updateError);
        return NextResponse.json({ error: 'Failed to update log' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: `Updated log ${logsByPhone[0].id} to ${status}` 
      });
    }

    // Update the found log(s)
    for (const log of logs) {
      // Don't downgrade status (e.g., don't change delivered back to sent)
      if (log.status === 'delivered' && status !== 'delivered') {
        continue;
      }

      const updateData: any = { status };
      if (status === 'delivered') {
        updateData.delivered_at = payload.timestamp || new Date().toISOString();
      }
      if (status === 'failed' && payload.metadata?.error) {
        updateData.error_message = payload.metadata.error;
      }

      const { error: updateError } = await supabase
        .from('notification_logs')
        .update(updateData)
        .eq('id', log.id);

      if (updateError) {
        console.error('Error updating notification log:', updateError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${payload.event} event for ${logs.length} log(s)` 
    });
  } catch (error) {
    console.error('Pingram webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint for webhook verification (some services require this)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    // Return the challenge for webhook verification
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({ 
    status: 'ok',
    message: 'Pingram webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
