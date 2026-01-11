import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// POST - Submit contact form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, subject, message } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'Unknown';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const fullName = `${firstName} ${lastName}`;

    // Create Supabase client (allows anonymous inserts)
    const serverClient = createServerClient();

    // Insert into database
    const { data: submission, error: dbError } = await serverClient
      .from('contact_submissions')
      .insert({
        name: fullName,
        email,
        phone: phone || null,
        subject,
        message,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving contact submission:', dbError);
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      );
    }

    // Send email notification to both recipients
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .field { margin-bottom: 20px; }
              .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
              .value { margin-top: 5px; padding: 12px; background: white; border-left: 3px solid #ec4899; border-radius: 4px; }
              .message-box { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 10px; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
              .meta { font-size: 11px; color: #9ca3af; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">🌸 New Contact Form Submission</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Kind Kandles & Boutique</p>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">From</div>
                  <div class="value">${fullName}</div>
                </div>
                
                <div class="field">
                  <div class="label">Email</div>
                  <div class="value">
                    <a href="mailto:${email}" style="color: #ec4899; text-decoration: none;">${email}</a>
                  </div>
                </div>
                
                ${phone ? `
                <div class="field">
                  <div class="label">Phone</div>
                  <div class="value">
                    <a href="tel:${phone}" style="color: #ec4899; text-decoration: none;">${phone}</a>
                  </div>
                </div>
                ` : ''}
                
                <div class="field">
                  <div class="label">Subject</div>
                  <div class="value">${subject}</div>
                </div>
                
                <div class="field">
                  <div class="label">Message</div>
                  <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
                </div>

                <div class="meta">
                  <strong>Submission ID:</strong> ${submission.id}<br>
                  <strong>Submitted:</strong> ${new Date().toLocaleString()}<br>
                  <strong>IP Address:</strong> ${ipAddress}<br>
                  <strong>User Agent:</strong> ${userAgent}
                </div>
              </div>
              <div class="footer">
                <p>View this submission in your <a href="https://admin.kindkandlesboutique.com/restricted/admin" style="color: #ec4899;">admin dashboard</a></p>
                <p style="margin-top: 10px;">This is an automated notification from Kind Kandles & Boutique</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await resend.emails.send({
        from: 'Kind Kandles Contact Form <noreply@kindkandlesboutique.com>',
        to: ['k@kindkandlesboutique.com', 'dominic@chargedupmarketing.com'],
        replyTo: email,
        subject: `New Contact Form: ${subject}`,
        html: emailHtml,
      });

      console.log('✅ Contact form notification emails sent successfully');
    } catch (emailError) {
      console.error('❌ Error sending notification emails:', emailError);
      // Don't fail the request if email fails - submission is still saved
    }

    return NextResponse.json({
      success: true,
      message: 'Contact form submitted successfully',
      submissionId: submission.id,
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Fetch all contact submissions (admin only)
export async function GET(request: NextRequest) {
  try {
    const serverClient = createServerClient();

    const { data: submissions, error } = await serverClient
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contact submissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ submissions });

  } catch (error) {
    console.error('Error in GET /api/contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

