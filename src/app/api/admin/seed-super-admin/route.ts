import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// Seed data for the super admin
const SUPER_ADMIN_DATA = {
  email: 'dominic@chargedupmarketing.com',
  password: '73105121De!Dominic311$2005',
  first_name: 'Dominic',
  last_name: 'Engrassia',
  role: 'super_admin' as const,
  sub_level_slugs: ['chargedup-marketing', 'developer']
};

// Secret key required to run this endpoint (set in environment variables)
const SEED_SECRET = process.env.SEED_SECRET_KEY || 'kind-kandles-seed-2024';

export async function POST(request: NextRequest) {
  try {
    // Verify secret key
    const body = await request.json();
    const { secretKey } = body;
    
    if (secretKey !== SEED_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret key' },
        { status: 401 }
      );
    }
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    const supabase = createServerClient();
    
    // 1. Hash the password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(SUPER_ADMIN_DATA.password, saltRounds);
    
    // 2. Check if user already exists
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('email', SUPER_ADMIN_DATA.email)
      .single();
    
    let userId: string;
    
    if (existingUser) {
      // Update existing user to super_admin
      const { data: updatedUser, error: updateError } = await supabase
        .from('admin_users')
        .update({
          password_hash,
          first_name: SUPER_ADMIN_DATA.first_name,
          last_name: SUPER_ADMIN_DATA.last_name,
          role: 'super_admin',
          is_active: true,
          two_factor_enabled: true
        })
        .eq('id', existingUser.id)
        .select('id')
        .single();
      
      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
      }
      
      userId = updatedUser.id;
    } else {
      // Create new super admin
      const { data: newUser, error: createError } = await supabase
        .from('admin_users')
        .insert({
          email: SUPER_ADMIN_DATA.email,
          password_hash,
          first_name: SUPER_ADMIN_DATA.first_name,
          last_name: SUPER_ADMIN_DATA.last_name,
          role: 'super_admin',
          is_active: true,
          two_factor_enabled: true
        })
        .select('id')
        .single();
      
      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      
      userId = newUser.id;
    }
    
    // 3. Get sub-level IDs
    const { data: subLevels, error: subLevelError } = await supabase
      .from('user_sub_levels')
      .select('id, slug')
      .in('slug', SUPER_ADMIN_DATA.sub_level_slugs);
    
    if (subLevelError) {
      console.error('Error fetching sub-levels:', subLevelError);
      // Continue anyway - sub-levels might not exist yet
    }
    
    // 4. Assign sub-levels to user
    if (subLevels && subLevels.length > 0) {
      // Remove existing assignments first
      await supabase
        .from('user_sub_level_assignments')
        .delete()
        .eq('user_id', userId);
      
      // Create new assignments
      const assignments = subLevels.map(sl => ({
        user_id: userId,
        sub_level_id: sl.id,
        assigned_at: new Date().toISOString()
      }));
      
      const { error: assignError } = await supabase
        .from('user_sub_level_assignments')
        .insert(assignments);
      
      if (assignError) {
        console.error('Error assigning sub-levels:', assignError);
        // Continue anyway
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Super admin account seeded successfully',
      user: {
        email: SUPER_ADMIN_DATA.email,
        name: `${SUPER_ADMIN_DATA.first_name} ${SUPER_ADMIN_DATA.last_name}`,
        role: 'super_admin',
        subLevels: SUPER_ADMIN_DATA.sub_level_slugs
      }
    });
    
  } catch (error) {
    console.error('Seed super admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

