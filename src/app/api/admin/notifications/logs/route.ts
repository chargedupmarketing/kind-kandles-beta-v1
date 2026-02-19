import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Verify admin from cookie
async function verifyAdmin(): Promise<{ userId: string; email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secure-jwt-secret-at-least-32-characters-long');
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

// GET - Fetch notification logs with filters
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdmin();
    if (!admin || !admin.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const recipientType = searchParams.get('recipientType');
    const channel = searchParams.get('channel');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const supabase = createServerClient();

    let query = supabase
      .from('notification_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (type) {
      query = query.eq('notification_type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (recipientType) {
      query = query.eq('recipient_type', recipientType);
    }
    if (channel) {
      query = query.eq('channel', channel);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Error fetching notification logs:', error);
      // Return empty array if table doesn't exist yet
      if (error.code === '42P01') {
        return NextResponse.json({
          logs: [],
          total: 0,
          limit,
          offset,
        });
      }
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    // Get summary stats
    const { data: stats } = await supabase
      .from('notification_logs')
      .select('status')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const summary = {
      total_24h: stats?.length || 0,
      sent_24h: stats?.filter((s: any) => s.status === 'sent').length || 0,
      failed_24h: stats?.filter((s: any) => s.status === 'failed').length || 0,
      delivered_24h: stats?.filter((s: any) => s.status === 'delivered').length || 0,
    };

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      limit,
      offset,
      summary,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/notifications/logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete old logs (cleanup)
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdmin();
    if (!admin || !admin.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Note: In production, you might want to check for super_admin role
    // For now, any authenticated admin can delete old logs

    const { searchParams } = new URL(request.url);
    const olderThanDays = parseInt(searchParams.get('olderThanDays') || '30');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const supabase = createServerClient();

    const { error, data } = await supabase
      .from('notification_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error deleting old logs:', error);
      return NextResponse.json({ error: 'Failed to delete logs' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deleted: data?.length || 0,
      message: `Deleted logs older than ${olderThanDays} days`,
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/notifications/logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
