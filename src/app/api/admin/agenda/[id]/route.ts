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

// PUT - Update agenda item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { id } = await params;
    const body = await request.json();

    const supabase = createServerClient();

    // Get current item to check permissions and for notification
    const { data: currentItem } = await supabase
      .from('agenda_items')
      .select('*, assigned_to_user:admin_users!agenda_items_assigned_to_fkey(id, email)')
      .eq('id', id)
      .single();

    if (!currentItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Update the item
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.due_date !== undefined) updateData.due_date = body.due_date || null;
    if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to;
    if (body.tags !== undefined) updateData.tags = Array.isArray(body.tags) ? body.tags : [];
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
    if (body.notify_on_due !== undefined) updateData.notify_on_due = body.notify_on_due;
    if (body.notify_on_update !== undefined) updateData.notify_on_update = body.notify_on_update;
    if (body.completed_at !== undefined) updateData.completed_at = body.completed_at;

    const { data: item, error } = await supabase
      .from('agenda_items')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        assigned_to_user:admin_users!agenda_items_assigned_to_fkey(id, email, first_name, last_name),
        created_by_user:admin_users!agenda_items_created_by_fkey(id, email, first_name, last_name)
      `)
      .single();

    if (error) {
      console.error('Error updating agenda item:', error);
      return NextResponse.json({ error: 'Failed to update agenda item' }, { status: 500 });
    }

    // Send notification if status changed or assigned to someone else
    if (currentItem.notify_on_update) {
      const statusChanged = body.status && body.status !== currentItem.status;
      const assignedToChanged = body.assigned_to && body.assigned_to !== currentItem.assigned_to;

      if (statusChanged || assignedToChanged) {
        const notifyUserId = assignedToChanged ? body.assigned_to : currentItem.assigned_to;
        
        if (notifyUserId !== admin.id) {
          try {
            let message = '';
            if (statusChanged) {
              message = `Agenda item "${item.title}" status changed to ${body.status}`;
            } else if (assignedToChanged) {
              message = `Agenda item "${item.title}" has been assigned to you`;
            }

            await supabase.from('notifications').insert({
              user_id: notifyUserId,
              type: 'agenda_updated',
              message,
              metadata: {
                agenda_item_id: item.id,
                updated_by: admin.email,
                changes: body,
              },
            });
          } catch (notifError) {
            console.error('Error sending notification:', notifError);
          }
        }
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

    return NextResponse.json({ item: formattedItem });
  } catch (error) {
    console.error('Error in PUT /api/admin/agenda/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete agenda item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { id } = await params;
    const supabase = createServerClient();

    const { error } = await supabase
      .from('agenda_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting agenda item:', error);
      return NextResponse.json({ error: 'Failed to delete agenda item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/agenda/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
