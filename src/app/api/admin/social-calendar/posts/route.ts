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

function generateRecurrenceDates(
  startDate: Date,
  pattern: { type: string; interval: number; days_of_week?: number[]; end_date?: string | null; occurrences?: number | null }
): Date[] {
  const dates: Date[] = [];
  const maxOccurrences = pattern.occurrences || 52; // default cap at 52
  const endDate = pattern.end_date ? new Date(pattern.end_date) : null;
  const maxFuture = new Date();
  maxFuture.setFullYear(maxFuture.getFullYear() + 1); // never generate more than 1 year out

  let current = new Date(startDate);

  for (let i = 0; i < maxOccurrences; i++) {
    // Advance to next occurrence
    switch (pattern.type) {
      case 'daily':
        current = new Date(current);
        current.setDate(current.getDate() + pattern.interval);
        break;
      case 'weekly':
        current = new Date(current);
        current.setDate(current.getDate() + 7 * pattern.interval);
        break;
      case 'biweekly':
        current = new Date(current);
        current.setDate(current.getDate() + 14);
        break;
      case 'monthly':
        current = new Date(current);
        current.setMonth(current.getMonth() + pattern.interval);
        break;
      case 'custom_days': {
        // Post on specific days of the week
        const daysOfWeek = pattern.days_of_week || [];
        if (daysOfWeek.length === 0) break;
        current = new Date(current);
        let found = false;
        for (let d = 1; d <= 7; d++) {
          const next = new Date(current);
          next.setDate(next.getDate() + d);
          if (daysOfWeek.includes(next.getDay())) {
            current = next;
            found = true;
            break;
          }
        }
        if (!found) break;
        break;
      }
      default:
        current = new Date(current);
        current.setDate(current.getDate() + 7);
    }

    if (endDate && current > endDate) break;
    if (current > maxFuture) break;

    dates.push(new Date(current));
  }

  return dates;
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
      recurrence,
    } = body;

    if (!calendar_id || !title || !content || !scheduled_date) {
      return NextResponse.json(
        { error: 'Calendar ID, title, content, and scheduled date are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Look up admin name
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('first_name, last_name')
      .eq('id', admin.id)
      .single();
    const adminName = adminUser
      ? [adminUser.first_name, adminUser.last_name].filter(Boolean).join(' ') || admin.email
      : admin.email;

    const isRecurring = recurrence?.enabled === true;
    const recurrencePattern = isRecurring ? {
      type: recurrence.type,
      interval: recurrence.interval || 1,
      days_of_week: recurrence.days_of_week || [],
      end_date: recurrence.end_date || null,
      occurrences: recurrence.occurrences || null,
    } : null;

    // Create the parent post
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
        created_by_name: adminName,
        is_recurring: isRecurring,
        recurrence_pattern: recurrencePattern,
        recurrence_index: isRecurring ? 0 : null,
      })
      .select()
      .single();

    if (postError) {
      console.error('Error creating social post:', postError);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    // Generate recurring child posts
    let childPosts: any[] = [];
    if (isRecurring && recurrencePattern) {
      const dates = generateRecurrenceDates(
        new Date(scheduled_date),
        recurrencePattern
      );

      if (dates.length > 0) {
        const childInserts = dates.map((date, index) => ({
          calendar_id,
          title,
          content,
          media_urls: media_urls || [],
          scheduled_date: date.toISOString(),
          status: status || 'draft',
          hashtags: hashtags || [],
          mentions: mentions || [],
          location: location || null,
          notes: notes || null,
          created_by: admin.id,
          created_by_name: adminName,
          is_recurring: true,
          recurrence_pattern: recurrencePattern,
          recurrence_parent_id: post.id,
          recurrence_index: index + 1,
        }));

        const { data: children, error: childError } = await supabase
          .from('social_posts')
          .insert(childInserts)
          .select();

        if (childError) {
          console.error('Error creating recurring child posts:', childError);
        } else {
          childPosts = children || [];
        }
      }
    }

    // Add collaborators if provided
    if (collaborators && collaborators.length > 0) {
      const allPostIds = [post.id, ...childPosts.map((c: any) => c.id)];
      const collaboratorInserts = allPostIds.flatMap((postId: string) =>
        collaborators.map((collab: any) => ({
          post_id: postId,
          user_id: collab.user_id,
          user_name: collab.user_name,
        }))
      );

      await supabase.from('social_post_collaborators').insert(collaboratorInserts);

      for (const collab of collaborators) {
        try {
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
        } catch (notifError) {
          console.error('Notification insert failed (non-blocking):', notifError);
        }
      }
    }

    return NextResponse.json({
      post,
      recurring_posts_created: childPosts.length,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/social-calendar/posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
