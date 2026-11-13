import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required to view technician details');
    }

    const { id } = await params;
    const worker = dataStore.getWorkerById(id);

    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'Technician not found' },
        { status: 404 }
      );
    }

    const assignedJobs = dataStore.getRequestsForWorker(id);

    return NextResponse.json({
      success: true,
      data: {
        technician: worker,
        assignedJobs,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch technician profile' },
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
      return unauthorizedResponse('Administrator authorization required to modify technician');
    }

    const { id } = await params;
    const body = await request.json();

    // Prevent arbitrary ID override
    delete body.id;
    delete body.created_at;

    const updated = dataStore.updateWorker(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Technician not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
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
      return unauthorizedResponse('Administrator authorization required to delete technician records');
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Valid technician ID is required' },
        { status: 400 }
      );
    }

    // 1. Delete from Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const { supabase } = await import('@/lib/supabase/client');

        // Check if technician had an ID document stored
        const { data: dbWorker } = await supabase.from('workers').select('id_document_url, avatar_url').eq('id', id).maybeSingle();
        if (dbWorker?.id_document_url && dbWorker.id_document_url.includes('/storage/v1/object/public/technician-documents/')) {
          const filePath = dbWorker.id_document_url.split('/technician-documents/')[1];
          if (filePath) {
            await supabase.storage.from('technician-documents').remove([filePath]);
          }
        }

        // Clean up foreign key references
        await supabase.from('assignments').delete().eq('worker_id', id);
        await supabase.from('worker_contact_attempts').delete().eq('worker_id', id);
        await supabase.from('worker_services').delete().eq('worker_id', id);
        await supabase.from('service_requests').update({
          assigned_worker_id: null,
          assigned_worker_name: null,
          assigned_worker_phone: null,
        }).eq('assigned_worker_id', id);

        const cleanPhone = id.replace(/\D/g, '').slice(-10);

        // Delete main worker record
        await supabase.from('workers').delete().eq('id', id);
        if (cleanPhone) {
          await supabase.from('workers').delete().ilike('phone', `%${cleanPhone}%`);
        }
      } catch (dbErr) {
        console.warn('Could not delete worker from Supabase:', dbErr);
      }
    }

    // 2. Delete from local dataStore
    dataStore.deleteWorker(id);

    return NextResponse.json({
      success: true,
      message: 'Technician record and application permanently deleted',
      deletedId: id,
    });
  } catch (error) {
    console.error('Delete technician error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete technician' },
      { status: 500 }
    );
  }
}
