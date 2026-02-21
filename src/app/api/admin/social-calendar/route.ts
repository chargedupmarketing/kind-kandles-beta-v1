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

// GET - Fetch all social calendars
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const supabase = createServerClient();

    // Fetch all calendars
    const { data: calendars, error } = await supabase
      .from('social_calendars')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching social calendars:', error);
      return NextResponse.json({ error: 'Failed to fetch calendars' }, { status: 500 });
    }

    // Look up creator names
    const creatorIds = [...new Set(calendars.map((c: any) => c.created_by).filter(Boolean))];
    let creatorMap: Record<string, { first_name?: string; last_name?: string; email?: string }> = {};
    if (creatorIds.length > 0) {
      const { data: users } = await supabase
        .from('admin_users')
        .select('id, first_name, last_name, email')
        .in('id', creatorIds);
      if (users) {
        for (const u of users) {
          creatorMap[u.id] = u;
        }
      }
    }

    // Format response
    const formattedCalendars = calendars.map((calendar: any) => {
      const creator = creatorMap[calendar.created_by];
      return {
        id: calendar.id,
        name: calendar.name,
        platform: calendar.platform,
        description: calendar.description,
        color: calendar.color,
        is_active: calendar.is_active,
        created_by: calendar.created_by,
        created_by_name: creator ? [creator.first_name, creator.last_name].filter(Boolean).join(' ') || creator.email || 'Unknown' : 'Unknown',
        created_by_email: creator?.email || '',
        created_at: calendar.created_at,
        updated_at: calendar.updated_at,
      };
    });

    return NextResponse.json({ calendars: formattedCalendars });
  } catch (error) {
    console.error('Error in GET /api/admin/social-calendar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new social calendar
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
    const { name, platform, description, color } = body;

    if (!name || !platform) {
      return NextResponse.json({ error: 'Name and platform are required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Create calendar
    const { data: calendar, error } = await supabase
      .from('social_calendars')
      .insert({
        name,
        platform,
        description: description || null,
        color: color || '#db2777',
        created_by: admin.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating social calendar:', error);
      return NextResponse.json({ error: 'Failed to create calendar' }, { status: 500 });
    }

    try {
      await supabase.from('notifications').insert({
        user_id: admin.id,
        type: 'social_calendar_created',
        title: 'Calendar Created',
        message: `Your ${platform} calendar "${name}" has been created successfully!`,
        metadata: {
          calendar_id: calendar.id,
          platform: platform,
        },
      });
    } catch (notifError) {
      console.error('Notification insert failed (non-blocking):', notifError);
    }

    return NextResponse.json({ calendar });
  } catch (error) {
    console.error('Error in POST /api/admin/social-calendar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
