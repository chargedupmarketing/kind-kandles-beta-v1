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

// PUT - Update a social post
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

    const { id } = await context.params;
    const body = await request.json();
    const {
      title,
      content,
      media_urls,
      scheduled_date,
      status,
      hashtags,
      mentions,
      location,
      notes,
      post_url,
    } = body;

    const supabase = createServerClient();

    // Get current post to check for status changes
    const { data: currentPost } = await supabase
      .from('social_posts')
      .select('status, created_by, calendar_id')
      .eq('id', id)
      .single();

    // Update post
    const updateData: any = {
      title,
      content,
      media_urls,
      scheduled_date,
      status,
      hashtags,
      mentions,
      location,
      notes,
    };

    if (status === 'published') {
      updateData.published_at = new Date().toISOString();
      updateData.published_by = admin.id;
      if (post_url) {
        updateData.post_url = post_url;
      }
    }

    const { data: post, error } = await supabase
      .from('social_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating social post:', error);
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    // Send notifications for status changes (non-blocking)
    if (currentPost && currentPost.status !== status) {
      try {
        let notifPayload: any = null;
        if (status === 'scheduled') {
          notifPayload = {
            user_id: currentPost.created_by,
            type: 'social_post_scheduled',
            title: 'Post Scheduled',
            message: `Your post "${title}" is scheduled for publishing`,
            metadata: { post_id: id, calendar_id: currentPost.calendar_id, scheduled_date },
          };
        } else if (status === 'published') {
          notifPayload = {
            user_id: currentPost.created_by,
            type: 'social_post_published',
            title: 'Post Published',
            message: `Your post "${title}" has been published successfully!`,
            metadata: { post_id: id, calendar_id: currentPost.calendar_id, post_url },
          };
        } else if (status === 'failed') {
          notifPayload = {
            user_id: currentPost.created_by,
            type: 'social_post_failed',
            title: 'Post Failed',
            message: `Your post "${title}" failed to publish. Please check and try again.`,
            metadata: { post_id: id, calendar_id: currentPost.calendar_id },
          };
        }
        if (notifPayload) {
          await supabase.from('notifications').insert(notifPayload);
        }
      } catch (notifError) {
        console.error('Notification insert failed (non-blocking):', notifError);
      }
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error in PUT /api/admin/social-calendar/posts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a social post
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

    const { id } = await context.params;
    const supabase = createServerClient();

    // Delete post
    const { error } = await supabase
      .from('social_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting social post:', error);
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/social-calendar/posts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
