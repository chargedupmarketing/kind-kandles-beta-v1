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

    // Fetch all calendars with creator info
    const { data: calendars, error } = await supabase
      .from('social_calendars')
      .select(`
        *,
        created_by_user:admin_users!social_calendars_created_by_fkey(name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching social calendars:', error);
      return NextResponse.json({ error: 'Failed to fetch calendars' }, { status: 500 });
    }

    // Format response
    const formattedCalendars = calendars.map((calendar: any) => ({
      id: calendar.id,
      name: calendar.name,
      platform: calendar.platform,
      description: calendar.description,
      color: calendar.color,
      is_active: calendar.is_active,
      created_by: calendar.created_by,
      created_by_name: calendar.created_by_user?.name || 'Unknown',
      created_by_email: calendar.created_by_user?.email || '',
      created_at: calendar.created_at,
      updated_at: calendar.updated_at,
    }));

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

    // Send notification to creator
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

    return NextResponse.json({ calendar });
  } catch (error) {
    console.error('Error in POST /api/admin/social-calendar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
