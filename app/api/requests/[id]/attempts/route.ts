import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { ContactResult } from '@/types';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';

const VALID_RESULTS: ContactResult[] = ['accepted', 'rejected', 'no_answer', 'busy', 'call_later'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required to record contact attempt');
    }

    const { id } = await params;
    const body = await request.json();
    const { worker_id, result, notes } = body;

    if (!worker_id) {
      return NextResponse.json(
        { success: false, error: 'Technician worker_id is required' },
        { status: 400 }
      );
    }

    if (!result || !VALID_RESULTS.includes(result)) {
      return NextResponse.json(
        { success: false, error: `Invalid contact result. Valid outcomes: ${VALID_RESULTS.join(', ')}` },
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

    const worker = dataStore.getWorkerById(worker_id);
    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'Technician not found' },
        { status: 404 }
      );
    }

    const attempt = dataStore.recordContactAttempt(id, worker_id, result, notes);

    return NextResponse.json({
      success: true,
      message: `Call attempt recorded: ${result.toUpperCase()}`,
      data: attempt,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to record contact attempt' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required to view contact attempts');
    }

    const { id } = await params;
    const attempts = dataStore.getContactAttemptsForRequest(id);

    return NextResponse.json({
      success: true,
      count: attempts.length,
      data: attempts,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contact attempts' },
      { status: 500 }
    );
  }
}
