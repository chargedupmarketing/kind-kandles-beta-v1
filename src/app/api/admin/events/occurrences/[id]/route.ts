import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// PATCH - Update occurrence - Admin only
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      start_datetime,
      end_datetime,
      location_type,
      location_address,
      max_participants,
      current_bookings,
      status,
      notes,
    } = body;

    // Validate dates if both provided
    if (start_datetime && end_datetime) {
      const startDate = new Date(start_datetime);
      const endDate = new Date(end_datetime);
      if (endDate <= startDate) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        );
      }
    }

    const serverClient = createServerClient();

    // Build update object (only include provided fields)
    const updateData: any = {};
    if (start_datetime !== undefined) updateData.start_datetime = start_datetime;
    if (end_datetime !== undefined) updateData.end_datetime = end_datetime;
    if (location_type !== undefined) updateData.location_type = location_type;
    if (location_address !== undefined)
      updateData.location_address = location_address;
    if (max_participants !== undefined)
      updateData.max_participants = max_participants;
    if (current_bookings !== undefined)
      updateData.current_bookings = current_bookings;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // Update occurrence
    const { data: occurrence, error: occurrenceError } = await serverClient
      .from('event_occurrences')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (occurrenceError) {
      console.error('Error updating occurrence:', occurrenceError);
      return NextResponse.json(
        { error: 'Failed to update occurrence', details: occurrenceError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Occurrence updated successfully',
      occurrence,
    });
  } catch (error) {
    console.error('Occurrence update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove occurrence - Admin only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const serverClient = createServerClient();

    // Check if there are any bookings for this occurrence
    const { count } = await serverClient
      .from('event_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('occurrence_id', id)
      .in('status', ['pending', 'confirmed']);

    if (count && count > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete occurrence with ${count} active booking(s). Please cancel bookings first.`,
        },
        { status: 400 }
      );
    }

    // Delete occurrence
    const { error } = await serverClient
      .from('event_occurrences')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting occurrence:', error);
      return NextResponse.json(
        { error: 'Failed to delete occurrence', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Occurrence deleted successfully',
    });
  } catch (error) {
    console.error('Occurrence deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
