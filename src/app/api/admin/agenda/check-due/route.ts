import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// This endpoint should be called by a cron job to check for due agenda items
// and send notifications
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret-here';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const supabase = createServerClient();
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Find items that are due within the next hour and have notifications enabled
    const { data: dueItems, error } = await supabase
      .from('agenda_items')
      .select(`
        *,
        assigned_to_user:admin_users!agenda_items_assigned_to_fkey(id, email, first_name, last_name)
      `)
      .eq('notify_on_due', true)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .gte('due_date', now.toISOString())
      .lte('due_date', oneHourFromNow.toISOString());

    if (error) {
      console.error('Error fetching due items:', error);
      return NextResponse.json({ error: 'Failed to fetch due items' }, { status: 500 });
    }

    if (!dueItems || dueItems.length === 0) {
      return NextResponse.json({ 
        message: 'No due items found',
        checked: 0 
      });
    }

    // Send notifications for each due item
    const notifications = [];
    for (const item of dueItems) {
      // Check if we already sent a notification for this item
      const { data: existingNotif } = await supabase
        .from('notifications')
        .select('id')
        .eq('type', 'agenda_due')
        .eq('metadata->>agenda_item_id', item.id)
        .gte('created_at', new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()) // Within last 2 hours
        .single();

      if (existingNotif) {
        continue; // Already notified
      }

      const dueDate = new Date(item.due_date);
      const minutesUntilDue = Math.round((dueDate.getTime() - now.getTime()) / 1000 / 60);
      
      let message = '';
      if (minutesUntilDue <= 0) {
        message = `⏰ Agenda item "${item.title}" is now due!`;
      } else if (minutesUntilDue <= 15) {
        message = `⏰ Agenda item "${item.title}" is due in ${minutesUntilDue} minutes`;
      } else {
        message = `⏰ Agenda item "${item.title}" is due in ${Math.round(minutesUntilDue / 60)} hour(s)`;
      }

      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: item.assigned_to,
          type: 'agenda_due',
          message,
          metadata: {
            agenda_item_id: item.id,
            due_date: item.due_date,
            priority: item.priority,
          },
        });

      if (!notifError) {
        notifications.push({
          item_id: item.id,
          user_id: item.assigned_to,
          message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      checked: dueItems.length,
      notified: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error('Error in agenda due check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
