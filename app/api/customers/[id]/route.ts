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
      return unauthorizedResponse('Administrator authorization required to view customer details');
    }

    const { id } = await params;
    const result = dataStore.getCustomerById(id);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer profile' },
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
      return unauthorizedResponse('Administrator authorization required to delete customer contacts');
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Valid customer ID is required' },
        { status: 400 }
      );
    }

    const existing = dataStore.getCustomerById(id);
    const cleanPhone = existing?.customer?.phone
      ? existing.customer.phone.replace(/\D/g, '').slice(-10)
      : id.replace(/\D/g, '').slice(-10);

    // 1. Delete from Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        // Find request IDs to delete child references
        const { data: relatedReqs } = await supabase
          .from('service_requests')
          .select('id')
          .or(`customer_id.eq.${id}${cleanPhone ? `,customer_phone.ilike.%${cleanPhone}%` : ''}`);

        if (Array.isArray(relatedReqs) && relatedReqs.length > 0) {
          const reqIds = relatedReqs.map((r) => r.id);
          for (const reqId of reqIds) {
            await supabase.from('assignments').delete().eq('request_id', reqId);
            await supabase.from('worker_contact_attempts').delete().eq('request_id', reqId);
          }
        }

        // Delete related requests from Supabase
        if (cleanPhone) {
          await supabase.from('service_requests').delete().ilike('customer_phone', `%${cleanPhone}%`);
        }
        await supabase.from('service_requests').delete().eq('customer_id', id);

        // Delete customer record
        await supabase.from('customers').delete().eq('id', id);
        if (cleanPhone) {
          await supabase.from('customers').delete().ilike('phone', `%${cleanPhone}%`);
        }
      } catch (dbErr) {
        console.warn('Could not delete customer from Supabase:', dbErr);
      }
    }

    // 2. Delete from local dataStore
    dataStore.deleteCustomer(id);

    return NextResponse.json({
      success: true,
      message: 'Customer and associated enquiry records permanently deleted',
      deletedId: id,
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
