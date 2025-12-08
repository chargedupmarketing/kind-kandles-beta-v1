import { NextResponse } from 'next/server';
import { getSquareApplicationId, getSquareLocationId, getSquareEnvironment } from '@/lib/square';

export async function GET() {
  return NextResponse.json({
    applicationId: getSquareApplicationId(),
    locationId: getSquareLocationId(),
    environment: getSquareEnvironment(),
  });
}

