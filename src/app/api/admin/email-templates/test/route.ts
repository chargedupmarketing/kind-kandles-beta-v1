import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { jwtVerify } from 'jose';
import { logAuditEvent } from '@/lib/auditLog';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secure-jwt-secret-at-least-32-characters-long');

// Helper to verify user role from JWT
// Uses the role and subLevels directly from the JWT payload (already verified when token was issued)
async function verifyUserRole(request: NextRequest): Promise<{ 
  authorized: boolean; 
  user?: { id: string; email: string; role: string; subLevels: string[] };
  error?: string;
}> {
  const token = request.cookies.get('admin-token')?.value;
  
  if (!token) {
    return { authorized: false, error: 'Not authenticated' };
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    const userId = payload.userId as string;
    const email = payload.email as string;
    const role = payload.role as string;
    const subLevels = (payload.subLevels as string[]) || [];

    if (!userId || !email || !role) {
      return { authorized: false, error: 'Invalid token payload' };
    }

    // Check if user is super_admin or has developer sub-level
    const isSuperAdmin = role === 'super_admin';
    const isDeveloper = subLevels.some(sl => sl.toLowerCase() === 'developer');

    if (!isSuperAdmin && !isDeveloper) {
      return { authorized: false, error: 'Insufficient permissions. Only Super Admins and Developers can send test emails.' };
    }

    return { 
      authorized: true, 
      user: { 
        id: userId, 
        email: email, 
        role: role,
        subLevels 
      } 
    };
  } catch {
    return { authorized: false, error: 'Invalid or expired token' };
  }
}

// POST /api/admin/email-templates/test - Send test email
export async function POST(request: NextRequest) {
  try {
    // Verify user has permission (Super Admin or Developer)
    const authResult = await verifyUserRole(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 403 });
    }

    const { to, subject, html_content, variables } = await request.json();

    if (!to || !subject || !html_content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey || resendApiKey.includes('placeholder')) {
      return NextResponse.json({ 
        error: 'Email service not configured. Please add RESEND_API_KEY to environment variables.' 
      }, { status: 400 });
    }

    const resend = new Resend(resendApiKey);
    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

    // Replace variables with sample data for testing
    let processedSubject = subject;
    let processedHtml = html_content;

    const sampleData: Record<string, string> = {
      customer_name: 'Test Customer',
      subscriber_name: 'Test Subscriber',
      order_number: 'KK-TEST-12345',
      order_total: '$45.99',
      subtotal: '$39.99',
      shipping: '$5.00',
      tax: '$1.00',
      items_list: `
        <div style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>Calm Down Girl Candle</strong> x 1 - $24.99
        </div>
        <div style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>Lavender Body Butter</strong> x 1 - $15.00
        </div>
      `,
      shipping_address: '123 Test Street<br>Maryland, USA',
      tracking_number: '1Z999AA10123456784',
      tracking_url: 'https://www.ups.com/track',
      review_url: 'https://kindkandlesboutique.com/write-your-story',
      product_name: 'Calm Down Girl Candle',
      shop_url: 'https://kindkandlesboutique.com/collections/all',
      cart_url: 'https://kindkandlesboutique.com/checkout',
      cart_items: `
        <div style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>Eucalyptus Spearmint Candle</strong> x 1 - $24.99
        </div>
      `,
      cart_total: '$24.99',
      newsletter_title: 'This Week at Kind Kandles',
      newsletter_content: '<p>Welcome to this week\'s newsletter! We have exciting news to share with you.</p>',
      featured_products: `
        <div style="text-align: center; padding: 15px;">
          <strong>New Arrival: Summer Breeze Candle</strong><br>
          <span style="color: #db2777;">$29.99</span>
        </div>
      `,
      offer_title: 'Subscriber Exclusive!',
      offer_description: 'Get 20% off your next order',
      promo_title: 'Summer Sale',
      promo_content: '<p>Our biggest sale of the season is here! Stock up on your favorite scents.</p>',
      discount_percent: '25',
      discount_code: 'TESTSALE25',
      expiry_date: 'December 31, 2025',
      facebook_url: 'https://facebook.com/kindkandles',
      instagram_url: 'https://instagram.com/kindkandles',
      tiktok_url: 'https://tiktok.com/@kindkandles',
      unsubscribe_link: '#',
    };

    // Replace all variables
    for (const [key, value] of Object.entries(sampleData)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedSubject = processedSubject.replace(regex, value);
      processedHtml = processedHtml.replace(regex, value);
    }

    // Also replace any custom variables provided
    if (variables && typeof variables === 'object') {
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processedSubject = processedSubject.replace(regex, String(value));
        processedHtml = processedHtml.replace(regex, String(value));
      }
    }

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: to,
      subject: `[TEST] ${processedSubject}`,
      html: processedHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the test email action
    await logAuditEvent({
      action: 'TEST',
      resource: 'email_template',
      resourceId: undefined,
      userId: authResult.user?.id,
      userEmail: authResult.user?.email,
      userRole: authResult.user?.role,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: {
        recipient: to,
        subject: processedSubject,
      },
    });

    return NextResponse.json({ success: true, message: `Test email sent to ${to}` });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
  }
}

