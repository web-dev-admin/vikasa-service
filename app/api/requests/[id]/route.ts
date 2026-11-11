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

    // 1. Delete from Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        // First delete any associated worker contact attempts to maintain referential integrity
        await supabase.from('worker_contact_attempts').delete().eq('request_id', id);
        // Then delete the main service request record
        const { error: dbError } = await supabase.from('service_requests').delete().eq('id', id);
        if (dbError) {
          console.warn('Supabase service_requests delete warning:', dbError.message);
        }
      } catch (dbErr) {
        console.warn('Could not delete service request from Supabase:', dbErr);
      }
    }

    // 2. Delete from local dataStore
    const deleted = dataStore.deleteRequest(id);

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

