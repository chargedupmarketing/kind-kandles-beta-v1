import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-at-least-32-characters-long';

async function getCurrentAdmin(): Promise<{ userId: string; email: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-token')?.value;
    
    if (!token) return null;
    
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    return {
      userId: payload.userId as string,
      email: payload.email as string
    };
  } catch {
    return null;
  }
}

async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch {
    return plainPassword === hashedPassword;
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, email, password_hash')
      .eq('id', admin.userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Generate a reauth token that expires in 30 minutes
    const reauthToken = crypto.randomUUID();
    const expiresAt = Date.now() + 30 * 60 * 1000;

    // Store in cookie
    const cookieStore = await cookies();
    cookieStore.set('admin-reauth', reauthToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60,
      path: '/'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Re-authentication successful',
      expiresAt 
    });
  } catch (error) {
    console.error('Re-authentication error:', error);
    return NextResponse.json({ error: 'Re-authentication failed' }, { status: 500 });
  }
}
