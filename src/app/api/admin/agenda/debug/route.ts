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

// GET - Debug endpoint to check database schema
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const supabase = createServerClient();
    const results: any = {
      admin_id: admin.id,
      admin_email: admin.email,
      tables: {},
      errors: []
    };

    // Check agenda_items table
    try {
      const { data, error } = await supabase
        .from('agenda_items')
        .select('*')
        .limit(1);
      
      results.tables.agenda_items = {
        exists: !error,
        error: error?.message,
        error_code: error?.code,
        sample_data: data?.[0] || null,
        columns: data?.[0] ? Object.keys(data[0]) : []
      };
    } catch (e: any) {
      results.errors.push({ table: 'agenda_items', error: e.message });
    }

    // Check admin_users table
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .limit(1);
      
      results.tables.admin_users = {
        exists: !error,
        error: error?.message,
        error_code: error?.code,
        columns: data?.[0] ? Object.keys(data[0]) : []
      };
    } catch (e: any) {
      results.errors.push({ table: 'admin_users', error: e.message });
    }

    // Check agenda_comments table
    try {
      const { data, error } = await supabase
        .from('agenda_comments')
        .select('*')
        .limit(1);
      
      results.tables.agenda_comments = {
        exists: !error,
        error: error?.message,
        error_code: error?.code
      };
    } catch (e: any) {
      results.errors.push({ table: 'agenda_comments', error: e.message });
    }

    // Check agenda_subtasks table
    try {
      const { data, error } = await supabase
        .from('agenda_subtasks')
        .select('*')
        .limit(1);
      
      results.tables.agenda_subtasks = {
        exists: !error,
        error: error?.message,
        error_code: error?.code
      };
    } catch (e: any) {
      results.errors.push({ table: 'agenda_subtasks', error: e.message });
    }

    // Try the actual query that's failing
    try {
      const { data, error } = await supabase
        .from('agenda_items')
        .select(`
          *,
          assigned_to_user:admin_users!agenda_items_assigned_to_fkey(id, email, first_name, last_name),
          created_by_user:admin_users!agenda_items_created_by_fkey(id, email, first_name, last_name)
        `)
        .limit(1);
      
      results.actual_query = {
        success: !error,
        error: error?.message,
        error_code: error?.code,
        error_details: error?.details,
        error_hint: error?.hint,
        data_sample: data?.[0] || null
      };
    } catch (e: any) {
      results.actual_query = {
        success: false,
        error: e.message
      };
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
