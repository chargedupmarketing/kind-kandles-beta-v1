import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Package Tracking API (Alternative endpoint)
 * 
 * This endpoint is not used in the current Pirate Ship manual workflow.
 * Tracking information is stored in order records after CSV import.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const trackingNumber = searchParams.get('tracking_number');

  if (!trackingNumber) {
    return NextResponse.json({ error: 'Tracking number required' }, { status: 400 });
  }

  return NextResponse.json({
    message: 'Tracking is managed through order records',
    workflow: 'manual-csv',
    trackingNumber,
    instructions: 'View order details in admin panel for tracking information'
  }, { status: 200 });
}
