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

