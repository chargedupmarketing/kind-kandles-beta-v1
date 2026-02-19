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

// GET - Fetch all agenda items
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const supabase = createServerClient();

    // Fetch agenda items with user information
    // Build query progressively based on what tables exist
    let selectFields = `
      *,
      assigned_to_user:admin_users!agenda_items_assigned_to_fkey(id, email, first_name, last_name),
      created_by_user:admin_users!agenda_items_created_by_fkey(id, email, first_name, last_name)
    `;

    // Check if agenda_comments table exists
    try {
      const { data: testComments } = await supabase
        .from('agenda_comments')
        .select('id')
        .limit(1);
      
      if (testComments !== null) {
        selectFields += ',\n        comments:agenda_comments(count)';
      }
    } catch (e) {
      console.log('agenda_comments table not found');
    }

    // Check if enhanced tables exist
    try {
      const { data: testSubtasks } = await supabase
        .from('agenda_subtasks')
        .select('id')
        .limit(1);
      
      if (testSubtasks !== null) {
        selectFields += `,
        subtasks:agenda_subtasks(count),
        attachments:agenda_attachments(count),
        watchers:agenda_watchers(count),
        item_tags:agenda_item_tags(tag:agenda_tags(id, name, color))`;
      }
    } catch (e) {
      console.log('Enhanced tables not found');
    }

    const query = supabase
      .from('agenda_items')
      .select(selectFields)
      .order('created_at', { ascending: false });

    const { data: items, error } = await query;

    if (error || !items) {
      console.error('Error fetching agenda items:', error);
      
      // If agenda_items table doesn't exist, return empty array with helpful message
      if (error?.code === '42P01') {
        return NextResponse.json({ 
          items: [],
          message: 'Agenda table not found. Please run the database migration first.',
          error: 'Table does not exist'
        });
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch agenda items',
        details: error?.message || 'Unknown error'
      }, { status: 500 });
    }

    // Format the response (items is guaranteed to be an array here)
    const formattedItems = (items as any[]).map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      type: item.type,
      status: item.status,
      priority: item.priority,
      due_date: item.due_date,
      start_date: item.start_date || null,
      assigned_to: item.assigned_to,
      assigned_to_name: [item.assigned_to_user?.first_name, item.assigned_to_user?.last_name].filter(Boolean).join(' ') || item.assigned_to_user?.email || 'Unknown',
      created_by: item.created_by,
      created_by_name: [item.created_by_user?.first_name, item.created_by_user?.last_name].filter(Boolean).join(' ') || item.created_by_user?.email || 'Unknown',
      tags: item.tags || [],
      item_tags: item.item_tags?.map((it: any) => it.tag).filter(Boolean) || [],
      notes: item.notes || '',
      created_at: item.created_at,
      updated_at: item.updated_at,
      completed_at: item.completed_at,
      notify_on_due: item.notify_on_due ?? true,
      notify_on_update: item.notify_on_update ?? false,
      comments_count: item.comments?.[0]?.count || 0,
      subtasks_count: item.subtasks?.[0]?.count || 0,
      attachments_count: item.attachments?.[0]?.count || 0,
      watchers_count: item.watchers?.[0]?.count || 0,
      progress_percentage: item.progress_percentage || 0,
      estimated_hours: item.estimated_hours || null,
      actual_hours: item.actual_hours || null,
      color: item.color || '#3b82f6',
      parent_id: item.parent_id || null,
      recurrence_pattern: item.recurrence_pattern || null,
      is_template: item.is_template || false,
    }));

    return NextResponse.json({ items: formattedItems });
  } catch (error) {
    console.error('Error in GET /api/admin/agenda:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new agenda item
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const body = await request.json();
    const {
      title,
      description,
      type = 'task',
      priority = 'medium',
      due_date,
      start_date,
      assigned_to,
      tags = [],
      tag_ids = [],
      notes,
      notify_on_due = true,
      notify_on_update = false,
      estimated_hours,
      color,
      parent_id,
      recurrence_pattern,
      subtasks = [],
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Create the agenda item
    const { data: item, error } = await supabase
      .from('agenda_items')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        type,
        status: 'pending',
        priority,
        due_date: due_date || null,
        start_date: start_date || null,
        assigned_to: assigned_to || admin.id,
        created_by: admin.id,
        tags: Array.isArray(tags) ? tags : [],
        estimated_hours: estimated_hours || null,
        color: color || '#3b82f6',
        parent_id: parent_id || null,
        recurrence_pattern: recurrence_pattern || null,
        notes: notes?.trim() || null,
        notify_on_due,
        notify_on_update,
      })
      .select(`
        *,
        assigned_to_user:admin_users!agenda_items_assigned_to_fkey(id, email, name),
        created_by_user:admin_users!agenda_items_created_by_fkey(id, email, name)
      `)
      .single();

    if (error) {
      console.error('Error creating agenda item:', error);
      return NextResponse.json({ error: 'Failed to create agenda item' }, { status: 500 });
    }

    // Create subtasks if provided
    if (subtasks && subtasks.length > 0) {
      const subtaskInserts = subtasks.map((subtask: any, index: number) => ({
        agenda_item_id: item.id,
        title: subtask.title || subtask,
        position: index,
      }));

      await supabase.from('agenda_subtasks').insert(subtaskInserts);
    }

    // Link tags if provided
    if (tag_ids && tag_ids.length > 0) {
      const tagInserts = tag_ids.map((tagId: string) => ({
        agenda_item_id: item.id,
        tag_id: tagId,
      }));

      await supabase.from('agenda_item_tags').insert(tagInserts);
    }

    // Send notification if assigned to someone else
    if (item.assigned_to !== admin.id && item.notify_on_update) {
      try {
        await supabase.from('notifications').insert({
          user_id: item.assigned_to,
          type: 'agenda_assigned',
          message: `New ${item.type} assigned to you: ${item.title}`,
          metadata: {
            agenda_item_id: item.id,
            assigned_by: admin.email,
          },
        });
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
      }
    }

    const formattedItem = {
      id: item.id,
      title: item.title,
      description: item.description || '',
      type: item.type,
      status: item.status,
      priority: item.priority,
      due_date: item.due_date,
      assigned_to: item.assigned_to,
      assigned_to_name: [item.assigned_to_user?.first_name, item.assigned_to_user?.last_name].filter(Boolean).join(' ') || item.assigned_to_user?.email || 'Unknown',
      created_by: item.created_by,
      created_by_name: [item.created_by_user?.first_name, item.created_by_user?.last_name].filter(Boolean).join(' ') || item.created_by_user?.email || 'Unknown',
      tags: item.tags || [],
      notes: item.notes || '',
      created_at: item.created_at,
      updated_at: item.updated_at,
      completed_at: item.completed_at,
      notify_on_due: item.notify_on_due,
      notify_on_update: item.notify_on_update,
    };

    return NextResponse.json({ item: formattedItem }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/agenda:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
