import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { NotificationType } from '@/lib/notifications';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// All notification types
const NOTIFICATION_TYPES: NotificationType[] = [
  'new_order',
  'new_review',
  'new_story',
  'new_contact',
  'new_event_booking',
  'low_inventory',
  'order_issues',
  'high_value_order',
];

// Verify admin from cookie and return role info
async function verifyAdmin(): Promise<{ userId: string; email: string; role?: string } | null> {
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
      role: payload.role as string | undefined,
    };
  } catch {
    return null;
  }
}

// Check if user is super admin
async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('admin_users')
    .select('role')
    .eq('id', userId)
    .single();
  
  return data?.role === 'super_admin';
}

// GET - Fetch notification preferences
// Super admins can fetch any user's preferences via ?userId=xxx
// Also supports ?listUsers=true to get all admin users for selection
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authAdmin = await verifyAdmin();
    if (!authAdmin || !authAdmin.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');
    const listUsers = searchParams.get('listUsers') === 'true';
    
    // Check if requester is super admin
    const requesterIsSuperAdmin = await isSuperAdmin(authAdmin.userId);

    // If listing users (super admin only)
    if (listUsers) {
      if (!requesterIsSuperAdmin) {
        return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
      }

      const { data: users, error: usersError } = await supabase
        .from('admin_users')
        .select('id, email, first_name, last_name, role, phone_number, is_active')
        .eq('is_active', true)
        .order('first_name');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
      }

      return NextResponse.json({ users: users || [] });
    }

    // Determine which user's preferences to fetch
    let adminId = authAdmin.userId;
    
    // If targeting another user, verify super admin access
    if (targetUserId && targetUserId !== authAdmin.userId) {
      if (!requesterIsSuperAdmin) {
        return NextResponse.json({ error: 'Super admin access required to view other users\' preferences' }, { status: 403 });
      }
      adminId = targetUserId;
    }

    // Get admin info including phone number
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, phone_number, first_name, last_name, role')
      .eq('id', adminId)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Get notification preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('admin_user_id', adminId);

    if (prefsError) {
      console.error('Error fetching preferences:', prefsError);
      // Return empty array if table doesn't exist yet
      if (prefsError.code === '42P01') {
        return NextResponse.json({
          admin: {
            id: adminData.id,
            email: adminData.email,
            phone_number: adminData.phone_number,
            first_name: adminData.first_name,
            last_name: adminData.last_name,
            role: adminData.role,
          },
          preferences: NOTIFICATION_TYPES.map(type => ({
            notification_type: type,
            email_enabled: true,
            sms_enabled: false,
          })),
          isSuperAdmin: requesterIsSuperAdmin,
          isOwnPreferences: adminId === authAdmin.userId,
        });
      }
    }

    // Create a map of existing preferences
    const prefMap = new Map();
    (preferences || []).forEach((pref: any) => {
      prefMap.set(pref.notification_type, pref);
    });

    // Return all notification types with their preferences (defaults if not set)
    const allPreferences = NOTIFICATION_TYPES.map(type => {
      const existing = prefMap.get(type);
      return {
        notification_type: type,
        email_enabled: existing ? existing.email_enabled : true,
        sms_enabled: existing ? existing.sms_enabled : false,
      };
    });

    return NextResponse.json({
      admin: {
        id: adminData.id,
        email: adminData.email,
        phone_number: adminData.phone_number,
        first_name: adminData.first_name,
        last_name: adminData.last_name,
        role: adminData.role,
      },
      preferences: allPreferences,
      isSuperAdmin: requesterIsSuperAdmin,
      isOwnPreferences: adminId === authAdmin.userId,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/notifications/preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update notification preferences
// Super admins can update any user's preferences via userId in body
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminAuth = await verifyAdmin();
    if (!adminAuth || !adminAuth.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { preferences, phone_number, userId: targetUserId } = body;

    const supabase = createServerClient();
    
    // Determine which user's preferences to update
    let adminId = adminAuth.userId;
    
    // If targeting another user, verify super admin access
    if (targetUserId && targetUserId !== adminAuth.userId) {
      const requesterIsSuperAdmin = await isSuperAdmin(adminAuth.userId);
      if (!requesterIsSuperAdmin) {
        return NextResponse.json({ error: 'Super admin access required to update other users\' preferences' }, { status: 403 });
      }
      adminId = targetUserId;
    }

    // Update phone number if provided
    if (phone_number !== undefined) {
      const { error: phoneError } = await supabase
        .from('admin_users')
        .update({ phone_number })
        .eq('id', adminId);

      if (phoneError) {
        console.error('Error updating phone number:', phoneError);
        return NextResponse.json({ error: 'Failed to update phone number' }, { status: 500 });
      }
    }

    // Update preferences if provided
    if (preferences && Array.isArray(preferences)) {
      for (const pref of preferences) {
        if (!pref.notification_type || !NOTIFICATION_TYPES.includes(pref.notification_type)) {
          continue;
        }

        const { error: prefError } = await supabase
          .from('notification_preferences')
          .upsert({
            admin_user_id: adminId,
            notification_type: pref.notification_type,
            email_enabled: pref.email_enabled ?? true,
            sms_enabled: pref.sms_enabled ?? false,
          }, {
            onConflict: 'admin_user_id,notification_type',
          });

        if (prefError) {
          console.error('Error updating preference:', prefError);
        }
      }
    }

    // Fetch updated preferences
    const { data: updatedPrefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('admin_user_id', adminId);

    const { data: updatedAdmin } = await supabase
      .from('admin_users')
      .select('id, email, phone_number, first_name, last_name, role')
      .eq('id', adminId)
      .single();

    // Create response with all notification types
    const prefMap = new Map();
    (updatedPrefs || []).forEach((pref: any) => {
      prefMap.set(pref.notification_type, pref);
    });

    const allPreferences = NOTIFICATION_TYPES.map(type => {
      const existing = prefMap.get(type);
      return {
        notification_type: type,
        email_enabled: existing ? existing.email_enabled : true,
        sms_enabled: existing ? existing.sms_enabled : false,
      };
    });

    return NextResponse.json({
      success: true,
      admin: updatedAdmin,
      preferences: allPreferences,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/notifications/preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
