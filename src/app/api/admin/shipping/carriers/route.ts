import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Shipping Carriers API
 * 
 * This endpoint is not actively used in the current Pirate Ship manual workflow.
 * Returns available carriers for reference.
 */
export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('admin-token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return carriers available through Pirate Ship
    const carriers = [
      {
        id: 'usps',
        name: 'USPS',
        services: [
          { id: 'usps_first_class', name: 'First Class Mail', description: 'Economical, 2-5 days' },
          { id: 'usps_priority', name: 'Priority Mail', description: 'Fast, 1-3 days' },
          { id: 'usps_priority_express', name: 'Priority Mail Express', description: 'Overnight' },
        ]
      },
      {
        id: 'ups',
        name: 'UPS',
        services: [
          { id: 'ups_ground', name: 'Ground', description: '1-5 days' },
          { id: 'ups_2nd_day', name: '2nd Day Air', description: '2 days' },
          { id: 'ups_next_day', name: 'Next Day Air', description: 'Overnight' },
        ]
      }
    ];

    return NextResponse.json({ 
      carriers,
      workflow: 'manual-csv',
      note: 'Select shipping methods in Pirate Ship after CSV upload'
    });
  } catch (error) {
    console.error('Error fetching carriers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
