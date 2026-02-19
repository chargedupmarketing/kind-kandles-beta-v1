import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getNotificationService } from '@/lib/notifications';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Verify admin from cookie
async function verifyAdmin(): Promise<{ userId: string; email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secure-jwt-secret-at-least-32-characters-long');
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

// POST - Send a test notification
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authAdmin = await verifyAdmin();
    if (!authAdmin || !authAdmin.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const adminId = authAdmin.userId;
    const body = await request.json();
    const { channel, notification_type } = body;

    if (!channel || !['email', 'sms'].includes(channel)) {
      return NextResponse.json({ error: 'Invalid channel. Must be "email" or "sms"' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get admin info
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, phone_number, first_name, last_name')
      .eq('id', adminId)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const service = getNotificationService();

    // Test data for the notification
    const testVariables = {
      order_number: 'MKK-TEST-001',
      total: '99.99',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      product_name: 'Test Candle',
      rating: 5,
      title: 'Test Story Title',
      author: 'Test Author',
      name: 'Test Contact',
      email: 'contact@example.com',
      subject: 'Test Subject',
      message: 'This is a test message.',
      event_name: 'Test Event',
      num_participants: 5,
      variant_name: 'Large',
      quantity: 3,
      issue_type: 'Payment Failed',
      details: 'Test payment failure details',
      admin_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kindkandlesboutique.com'}/restricted/admin`,
    };

    const results = [];

    if (channel === 'email') {
      if (!adminData.email) {
        return NextResponse.json({ error: 'No email address configured' }, { status: 400 });
      }

      // Get the template for the notification type
      const templateKey = notification_type 
        ? `admin_${notification_type}_email` 
        : 'admin_new_order_email';
      
      const template = await service.getTemplate(templateKey);
      
      const subject = template 
        ? service.renderTemplate(template.subject || 'Test Notification', testVariables)
        : 'Test Notification from Kind Kandles';
      
      const emailBody = template
        ? service.renderTemplate(template.body_template, testVariables)
        : `<h1>Test Notification</h1><p>This is a test notification sent at ${new Date().toLocaleString()}</p><p>If you received this, your email notifications are working correctly!</p>`;

      const result = await service.sendNotification({
        type: notification_type || 'test',
        recipientType: 'admin',
        recipientEmail: adminData.email,
        channels: ['email'],
        subject,
        body: emailBody,
      });

      results.push(...result);
    } else if (channel === 'sms') {
      if (!adminData.phone_number) {
        return NextResponse.json({ 
          error: 'No phone number configured. Please add your phone number in notification preferences first.' 
        }, { status: 400 });
      }

      // Check if SMS is configured
      if (!process.env.PINGRAM_CLIENT_ID || !process.env.PINGRAM_CLIENT_SECRET) {
        return NextResponse.json({ 
          error: 'SMS service not configured. Please add PINGRAM_CLIENT_ID and PINGRAM_CLIENT_SECRET to environment variables.' 
        }, { status: 400 });
      }

      // Get the template for the notification type
      const templateKey = notification_type 
        ? `admin_${notification_type}_sms` 
        : 'admin_new_order_sms';
      
      const template = await service.getTemplate(templateKey);
      
      const smsBody = template
        ? service.renderTemplate(template.body_template, testVariables)
        : `Test notification from Kind Kandles at ${new Date().toLocaleTimeString()}`;

      const result = await service.sendNotification({
        type: notification_type || 'test',
        recipientType: 'admin',
        recipientPhone: adminData.phone_number,
        channels: ['sms'],
        body: smsBody,
      });

      results.push(...result);
    }

    const success = results.some(r => r.success);
    const errors = results.filter(r => !r.success).map(r => r.error);

    return NextResponse.json({
      success,
      channel,
      notification_type: notification_type || 'test',
      recipient: channel === 'email' ? adminData.email : adminData.phone_number,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/notifications/test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
