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
    const worker = dataStore.getWorkerById(id);

    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'Technician not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: worker });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve technician' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required');
    }

    const { id } = await params;
    const body = await request.json();

    const updated = dataStore.updateWorker(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Technician not found' },
        { status: 404 }
      );
    }

    // Sync to Supabase if available
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        await supabase.from('workers').update(body).eq('id', id);
      } catch (dbErr) {
        console.warn('Supabase worker update warning:', dbErr);
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update technician' },
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
      return unauthorizedResponse('Administrator authorization required to delete technicians');
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Valid technician ID is required' },
        { status: 400 }
      );
    }

    const worker = dataStore.getWorkerById(id);

    // 1. Delete from Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        // A. Safely unassign worker from any active service_requests to satisfy foreign key constraints
        await supabase
          .from('service_requests')
          .update({
            assigned_worker_id: null,
            assigned_worker_name: null,
            assigned_worker_phone: null,
            status: 'CUSTOMER_CONFIRMED',
          })
          .eq('assigned_worker_id', id);

        // B. Delete related worker services
        await supabase.from('worker_services').delete().eq('worker_id', id);

        // C. Delete related contact attempts
        await supabase.from('worker_contact_attempts').delete().eq('worker_id', id);

        // D. Delete any related worker assignments
        await supabase.from('assignments').delete().eq('worker_id', id);
        await supabase.from('assignments').delete().eq('technician_id', id);

        // E. Delete from workers table by primary id
        await supabase.from('workers').delete().eq('id', id);

        // F. If worker has application_token or phone, delete by those too
        if (worker?.application_token) {
          await supabase.from('workers').delete().eq('application_token', worker.application_token);
        }
        if (worker?.phone) {
          await supabase.from('workers').delete().eq('phone', worker.phone);
          const cleanPhone = worker.phone.replace(/\D/g, '').slice(-10);
          if (cleanPhone) {
            await supabase.from('workers').delete().ilike('phone', `%${cleanPhone}%`);
          }
        }
      } catch (dbErr) {
        console.warn('Could not delete technician from Supabase:', dbErr);
      }
    }

    // 2. Delete from local dataStore and add to permanent deletedWorkerIds
    dataStore.deleteWorker(id);

    return NextResponse.json({
      success: true,
      message: 'Technician record permanently deleted from database',
      deletedId: id,
    });
  } catch (error) {
    console.error('Delete technician error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete technician from database' },
      { status: 500 }
    );
  }
}
