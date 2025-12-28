import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Shipping Labels API
 * 
 * This endpoint is not used in the current Pirate Ship manual workflow.
 * Labels are created directly in Pirate Ship after CSV upload.
 * 
 * Workflow:
 * 1. Export orders from admin panel (CSV)
 * 2. Upload to Pirate Ship
 * 3. Create labels in Pirate Ship
 * 4. Download tracking numbers (CSV)
 * 5. Import tracking back to admin panel
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: 'Shipping labels are created in Pirate Ship',
    workflow: 'manual-csv',
    instructions: 'See PIRATE_SHIP_WORKFLOW.md for complete instructions'
  }, { status: 200 });
}
