import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Shipping Rates API
 * 
 * This endpoint is not used in the current Pirate Ship manual workflow.
 * Rates are calculated directly in Pirate Ship after CSV upload.
 * 
 * If you want automated rate quotes, consider integrating with:
 * - EasyPost (https://www.easypost.com/)
 * - ShipEngine (https://www.shipengine.com/)
 * - ShipStation (https://www.shipstation.com/)
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: 'Shipping rates are calculated in Pirate Ship',
    workflow: 'manual-csv',
    instructions: 'Export orders to CSV, upload to Pirate Ship to get rates'
  }, { status: 200 });
}
