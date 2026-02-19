import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-at-least-32-characters-long';

async function getCurrentAdmin(): Promise<{ id: string; email: string; name?: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-token')?.value;
    if (!token) return null;

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return {
      id: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string | undefined,
    };
  } catch (error) {
    return null;
  }
}

// GET - Fetch social posts for a calendar
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendar_id');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const supabase = createServerClient();

    let query = supabase
      .from('social_posts')
      .select(`
        *,
        calendar:social_calendars(name, platform, color),
        collaborators:social_post_collaborators(user_id, user_name)
      `)
      .order('scheduled_date', { ascending: true });

    if (calendarId) {
      query = query.eq('calendar_id', calendarId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('scheduled_date', startDate);
    }

    if (endDate) {
      query = query.lte('scheduled_date', endDate);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching social posts:', error);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error in GET /api/admin/social-calendar/posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new social post
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const {
      calendar_id,
      title,
      content,
      media_urls,
      scheduled_date,
      status,
      hashtags,
      mentions,
      location,
      notes,
      collaborators,
    } = body;

    if (!calendar_id || !title || !content || !scheduled_date) {
      return NextResponse.json(
        { error: 'Calendar ID, title, content, and scheduled date are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Create post
    const { data: post, error: postError } = await supabase
      .from('social_posts')
      .insert({
        calendar_id,
        title,
        content,
        media_urls: media_urls || [],
        scheduled_date,
        status: status || 'draft',
        hashtags: hashtags || [],
        mentions: mentions || [],
        location: location || null,
        notes: notes || null,
        created_by: admin.id,
        created_by_name: admin.name || admin.email,
      })
      .select()
      .single();

    if (postError) {
      console.error('Error creating social post:', postError);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    // Add collaborators if provided
    if (collaborators && collaborators.length > 0) {
      const collaboratorInserts = collaborators.map((collab: any) => ({
        post_id: post.id,
        user_id: collab.user_id,
        user_name: collab.user_name,
      }));

      await supabase.from('social_post_collaborators').insert(collaboratorInserts);

      // Notify collaborators
      for (const collab of collaborators) {
        await supabase.from('notifications').insert({
          user_id: collab.user_id,
          type: 'social_post_collaboration',
          title: 'Added to Social Post',
          message: `You've been added as a collaborator on "${title}"`,
          metadata: {
            post_id: post.id,
            calendar_id: calendar_id,
            added_by: admin.id,
          },
        });
      }
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error in POST /api/admin/social-calendar/posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
