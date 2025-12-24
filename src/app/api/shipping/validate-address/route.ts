import { NextRequest, NextResponse } from 'next/server';
import { validateAddress } from '@/lib/pirateship';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    // Validate with Pirate Ship
    const result = await validateAddress(address);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error validating address:', error);
    return NextResponse.json(
      { error: 'Failed to validate address', details: error.message },
      { status: 500 }
    );
  }
}

