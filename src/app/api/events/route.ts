import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch all active events with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const locationType = searchParams.get('location_type');
    const featured = searchParams.get('featured');
    const category = searchParams.get('category');

    // Build query
    let query = supabase
      .from('events')
      .select(`
        *,
        categories:event_category_mappings(
          category:event_categories(*)
        )
      `)
      .eq('is_active', true)
      .order('featured', { ascending: false })
      .order('title', { ascending: true });

    // Apply filters
    if (type) {
      query = query.eq('event_type', type);
    }
    if (locationType) {
      query = query.eq('location_type', locationType);
    }
    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    // For each event, fetch the next available occurrence
    const eventsWithOccurrences = await Promise.all(
      (events || []).map(async (event) => {
        const { data: nextOccurrence } = await supabase
          .from('event_occurrences')
          .select('*')
          .eq('event_id', event.id)
          .eq('status', 'available')
          .gte('start_datetime', new Date().toISOString())
          .order('start_datetime', { ascending: true })
          .limit(1)
          .single();

        // Flatten categories
        const categories = event.categories?.map((c: any) => c.category) || [];

        return {
          ...event,
          categories,
          next_occurrence: nextOccurrence || null,
        };
      })
    );

    // Filter by category if specified
    let filteredEvents = eventsWithOccurrences;
    if (category) {
      filteredEvents = eventsWithOccurrences.filter((event) =>
        event.categories?.some((c: any) => c.slug === category)
      );
    }

    return NextResponse.json({ events: filteredEvents });
  } catch (error) {
    console.error('Error in GET /api/events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
