import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';
import { supabase, isLocalMockMode } from '@/lib/supabase/client';

// GET: Privileged retrieval of notification center items
export async function GET(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator session required');
    }

    // Sync from Supabase if connected
    if (!isLocalMockMode && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && Array.isArray(data) && data.length > 0) {
          for (const item of data) {
            dataStore.addNotification({
              type: item.type,
              title: item.title,
              message: item.message,
              related_id: item.related_id,
              related_type: item.related_type,
            });
          }
        }
      } catch (e) {
        console.warn('Supabase notifications sync warning:', e);
      }
    }

    const notifications = dataStore.getNotifications();
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
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

    const body = await request.json();
    const action = body.action;

    if (action === 'mark_read') {
      const id = body.id;
      if (!id) {
        return NextResponse.json({ success: false, error: 'Notification ID required' }, { status: 400 });
      }
      dataStore.markNotificationAsRead(id);

      if (!isLocalMockMode && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        try {
          await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        } catch {
          // ignore
        }
      }

      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    if (action === 'mark_all_read') {
      dataStore.markAllNotificationsAsRead();

      if (!isLocalMockMode && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        try {
          await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
        } catch {
          // ignore
        }
      }

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (action === 'delete') {
      const id = body.id;
      if (!id) {
        return NextResponse.json({ success: false, error: 'Notification ID required' }, { status: 400 });
      }
      dataStore.deleteNotification(id);

      if (!isLocalMockMode && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        try {
          await supabase.from('notifications').delete().eq('id', id);
        } catch {
          // ignore
        }
      }

      return NextResponse.json({ success: true, message: 'Notification removed' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process notification action' },
      { status: 500 }
    );
  }
}

