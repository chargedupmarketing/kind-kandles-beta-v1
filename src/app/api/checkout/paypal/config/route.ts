import { NextResponse } from 'next/server';

export async function GET() {
  const isConfigured = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  
  return NextResponse.json({
    configured: isConfigured,
    mode,
    clientId: isConfigured ? process.env.PAYPAL_CLIENT_ID?.substring(0, 10) + '...' : null,
  });
}

