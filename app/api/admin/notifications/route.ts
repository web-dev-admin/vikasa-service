import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';
import { supabase, supabaseAdmin, isLocalMockMode } from '@/lib/supabase/client';

interface DualTableResult {
  primaryUpdated: boolean;
  fallbackUpdated: boolean;
  errors: string[];
}

/**
 * Executes a dual-table mutation across 'notifications' and 'admin_notifications',
 * strictly inspecting results, logging sanitized errors, and determining whether
 * the database update actually succeeded.
 */
async function executeDualTableMutation(
  operationName: string,
  mutateFn: (tableName: 'notifications' | 'admin_notifications') => PromiseLike<{ error: { code?: string; message: string } | null }>
): Promise<DualTableResult> {
  if (isLocalMockMode || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { primaryUpdated: true, fallbackUpdated: true, errors: [] };
  }

  const results = await Promise.allSettled([
    Promise.resolve(mutateFn('notifications')),
    Promise.resolve(mutateFn('admin_notifications')),
  ]);

  let primaryUpdated = false;
  let fallbackUpdated = false;
  const errors: string[] = [];

  // 1. Evaluate primary table ('notifications')
  if (results[0].status === 'fulfilled') {
    const { error } = results[0].value;
    if (error) {
      // 42P01: relation does not exist (acceptable if legacy table is missing)
      if (error.code !== '42P01') {
        errors.push(`notifications: ${error.message}`);
      }
    } else {
      primaryUpdated = true;
    }
  } else {
    errors.push(`notifications rejected: ${String(results[0].reason)}`);
  }

  // 2. Evaluate fallback table ('admin_notifications')
  if (results[1].status === 'fulfilled') {
    const { error } = results[1].value;
    if (error) {
      if (error.code !== '42P01') {
        errors.push(`admin_notifications: ${error.message}`);
      }
    } else {
      fallbackUpdated = true;
    }
  } else {
    errors.push(`admin_notifications rejected: ${String(results[1].reason)}`);
  }

  if (errors.length > 0) {
    console.warn(`[AdminNotifications:${operationName}] DB mutation warnings:`, errors.join('; '));
  }

  return { primaryUpdated, fallbackUpdated, errors };
}

// GET: Privileged retrieval of notification center items
export async function GET(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator session required');
    }

    if (!supabaseAdmin && !isLocalMockMode) {
      console.warn('[AdminNotifications:GET] SUPABASE_SERVICE_ROLE_KEY missing; querying via anon client.');
    }
    const client = supabaseAdmin || supabase;

    // Sync from Supabase if connected
    if (!isLocalMockMode && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        let { data, error } = await client
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error || !Array.isArray(data) || data.length === 0) {
          const fallback = await client
            .from('admin_notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          if (!fallback.error && Array.isArray(fallback.data) && fallback.data.length > 0) {
            data = fallback.data;
            error = null;
          }
        }

        if (!error && Array.isArray(data) && data.length > 0) {
          dataStore.mergeNotifications(data);
        }
      } catch (e) {
        console.warn('[AdminNotifications:GET] Supabase sync warning:', e instanceof Error ? e.message : 'Unknown sync error');
      }
    }

    const notifications = dataStore.getNotifications();
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return NextResponse.json(
      {
        success: true,
        data: notifications,
        unreadCount,
      },
      {
        headers: {
          'Cache-Control': 'no-store, private',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST: Actions on notifications (mark_read, mark_all_read, delete)
export async function POST(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator session required');
    }

    if (!supabaseAdmin && !isLocalMockMode) {
      console.warn('[AdminNotifications:POST] SUPABASE_SERVICE_ROLE_KEY missing; mutating via anon client.');
    }
    const client = supabaseAdmin || supabase;
    const body = await request.json();
    const action = body.action;

    if (action === 'mark_read') {
      const id = body.id;
      if (!id || typeof id !== 'string') {
        return NextResponse.json({ success: false, error: 'Valid notification ID required' }, { status: 400 });
      }

      // Execute dual-table database mutation and inspect results
      const { primaryUpdated, fallbackUpdated, errors } = await executeDualTableMutation(
        'mark_read',
        (table) => client.from(table).update({ is_read: true }).eq('id', id)
      );

      // If both tables were targeted but failed with real DB errors, report error to client
      if (!primaryUpdated && !fallbackUpdated && errors.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Database update failed on all notification tables' },
          { status: 502 }
        );
      }

      // Update in-memory dataStore once verified
      dataStore.markNotificationAsRead(id);

      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
        persisted: { primary: primaryUpdated, fallback: fallbackUpdated },
      });
    }

    if (action === 'mark_all_read') {
      const { primaryUpdated, fallbackUpdated, errors } = await executeDualTableMutation(
        'mark_all_read',
        (table) => client.from(table).update({ is_read: true }).eq('is_read', false)
      );

      if (!primaryUpdated && !fallbackUpdated && errors.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Database update failed on all notification tables' },
          { status: 502 }
        );
      }

      dataStore.markAllNotificationsAsRead();

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
        persisted: { primary: primaryUpdated, fallback: fallbackUpdated },
      });
    }

    if (action === 'delete') {
      const id = body.id;
      if (!id || typeof id !== 'string') {
        return NextResponse.json({ success: false, error: 'Valid notification ID required' }, { status: 400 });
      }

      const { primaryUpdated, fallbackUpdated, errors } = await executeDualTableMutation(
        'delete',
        (table) => client.from(table).delete().eq('id', id)
      );

      if (!primaryUpdated && !fallbackUpdated && errors.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Database deletion failed on all notification tables' },
          { status: 502 }
        );
      }

      dataStore.deleteNotification(id);

      return NextResponse.json({
        success: true,
        message: 'Notification removed',
        persisted: { primary: primaryUpdated, fallback: fallbackUpdated },
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process notification action' },
      { status: 500 }
    );
  }
}
