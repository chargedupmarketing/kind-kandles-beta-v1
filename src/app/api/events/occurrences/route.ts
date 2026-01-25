import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// GET - Fetch available occurrences for calendar view
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('event_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const supabase = createClient();

    // Build query
    let query = supabase
      .from('event_occurrences')
      .select(`
        *,
        event:events(*)
      `)
      .eq('status', 'available')
      .gte('start_datetime', startDate || new Date().toISOString())
      .order('start_datetime', { ascending: true });

    // Apply filters
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    if (endDate) {
      query = query.lte('start_datetime', endDate);
    }

    const { data: occurrences, error } = await query;

    if (error) {
      console.error('Error fetching occurrences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch occurrences' },
        { status: 500 }
      );
    }

    // Filter to only show occurrences for active events
    const filteredOccurrences = (occurrences || []).filter(
      (occ: any) => occ.event?.is_active === true
    );

    return NextResponse.json({ occurrences: filteredOccurrences });
  } catch (error) {
    console.error('Error in GET /api/events/occurrences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
