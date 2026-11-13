import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';
import { dataStore } from '@/lib/data/store';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required to clear dummy data');
    }

    // 1. Wipe remote Supabase tables if connected
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        await supabase.from('assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('worker_contact_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('worker_services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('service_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('workers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (dbErr) {
        console.warn('Supabase remote purge warning:', dbErr);
      }
    }

    // 2. Wipe server dataStore
    dataStore.clearAllOperationalData();

    return NextResponse.json({
      success: true,
      message: 'All requests, customers, technicians, and notifications permanently wiped.',
      remaining_requests: 0,
      remaining_workers: 0,
      remaining_customers: 0,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to clear dummy data' },
      { status: 500 }
    );
  }
}
