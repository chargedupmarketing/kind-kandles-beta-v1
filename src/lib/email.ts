import { Resend } from 'resend';
import type { OrderWithItems } from './database.types';

const resendApiKey = process.env.RESEND_API_KEY || 'placeholder-key';
const resend = new Resend(resendApiKey);

const FROM_EMAIL = process.env.EMAIL_FROM || 'orders@kindkandlesboutique.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@kindkandlesboutique.com';

interface EmailResult {
  success: boolean;
  error?: string;
}

// Helper to check if email is configured
export function isEmailConfigured(): boolean {
  const key = process.env.RESEND_API_KEY;
  return !!(key && !key.includes('placeholder'));
}

// Order Confirmation Email
export async function sendOrderConfirmation(order: OrderWithItems): Promise<EmailResult> {
  try {
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          ${item.title}${item.variant_title ? ` - ${item.variant_title}` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
          $${item.total.toFixed(2)}
        </td>
      </tr>
    `).join('');

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.customer_email,
      subject: `Order Confirmation - ${order.order_number}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #db2777; margin: 0;">My Kind Kandles & Boutique</h1>
            <p style="color: #666; margin: 5px 0;">Do All Things With Kindness</p>
          </div>

          <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0 0 10px;">Thank You for Your Order!</h2>
            <p style="color: #666; margin: 0;">Order Number: <strong>${order.order_number}</strong></p>
          </div>

          <div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px; color: #333;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #eee;">Item</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #eee;">Qty</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #eee;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 12px; text-align: right;">Subtotal:</td>
                  <td style="padding: 12px; text-align: right;">$${order.subtotal.toFixed(2)}</td>
                </tr>
                ${order.discount > 0 ? `
                <tr>
                  <td colspan="2" style="padding: 12px; text-align: right; color: #16a34a;">Discount:</td>
                  <td style="padding: 12px; text-align: right; color: #16a34a;">-$${order.discount.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td colspan="2" style="padding: 12px; text-align: right;">Shipping:</td>
                  <td style="padding: 12px; text-align: right;">${order.shipping_cost === 0 ? 'FREE' : `$${order.shipping_cost.toFixed(2)}`}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 12px; text-align: right;">Tax:</td>
                  <td style="padding: 12px; text-align: right;">$${order.tax.toFixed(2)}</td>
                </tr>
                <tr style="font-weight: bold; font-size: 1.1em;">
                  <td colspan="2" style="padding: 12px; text-align: right; border-top: 2px solid #db2777;">Total:</td>
                  <td style="padding: 12px; text-align: right; border-top: 2px solid #db2777; color: #db2777;">$${order.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px; color: #333;">Shipping Address</h3>
            <p style="margin: 0; color: #666;">
              ${order.customer_name}<br>
              ${order.shipping_address_line1}<br>
              ${order.shipping_address_line2 ? order.shipping_address_line2 + '<br>' : ''}
              ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}<br>
              ${order.shipping_country}
            </p>
          </div>

          <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
            <p>We'll send you another email when your order ships.</p>
            <p>Questions? Reply to this email or visit our <a href="https://kindkandlesboutique.com/about/contact" style="color: #db2777;">contact page</a>.</p>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} My Kind Kandles & Boutique. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending order confirmation:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Email error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

// Shipping Notification Email
export async function sendShippingNotification(order: OrderWithItems): Promise<EmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.customer_email,
      subject: `Your Order Has Shipped! - ${order.order_number}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #db2777; margin: 0;">My Kind Kandles & Boutique</h1>
          </div>

          <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0 0 10px;">📦 Your Order Has Shipped!</h2>
            <p style="color: #666; margin: 0;">Order Number: <strong>${order.order_number}</strong></p>
          </div>

          ${order.tracking_number ? `
          <div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center;">
            <h3 style="margin: 0 0 10px; color: #333;">Tracking Information</h3>
            <p style="margin: 0 0 15px; color: #666;">Tracking Number: <strong>${order.tracking_number}</strong></p>
            ${order.tracking_url ? `
            <a href="${order.tracking_url}" style="display: inline-block; background: #db2777; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Track Your Package
            </a>
            ` : ''}
          </div>
          ` : ''}

          <div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px; color: #333;">Shipping To</h3>
            <p style="margin: 0; color: #666;">
              ${order.customer_name}<br>
              ${order.shipping_address_line1}<br>
              ${order.shipping_address_line2 ? order.shipping_address_line2 + '<br>' : ''}
              ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}
            </p>
          </div>

          <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
            <p>Thank you for shopping with us! We hope you love your order. 💕</p>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} My Kind Kandles & Boutique. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending shipping notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Email error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

// Admin New Order Notification
export async function sendAdminOrderNotification(order: OrderWithItems): Promise<EmailResult> {
  try {
    const itemsList = order.items.map(item => 
      `• ${item.title}${item.variant_title ? ` (${item.variant_title})` : ''} x${item.quantity} - $${item.total.toFixed(2)}`
    ).join('\n');

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `🎉 New Order! ${order.order_number} - $${order.total.toFixed(2)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #db2777;">New Order Received! 🎉</h1>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p><strong>Order Number:</strong> ${order.order_number}</p>
            <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
            <p><strong>Customer:</strong> ${order.customer_name}</p>
            <p><strong>Email:</strong> ${order.customer_email}</p>
          </div>

          <h3>Items:</h3>
          <pre style="background: #f9fafb; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${itemsList}</pre>

          <h3>Shipping Address:</h3>
          <p>
            ${order.shipping_address_line1}<br>
            ${order.shipping_address_line2 ? order.shipping_address_line2 + '<br>' : ''}
            ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}
          </p>

          <p style="margin-top: 30px;">
            <a href="https://kindkandlesboutique.com/restricted/admin" style="display: inline-block; background: #db2777; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              View in Admin Dashboard
            </a>
          </p>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending admin notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Email error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

// Low Stock Alert
export async function sendLowStockAlert(productTitle: string, variantTitle: string, quantity: number): Promise<EmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `⚠️ Low Stock Alert: ${productTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #f59e0b;">⚠️ Low Stock Alert</h1>
          
          <div style="background: #fffbeb; border: 1px solid #fcd34d; padding: 20px; border-radius: 8px;">
            <p><strong>Product:</strong> ${productTitle}</p>
            <p><strong>Variant:</strong> ${variantTitle}</p>
            <p><strong>Remaining Stock:</strong> ${quantity} units</p>
          </div>

          <p style="margin-top: 20px;">
            <a href="https://kindkandlesboutique.com/restricted/admin" style="display: inline-block; background: #db2777; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              Manage Inventory
            </a>
          </p>
        </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to send email' };
  }
}

// =====================================================
// NEW NOTIFICATION EMAIL FUNCTIONS
// =====================================================

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kindkandlesboutique.com';

// Order Delivered Notification (Customer)
export async function sendOrderDeliveredNotification(order: {
  order_number: string;
  customer_name: string;
  customer_email: string;
}): Promise<EmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.customer_email,
      subject: `Your Order Has Been Delivered! - ${order.order_number}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #db2777; margin: 0;">My Kind Kandles & Boutique</h1>
          </div>

          <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0 0 10px;">🎉 Your Order Has Been Delivered!</h2>
            <p style="color: #666; margin: 0;">Order Number: <strong>${order.order_number}</strong></p>
          </div>

          <div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center;">
            <p style="font-size: 16px; color: #333;">Hi ${order.customer_name},</p>
            <p style="color: #666;">Great news! Your order has been delivered. We hope you love your purchase!</p>
            <p style="color: #666;">If you have a moment, we'd love to hear what you think. Your feedback helps us improve and helps other customers make informed decisions.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${SITE_URL}/collections/all" style="display: inline-block; background: #db2777; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Shop Again
            </a>
          </div>

          <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
            <p>Thank you for shopping with us! 💕</p>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} My Kind Kandles & Boutique. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending order delivered notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Email error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

// Order Issue Notification (Admin)
export async function sendOrderIssueNotification(order: {
  order_number: string;
  customer_name: string;
  customer_email: string;
  issue_type: string;
  details: string;
}, adminEmail?: string): Promise<EmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail || ADMIN_EMAIL,
      subject: `⚠️ Order Issue: ${order.order_number} - ${order.issue_type}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #dc2626;">⚠️ Order Issue Alert</h1>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p><strong>Order Number:</strong> ${order.order_number}</p>
            <p><strong>Issue Type:</strong> ${order.issue_type}</p>
            <p><strong>Customer:</strong> ${order.customer_name}</p>
            <p><strong>Email:</strong> ${order.customer_email}</p>
          </div>

          <h3>Issue Details:</h3>
          <p style="background: #f9fafb; padding: 15px; border-radius: 8px;">${order.details}</p>

          <p style="margin-top: 20px;">
            <a href="${SITE_URL}/restricted/admin" style="display: inline-block; background: #db2777; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              View Order
            </a>
          </p>
        </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to send email' };
  }
}

// High Value Order Notification (Admin)
export async function sendHighValueOrderNotification(order: {
  order_number: string;
  total: number;
  customer_name: string;
  customer_email: string;
}, adminEmail?: string): Promise<EmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail || ADMIN_EMAIL,
      subject: `💎 High Value Order! ${order.order_number} - $${order.total.toFixed(2)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #7c3aed;">💎 High Value Order!</h1>
          
          <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p><strong>Order Number:</strong> ${order.order_number}</p>
            <p style="font-size: 24px; color: #7c3aed;"><strong>Total: $${order.total.toFixed(2)}</strong></p>
            <p><strong>Customer:</strong> ${order.customer_name}</p>
            <p><strong>Email:</strong> ${order.customer_email}</p>
          </div>

          <p>This order exceeds the high-value threshold and may warrant special attention!</p>

          <p style="margin-top: 20px;">
            <a href="${SITE_URL}/restricted/admin" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              View in Admin Dashboard
            </a>
          </p>
        </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to send email' };
  }
}

// New Review Notification (Admin)
export async function sendNewReviewNotification(review: {
  product_name: string;
  rating: number;
  customer_name: string;
  customer_email: string;
  title?: string;
  content?: string;
}, adminEmail?: string): Promise<EmailResult> {
  try {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail || ADMIN_EMAIL,
      subject: `⭐ New Review: ${review.product_name} (${review.rating}/5)`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #db2777;">⭐ New Review Submitted</h1>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p><strong>Product:</strong> ${review.product_name}</p>
            <p><strong>Rating:</strong> <span style="color: #f59e0b; font-size: 18px;">${stars}</span> (${review.rating}/5)</p>
            <p><strong>Customer:</strong> ${review.customer_name}</p>
            <p><strong>Email:</strong> ${review.customer_email}</p>
          </div>

          ${review.title ? `<h3>${review.title}</h3>` : ''}
          ${review.content ? `<p style="background: #fff; border: 1px solid #eee; padding: 15px; border-radius: 8px;">${review.content}</p>` : ''}

          <p style="margin-top: 20px;">
            <a href="${SITE_URL}/restricted/admin" style="display: inline-block; background: #db2777; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              Review in Admin
            </a>
          </p>
        </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to send email' };
  }
}

// Review Approved Notification (Customer)
export async function sendReviewApprovedNotification(review: {
  product_name: string;
  customer_name: string;
  customer_email: string;
}): Promise<EmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: review.customer_email,
      subject: `Your Review Has Been Published!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #db2777; margin: 0;">My Kind Kandles & Boutique</h1>
          </div>

          <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0 0 10px;">Thank You!</h2>
            <p style="color: #666; margin: 0;">Your review has been published</p>
          </div>

          <div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <p>Hi ${review.customer_name},</p>
            <p>Your review for <strong>${review.product_name}</strong> has been approved and is now live on our website.</p>
            <p>Thank you for taking the time to share your feedback! Your review helps other customers make informed decisions.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${SITE_URL}/collections/all" style="display: inline-block; background: #db2777; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Continue Shopping
            </a>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} My Kind Kandles & Boutique. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to send email' };
  }
}

// New Story Notification (Admin)
export async function sendNewStoryNotification(story: {
  title: string;
  author: string;
  email: string;
  category: string;
  content: string;
}, adminEmail?: string): Promise<EmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail || ADMIN_EMAIL,
      subject: `📖 New Customer Story: ${story.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #db2777;">📖 New Customer Story</h1>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p><strong>Title:</strong> ${story.title}</p>
            <p><strong>Author:</strong> ${story.author}</p>
            <p><strong>Email:</strong> ${story.email}</p>
            <p><strong>Category:</strong> ${story.category}</p>
          </div>

          <h3>Story Preview:</h3>
          <div style="background: #fff; border: 1px solid #eee; padding: 15px; border-radius: 8px; max-height: 200px; overflow: hidden;">
            ${story.content.substring(0, 500)}${story.content.length > 500 ? '...' : ''}
          </div>

          <p style="margin-top: 20px;">
            <a href="${SITE_URL}/restricted/admin" style="display: inline-block; background: #db2777; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              Review in Admin
            </a>
          </p>
        </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to send email' };
  }
}

// Story Approved Notification (Customer)
export async function sendStoryApprovedNotification(story: {
  title: string;
  author: string;
  email: string;
}): Promise<EmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: story.email,
      subject: `Your Story Has Been Published!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #db2777; margin: 0;">My Kind Kandles & Boutique</h1>
          </div>

          <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0 0 10px;">Your Story is Live!</h2>
            <p style="color: #666; margin: 0;">"${story.title}"</p>
          </div>

          <div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <p>Hi ${story.author},</p>
            <p>Great news! Your story <strong>"${story.title}"</strong> has been approved and published on our website.</p>
            <p>Thank you for sharing your experience with our community. Your story helps inspire others!</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${SITE_URL}/about/stories" style="display: inline-block; background: #db2777; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              View Your Story
            </a>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} My Kind Kandles & Boutique. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to send email' };
  }
}

// New Event Booking Notification (Admin)
export async function sendNewEventBookingNotification(booking: {
  event_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  num_participants: number;
  requested_date?: string;
  location_preference?: string;
  special_requests?: string;
}, adminEmail?: string): Promise<EmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail || ADMIN_EMAIL,
      subject: `🎉 New Event Booking: ${booking.event_name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #db2777;">🎉 New Event Booking Request</h1>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p><strong>Event:</strong> ${booking.event_name}</p>
            <p><strong>Customer:</strong> ${booking.customer_name}</p>
            <p><strong>Email:</strong> ${booking.customer_email}</p>
            ${booking.customer_phone ? `<p><strong>Phone:</strong> ${booking.customer_phone}</p>` : ''}
            <p><strong>Participants:</strong> ${booking.num_participants}</p>
            ${booking.requested_date ? `<p><strong>Requested Date:</strong> ${booking.requested_date}</p>` : ''}
            ${booking.location_preference ? `<p><strong>Location:</strong> ${booking.location_preference}</p>` : ''}
          </div>

          ${booking.special_requests ? `
          <h3>Special Requests:</h3>
          <p style="background: #fff; border: 1px solid #eee; padding: 15px; border-radius: 8px;">${booking.special_requests}</p>
          ` : ''}

          <p style="margin-top: 20px;">
            <a href="${SITE_URL}/restricted/admin" style="display: inline-block; background: #db2777; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              View in Admin
            </a>
          </p>
        </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to send email' };
  }
}

// Event Confirmed Notification (Customer)
export async function sendEventConfirmedNotification(booking: {
  event_name: string;
  event_date: string;
  event_time?: string;
  customer_name: string;
  customer_email: string;
  location?: string;
  num_participants: number;
  total_price?: number;
}): Promise<EmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.customer_email,
      subject: `Your Event Booking is Confirmed! - ${booking.event_name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #db2777; margin: 0;">My Kind Kandles & Boutique</h1>
          </div>

          <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0 0 10px;">🎉 Booking Confirmed!</h2>
            <p style="color: #666; margin: 0;">${booking.event_name}</p>
          </div>

          <div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <p>Hi ${booking.customer_name},</p>
            <p>Great news! Your booking has been confirmed. Here are the details:</p>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Event:</strong> ${booking.event_name}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${booking.event_date}</p>
              ${booking.event_time ? `<p style="margin: 5px 0;"><strong>Time:</strong> ${booking.event_time}</p>` : ''}
              ${booking.location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${booking.location}</p>` : ''}
              <p style="margin: 5px 0;"><strong>Participants:</strong> ${booking.num_participants}</p>
              ${booking.total_price ? `<p style="margin: 5px 0;"><strong>Total:</strong> $${booking.total_price.toFixed(2)}</p>` : ''}
            </div>

            <p>We look forward to seeing you!</p>
          </div>

          <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
            <p>Questions? Reply to this email or visit our <a href="${SITE_URL}/about/contact" style="color: #db2777;">contact page</a>.</p>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} My Kind Kandles & Boutique. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to send email' };
  }
}

// Event Reminder Notification (Customer)
export async function sendEventReminderNotification(booking: {
  event_name: string;
  event_date: string;
  event_time?: string;
  customer_name: string;
  customer_email: string;
  location?: string;
}): Promise<EmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.customer_email,
      subject: `Reminder: ${booking.event_name} Tomorrow!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #db2777; margin: 0;">My Kind Kandles & Boutique</h1>
          </div>

          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0 0 10px;">⏰ Event Reminder</h2>
            <p style="color: #666; margin: 0;">${booking.event_name} is tomorrow!</p>
          </div>

          <div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <p>Hi ${booking.customer_name},</p>
            <p>This is a friendly reminder that your event is coming up tomorrow!</p>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Event:</strong> ${booking.event_name}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${booking.event_date}</p>
              ${booking.event_time ? `<p style="margin: 5px 0;"><strong>Time:</strong> ${booking.event_time}</p>` : ''}
              ${booking.location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${booking.location}</p>` : ''}
            </div>

            <p>We can't wait to see you there!</p>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} My Kind Kandles & Boutique. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to send email' };
  }
}

// Abandoned Cart Notification (Customer)
export async function sendAbandonedCartNotification(cart: {
  customer_name: string;
  customer_email: string;
  cart_items?: Array<{ title: string; quantity: number; price: number }>;
  cart_total?: number;
  cart_url: string;
}): Promise<EmailResult> {
  try {
    const itemsHtml = cart.cart_items?.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `).join('') || '';

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: cart.customer_email,
      subject: `You Left Something Behind!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #db2777; margin: 0;">My Kind Kandles & Boutique</h1>
          </div>

          <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0 0 10px;">Did You Forget Something?</h2>
            <p style="color: #666; margin: 0;">Your cart is waiting for you!</p>
          </div>

          <div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <p>Hi ${cart.customer_name || 'there'},</p>
            <p>We noticed you left some items in your cart. Don't worry - we saved them for you!</p>
            
            ${cart.cart_items && cart.cart_items.length > 0 ? `
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              ${cart.cart_total ? `
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold; color: #db2777;">$${cart.cart_total.toFixed(2)}</td>
                </tr>
              </tfoot>
              ` : ''}
            </table>
            ` : ''}

            <p>Complete your purchase before these items sell out!</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${cart.cart_url}" style="display: inline-block; background: #db2777; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Complete Your Order
            </a>
          </div>

          <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
            <p>Questions? Reply to this email or visit our <a href="${SITE_URL}/about/contact" style="color: #db2777;">contact page</a>.</p>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} My Kind Kandles & Boutique. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to send email' };
  }
}

