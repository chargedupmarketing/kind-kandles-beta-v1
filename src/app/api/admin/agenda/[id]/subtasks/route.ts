import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-at-least-32-characters-long';

async function getCurrentAdmin(): Promise<{ id: string; email: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-token')?.value;
    if (!token) return null;

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return {
      id: payload.userId as string,
      email: payload.email as string,
    };
  } catch (error) {
    return null;
  }
}

// GET - Fetch subtasks for an agenda item
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await context.params;
    const supabase = createServerClient();

    const { data: subtasks, error } = await supabase
      .from('agenda_subtasks')
      .select('*, completed_by_user:admin_users!agenda_subtasks_completed_by_fkey(first_name, last_name)')
      .eq('agenda_item_id', id)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching subtasks:', error);
      return NextResponse.json({ error: 'Failed to fetch subtasks' }, { status: 500 });
    }

    return NextResponse.json({ subtasks });
  } catch (error) {
    console.error('Error in GET /api/admin/agenda/[id]/subtasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new subtask
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { title, position } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: subtask, error } = await supabase
      .from('agenda_subtasks')
      .insert({
        agenda_item_id: id,
        title,
        position: position || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subtask:', error);
      return NextResponse.json({ error: 'Failed to create subtask' }, { status: 500 });
    }

    return NextResponse.json({ subtask });
  } catch (error) {
    console.error('Error in POST /api/admin/agenda/[id]/subtasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update subtask (toggle completion, reorder, etc.)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { subtask_id, is_completed, title, position } = body;

    if (!subtask_id) {
      return NextResponse.json({ error: 'Subtask ID is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const updateData: any = {};
    if (typeof is_completed === 'boolean') {
      updateData.is_completed = is_completed;
      if (is_completed) {
        updateData.completed_by = admin.id;
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_by = null;
        updateData.completed_at = null;
      }
    }
    if (title !== undefined) updateData.title = title;
    if (position !== undefined) updateData.position = position;

    const { data: subtask, error } = await supabase
      .from('agenda_subtasks')
      .update(updateData)
      .eq('id', subtask_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating subtask:', error);
      return NextResponse.json({ error: 'Failed to update subtask' }, { status: 500 });
    }

    return NextResponse.json({ subtask });
  } catch (error) {
    console.error('Error in PUT /api/admin/agenda/[id]/subtasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a subtask
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const subtaskId = searchParams.get('subtask_id');

    if (!subtaskId) {
      return NextResponse.json({ error: 'Subtask ID is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from('agenda_subtasks')
      .delete()
      .eq('id', subtaskId);

    if (error) {
      console.error('Error deleting subtask:', error);
      return NextResponse.json({ error: 'Failed to delete subtask' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/agenda/[id]/subtasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
