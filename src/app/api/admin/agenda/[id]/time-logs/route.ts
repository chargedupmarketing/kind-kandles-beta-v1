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

// GET - Fetch time logs for an agenda item
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

    const { data: timeLogs, error } = await supabase
      .from('agenda_time_logs')
      .select('*, user:admin_users!agenda_time_logs_user_id_fkey(name, email)')
      .eq('agenda_item_id', id)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching time logs:', error);
      return NextResponse.json({ error: 'Failed to fetch time logs' }, { status: 500 });
    }

    return NextResponse.json({ timeLogs });
  } catch (error) {
    console.error('Error in GET /api/admin/agenda/[id]/time-logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Start or end a time log
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
    const { action, description, log_id } = body; // action: 'start' or 'end'

    const supabase = createServerClient();

    if (action === 'start') {
      // Check if there's already an active timer
      const { data: activeLog } = await supabase
        .from('agenda_time_logs')
        .select('id')
        .eq('agenda_item_id', id)
        .eq('user_id', admin.id)
        .is('ended_at', null)
        .single();

      if (activeLog) {
        return NextResponse.json({ error: 'Timer already running' }, { status: 400 });
      }

      // Start new timer
      const { data: timeLog, error } = await supabase
        .from('agenda_time_logs')
        .insert({
          agenda_item_id: id,
          user_id: admin.id,
          started_at: new Date().toISOString(),
          description: description || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error starting timer:', error);
        return NextResponse.json({ error: 'Failed to start timer' }, { status: 500 });
      }

      return NextResponse.json({ timeLog });
    } else if (action === 'end') {
      if (!log_id) {
        return NextResponse.json({ error: 'Log ID is required to end timer' }, { status: 400 });
      }

      // Get the log to calculate duration
      const { data: log } = await supabase
        .from('agenda_time_logs')
        .select('started_at')
        .eq('id', log_id)
        .single();

      if (!log) {
        return NextResponse.json({ error: 'Time log not found' }, { status: 404 });
      }

      const endedAt = new Date();
      const startedAt = new Date(log.started_at);
      const durationMinutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);

      // End timer
      const { data: timeLog, error } = await supabase
        .from('agenda_time_logs')
        .update({
          ended_at: endedAt.toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq('id', log_id)
        .select()
        .single();

      if (error) {
        console.error('Error ending timer:', error);
        return NextResponse.json({ error: 'Failed to end timer' }, { status: 500 });
      }

      // Update actual_hours on agenda item
      const { data: totalTime } = await supabase
        .from('agenda_time_logs')
        .select('duration_minutes')
        .eq('agenda_item_id', id);

      if (totalTime) {
        const totalMinutes = totalTime.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
        await supabase
          .from('agenda_items')
          .update({ actual_hours: (totalMinutes / 60).toFixed(2) })
          .eq('id', id);
      }

      return NextResponse.json({ timeLog });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in POST /api/admin/agenda/[id]/time-logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a time log
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
    const logId = searchParams.get('log_id');

    if (!logId) {
      return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from('agenda_time_logs')
      .delete()
      .eq('id', logId);

    if (error) {
      console.error('Error deleting time log:', error);
      return NextResponse.json({ error: 'Failed to delete time log' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/agenda/[id]/time-logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
