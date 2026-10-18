import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required to view customer contacts');
    }

    // Sync from Supabase customers or service_requests if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const { data: dbCustomers, error } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(dbCustomers) && dbCustomers.length > 0) {
          dataStore.mergeCustomers(dbCustomers);
        } else {
          const { data: dbRequests } = await supabase
            .from('service_requests')
            .select('*')
            .order('created_at', { ascending: false });
          if (Array.isArray(dbRequests) && dbRequests.length > 0) {
            dataStore.mergeRequests(dbRequests);
          }
        }
      } catch (e) {
        console.warn('Supabase customers fetch warning:', e);
      }
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const district = searchParams.get('district') || undefined;
    const service = searchParams.get('service') || undefined;

    const customers = dataStore.getCustomers({ search, district, service });
    return NextResponse.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required to manage customer contacts');
    }

    const body = await request.json();
    if (!body.full_name || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'Full name and mobile number are required' },
        { status: 400 }
      );
    }

    const customer = dataStore.upsertCustomer(body);
    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to save customer' },
      { status: 500 }
    );
  }
}
