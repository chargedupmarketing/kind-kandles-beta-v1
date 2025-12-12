import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { Resend } from 'resend';

// Only initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Kind Kandles <noreply@kindkandlesboutique.com>';
const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

interface Resend2FARequest {
  userId: string;
}

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    const body: Resend2FARequest = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = createServerClient();
    
    // Get user details
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('id, email, first_name, is_active')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }
    
    // Check for recent OTP (rate limiting)
    const { data: recentOTP } = await supabase
      .from('two_factor_codes')
      .select('created_at')
      .eq('user_id', userId)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (recentOTP) {
      const createdAt = new Date(recentOTP.created_at);
      const secondsSinceCreation = (Date.now() - createdAt.getTime()) / 1000;
      
      if (secondsSinceCreation < RESEND_COOLDOWN_SECONDS) {
        const waitTime = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceCreation);
        return NextResponse.json(
          { 
            error: `Please wait ${waitTime} seconds before requesting a new code`,
            waitTime 
          },
          { status: 429 }
        );
      }
    }
    
    // Invalidate any existing unused codes
    await supabase
      .from('two_factor_codes')
      .update({ used: true })
      .eq('user_id', userId)
      .eq('used', false);
    
    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    
    // Store OTP in database
    const { error: insertError } = await supabase
      .from('two_factor_codes')
      .insert({
        user_id: userId,
        code: otp,
        expires_at: expiresAt.toISOString(),
        used: false,
        attempts: 0
      });
    
    if (insertError) {
      console.error('Error storing OTP:', insertError);
      return NextResponse.json(
        { error: 'Failed to generate verification code' },
        { status: 500 }
      );
    }
    
    // Send email with OTP
    if (resend) {
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: user.email,
          subject: 'Your Kind Kandles Admin Login Code',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #14b8a6; margin: 0;">Kind Kandles</h1>
                <p style="color: #666; margin: 5px 0 0;">Admin Portal</p>
              </div>
              
              <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 20px;">
                <p style="color: rgba(255,255,255,0.9); margin: 0 0 15px; font-size: 16px;">
                  Hi ${user.first_name || 'there'},
                </p>
                <p style="color: rgba(255,255,255,0.9); margin: 0 0 20px; font-size: 14px;">
                  Your verification code is:
                </p>
                <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: 20px; margin: 0 auto; max-width: 200px;">
                  <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: white;">${otp}</span>
                </div>
              </div>
              
              <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px; font-size: 14px;">
                  <strong>⏱️ This code expires in ${OTP_EXPIRY_MINUTES} minutes.</strong>
                </p>
                <p style="margin: 0; font-size: 14px; color: #666;">
                  If you didn't request this code, please ignore this email or contact support if you have concerns.
                </p>
              </div>
              
              <div style="text-align: center; color: #999; font-size: 12px;">
                <p style="margin: 0;">
                  🔒 Never share this code with anyone. Kind Kandles staff will never ask for your verification code.
                </p>
              </div>
            </body>
            </html>
          `
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // In development, log the OTP for testing
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEV] OTP for ${user.email}: ${otp}`);
        }
        // Don't fail the request - the OTP is still stored
      }
    } else {
      console.warn('Resend API key not configured - OTP email not sent');
      // In development, log the OTP for testing
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] OTP for ${user.email}: ${otp}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
      expiresAt: expiresAt.toISOString()
    });
    
  } catch (error) {
    console.error('Resend 2FA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

