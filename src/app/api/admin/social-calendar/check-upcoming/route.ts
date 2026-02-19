import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET || 'your-cron-secret-key';

// POST - Check for upcoming social posts and send reminders
// This endpoint should be called by a cron job every hour
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const supabase = createServerClient();

    // Call the database function to send reminders
    const { error } = await supabase.rpc('notify_upcoming_social_posts');

    if (error) {
      console.error('Error sending social post reminders:', error);
      return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Reminders sent successfully' });
  } catch (error) {
    console.error('Error in POST /api/admin/social-calendar/check-upcoming:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
