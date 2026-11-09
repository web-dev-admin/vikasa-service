import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';
import { supabase, isLocalMockMode } from '@/lib/supabase/client';

// GET: Retrieve registered administrator device tokens
export async function GET(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator session required');
    }

    const tokens = dataStore.getDeviceTokens();
    return NextResponse.json({
      success: true,
      count: tokens.length,
      data: tokens,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve device tokens' },
      { status: 500 }
    );
  }
}

// POST: Register or update an administrator device token
export async function POST(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator session required');
    }

    const body = await request.json();
    const { fcm_token, device_name, platform = 'android' } = body;

    if (!fcm_token || typeof fcm_token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid FCM token is required' },
        { status: 400 }
      );
    }

    // 1. Register in dataStore
    const token = dataStore.registerDeviceToken({
      admin_email: session.email,
      fcm_token: fcm_token.trim(),
      device_name: device_name || 'Admin Device',
      platform: platform === 'ios' ? 'ios' : platform === 'web' ? 'web' : 'android',
      is_active: true,
    });

    // 2. Persist to Supabase if connected
    if (!isLocalMockMode && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        await supabase.from('admin_device_tokens').upsert(
          {
            admin_email: session.email,
            fcm_token: fcm_token.trim(),
            device_name: device_name || 'Admin Device',
            platform: platform === 'ios' ? 'ios' : platform === 'web' ? 'web' : 'android',
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'fcm_token' }
        );
      } catch (dbErr) {
        console.warn('Supabase device token upsert warning:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'FCM device token registered for Web Push notifications',
      data: token,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to register device token' },
      { status: 500 }
    );
  }
}

// DELETE: Remove or deactivate a device token
export async function DELETE(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator session required');
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token parameter is required' },
        { status: 400 }
      );
    }

    dataStore.removeDeviceToken(token);

    if (!isLocalMockMode && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        await supabase.from('admin_device_tokens').delete().eq('fcm_token', token);
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Device token removed successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to remove device token' },
      { status: 500 }
    );
  }
}

