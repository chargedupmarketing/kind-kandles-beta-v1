import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, reviews } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({ error: 'Reviews are required' }, { status: 400 });
    }

    // Validate token
    const { data: reviewToken, error: tokenError } = await supabase
      .from('review_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !reviewToken) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // Check if token is expired
    if (new Date(reviewToken.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This review link has expired' }, { status: 400 });
    }

    // Check if token has already been used
    if (reviewToken.used_at) {
      return NextResponse.json({ error: 'This review link has already been used' }, { status: 400 });
    }

    // Validate that all product IDs in reviews are in the token's product_ids
    const validProductIds = new Set(reviewToken.product_ids);
    for (const review of reviews) {
      if (!validProductIds.has(review.product_id)) {
        return NextResponse.json({ 
          error: 'Invalid product ID in review' 
        }, { status: 400 });
      }

      if (!review.rating || review.rating < 1 || review.rating > 5) {
        return NextResponse.json({ 
          error: 'Rating must be between 1 and 5' 
        }, { status: 400 });
      }
    }

    // Create reviews
    const reviewsToInsert = reviews.map((review: {
      product_id: string;
      rating: number;
      title?: string;
      content?: string;
    }) => ({
      product_id: review.product_id,
      customer_email: reviewToken.customer_email,
      customer_name: reviewToken.customer_name,
      rating: review.rating,
      title: review.title || null,
      content: review.content || null,
      status: 'pending', // Reviews need admin approval
      verified_purchase: true,
      order_id: reviewToken.order_id,
      review_token_id: reviewToken.id,
    }));

    const { data: insertedReviews, error: insertError } = await supabase
      .from('product_reviews')
      .insert(reviewsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting reviews:', insertError);
      return NextResponse.json({ error: 'Failed to submit reviews' }, { status: 500 });
    }

    // Mark token as used
    await supabase
      .from('review_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', reviewToken.id);

    // Send thank you email
    await sendThankYouEmail(reviewToken);

    return NextResponse.json({
      success: true,
      message: 'Thank you for your reviews! They will be published after approval.',
      reviews_submitted: insertedReviews?.length || 0,
    });
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendThankYouEmail(reviewToken: any) {
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
          <h1 style="color: #ffffff; margin: 20px 0 0; font-size: 24px;">Thank You!</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Hi ${reviewToken.customer_name || 'Valued Customer'},
          </p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Thank you for taking the time to share your feedback! Your review helps other customers make informed decisions and helps us continue to improve.
          </p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Your review will be published shortly after our team reviews it.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://kindkandlesboutique.com'}/collections/all" style="display: inline-block; background: linear-gradient(135deg, #d4a574 0%, #c49b6a 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-size: 16px; font-weight: bold;">
              Continue Shopping
            </a>
          </div>
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

  if (resend) {
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'My Kind Kandles <orders@kindkandlesboutique.com>',
        to: reviewToken.customer_email,
        subject: 'Thank you for your review!',
        html: emailHtml,
      });
    } catch (error) {
      console.error('Error sending thank you email:', error);
      // Don't throw - the review was still submitted successfully
    }
  } else {
    console.warn('Resend API key not configured, skipping thank you email');
  }
}

