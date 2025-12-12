import { NextResponse } from 'next/server';
import { getSquareConfig } from '@/lib/square';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = await getSquareConfig();
  
  return NextResponse.json({
    applicationId: config.applicationId,
    locationId: config.locationId,
    environment: config.mode,
  });
}

