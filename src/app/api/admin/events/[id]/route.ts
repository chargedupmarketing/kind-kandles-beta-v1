import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Fetch single event details - Admin only
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const serverClient = createServerClient();

    // Fetch event with categories
    const { data: event, error } = await serverClient
      .from('events')
      .select(`
        *,
        categories:event_category_mappings(
          category:event_categories(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Flatten categories
    const categories = event.categories?.map((c: any) => c.category) || [];

    return NextResponse.json({
      event: {
        ...event,
        categories,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/events/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update event - Admin only
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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

    const serverClient = createServerClient();

    // If slug is being changed, check if it already exists
    if (slug) {
      const { data: existing } = await serverClient
        .from('events')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Event with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Build update object (only include provided fields)
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (short_description !== undefined)
      updateData.short_description = short_description;
    if (event_type !== undefined) updateData.event_type = event_type;
    if (location_type !== undefined) updateData.location_type = location_type;
    if (fixed_location_address !== undefined)
      updateData.fixed_location_address = fixed_location_address;
    if (duration_minutes !== undefined)
      updateData.duration_minutes = duration_minutes;
    if (min_participants !== undefined)
      updateData.min_participants = min_participants;
    if (max_participants !== undefined)
      updateData.max_participants = max_participants;
    if (pricing_model !== undefined) updateData.pricing_model = pricing_model;
    if (base_price !== undefined) updateData.base_price = base_price;
    if (price_tiers !== undefined) updateData.price_tiers = price_tiers;
    if (deposit_required !== undefined)
      updateData.deposit_required = deposit_required;
    if (deposit_amount !== undefined) updateData.deposit_amount = deposit_amount;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (gallery_images !== undefined) updateData.gallery_images = gallery_images;
    if (includes !== undefined) updateData.includes = includes;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (featured !== undefined) updateData.featured = featured;

    // Update event
    const { data: event, error: eventError } = await serverClient
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (eventError) {
      console.error('Error updating event:', eventError);
      return NextResponse.json(
        { error: 'Failed to update event', details: eventError },
        { status: 500 }
      );
    }

    // Update category mappings if provided
    if (category_ids !== undefined) {
      // Delete existing mappings
      await serverClient
        .from('event_category_mappings')
        .delete()
        .eq('event_id', id);

      // Add new mappings
      if (category_ids.length > 0) {
        const mappings = category_ids.map((categoryId: string) => ({
          event_id: id,
          category_id: categoryId,
        }));

        await serverClient.from('event_category_mappings').insert(mappings);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully',
      event,
    });
  } catch (error) {
    console.error('Event update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete event (set is_active = false) - Admin only
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const serverClient = createServerClient();

    // Soft delete by setting is_active to false
    const { error } = await serverClient
      .from('events')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json(
        { error: 'Failed to delete event', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Event deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
