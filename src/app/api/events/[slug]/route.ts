import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch single event details by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Fetch event with categories
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        categories:event_category_mappings(
          category:event_categories(*)
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Fetch upcoming occurrences (next 10)
    const { data: occurrences } = await supabase
      .from('event_occurrences')
      .select('*')
      .eq('event_id', event.id)
      .eq('status', 'available')
      .gte('start_datetime', new Date().toISOString())
      .order('start_datetime', { ascending: true })
      .limit(10);

    // Flatten categories
    const categories = event.categories?.map((c: any) => c.category) || [];

    return NextResponse.json({
      event: {
        ...event,
        categories,
        upcoming_occurrences: occurrences || [],
      },
    });
  } catch (error) {
    console.error('Error in GET /api/events/[slug]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
