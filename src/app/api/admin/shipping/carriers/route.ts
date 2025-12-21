import { NextRequest, NextResponse } from 'next/server';
import { getShippoClient } from '@/lib/shippo';

export const dynamic = 'force-dynamic';

// Get available carrier accounts
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shippo = getShippoClient();
    if (!shippo) {
      return NextResponse.json(
        { error: 'Shipping service not configured' },
        { status: 503 }
      );
    }

    // Get all carrier accounts
    const carrierAccounts = await shippo.carrierAccounts.list();

    const carriers = (carrierAccounts.results || []).map((account: any) => ({
      id: account.objectId,
      carrier: account.carrier,
      carrierName: account.carrierName || account.carrier.toUpperCase(),
      accountId: account.accountId,
      active: account.active,
      testMode: account.test,
      parameters: account.parameters,
    }));

    return NextResponse.json({
      carriers,
      total: carriers.length,
    });

  } catch (error: any) {
    console.error('Error getting carrier accounts:', error);
    return NextResponse.json(
      { error: 'Failed to get carrier accounts', details: error.message },
      { status: 500 }
    );
  }
}

