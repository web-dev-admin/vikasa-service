import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';

// GET: Notifications disabled - returns empty list immediately with zero DB overhead
export async function GET(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator session required');
    }

    return NextResponse.json(
      {
        success: true,
        data: [],
        unreadCount: 0,
        message: 'Notification system is disabled',
      },
      {
        headers: {
          'Cache-Control': 'no-store, private',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST: Actions on notifications (no-op since notifications are disabled)
export async function POST(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator session required');
    }

    return NextResponse.json({
      success: true,
      message: 'Notification operations disabled',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to process notification action' },
      { status: 500 }
    );
  }
}
