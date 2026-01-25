import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Test if event tables exist and are accessible
export async function GET(request: NextRequest) {
  try {
    const serverClient = createServerClient();
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
    };

    // Test 1: Check if events table exists
    try {
      const { data, error } = await serverClient
        .from('events')
        .select('id')
        .limit(1);
      
      results.tests.events_table = {
        exists: !error,
        error: error?.message || null,
        code: error?.code || null,
        hint: error?.hint || null,
      };
    } catch (e: any) {
      results.tests.events_table = {
        exists: false,
        error: e.message,
      };
    }

    // Test 2: Check if event_occurrences table exists
    try {
      const { data, error } = await serverClient
        .from('event_occurrences')
        .select('id')
        .limit(1);
      
      results.tests.event_occurrences_table = {
        exists: !error,
        error: error?.message || null,
        code: error?.code || null,
      };
    } catch (e: any) {
      results.tests.event_occurrences_table = {
        exists: false,
        error: e.message,
      };
    }

    // Test 3: Check if event_bookings table exists
    try {
      const { data, error } = await serverClient
        .from('event_bookings')
        .select('id')
        .limit(1);
      
      results.tests.event_bookings_table = {
        exists: !error,
        error: error?.message || null,
        code: error?.code || null,
      };
    } catch (e: any) {
      results.tests.event_bookings_table = {
        exists: false,
        error: e.message,
      };
    }

    // Test 4: Check if event_categories table exists
    try {
      const { data, error } = await serverClient
        .from('event_categories')
        .select('*')
        .limit(5);
      
      results.tests.event_categories_table = {
        exists: !error,
        count: data?.length || 0,
        error: error?.message || null,
        categories: data || [],
      };
    } catch (e: any) {
      results.tests.event_categories_table = {
        exists: false,
        error: e.message,
      };
    }

    // Test 5: Try to insert a test event (will rollback)
    try {
      const testEvent = {
        title: 'TEST EVENT - DELETE ME',
        slug: `test-event-${Date.now()}`,
        event_type: 'workshop',
        location_type: 'mobile',
        duration_minutes: 60,
        pricing_model: 'per_person',
        base_price: 25,
      };

      const { data, error } = await serverClient
        .from('events')
        .insert(testEvent)
        .select()
        .single();

      if (!error && data) {
        // Delete the test event immediately
        await serverClient
          .from('events')
          .delete()
          .eq('id', data.id);

        results.tests.insert_event = {
          success: true,
          message: 'Successfully inserted and deleted test event',
        };
      } else {
        results.tests.insert_event = {
          success: false,
          error: error?.message || null,
          code: error?.code || null,
          hint: error?.hint || null,
        };
      }
    } catch (e: any) {
      results.tests.insert_event = {
        success: false,
        error: e.message,
      };
    }

    // Summary
    const allTablesExist = 
      results.tests.events_table?.exists &&
      results.tests.event_occurrences_table?.exists &&
      results.tests.event_bookings_table?.exists &&
      results.tests.event_categories_table?.exists;

    results.summary = {
      all_tables_exist: allTablesExist,
      migrations_needed: !allTablesExist,
      ready_for_use: allTablesExist && results.tests.insert_event?.success,
    };

    if (!allTablesExist) {
      results.instructions = {
        message: 'Database tables are missing. Please run the migrations.',
        steps: [
          '1. Go to Supabase Dashboard → SQL Editor',
          '2. Run: supabase/migrations/20260118_events_system.sql',
          '3. Run: supabase/migrations/20260125_update_events_enums.sql',
          '4. Refresh this page to verify',
        ],
      };
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('Error in event system test:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
