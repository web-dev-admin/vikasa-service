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
    const req = dataStore.getRequestById(id);

    if (!req) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: req });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve request' },
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
      return unauthorizedResponse('Administrator authorization required to delete requests');
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Valid request ID is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryToken = searchParams.get('token');
    const queryNum = searchParams.get('num');

    const isUuid = (val?: string | null): boolean =>
      Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

    // 1. Delete from Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        // A. Delete child records from assignments
        await supabase.from('assignments').delete().eq('request_id', id);
        if (queryToken) {
          await supabase.from('assignments').delete().eq('request_id', queryToken);
        }

        // B. Delete child records from worker_contact_attempts
        await supabase.from('worker_contact_attempts').delete().eq('request_id', id);
        if (queryToken) {
          await supabase.from('worker_contact_attempts').delete().eq('request_id', queryToken);
        }

        // C. Delete main service request record by primary id
        await supabase.from('service_requests').delete().eq('id', id);
        if (queryToken && queryToken !== id) {
          await supabase.from('service_requests').delete().eq('id', queryToken);
        }

        // D. Delete by tracking token (only pass valid UUIDs to Postgres)
        if (isUuid(id)) {
          await supabase.from('service_requests').delete().eq('tracking_token', id);
        }
        if (queryToken && isUuid(queryToken)) {
          await supabase.from('service_requests').delete().eq('tracking_token', queryToken);
        }

        // E. If numeric request number was provided
        if (/^\d+$/.test(id)) {
          await supabase.from('service_requests').delete().eq('request_number', Number(id));
        }
        if (queryNum && /^\d+$/.test(queryNum)) {
          await supabase.from('service_requests').delete().eq('request_number', Number(queryNum));
        }
      } catch (dbErr) {
        console.warn('Could not delete service request from Supabase:', dbErr);
      }
    }

    // 2. Delete from local dataStore
    dataStore.deleteRequest(id);
    if (queryToken) {
      dataStore.deleteRequest(queryToken);
    }
    if (queryNum) {
      dataStore.deleteRequest(queryNum);
    }

    return NextResponse.json({
      success: true,
      message: 'Service request permanently deleted from database',
      deletedId: id,
    });
  } catch (error) {
    console.error('Delete request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete request from database' },
      { status: 500 }
    );
  }
}

