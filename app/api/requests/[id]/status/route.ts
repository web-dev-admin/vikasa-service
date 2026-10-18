import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { RequestStatus } from '@/types';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';

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
