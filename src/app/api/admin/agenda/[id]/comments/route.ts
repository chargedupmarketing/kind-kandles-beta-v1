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

// GET - Fetch comments for an agenda item
export async function GET(
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

    // Fetch comments with user information
    const { data: comments, error } = await supabase
      .from('agenda_comments')
      .select(`
        *,
        user:admin_users!agenda_comments_user_id_fkey(id, email, first_name, last_name)
      `)
      .eq('agenda_item_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    const formattedComments = comments?.map(comment => ({
      id: comment.id,
      agenda_item_id: comment.agenda_item_id,
      user_id: comment.user_id,
      user_name: [comment.user?.first_name, comment.user?.last_name].filter(Boolean).join(' ') || comment.user?.email || 'Unknown',
      comment: comment.comment,
      created_at: comment.created_at,
    })) || [];

    return NextResponse.json({ comments: formattedComments });
  } catch (error) {
    console.error('Error in GET /api/admin/agenda/[id]/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add a comment to an agenda item
export async function POST(
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
    const { comment } = body;

    if (!comment?.trim()) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify the agenda item exists
    const { data: item, error: itemError } = await supabase
      .from('agenda_items')
      .select('id, title, assigned_to, created_by, notify_on_update')
      .eq('id', id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Agenda item not found' }, { status: 404 });
    }

    // Create the comment
    const { data: newComment, error: commentError } = await supabase
      .from('agenda_comments')
      .insert({
        agenda_item_id: id,
        user_id: admin.id,
        comment: comment.trim(),
      })
      .select(`
        *,
        user:admin_users!agenda_comments_user_id_fkey(id, email, first_name, last_name)
      `)
      .single();

    if (commentError) {
      console.error('Error creating comment:', commentError);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    // Send notification to item creator and assigned user (if different from commenter)
    if (item.notify_on_update) {
      const usersToNotify = new Set([item.assigned_to, item.created_by]);
      usersToNotify.delete(admin.id); // Don't notify the commenter

      for (const userId of usersToNotify) {
        try {
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'agenda_comment',
            message: `New comment on "${item.title}"`,
            metadata: {
              agenda_item_id: item.id,
              comment_id: newComment.id,
              commented_by: admin.email,
            },
          });
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      }
    }

    const formattedComment = {
      id: newComment.id,
      agenda_item_id: newComment.agenda_item_id,
      user_id: newComment.user_id,
      user_name: newComment.user?.name || newComment.user?.email || 'Unknown',
      comment: newComment.comment,
      created_at: newComment.created_at,
    };

    return NextResponse.json({ comment: formattedComment }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/agenda/[id]/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
