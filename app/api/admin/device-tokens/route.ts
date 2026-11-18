import { NextResponse } from 'next/server';

/**
 * DEPRECATED: Device tokens API previously used for Firebase Cloud Messaging (FCM).
 * Firebase has been completely removed in favor of Supabase PostgreSQL notifications & in-app alerts.
 * Returns safe no-op responses with zero database load.
 */

export async function GET() {
  return NextResponse.json({
    success: true,
    deprecated: true,
    count: 0,
    data: [],
    message: 'Push notifications deprecated; in-app notification center active',
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    deprecated: true,
    message: 'FCM push registration deprecated',
  });
}

export async function DELETE() {
  return NextResponse.json({
    success: true,
    deprecated: true,
    message: 'FCM push token deletion deprecated',
  });
}
