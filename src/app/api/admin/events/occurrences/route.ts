import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Fetch occurrences with filters - Admin only
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('event_id');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const serverClient = createServerClient();

    // Build query
    let query = serverClient
      .from('event_occurrences')
      .select(`
        *,
        event:events(*)
      `)
      .order('start_datetime', { ascending: true });

    // Apply filters
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (startDate) {
      query = query.gte('start_datetime', startDate);
    }
    if (endDate) {
      query = query.lte('start_datetime', endDate);
    }

    const { data: occurrences, error } = await query;

    if (error) {
      console.error('Error fetching occurrences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch occurrences', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ occurrences: occurrences || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/events/occurrences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new occurrence - Admin only
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      event_id,
      start_datetime,
      end_datetime,
      location_type,
      location_address,
      max_participants,
      status,
      notes,
    } = body;

    // Validate required fields
    if (!event_id || !start_datetime || !end_datetime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start_datetime);
    const endDate = new Date(end_datetime);
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    const serverClient = createServerClient();

    // Verify event exists
    const { data: event, error: eventError } = await serverClient
      .from('events')
      .select('id')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Insert occurrence
    const { data: occurrence, error: occurrenceError } = await serverClient
      .from('event_occurrences')
      .insert({
        event_id,
        start_datetime,
        end_datetime,
        location_type: location_type || null,
        location_address: location_address || null,
        max_participants: max_participants || null,
        status: status || 'available',
        notes: notes || null,
        current_bookings: 0,
      })
      .select()
      .single();

    if (occurrenceError) {
      console.error('Error creating occurrence:', occurrenceError);
      return NextResponse.json(
        { error: 'Failed to create occurrence', details: occurrenceError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Occurrence created successfully',
      occurrence,
    });
  } catch (error) {
    console.error('Occurrence creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
