import { NextRequest, NextResponse } from 'next/server';

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';

const PAYPAL_API_URL = PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string | null> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    return null;
  }

  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('PayPal auth error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token'); // PayPal order ID
    const payerId = searchParams.get('PayerID');

    // Get base URL for redirect
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (request.headers.get('host')?.includes('localhost') 
        ? `http://${request.headers.get('host')}`
        : `https://${request.headers.get('host')}`);

    if (!token) {
      return NextResponse.redirect(`${baseUrl}/checkout?error=missing_token`);
    }

    const accessToken = await getPayPalAccessToken();
    if (!accessToken) {
      return NextResponse.redirect(`${baseUrl}/checkout?error=auth_failed`);
    }

    // Capture the payment
    const captureResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await captureResponse.json();

    if (!captureResponse.ok || captureData.status !== 'COMPLETED') {
      console.error('PayPal capture error:', captureData);
      return NextResponse.redirect(`${baseUrl}/checkout?error=capture_failed`);
    }

    // Payment successful - get payment details
    const paymentId = captureData.id;
    const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    const amount = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;
    const payerEmail = captureData.payer?.email_address;

    // Store payment info in a cookie for the success page to create the order
    const paymentInfo = {
      paymentId,
      captureId,
      amount,
      payerEmail,
      provider: 'paypal',
    };

    // Redirect to success page with payment info
    const response = NextResponse.redirect(`${baseUrl}/checkout/success?paypal=true&payment_id=${paymentId}`);
    
    // Set a cookie with payment info (will be read by success page)
    response.cookies.set('paypal_payment', JSON.stringify(paymentInfo), {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('PayPal capture error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://kindkandlesboutique.com';
    return NextResponse.redirect(`${baseUrl}/checkout?error=internal_error`);
  }
}

