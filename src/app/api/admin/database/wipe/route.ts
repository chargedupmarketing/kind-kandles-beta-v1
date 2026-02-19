import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-at-least-32-characters-long';

async function verifyAdminWithRole(): Promise<{ userId: string; email: string; role: string; isSuperAdmin: boolean } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-token')?.value;
    
    if (!token) return null;
    
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    if (!isSupabaseConfigured()) {
      return {
        userId: payload.userId as string,
        email: payload.email as string,
        role: payload.role as string,
        isSuperAdmin: payload.role === 'owner'
      };
    }

    const supabase = createServerClient();
    const { data: user } = await supabase
      .from('admin_users')
      .select('id, email, role, sub_level_id')
      .eq('id', payload.userId)
      .single();

    if (!user) return null;

    let isSuperAdmin = user.role === 'owner';
    if (user.sub_level_id) {
      const { data: subLevel } = await supabase
        .from('user_sub_levels')
        .select('name')
        .eq('id', user.sub_level_id)
        .single();
      
      if (subLevel?.name === 'super_admin') {
        isSuperAdmin = true;
      }
    }
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      isSuperAdmin
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication - must be super admin
    const admin = await verifyAdminWithRole();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!admin.isSuperAdmin) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { type } = await request.json();

    if (!type) {
      return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    switch (type) {
      case 'products': {
        // Delete related data first (foreign key constraints)
        await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('product_variants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        break;
      }
      case 'orders': {
        // Delete order items first
        await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        break;
      }
      case 'customers': {
        const { error } = await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        break;
      }
      case 'contacts': {
        const { error } = await supabase.from('contact_submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        break;
      }
      case 'stories': {
        const { error } = await supabase.from('customer_stories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        break;
      }
      case 'surveys': {
        const { error } = await supabase.from('survey_responses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `${type} data deleted successfully` });
  } catch (error) {
    console.error('Wipe error:', error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}

