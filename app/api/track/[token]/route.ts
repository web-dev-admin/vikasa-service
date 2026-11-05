import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const cleanToken = token ? token.trim() : '';

    if (!cleanToken || cleanToken.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Valid tracking token or request reference number is required' },
        { status: 400 }
      );
    }

    const publicStatus = dataStore.getPublicTrackingStatus(cleanToken);

    if (!publicStatus) {
      return NextResponse.json(
        { success: false, error: 'Tracking record not found or token has expired' },
        { status: 404 }
      );
    }

    // Explicit projection whitelist — ensures ZERO PII leaks
    const safeProjection = {
      request_number: publicStatus.request_number,
      service_name: publicStatus.service_name,
      category_name: publicStatus.category_name,
      status: publicStatus.status,
      preferred_date: publicStatus.preferred_date,
      preferred_time_slot: publicStatus.preferred_time_slot,
      general_area: publicStatus.general_area,
      created_at: publicStatus.created_at,
      assigned_worker_first_name: publicStatus.assigned_worker_first_name,
    };

    return NextResponse.json({
      success: true,
      data: safeProjection,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve tracking status' },
      { status: 500 }
    );
  }
}
