import { NextRequest, NextResponse } from 'next/server';

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox'; // 'sandbox' or 'live'

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
    const amount = searchParams.get('amount');

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    // Check if PayPal is configured
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'PayPal is not configured. Please add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to environment variables.' },
        { status: 500 }
      );
    }

    const accessToken = await getPayPalAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to authenticate with PayPal' }, { status: 500 });
    }

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (request.headers.get('host')?.includes('localhost') 
        ? `http://${request.headers.get('host')}`
        : `https://${request.headers.get('host')}`);

    // Create PayPal order
    const orderResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: amount,
          },
          description: 'My Kind Kandles & Boutique Order',
        }],
        application_context: {
          brand_name: 'My Kind Kandles & Boutique',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${baseUrl}/api/checkout/paypal/capture`,
          cancel_url: `${baseUrl}/checkout?cancelled=true`,
        },
      }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error('PayPal create order error:', orderData);
      return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 });
    }

    // Find the approval URL
    const approvalUrl = orderData.links?.find((link: any) => link.rel === 'approve')?.href;

    if (approvalUrl) {
      // Redirect to PayPal
      return NextResponse.redirect(approvalUrl);
    }

    return NextResponse.json({ error: 'No approval URL from PayPal' }, { status: 500 });

  } catch (error) {
    console.error('PayPal create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

