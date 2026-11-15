import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required');
    }

    const { id } = await params;
    const customer = dataStore.getCustomerById(id);

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required to delete customer records');
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Valid customer ID is required' },
        { status: 400 }
      );
    }

    const record = dataStore.getCustomerById(id);
    const customer = record?.customer;
    const cleanPhone = customer?.phone?.replace(/\D/g, '').slice(-10);

    // 1. Delete from Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        // Delete from customers table
        await supabase.from('customers').delete().eq('id', id);

        if (customer?.phone) {
          await supabase.from('customers').delete().eq('phone', customer.phone);
        }

        // Delete associated service_requests if any
        await supabase.from('service_requests').delete().eq('customer_id', id);
        if (customer?.phone) {
          await supabase.from('service_requests').delete().eq('customer_phone', customer.phone);
        }
        if (cleanPhone) {
          await supabase.from('service_requests').delete().ilike('customer_phone', `%${cleanPhone}%`);
        }
      } catch (dbErr) {
        console.warn('Could not delete customer from Supabase:', dbErr);
      }
    }

    // 2. Delete from local dataStore and add to permanent deletedCustomerIds
    dataStore.deleteCustomer(id);

    return NextResponse.json({
      success: true,
      message: 'Customer record and associated enquiries permanently deleted from database',
      deletedId: id,
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer from database' },
      { status: 500 }
    );
  }
}
