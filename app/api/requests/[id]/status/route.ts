import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { RequestStatus } from '@/types';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';
import { supabase } from '@/lib/supabase/client';

const VALID_STATUSES: RequestStatus[] = [
  'NEW',
  'CUSTOMER_TO_CALL',
  'CUSTOMER_CONFIRMED',
  'MATCHING',
  'WORKER_CONTACTING',
  'WORKER_ACCEPTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CUSTOMER_CANCELLED',
  'NO_WORKER_AVAILABLE',
  'CANCELLED',
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required to update request status');
    }

    const { id } = await params;
    const body = await request.json();
    const { status, note } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const req = dataStore.getRequestById(id);
    if (!req) {
      return NextResponse.json(
        { success: false, error: 'Service request not found' },
        { status: 404 }
      );
    }

    if (status === 'COMPLETED') {
      dataStore.completeJob(id);
    } else if (status === 'CANCELLED' || status === 'CUSTOMER_CANCELLED' || status === 'NO_WORKER_AVAILABLE') {
      dataStore.cancelRequest(id, note);
      dataStore.updateRequestStatus(id, status, note);
    } else if (status === 'CUSTOMER_CONFIRMED') {
      dataStore.confirmCustomerRequirement(id, note);
    } else {
      dataStore.updateRequestStatus(id, status, note);
    }

    // Persist status change to Supabase database
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const updatePayload: Record<string, any> = {
          status,
          updated_at: new Date().toISOString(),
        };
        if (status === 'CUSTOMER_CONFIRMED') {
          updatePayload.customer_confirmed = true;
          updatePayload.customer_confirmed_at = new Date().toISOString();
        }
        if (note) {
          updatePayload.admin_notes = note;
        }

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const { data: updatedRows, error: sbErr } = await supabase
          .from('service_requests')
          .update(updatePayload)
          .eq('id', id)
          .select('id');

        if ((!updatedRows || updatedRows.length === 0) && isUuid) {
          await supabase
            .from('service_requests')
            .update(updatePayload)
            .eq('tracking_token', id);
        }

        if (sbErr) {
          console.error('[Requests:status:PATCH] Supabase update error:', sbErr.message);
        }
      } catch (err) {
        console.warn('Supabase status sync error:', err);
      }
    }

    const updated = dataStore.getRequestById(id);
    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update request status' },
      { status: 500 }
    );
  }
}
