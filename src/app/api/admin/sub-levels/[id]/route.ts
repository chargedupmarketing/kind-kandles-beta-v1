import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secure-jwt-secret-at-least-32-characters-long'
);

// Verify user has permission to manage sub-levels
async function verifySubLevelPermission(): Promise<{
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

// GET /api/admin/sub-levels/[id] - Get a specific sub-level
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const supabase = createServerClient();
    
    const { data: subLevel, error } = await supabase
      .from('user_sub_levels')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !subLevel) {
      return NextResponse.json({ error: 'Sub-level not found' }, { status: 404 });
    }
    
    return NextResponse.json({ subLevel });
  } catch (error) {
    console.error('Get sub-level error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/sub-levels/[id] - Update a sub-level
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const auth = await verifySubLevelPermission();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    
    const supabase = createServerClient();
    
    // Check if sub-level exists and is not a system sub-level
    const { data: existing, error: fetchError } = await supabase
      .from('user_sub_levels')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Sub-level not found' }, { status: 404 });
    }
    
    if (existing.is_system) {
      return NextResponse.json({ error: 'Cannot modify system sub-levels' }, { status: 403 });
    }
    
    const body = await request.json();
    const { name, description } = body;
    
    const updateData: { name?: string; slug?: string; description?: string | null } = {};
    
    if (name !== undefined) {
      if (name.trim().length < 2) {
        return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
      }
      updateData.name = name.trim();
      updateData.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Check if new slug conflicts with existing
      const { data: conflicting } = await supabase
        .from('user_sub_levels')
        .select('id')
        .eq('slug', updateData.slug)
        .neq('id', id)
        .single();
      
      if (conflicting) {
        return NextResponse.json({ error: 'A sub-level with this name already exists' }, { status: 409 });
      }
    }
    
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    
    const { data: updated, error: updateError } = await supabase
      .from('user_sub_levels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating sub-level:', updateError);
      return NextResponse.json({ error: 'Failed to update sub-level' }, { status: 500 });
    }
    
    return NextResponse.json({ subLevel: updated });
  } catch (error) {
    console.error('Update sub-level error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/sub-levels/[id] - Delete a sub-level
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const auth = await verifySubLevelPermission();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    
    const supabase = createServerClient();
    
    // Check if sub-level exists and is not a system sub-level
    const { data: existing, error: fetchError } = await supabase
      .from('user_sub_levels')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Sub-level not found' }, { status: 404 });
    }
    
    if (existing.is_system) {
      return NextResponse.json({ error: 'Cannot delete system sub-levels' }, { status: 403 });
    }
    
    // Delete all assignments first (cascade should handle this, but being explicit)
    await supabase
      .from('user_sub_level_assignments')
      .delete()
      .eq('sub_level_id', id);
    
    // Delete the sub-level
    const { error: deleteError } = await supabase
      .from('user_sub_levels')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting sub-level:', deleteError);
      return NextResponse.json({ error: 'Failed to delete sub-level' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: 'Sub-level deleted' });
  } catch (error) {
    console.error('Delete sub-level error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

