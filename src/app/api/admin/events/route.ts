import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Fetch all events (including inactive) - Admin only
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const locationType = searchParams.get('location_type');
    const isActive = searchParams.get('is_active');

    const serverClient = createServerClient();

    // Build query
    let query = serverClient
      .from('events')
      .select(`
        *,
        categories:event_category_mappings(
          category:event_categories(*)
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (type) {
      query = query.eq('event_type', type);
    }
    if (locationType) {
      query = query.eq('location_type', locationType);
    }
    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events', details: error },
        { status: 500 }
      );
    }

    // Flatten categories and get occurrence counts
    const eventsWithData = await Promise.all(
      (events || []).map(async (event) => {
        // Count occurrences
        const { count: occurrenceCount } = await serverClient
          .from('event_occurrences')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);

        // Count bookings
        const { count: bookingCount } = await serverClient
          .from('event_bookings')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);

        // Flatten categories
        const categories = event.categories?.map((c: any) => c.category) || [];

        return {
          ...event,
          categories,
          occurrence_count: occurrenceCount || 0,
          booking_count: bookingCount || 0,
        };
      })
    );

    return NextResponse.json({ events: eventsWithData });
  } catch (error) {
    console.error('Error in GET /api/admin/events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new event - Admin only
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      description,
      short_description,
      event_type,
      location_type,
      fixed_location_address,
      duration_minutes,
      min_participants,
      max_participants,
      pricing_model,
      base_price,
      price_tiers,
      deposit_required,
      deposit_amount,
      image_url,
      gallery_images,
      includes,
      requirements,
      is_active,
      featured,
      category_ids,
    } = body;

    // Validate required fields
    if (!title || !slug || !event_type || !location_type || !pricing_model) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const serverClient = createServerClient();

    // Check if slug already exists
    const { data: existing } = await serverClient
      .from('events')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Event with this slug already exists' },
        { status: 400 }
      );
    }

    // Insert event
    const { data: event, error: eventError } = await serverClient
      .from('events')
      .insert({
        title,
        slug,
        description: description || null,
        short_description: short_description || null,
        event_type,
        location_type,
        fixed_location_address: fixed_location_address || null,
        duration_minutes: duration_minutes || 120,
        min_participants: min_participants || 1,
        max_participants: max_participants || 20,
        pricing_model,
        base_price: base_price || null,
        price_tiers: price_tiers || null,
        deposit_required: deposit_required || false,
        deposit_amount: deposit_amount || null,
        image_url: image_url || null,
        gallery_images: gallery_images || null,
        includes: includes || null,
        requirements: requirements || null,
        is_active: is_active !== undefined ? is_active : true,
        featured: featured || false,
      })
      .select()
      .single();

    if (eventError) {
      console.error('Error creating event:', eventError);
      return NextResponse.json(
        { error: 'Failed to create event', details: eventError },
        { status: 500 }
      );
    }

    // Add category mappings if provided
    if (category_ids && category_ids.length > 0) {
      const mappings = category_ids.map((categoryId: string) => ({
        event_id: event.id,
        category_id: categoryId,
      }));

      await serverClient.from('event_category_mappings').insert(mappings);
    }

    return NextResponse.json({
      success: true,
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    console.error('Event creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
