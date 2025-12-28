import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Package Tracking API
 * 
 * This endpoint is not used in the current Pirate Ship manual workflow.
 * Tracking is managed through order records after CSV import.
 * 
 * To track packages:
 * - View order details in admin panel
 * - Click tracking number/URL
 * - Or check Pirate Ship dashboard
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const trackingNumber = searchParams.get('tracking_number');

  if (!trackingNumber) {
    return NextResponse.json({ error: 'Tracking number required' }, { status: 400 });
  }

  return NextResponse.json({
    message: 'Tracking is managed in Pirate Ship dashboard',
    workflow: 'manual-csv',
    trackingNumber,
    instructions: 'Check order details in admin panel for tracking link'
  }, { status: 200 });
}
