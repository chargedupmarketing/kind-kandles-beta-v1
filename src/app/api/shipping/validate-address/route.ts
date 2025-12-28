import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Address Validation API
 * 
 * This endpoint is not used in the current Pirate Ship manual workflow.
 * Address validation happens automatically in Pirate Ship when you upload the CSV.
 * 
 * Pirate Ship will flag any invalid addresses before you create labels.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  return NextResponse.json({
    message: 'Address validation handled by Pirate Ship',
    workflow: 'manual-csv',
    address: body.address,
    instructions: 'Pirate Ship validates addresses automatically during CSV import',
    isValid: true, // Assume valid, will be checked in Pirate Ship
  }, { status: 200 });
}
