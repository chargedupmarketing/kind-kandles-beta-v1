import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// GET /api/admin/users/[id] - Get a specific admin user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, email, first_name, last_name, role, is_active, last_login, created_at')
      .eq('id', id)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get admin user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] - Update an admin user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get the requesting user's role from headers (set by middleware)
    const requestingUserRole = request.headers.get('x-user-role');
    const isSuperAdmin = requestingUserRole === 'super_admin';

    // Check if user exists and get their role
    const { data: existingUser, error: fetchError } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only super admins can modify other super admins
    if (existingUser.role === 'super_admin' && !isSuperAdmin) {
      return NextResponse.json({ error: 'Only super admins can modify other super admins' }, { status: 403 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (body.first_name !== undefined) updateData.first_name = body.first_name;
    if (body.last_name !== undefined) updateData.last_name = body.last_name;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    
    // Role change - only super admins can set super_admin role
    if (body.role !== undefined) {
      if (body.role === 'super_admin' && !isSuperAdmin) {
        return NextResponse.json({ error: 'Only super admins can assign super admin role' }, { status: 403 });
      }
      updateData.role = body.role;
    }

    // Password change
    if (body.password) {
      if (body.password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }
      updateData.password_hash = await bcrypt.hash(body.password, 12);
    }

    // Sub-levels update
    if (body.sub_levels !== undefined) {
      updateData.sub_levels = body.sub_levels;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: updatedUser, error } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, first_name, last_name, role, is_active, last_login, created_at, sub_levels')
      .single();

    if (error) {
      console.error('Error updating admin user:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update admin user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Delete an admin user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the requesting user's role from headers (set by middleware)
    const requestingUserRole = request.headers.get('x-user-role');
    const isSuperAdmin = requestingUserRole === 'super_admin';

    // Check if user exists and get their role
    const { data: existingUser, error: fetchError } = await supabase
      .from('admin_users')
      .select('id, role, email')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only super admins can delete other super admins
    if (existingUser.role === 'super_admin' && !isSuperAdmin) {
      return NextResponse.json({ error: 'Only super admins can delete other super admins' }, { status: 403 });
    }

    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting admin user:', error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete admin user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
