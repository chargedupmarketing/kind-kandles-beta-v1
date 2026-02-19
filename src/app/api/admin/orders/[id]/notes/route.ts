import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Note types for validation
const VALID_NOTE_TYPES = ['internal', 'packing', 'shipping', 'customer'] as const;
type NoteType = typeof VALID_NOTE_TYPES[number];

interface OrderNote {
  id: string;
  order_id: string;
  note: string;
  note_type: NoteType;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator_name?: string;
}

// GET - Fetch all notes for an order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify order exists
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch notes (simple query without joins)
    const { data: notes, error: notesError } = await supabase
      .from('order_notes')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (notesError) {
      console.error('Error fetching order notes:', notesError);
      // Return empty array if table doesn't exist yet
      if (notesError.code === '42P01') {
        return NextResponse.json({ notes: [] });
      }
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    // Transform to include creator name
    const transformedNotes = (notes || []).map((note: any) => ({
      id: note.id,
      order_id: note.order_id,
      note: note.note,
      note_type: note.note_type,
      created_at: note.created_at,
      updated_at: note.updated_at,
      creator_name: note.created_by_name || 'Admin',
    }));

    return NextResponse.json({ notes: transformedNotes });
  } catch (error) {
    console.error('Error in GET /api/admin/orders/[id]/notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add a new note to an order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { note, note_type = 'internal' } = body;

    // Validate note content
    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    // Validate note type
    if (!VALID_NOTE_TYPES.includes(note_type)) {
      return NextResponse.json({ 
        error: `Invalid note type. Must be one of: ${VALID_NOTE_TYPES.join(', ')}` 
      }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify order exists
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Insert the note
    const { data: newNote, error: insertError } = await supabase
      .from('order_notes')
      .insert({
        order_id: orderId,
        note: note.trim(),
        note_type,
        created_by_name: body.created_by_name || 'Admin',
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error inserting order note:', insertError);
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      note: newNote 
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/orders/[id]/notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a note from an order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { note_id } = body;

    if (!note_id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify the note belongs to this order
    const { data: existingNote, error: findError } = await supabase
      .from('order_notes')
      .select('id')
      .eq('id', note_id)
      .eq('order_id', orderId)
      .single();

    if (findError || !existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Delete the note
    const { error: deleteError } = await supabase
      .from('order_notes')
      .delete()
      .eq('id', note_id);

    if (deleteError) {
      console.error('Error deleting order note:', deleteError);
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/orders/[id]/notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update an existing note
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { note_id, note, note_type } = body;

    if (!note_id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify the note belongs to this order
    const { data: existingNote, error: findError } = await supabase
      .from('order_notes')
      .select('id')
      .eq('id', note_id)
      .eq('order_id', orderId)
      .single();

    if (findError || !existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Build update object
    const updateData: Partial<{ note: string; note_type: NoteType }> = {};

    if (note !== undefined) {
      if (typeof note !== 'string' || note.trim().length === 0) {
        return NextResponse.json({ error: 'Note content cannot be empty' }, { status: 400 });
      }
      updateData.note = note.trim();
    }

    if (note_type !== undefined) {
      if (!VALID_NOTE_TYPES.includes(note_type)) {
        return NextResponse.json({ 
          error: `Invalid note type. Must be one of: ${VALID_NOTE_TYPES.join(', ')}` 
        }, { status: 400 });
      }
      updateData.note_type = note_type;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Update the note
    const { data: updatedNote, error: updateError } = await supabase
      .from('order_notes')
      .update(updateData)
      .eq('id', note_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order note:', updateError);
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      note: updatedNote 
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/orders/[id]/notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
