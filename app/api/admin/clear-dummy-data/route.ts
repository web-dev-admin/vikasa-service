import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';
import { dataStore } from '@/lib/data/store';

export async function POST(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required to clear dummy data');
    }

    dataStore.clearAllOperationalData();

    return NextResponse.json({
      success: true,
      message: 'All dummy requests, customers, and technicians have been cleared.',
      remaining_requests: dataStore.getRequests().length,
      remaining_workers: dataStore.getWorkers().length,
      remaining_customers: dataStore.getCustomers().length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to clear dummy data' },
      { status: 500 }
    );
  }
}
