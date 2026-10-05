import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, note } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    if (status === 'COMPLETED') {
      dataStore.completeJob(id);
    } else if (status === 'CANCELLED') {
      dataStore.cancelRequest(id, note);
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
