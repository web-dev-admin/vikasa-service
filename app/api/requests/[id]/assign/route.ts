import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';
import { supabase } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required to assign technician');
    }

    const { id } = await params;
    const body = await request.json();
    const { technician_id, notes, bypass_acceptance_check } = body;

    if (!technician_id) {
      return NextResponse.json(
        { success: false, error: 'Technician ID is required' },
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

    // 1. Prevent double assignment if already assigned
    if (req.status === 'ASSIGNED' || req.status === 'IN_PROGRESS' || req.assigned_worker_id) {
      return NextResponse.json(
        {
          success: false,
          error: `Request #${req.request_number} already has an active assignment (${req.assigned_worker_name || req.assigned_worker_id}). Double assignments are strictly prohibited.`,
          code: 'ALREADY_ASSIGNED',
        },
        { status: 409 }
      );
    }

    const worker = dataStore.getWorkerById(technician_id);
    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'Technician not found' },
        { status: 404 }
      );
    }

    // 2. Technician verification (auto-verified if pending when assigned by admin)
    if (worker.verification_status !== 'verified') {
      dataStore.verifyWorker(technician_id, session.email, 'Auto-verified by administrator on assignment');
    }

    // 3. Technician must be available
    if (worker.availability === 'busy') {
      return NextResponse.json(
        {
          success: false,
          error: `Technician ${worker.full_name} is currently busy with another active assignment.`,
          code: 'WORKER_BUSY',
        },
        { status: 409 }
      );
    }

    // 4. Strict check for explicit technician acceptance
    // Check contact attempts for this request
    const contactAttempts = dataStore.getContactAttemptsForRequest(id);
    const hasAcceptedAttempt = contactAttempts.some(
      (a) => a.worker_id === technician_id && a.result === 'accepted'
    );

    if (!hasAcceptedAttempt && !bypass_acceptance_check) {
      return NextResponse.json(
        {
          success: false,
          error: `Assignment blocked: Technician ${worker.full_name} has not explicitly accepted this job on call. Record an 'accepted' call outcome first before assigning.`,
          code: 'ACCEPTANCE_REQUIRED',
        },
        { status: 422 }
      );
    }

    const assignment = dataStore.assignWorker(id, technician_id, notes);
    const updatedRequest = dataStore.getRequestById(id);

    // Sync assignment to Supabase service_requests
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const updatePayload: Record<string, any> = {
          assigned_worker_id: technician_id,
          assigned_worker_name: worker.full_name,
          assigned_worker_phone: worker.phone,
          status: 'ASSIGNED',
          updated_at: new Date().toISOString(),
        };

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
          console.error('[Requests:assign:POST] Supabase update error:', sbErr.message);
        }
      } catch (err) {
        console.warn('Supabase assignment sync error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Technician assigned successfully',
      data: {
        assignment,
        request: updatedRequest,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to assign technician' },
      { status: 500 }
    );
  }
}
