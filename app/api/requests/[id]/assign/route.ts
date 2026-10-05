import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { technician_id, notes } = body;

    if (!technician_id) {
      return NextResponse.json(
        { success: false, error: 'Technician ID is required' },
        { status: 400 }
      );
    }

    const assignment = dataStore.assignWorker(id, technician_id, notes);
    const updatedRequest = dataStore.getRequestById(id);

    return NextResponse.json({
      success: true,
      message: 'Technician assigned successfully',
      data: {
        assignment,
        request: updatedRequest,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to assign technician' },
      { status: 500 }
    );
  }
}
