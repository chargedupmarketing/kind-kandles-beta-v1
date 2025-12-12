import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// POST: Create review request and send email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, delay_hours = 24 } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get order details with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          product_id,
          product_name,
          quantity
        )
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if review token already exists for this order
    const { data: existingToken } = await supabase
      .from('review_tokens')
      .select('id')
      .eq('order_id', order_id)
      .single();

    if (existingToken) {
      return NextResponse.json({ 
        message: 'Review request already sent for this order',
        token_id: existingToken.id 
      });
    }

    // Get product IDs from order items
    const productIds = order.order_items?.map((item: { product_id: string }) => item.product_id) || [];

    if (productIds.length === 0) {
      return NextResponse.json({ error: 'No products found in order' }, { status: 400 });
    }

    // Generate unique token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

    // Create review token
    const { data: reviewToken, error: tokenError } = await supabase
      .from('review_tokens')
      .insert({
        order_id,
        customer_email: order.customer_email,
        customer_name: order.customer_name || order.shipping_address?.name,
        token,
        product_ids: productIds,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (tokenError) {
      console.error('Error creating review token:', tokenError);
      return NextResponse.json({ error: 'Failed to create review token' }, { status: 500 });
    }

    // If delay_hours is 0, send immediately; otherwise schedule
    if (delay_hours === 0) {
      await sendReviewRequestEmail(reviewToken, order);
    } else {
      // Schedule the review request
      const scheduledFor = new Date();
      scheduledFor.setHours(scheduledFor.getHours() + delay_hours);

      await supabase
        .from('scheduled_review_requests')
        .insert({
          order_id,
          scheduled_for: scheduledFor.toISOString(),
        });
    }

    return NextResponse.json({
      success: true,
      token_id: reviewToken.id,
      message: delay_hours === 0 ? 'Review request sent' : `Review request scheduled for ${delay_hours} hours`,
    });
  } catch (error) {
    console.error('Review request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to send review request email
async function sendReviewRequestEmail(reviewToken: any, order: any) {
  if (!resend) {
    console.warn('Resend API key not configured, skipping email');
    return;
  }

  const reviewUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kindkandlesboutique.com'}/reviews/${reviewToken.token}`;
  
  // Get product details
  const { data: products } = await supabase
    .from('products')
    .select('id, title, images')
    .in('id', reviewToken.product_ids);

  const productList = products?.map((p: any) => {
    const image = p.images?.[0]?.url || '/logos/logo.png';
    return `
      <tr>
        <td style="padding: 10px;">
          <img src="${image}" alt="${p.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />
        </td>
        <td style="padding: 10px; font-size: 14px; color: #333;">${p.title}</td>
      </tr>
    `;
  }).join('') || '';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #d4a574 0%, #c49b6a 100%); padding: 30px; text-align: center;">
          <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://kindkandlesboutique.com'}/logos/logo.png" alt="My Kind Kandles" style="max-width: 150px; height: auto;" />
          <h1 style="color: #ffffff; margin: 20px 0 0; font-size: 24px;">How did we do?</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Hi ${reviewToken.customer_name || 'Valued Customer'},
          </p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            We hope you're enjoying your recent purchase! Your feedback helps us improve and helps other customers make informed decisions.
          </p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Would you take a moment to share your experience with these products?
          </p>

          <!-- Products -->
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f9f9f9; border-radius: 8px;">
            ${productList}
          </table>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${reviewUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4a574 0%, #c49b6a 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-size: 16px; font-weight: bold;">
              Write a Review
            </a>
          </div>

          <p style="font-size: 14px; color: #666; line-height: 1.6; text-align: center;">
            This link expires in 7 days and can only be used once.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999; margin: 0;">
            Thank you for shopping with My Kind Kandles & Boutique
          </p>
          <p style="font-size: 12px; color: #999; margin: 10px 0 0;">
            © ${new Date().getFullYear()} My Kind Kandles & Boutique. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'My Kind Kandles <orders@kindkandlesboutique.com>',
      to: reviewToken.customer_email,
      subject: 'How was your order? Share your thoughts!',
      html: emailHtml,
    });

    // Update token with email sent timestamp
    await supabase
      .from('review_tokens')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', reviewToken.id);
  } catch (error) {
    console.error('Error sending review email:', error);
    throw error;
  }
}

// GET: Process scheduled review requests (called by cron job or manually)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Simple auth for cron job
    if (secret !== process.env.CRON_SECRET && secret !== 'manual') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pending scheduled requests that are due
    const { data: scheduledRequests, error } = await supabase
      .from('scheduled_review_requests')
      .select(`
        *,
        orders (
          *,
          order_items (
            product_id,
            product_name,
            quantity
          )
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(50);

    if (error) {
      console.error('Error fetching scheduled requests:', error);
      return NextResponse.json({ error: 'Failed to fetch scheduled requests' }, { status: 500 });
    }

    let processed = 0;
    let failed = 0;

    for (const request of scheduledRequests || []) {
      try {
        // Get the review token for this order
        const { data: reviewToken } = await supabase
          .from('review_tokens')
          .select('*')
          .eq('order_id', request.order_id)
          .single();

        if (reviewToken && !reviewToken.email_sent_at) {
          await sendReviewRequestEmail(reviewToken, request.orders);
        }

        // Mark as processed
        await supabase
          .from('scheduled_review_requests')
          .update({
            status: 'processed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', request.id);

        processed++;
      } catch (err) {
        console.error(`Error processing request ${request.id}:`, err);
        
        await supabase
          .from('scheduled_review_requests')
          .update({
            status: 'failed',
            error_message: err instanceof Error ? err.message : 'Unknown error',
          })
          .eq('id', request.id);

        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      failed,
      total: scheduledRequests?.length || 0,
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

