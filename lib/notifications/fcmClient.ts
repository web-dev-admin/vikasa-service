'use client';

export interface PushSubscriptionResult {
  success: boolean;
  token?: string;
  error?: string;
  status: 'granted' | 'denied' | 'default' | 'unsupported';
}

/**
 * Checks whether Web Push Notifications are supported on this browser/device.
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Gets the current Notification permission status.
 */
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isPushNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests Notification permission and registers the device token with the server.
 * This is ONLY called when the authenticated administrator clicks "Enable Notifications".
 */
export async function enableAdminPushNotifications(adminEmail: string): Promise<PushSubscriptionResult> {
  if (!isPushNotificationSupported()) {
    return {
      success: false,
      status: 'unsupported',
      error: 'Push notifications are not supported on this browser. Try Android Chrome.',
    };
  }

  try {
    // 1. Request user permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        status: permission,
        error: 'Notification permission was not granted by user.',
      };
    }

    // 2. Ensure Service Worker is ready
    const registration = await navigator.serviceWorker.ready;

    // 3. Subscribe to Web Push
    // Use VAPID key if provided, or default application server key
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXY5CEv1_VM';

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
        });
      } catch (subErr) {
        // Fallback for browsers that require standard subscribe without key
        console.warn('VAPID subscription failed, attempting basic subscribe:', subErr);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
        });
      }
    }

    const token = JSON.stringify(subscription);

    // 4. Save device token on backend
    const authToken = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    const deviceName = `${getDevicePlatform()} Browser`;

    const res = await fetch('/api/admin/device-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-portal': 'true',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({
        fcm_token: token,
        device_name: deviceName,
        platform: getDevicePlatform().toLowerCase(),
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to save device token on server');
    }

    return {
      success: true,
      token,
      status: 'granted',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error enabling push notifications';
    return {
      success: false,
      status: 'denied',
      error: errorMsg,
    };
  }
}

function getDevicePlatform(): string {
  if (typeof navigator === 'undefined') return 'Web';
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'Android';
  if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac/.test(ua)) return 'macOS';
  return 'Web';
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
