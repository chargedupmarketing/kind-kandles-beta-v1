import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Fetch all bookings with filters - Admin only
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const eventId = searchParams.get('event_id');
    const paymentStatus = searchParams.get('payment_status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const serverClient = createServerClient();

    // Build query
    let query = serverClient
      .from('event_bookings')
      .select(`
        *,
        event:events(*),
        occurrence:event_occurrences(*)
      `)
      .order('submitted_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }
    if (startDate) {
      query = query.gte('submitted_at', startDate);
    }
    if (endDate) {
      query = query.lte('submitted_at', endDate);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookings', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings: bookings || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/events/bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
