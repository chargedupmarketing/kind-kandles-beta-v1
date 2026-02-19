import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-at-least-32-characters-long';
const SELF_DESTRUCT_KEY = process.env.SELF_DESTRUCT_KEY || 'KINDKANDLES-DESTRUCT-2026';

// In-memory store for verification tokens (in production, use Redis)
const verificationTokens = new Map<string, { userId: string; step: number; expiresAt: number }>();

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

function convertToCSV(data: Record<string, unknown>[], headers?: string[]): string {
  if (!data || data.length === 0) return '';
  
  const keys = headers || Object.keys(data[0]);
  const csvRows = [];
  
  csvRows.push(keys.join(','));
  
  for (const row of data) {
    const values = keys.map(key => {
      const value = row[key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      return String(value);
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// Step 1: Verify special key and start the process
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminWithRole();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!admin.isSuperAdmin) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, specialKey, verificationToken, confirmationText } = body;

    // Step 1: Verify special key
    if (action === 'verify-key') {
      if (specialKey !== SELF_DESTRUCT_KEY) {
        // Log failed attempt
        console.error(`[SECURITY] Failed self-destruct key attempt by ${admin.email} from IP: ${request.headers.get('x-forwarded-for') || 'unknown'}`);
        return NextResponse.json({ error: 'Invalid special key' }, { status: 403 });
      }

      // Generate verification token for next step
      const token = crypto.randomBytes(32).toString('hex');
      verificationTokens.set(token, {
        userId: admin.userId,
        step: 1,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
      });

      return NextResponse.json({ 
        success: true, 
        verificationToken: token,
        message: 'Key verified. Proceed to confirmation step.'
      });
    }

    // Step 2: First confirmation
    if (action === 'confirm-step-1') {
      const tokenData = verificationTokens.get(verificationToken);
      if (!tokenData || tokenData.userId !== admin.userId || tokenData.step !== 1 || Date.now() > tokenData.expiresAt) {
        return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 403 });
      }

      if (confirmationText !== 'I UNDERSTAND THIS WILL DELETE ALL DATA') {
        return NextResponse.json({ error: 'Confirmation text does not match' }, { status: 400 });
      }

      // Update token for next step
      tokenData.step = 2;
      tokenData.expiresAt = Date.now() + 5 * 60 * 1000;

      return NextResponse.json({ 
        success: true, 
        message: 'First confirmation received. Proceed to final confirmation.'
      });
    }

    // Step 3: Second confirmation
    if (action === 'confirm-step-2') {
      const tokenData = verificationTokens.get(verificationToken);
      if (!tokenData || tokenData.userId !== admin.userId || tokenData.step !== 2 || Date.now() > tokenData.expiresAt) {
        return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 403 });
      }

      if (confirmationText !== 'DELETE EVERYTHING PERMANENTLY') {
        return NextResponse.json({ error: 'Confirmation text does not match' }, { status: 400 });
      }

      // Update token for next step
      tokenData.step = 3;
      tokenData.expiresAt = Date.now() + 5 * 60 * 1000;

      return NextResponse.json({ 
        success: true, 
        message: 'Second confirmation received. Ready for final execution.'
      });
    }

    // Step 4: Execute self-destruct (download + wipe)
    if (action === 'execute') {
      const tokenData = verificationTokens.get(verificationToken);
      if (!tokenData || tokenData.userId !== admin.userId || tokenData.step !== 3 || Date.now() > tokenData.expiresAt) {
        return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 403 });
      }

      // Clean up token
      verificationTokens.delete(verificationToken);

      if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
      }

      const supabase = createServerClient();

      // Step 4a: Export all data first
      const [products, orders, customers, contacts, stories, surveys, reviews, discounts, adminUsers, auditLogs] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('contact_submissions').select('*'),
        supabase.from('customer_stories').select('*'),
        supabase.from('survey_responses').select('*'),
        supabase.from('product_reviews').select('*'),
        supabase.from('discounts').select('*'),
        supabase.from('admin_users').select('id, email, first_name, last_name, role, created_at'),
        supabase.from('audit_logs').select('*')
      ]);

      const sections = [
        { name: 'PRODUCTS', data: products.data || [] },
        { name: 'ORDERS', data: orders.data || [] },
        { name: 'CUSTOMERS', data: customers.data || [] },
        { name: 'CONTACT_SUBMISSIONS', data: contacts.data || [] },
        { name: 'CUSTOMER_STORIES', data: stories.data || [] },
        { name: 'SURVEY_RESPONSES', data: surveys.data || [] },
        { name: 'PRODUCT_REVIEWS', data: reviews.data || [] },
        { name: 'DISCOUNTS', data: discounts.data || [] },
        { name: 'ADMIN_USERS', data: adminUsers.data || [] },
        { name: 'AUDIT_LOGS', data: auditLogs.data || [] }
      ];

      let csvContent = `SELF-DESTRUCT BACKUP\nGenerated: ${new Date().toISOString()}\nInitiated by: ${admin.email}\n`;
      for (const section of sections) {
        csvContent += `\n\n=== ${section.name} (${section.data.length} records) ===\n`;
        if (section.data.length > 0) {
          csvContent += convertToCSV(section.data as Record<string, unknown>[]);
        } else {
          csvContent += 'No data';
        }
      }

      // Step 4b: Wipe all data (in correct order for foreign key constraints)
      const wipeOrder = [
        'order_items',
        'product_images',
        'product_variants',
        'product_reviews',
        'notification_logs',
        'audit_logs',
        'orders',
        'products',
        'customers',
        'contact_submissions',
        'customer_stories',
        'survey_responses',
        'discounts'
      ];

      for (const table of wipeOrder) {
        try {
          await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } catch (err) {
          console.error(`Error wiping ${table}:`, err);
        }
      }

      // Log the self-destruct action
      console.error(`[CRITICAL] SELF-DESTRUCT executed by ${admin.email} at ${new Date().toISOString()}`);

      // Return the backup data
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="FINAL_BACKUP_BEFORE_WIPE_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Self-destruct error:', error);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}
