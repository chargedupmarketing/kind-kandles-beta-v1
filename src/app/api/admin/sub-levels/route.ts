import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secure-jwt-secret-at-least-32-characters-long'
);

// Verify user has permission to manage sub-levels
async function verifySubLevelPermission(request: NextRequest): Promise<{
  authorized: boolean;
  userId?: string;
  role?: string;
  subLevels?: string[];
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-token')?.value;
    
    if (!token) {
      return { authorized: false, error: 'Not authenticated' };
    }
    
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;
    const subLevels = (payload.subLevels as string[]) || [];
    
    // Only super_admin or users with 'developer' sub-level can manage sub-levels
    if (role === 'super_admin' || subLevels.includes('developer')) {
      return { 
        authorized: true, 
        userId: payload.userId as string,
        role,
        subLevels
      };
    }
    
    return { authorized: false, error: 'Insufficient permissions' };
  } catch (error) {
    return { authorized: false, error: 'Invalid token' };
  }
}

// GET /api/admin/sub-levels - List all sub-levels
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    
    // Verify authentication (any authenticated user can view sub-levels)
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const supabase = createServerClient();
    
    const { data: subLevels, error } = await supabase
      .from('user_sub_levels')
      .select(`
        id,
        name,
        slug,
        description,
        is_system,
        created_at,
        created_by
      `)
      .order('is_system', { ascending: false })
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching sub-levels:', error);
      return NextResponse.json({ error: 'Failed to fetch sub-levels' }, { status: 500 });
    }
    
    return NextResponse.json({ subLevels: subLevels || [] });
  } catch (error) {
    console.error('Sub-levels API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/sub-levels - Create a new sub-level
export async function POST(request: NextRequest) {
  try {
    const auth = await verifySubLevelPermission(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    
    const body = await request.json();
    const { name, description } = body;
    
    // Validate required fields
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name is required (min 2 characters)' }, { status: 400 });
    }
    
    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    const supabase = createServerClient();
    
    // Check if slug already exists
    const { data: existing } = await supabase
      .from('user_sub_levels')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (existing) {
      return NextResponse.json({ error: 'A sub-level with this name already exists' }, { status: 409 });
    }
    
    // Create sub-level
    const { data: newSubLevel, error } = await supabase
      .from('user_sub_levels')
      .insert({
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        is_system: false,
        created_by: auth.userId
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating sub-level:', error);
      return NextResponse.json({ error: 'Failed to create sub-level' }, { status: 500 });
    }
    
    return NextResponse.json({ subLevel: newSubLevel }, { status: 201 });
  } catch (error) {
    console.error('Create sub-level error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

