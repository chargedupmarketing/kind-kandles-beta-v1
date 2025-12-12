import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  category: 'transactional' | 'marketing' | 'custom';
  subject: string;
  html_content: string;
  variables: string[];
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Default email templates
const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Order Confirmation',
    slug: 'order-confirmation',
    category: 'transactional',
    subject: 'Order Confirmation - {{order_number}}',
    description: 'Sent automatically when a customer places an order',
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #db2777 0%, #be185d 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">My Kind Kandles & Boutique</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Do All Things With Kindness</p>
    </div>
    
    <div style="padding: 30px;">
      <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 25px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
        <h2 style="color: #333; margin: 0 0 10px; font-size: 22px;">Thank You for Your Order! 💕</h2>
        <p style="color: #666; margin: 0;">Order Number: <strong>{{order_number}}</strong></p>
      </div>

      <p style="color: #555;">Hi {{customer_name}},</p>
      <p style="color: #555;">Thank you so much for your order! We're thrilled to have you as part of our Kind Kandles family. Your order is being prepared with love and care.</p>

      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px; color: #333; font-size: 16px;">Order Summary</h3>
        {{items_list}}
        <div style="border-top: 2px solid #eee; margin-top: 15px; padding-top: 15px;">
          <p style="margin: 5px 0; color: #555;"><strong>Subtotal:</strong> {{subtotal}}</p>
          <p style="margin: 5px 0; color: #555;"><strong>Shipping:</strong> {{shipping}}</p>
          <p style="margin: 5px 0; color: #555;"><strong>Tax:</strong> {{tax}}</p>
          <p style="margin: 10px 0 0; font-size: 18px; color: #db2777;"><strong>Total: {{order_total}}</strong></p>
        </div>
      </div>

      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px; color: #333; font-size: 16px;">Shipping To</h3>
        <p style="margin: 0; color: #555;">{{shipping_address}}</p>
      </div>

      <p style="color: #555;">We'll send you another email with tracking information once your order ships. If you have any questions, feel free to reply to this email.</p>
      
      <p style="color: #555;">With kindness,<br><strong>The Kind Kandles Team</strong></p>
    </div>
    
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; color: #888; font-size: 12px;">My Kind Kandles & Boutique</p>
      <p style="margin: 5px 0 0; color: #888; font-size: 12px;">Maryland, USA</p>
    </div>
  </div>
</body>
</html>`,
    variables: ['customer_name', 'order_number', 'order_total', 'subtotal', 'shipping', 'tax', 'items_list', 'shipping_address'],
    is_active: true,
  },
  {
    name: 'Shipping Notification',
    slug: 'shipping-notification',
    category: 'transactional',
    subject: 'Your Order Has Shipped! 📦 - {{order_number}}',
    description: 'Sent when an order is marked as shipped',
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #db2777 0%, #be185d 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">My Kind Kandles & Boutique</h1>
    </div>
    
    <div style="padding: 30px;">
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 25px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
        <h2 style="color: #333; margin: 0 0 10px; font-size: 22px;">📦 Your Order Has Shipped!</h2>
        <p style="color: #666; margin: 0;">Order Number: <strong>{{order_number}}</strong></p>
      </div>

      <p style="color: #555;">Hi {{customer_name}},</p>
      <p style="color: #555;">Great news! Your order is on its way to you. We've carefully packed your items with love and they're now in transit.</p>

      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <h3 style="margin: 0 0 10px; color: #333; font-size: 16px;">Tracking Information</h3>
        <p style="margin: 0 0 15px; color: #555;">Tracking Number: <strong>{{tracking_number}}</strong></p>
        <a href="{{tracking_url}}" style="display: inline-block; background: #db2777; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Track Your Package</a>
      </div>

      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px; color: #333; font-size: 16px;">Shipping To</h3>
        <p style="margin: 0; color: #555;">{{shipping_address}}</p>
      </div>

      <p style="color: #555;">Thank you for choosing Kind Kandles! We hope you love your order.</p>
      
      <p style="color: #555;">With kindness,<br><strong>The Kind Kandles Team</strong></p>
    </div>
    
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; color: #888; font-size: 12px;">My Kind Kandles & Boutique</p>
      <p style="margin: 5px 0 0; color: #888; font-size: 12px;">Maryland, USA</p>
    </div>
  </div>
</body>
</html>`,
    variables: ['customer_name', 'order_number', 'tracking_number', 'tracking_url', 'shipping_address'],
    is_active: true,
  },
  {
    name: 'Delivery Confirmation',
    slug: 'delivery-confirmation',
    category: 'transactional',
    subject: 'Your Order Has Been Delivered! 🎉 - {{order_number}}',
    description: 'Sent when an order is marked as delivered',
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #db2777 0%, #be185d 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">My Kind Kandles & Boutique</h1>
    </div>
    
    <div style="padding: 30px;">
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
        <h2 style="color: #333; margin: 0 0 10px; font-size: 22px;">🎉 Your Order Has Arrived!</h2>
        <p style="color: #666; margin: 0;">Order Number: <strong>{{order_number}}</strong></p>
      </div>

      <p style="color: #555;">Hi {{customer_name}},</p>
      <p style="color: #555;">Your Kind Kandles order has been delivered! We hope you're as excited as we are for you to enjoy your new goodies.</p>

      <div style="background: #fdf2f8; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="color: #db2777; font-size: 18px; margin: 0 0 10px;">💕 We'd Love Your Feedback!</p>
        <p style="color: #555; margin: 0 0 15px;">Your reviews help other customers and help us improve.</p>
        <a href="{{review_url}}" style="display: inline-block; background: #db2777; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Leave a Review</a>
      </div>

      <p style="color: #555;">If there's anything we can help with, don't hesitate to reach out!</p>
      
      <p style="color: #555;">With kindness,<br><strong>The Kind Kandles Team</strong></p>
    </div>
    
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; color: #888; font-size: 12px;">My Kind Kandles & Boutique</p>
      <p style="margin: 5px 0 0; color: #888; font-size: 12px;">Maryland, USA</p>
    </div>
  </div>
</body>
</html>`,
    variables: ['customer_name', 'order_number', 'review_url'],
    is_active: true,
  },
  {
    name: 'Review Request',
    slug: 'review-request',
    category: 'transactional',
    subject: 'How are you enjoying your Kind Kandles? ✨',
    description: 'Sent 7 days after delivery to request a review',
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #db2777 0%, #be185d 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">My Kind Kandles & Boutique</h1>
    </div>
    
    <div style="padding: 30px;">
      <h2 style="color: #333; margin: 0 0 20px; text-align: center;">How Are You Enjoying Your Order? ✨</h2>

      <p style="color: #555;">Hi {{customer_name}},</p>
      <p style="color: #555;">It's been about a week since your Kind Kandles order arrived, and we'd love to hear what you think!</p>

      <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
        <p style="color: #333; font-size: 18px; margin: 0 0 10px;">⭐⭐⭐⭐⭐</p>
        <p style="color: #555; margin: 0 0 20px;">Your feedback helps us create better products and helps other customers find their perfect scent!</p>
        <a href="{{review_url}}" style="display: inline-block; background: #db2777; color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Share Your Experience</a>
      </div>

      <p style="color: #555;">As a thank you for your review, enjoy <strong>10% off</strong> your next order with code: <strong style="color: #db2777;">THANKYOU10</strong></p>
      
      <p style="color: #555;">With gratitude,<br><strong>The Kind Kandles Team</strong></p>
    </div>
    
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; color: #888; font-size: 12px;">My Kind Kandles & Boutique</p>
      <p style="margin: 5px 0 0; color: #888; font-size: 12px;">Maryland, USA</p>
    </div>
  </div>
</body>
</html>`,
    variables: ['customer_name', 'review_url', 'product_name'],
    is_active: true,
  },
  {
    name: 'Welcome Email',
    slug: 'welcome-email',
    category: 'marketing',
    subject: 'Welcome to the Kind Kandles Family! 💕',
    description: 'Sent to new newsletter subscribers',
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #db2777 0%, #be185d 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Kind Kandles! 💕</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Do All Things With Kindness</p>
    </div>
    
    <div style="padding: 30px;">
      <p style="color: #555; font-size: 17px;">Hi {{subscriber_name}},</p>
      <p style="color: #555;">Welcome to the Kind Kandles family! We're so happy to have you here. 🕯️</p>

      <p style="color: #555;">At My Kind Kandles & Boutique, we believe in creating moments of peace and self-care through our handmade candles and skincare products. Every item is crafted with love in Maryland.</p>

      <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
        <p style="color: #db2777; font-size: 20px; font-weight: bold; margin: 0 0 10px;">🎁 Welcome Gift!</p>
        <p style="color: #555; margin: 0 0 15px;">Enjoy 15% off your first order</p>
        <div style="background: white; border: 2px dashed #db2777; border-radius: 8px; padding: 15px; display: inline-block;">
          <span style="font-size: 24px; font-weight: bold; color: #db2777; letter-spacing: 2px;">WELCOME15</span>
        </div>
      </div>

      <h3 style="color: #333; margin: 25px 0 15px;">What to Expect:</h3>
      <ul style="color: #555; padding-left: 20px;">
        <li style="margin-bottom: 8px;">✨ Exclusive subscriber-only discounts</li>
        <li style="margin-bottom: 8px;">🕯️ First access to new products</li>
        <li style="margin-bottom: 8px;">💡 Self-care tips and candle care guides</li>
        <li style="margin-bottom: 8px;">🎉 Special birthday surprises</li>
      </ul>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{shop_url}}" style="display: inline-block; background: #db2777; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Start Shopping</a>
      </div>

      <p style="color: #555;">With kindness,<br><strong>The Kind Kandles Team</strong></p>
    </div>
    
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; color: #888; font-size: 12px;">My Kind Kandles & Boutique</p>
      <p style="margin: 5px 0 0; color: #888; font-size: 12px;">Maryland, USA</p>
      <p style="margin: 10px 0 0;"><a href="{{unsubscribe_link}}" style="color: #888; font-size: 11px;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`,
    variables: ['subscriber_name', 'shop_url', 'unsubscribe_link'],
    is_active: true,
  },
  {
    name: 'Weekly Newsletter',
    slug: 'weekly-newsletter',
    category: 'marketing',
    subject: '{{newsletter_title}} | Kind Kandles Weekly',
    description: 'Weekly newsletter template for GoHighLevel automation',
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #db2777 0%, #be185d 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">My Kind Kandles & Boutique</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Weekly Kindness ✨</p>
    </div>
    
    <div style="padding: 30px;">
      <h2 style="color: #333; margin: 0 0 20px; text-align: center;">{{newsletter_title}}</h2>

      <p style="color: #555;">Hi {{subscriber_name}},</p>
      
      <div style="color: #555;">
        {{newsletter_content}}
      </div>

      <!-- Featured Products Section -->
      <div style="margin: 30px 0;">
        <h3 style="color: #333; margin: 0 0 20px; text-align: center; border-bottom: 2px solid #fce7f3; padding-bottom: 10px;">✨ Featured This Week</h3>
        {{featured_products}}
      </div>

      <!-- Special Offer Section -->
      <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
        <p style="color: #db2777; font-size: 18px; font-weight: bold; margin: 0 0 10px;">{{offer_title}}</p>
        <p style="color: #555; margin: 0 0 15px;">{{offer_description}}</p>
        <div style="background: white; border: 2px dashed #db2777; border-radius: 8px; padding: 12px 20px; display: inline-block;">
          <span style="font-size: 20px; font-weight: bold; color: #db2777; letter-spacing: 2px;">{{discount_code}}</span>
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{shop_url}}" style="display: inline-block; background: #db2777; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Shop Now</a>
      </div>

      <p style="color: #555;">With kindness,<br><strong>The Kind Kandles Team</strong></p>
    </div>
    
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
      <div style="margin-bottom: 15px;">
        <a href="{{facebook_url}}" style="display: inline-block; margin: 0 5px; color: #888;">Facebook</a> |
        <a href="{{instagram_url}}" style="display: inline-block; margin: 0 5px; color: #888;">Instagram</a> |
        <a href="{{tiktok_url}}" style="display: inline-block; margin: 0 5px; color: #888;">TikTok</a>
      </div>
      <p style="margin: 0; color: #888; font-size: 12px;">My Kind Kandles & Boutique</p>
      <p style="margin: 5px 0 0; color: #888; font-size: 12px;">Maryland, USA</p>
      <p style="margin: 10px 0 0;"><a href="{{unsubscribe_link}}" style="color: #888; font-size: 11px;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`,
    variables: ['subscriber_name', 'newsletter_title', 'newsletter_content', 'featured_products', 'offer_title', 'offer_description', 'discount_code', 'shop_url', 'facebook_url', 'instagram_url', 'tiktok_url', 'unsubscribe_link'],
    is_active: true,
  },
  {
    name: 'Promotional Email',
    slug: 'promotional-email',
    category: 'marketing',
    subject: '{{promo_title}} - {{discount_percent}}% Off! 🎉',
    description: 'Sale announcements and promotional campaigns',
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #db2777 0%, #be185d 100%); padding: 40px 30px; text-align: center;">
      <p style="color: rgba(255,255,255,0.9); margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Limited Time Offer</p>
      <h1 style="color: white; margin: 0; font-size: 36px;">{{discount_percent}}% OFF</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 18px;">{{promo_title}}</p>
    </div>
    
    <div style="padding: 30px;">
      <p style="color: #555;">Hi {{subscriber_name}},</p>
      
      <div style="color: #555;">
        {{promo_content}}
      </div>

      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
        <p style="color: #92400e; font-size: 14px; margin: 0 0 10px;">Use code at checkout:</p>
        <div style="background: white; border: 3px dashed #f59e0b; border-radius: 8px; padding: 15px 25px; display: inline-block;">
          <span style="font-size: 28px; font-weight: bold; color: #db2777; letter-spacing: 3px;">{{discount_code}}</span>
        </div>
        <p style="color: #92400e; font-size: 13px; margin: 15px 0 0;">Expires: {{expiry_date}}</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{shop_url}}" style="display: inline-block; background: #db2777; color: white; padding: 16px 50px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px;">Shop the Sale</a>
      </div>

      <p style="color: #555;">Don't miss out on these amazing deals!</p>
      
      <p style="color: #555;">With kindness,<br><strong>The Kind Kandles Team</strong></p>
    </div>
    
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; color: #888; font-size: 12px;">My Kind Kandles & Boutique</p>
      <p style="margin: 5px 0 0; color: #888; font-size: 12px;">Maryland, USA</p>
      <p style="margin: 10px 0 0;"><a href="{{unsubscribe_link}}" style="color: #888; font-size: 11px;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`,
    variables: ['subscriber_name', 'promo_title', 'promo_content', 'discount_percent', 'discount_code', 'expiry_date', 'shop_url', 'unsubscribe_link'],
    is_active: true,
  },
  {
    name: 'Abandoned Cart Reminder',
    slug: 'abandoned-cart',
    category: 'marketing',
    subject: 'Did you forget something? 🕯️',
    description: 'Reminder for customers who left items in their cart',
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #db2777 0%, #be185d 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">My Kind Kandles & Boutique</h1>
    </div>
    
    <div style="padding: 30px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 60px;">🛒</span>
        <h2 style="color: #333; margin: 10px 0 0;">You Left Something Behind!</h2>
      </div>

      <p style="color: #555;">Hi {{customer_name}},</p>
      <p style="color: #555;">We noticed you left some amazing items in your cart. Don't worry, we saved them for you!</p>

      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h3 style="margin: 0 0 15px; color: #333; font-size: 16px;">Your Cart:</h3>
        {{cart_items}}
        <div style="border-top: 2px solid #eee; margin-top: 15px; padding-top: 15px; text-align: right;">
          <p style="margin: 0; font-size: 18px; color: #db2777;"><strong>Total: {{cart_total}}</strong></p>
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
        <p style="color: #db2777; font-size: 16px; font-weight: bold; margin: 0 0 10px;">Complete your order and save 10%!</p>
        <div style="background: white; border: 2px dashed #db2777; border-radius: 8px; padding: 10px 20px; display: inline-block;">
          <span style="font-size: 18px; font-weight: bold; color: #db2777; letter-spacing: 2px;">COMEBACK10</span>
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{cart_url}}" style="display: inline-block; background: #db2777; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Complete My Order</a>
      </div>

      <p style="color: #888; font-size: 13px; text-align: center;">Items in your cart are not reserved and may sell out.</p>
      
      <p style="color: #555;">With kindness,<br><strong>The Kind Kandles Team</strong></p>
    </div>
    
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; color: #888; font-size: 12px;">My Kind Kandles & Boutique</p>
      <p style="margin: 5px 0 0; color: #888; font-size: 12px;">Maryland, USA</p>
      <p style="margin: 10px 0 0;"><a href="{{unsubscribe_link}}" style="color: #888; font-size: 11px;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`,
    variables: ['customer_name', 'cart_items', 'cart_total', 'cart_url', 'unsubscribe_link'],
    is_active: true,
  },
];

// GET /api/admin/email-templates - List all templates
export async function GET() {
  try {
    const supabase = createServerClient();
    
    // Try to get templates from database
    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      // If table doesn't exist, return default templates
      console.log('Email templates table not found, returning defaults');
      const defaultsWithIds = DEFAULT_TEMPLATES.map((t, i) => ({
        ...t,
        id: `default-${i}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      return NextResponse.json({ templates: defaultsWithIds, isDefault: true });
    }

    // If no templates exist, seed with defaults
    if (!templates || templates.length === 0) {
      const { data: seeded, error: seedError } = await supabase
        .from('email_templates')
        .insert(DEFAULT_TEMPLATES.map(t => ({
          ...t,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })))
        .select();

      if (seedError) {
        console.error('Error seeding templates:', seedError);
        const defaultsWithIds = DEFAULT_TEMPLATES.map((t, i) => ({
          ...t,
          id: `default-${i}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        return NextResponse.json({ templates: defaultsWithIds, isDefault: true });
      }

      return NextResponse.json({ templates: seeded });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST /api/admin/email-templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    const newTemplate = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
      category: body.category || 'custom',
      subject: body.subject,
      html_content: body.html_content,
      variables: body.variables || [],
      description: body.description || '',
      is_active: body.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('email_templates')
      .insert(newTemplate)
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error('Error creating email template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

