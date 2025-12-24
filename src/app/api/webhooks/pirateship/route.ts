import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { mapTrackingStatusToOrderStatus, verifyWebhookSignature } from '@/lib/pirateship';
import { Resend } from 'resend';

const PIRATESHIP_WEBHOOK_SECRET = process.env.PIRATESHIP_WEBHOOK_SECRET || '';

// Tracking status to email template mapping
const STATUS_EMAIL_MAP: Record<string, string> = {
  TRANSIT: 'package-in-transit',
  OUT_FOR_DELIVERY: 'out-for-delivery',
  DELIVERED: 'package-delivered',
  RETURNED: 'package-returned',
  FAILURE: 'delivery-failed',
};

// POST /api/webhooks/pirateship - Handle Pirate Ship tracking webhooks
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-pirateship-signature') || '';

    // Verify webhook signature if secret is configured
    if (PIRATESHIP_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(rawBody, signature, PIRATESHIP_WEBHOOK_SECRET);
      if (!isValid) {
        console.error('Invalid Pirate Ship webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const { event, data } = payload;

    console.log('Pirate Ship webhook received:', event, data?.tracking_number);

    // Handle tracking update events
    if (event === 'track_updated') {
      await handleTrackingUpdate(data);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Shippo webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleTrackingUpdate(trackingData: {
  tracking_number: string;
  carrier: string;
  tracking_status: {
    status: string;
    status_details: string;
    status_date: string;
    location?: {
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
  tracking_history: Array<{
    status: string;
    status_details: string;
    status_date: string;
    location?: {
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  }>;
  eta?: string;
  metadata?: string;
}) {
  if (!isSupabaseConfigured()) {
    console.log('Database not configured, skipping tracking update');
    return;
  }

  const supabase = createServerClient();

  // Find shipment by tracking number
  const { data: shipment, error: shipmentError } = await supabase
    .from('shipments')
    .select('*, orders(id, customer_email, customer_name, order_number)')
    .eq('tracking_number', trackingData.tracking_number)
    .single();

  if (shipmentError || !shipment) {
    console.log('Shipment not found for tracking number:', trackingData.tracking_number);
    return;
  }

  const currentStatus = trackingData.tracking_status.status;
  const orderStatus = mapTrackingStatusToOrderStatus(currentStatus);

  // Update shipment with latest tracking info
  const updateData: Record<string, unknown> = {
    status: currentStatus.toLowerCase(),
    tracking_history: trackingData.tracking_history,
    updated_at: new Date().toISOString(),
  };

  if (trackingData.eta) {
    updateData.estimated_delivery = trackingData.eta;
  }

  if (currentStatus === 'DELIVERED') {
    updateData.delivered_date = trackingData.tracking_status.status_date;
    
    // Schedule review request email for 24 hours after delivery
    if (shipment.order_id) {
      await scheduleReviewRequest(supabase, shipment.order_id, shipment.id);
    }
  }

  await supabase
    .from('shipments')
    .update(updateData)
    .eq('id', shipment.id);

  // Update order status
  if (shipment.order_id) {
    await supabase
      .from('orders')
      .update({ 
        status: orderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shipment.order_id);
  }

  // Send customer notification email
  const emailTemplate = STATUS_EMAIL_MAP[currentStatus];
  if (emailTemplate && shipment.orders?.customer_email) {
    await sendTrackingNotification(
      shipment.orders.customer_email,
      shipment.orders.customer_name,
      shipment.orders.order_number,
      trackingData.tracking_number,
      shipment.tracking_url,
      currentStatus,
      trackingData.tracking_status.status_details,
      trackingData.eta
    );
  }
}

async function sendTrackingNotification(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  trackingNumber: string,
  trackingUrl: string,
  status: string,
  statusDetails: string,
  eta?: string
) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey || resendApiKey.includes('placeholder')) {
    console.log('Resend not configured, skipping notification email');
    return;
  }

  const resend = new Resend(resendApiKey);
  const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  // Get status-specific subject and content
  const { subject, headline, message } = getStatusContent(status, statusDetails, eta);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 30px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 24px;">📦 ${headline}</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <p style="color: #555; font-size: 16px;">Hi ${customerName},</p>
          <p style="color: #555; font-size: 16px;">${message}</p>
          
          <!-- Order Info -->
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 25px 0;">
            <p style="margin: 0 0 10px; color: #666;"><strong>Order:</strong> ${orderNumber}</p>
            <p style="margin: 0 0 10px; color: #666;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
            ${eta ? `<p style="margin: 0; color: #666;"><strong>Estimated Delivery:</strong> ${new Date(eta).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>` : ''}
          </div>
          
          <!-- Track Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingUrl}" style="display: inline-block; background: #14b8a6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Track Your Package
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; text-align: center;">
            Thank you for shopping with My Kind Kandles & Boutique! 🕯️
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="margin: 0; color: #888; font-size: 12px;">My Kind Kandles & Boutique</p>
          <p style="margin: 5px 0 0; color: #888; font-size: 12px;">Maryland, USA</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: customerEmail,
      subject: `${subject} - Order ${orderNumber}`,
      html,
    });
    console.log('Tracking notification sent to:', customerEmail);
  } catch (error) {
    console.error('Failed to send tracking notification:', error);
  }
}

// Schedule a review request email 24 hours after delivery
async function scheduleReviewRequest(
  supabase: ReturnType<typeof createServerClient>,
  orderId: string,
  shipmentId: string
) {
  try {
    // Check if a review request is already scheduled for this order
    const { data: existingRequest } = await supabase
      .from('scheduled_review_requests')
      .select('id')
      .eq('order_id', orderId)
      .single();

    if (existingRequest) {
      console.log('Review request already scheduled for order:', orderId);
      return;
    }

    // Schedule for 24 hours from now
    const scheduledFor = new Date();
    scheduledFor.setHours(scheduledFor.getHours() + 24);

    // Create review token first
    const { data: order } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          product_id,
          product_name
        )
      `)
      .eq('id', orderId)
      .single();

    if (!order || !order.order_items?.length) {
      console.log('Order or order items not found for review request:', orderId);
      return;
    }

    // Generate unique token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

    const productIds = order.order_items.map((item: { product_id: string }) => item.product_id);

    // Create review token
    await supabase
      .from('review_tokens')
      .insert({
        order_id: orderId,
        customer_email: order.customer_email,
        customer_name: order.customer_name || order.shipping_address?.name,
        token,
        product_ids: productIds,
        expires_at: expiresAt.toISOString(),
      });

    // Schedule the review request
    await supabase
      .from('scheduled_review_requests')
      .insert({
        order_id: orderId,
        shipment_id: shipmentId,
        scheduled_for: scheduledFor.toISOString(),
        status: 'pending',
      });

    console.log('Review request scheduled for order:', orderId, 'at', scheduledFor.toISOString());
  } catch (error) {
    console.error('Error scheduling review request:', error);
  }
}

function getStatusContent(status: string, statusDetails: string, eta?: string): {
  subject: string;
  headline: string;
  message: string;
} {
  switch (status) {
    case 'TRANSIT':
      return {
        subject: 'Your Order is On Its Way',
        headline: 'Your Package is in Transit!',
        message: `Great news! Your order has been picked up by the carrier and is on its way to you. ${statusDetails}`,
      };
    case 'OUT_FOR_DELIVERY':
      return {
        subject: 'Out for Delivery Today',
        headline: 'Your Package is Out for Delivery!',
        message: 'Exciting news! Your package is out for delivery and should arrive today. Keep an eye out for the delivery person!',
      };
    case 'DELIVERED':
      return {
        subject: 'Your Order Has Been Delivered',
        headline: 'Package Delivered! 🎉',
        message: 'Your order has been delivered! We hope you love your new products. If you have any questions, please don\'t hesitate to reach out.',
      };
    case 'RETURNED':
      return {
        subject: 'Package Returned to Sender',
        headline: 'Package Returned',
        message: 'Unfortunately, your package was returned to us. Please contact us to arrange reshipment or a refund.',
      };
    case 'FAILURE':
      return {
        subject: 'Delivery Issue with Your Order',
        headline: 'Delivery Issue',
        message: `There was an issue with the delivery of your package: ${statusDetails}. Please contact us for assistance.`,
      };
    default:
      return {
        subject: 'Shipping Update',
        headline: 'Shipping Update',
        message: `Here's an update on your order: ${statusDetails}`,
      };
  }
}

