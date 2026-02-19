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

// PUT - Update a social calendar
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
    const { name, platform, description, color, is_active } = body;

    const supabase = createServerClient();

    // Update calendar
    const { data: calendar, error } = await supabase
      .from('social_calendars')
      .update({
        name,
        platform,
        description,
        color,
        is_active,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating social calendar:', error);
      return NextResponse.json({ error: 'Failed to update calendar' }, { status: 500 });
    }

    return NextResponse.json({ calendar });
  } catch (error) {
    console.error('Error in PUT /api/admin/social-calendar/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a social calendar
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

    // Delete calendar (cascade will delete all posts)
    const { error } = await supabase
      .from('social_calendars')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting social calendar:', error);
      return NextResponse.json({ error: 'Failed to delete calendar' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/social-calendar/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
