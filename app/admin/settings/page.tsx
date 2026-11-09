'use client';

import React, { useState, useEffect } from 'react';
import PWAInstallButton from '@/components/pwa/PWAInstallButton';
import {
  isPushNotificationSupported,
  getNotificationPermissionStatus,
  enableAdminPushNotifications,
} from '@/lib/notifications/fcmClient';
import { VIKASA_CONFIG } from '@/lib/constants';
import {
  Settings,
  Bell,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Radio,
  ExternalLink,
  Volume2,
  RefreshCw,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [adminEmail, setAdminEmail] = useState('admin@vikasa.com');
  const [pushStatus, setPushStatus] = useState<string>('default');
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);
  const [registeredTokensCount, setRegisteredTokensCount] = useState(0);

  useEffect(() => {
    // Read session
    const auth = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}')
      : null;
    if (auth?.email) setAdminEmail(auth.email);

    // Push permission
    if (isPushNotificationSupported()) {
      setPushStatus(getNotificationPermissionStatus());
    } else {
      setPushStatus('unsupported');
    }

    // Fetch tokens
    fetch('/api/admin/device-tokens', {
      headers: {
        'x-admin-portal': 'true',
        ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success) setRegisteredTokensCount(json.count || 0);
      })
      .catch(() => {});
  }, []);

  const handleEnablePush = async () => {
    setIsPushLoading(true);
    setPushFeedback(null);
    try {
      const res = await enableAdminPushNotifications(adminEmail);
      if (res.success) {
        setPushStatus('granted');
        setPushFeedback('Android Push Notifications enabled successfully on this device!');
        setRegisteredTokensCount((c) => c + 1);
      } else {
        setPushStatus(res.status);
        setPushFeedback(res.error || 'Failed to enable push notifications.');
      }
    } catch {
      setPushFeedback('Error requesting notification permission.');
    } finally {
      setIsPushLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-100 p-3 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-1 border border-emerald-200">
          <Settings className="w-3.5 h-3.5 text-emerald-700" />
          <span>System &amp; PWA Preferences</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Admin Portal Settings &amp; Device Notifications
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your Android PWA installation, Firebase Web Push device alerts, and business system parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Android PWA Installation */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Install Vikasa on Android</h3>
                <span className="text-[11px] text-slate-500">Standalone Progressive Web Application</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Install Vikasa directly to your Android Home Screen via Google Chrome. Enjoy a native app experience, fast offline caching, full-screen display, and real-time push alerts.
            </p>

            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>No app store downloads or APK installations needed</li>
              <li>Runs smoothly in standalone full-screen window</li>
              <li>Encrypted private session management</li>
            </ul>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Installation Status</span>
            <PWAInstallButton />
          </div>
        </div>

        {/* 2. Web Push Notifications (FCM) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Real-Time Push Alerts</h3>
                <span className="text-[11px] text-slate-500">Firebase Cloud Messaging (FCM)</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Receive sound and vibration alerts on your Android device whenever a customer books a service or a new technician registers in Tamil Nadu.
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Browser Permission:</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                    pushStatus === 'granted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : pushStatus === 'denied'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {pushStatus.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Registered Admin Devices:</span>
                <span className="font-mono font-bold text-slate-900">{registeredTokensCount}</span>
              </div>
            </div>

            {pushFeedback && (
              <p className="text-[11px] font-bold text-emerald-700">{pushFeedback}</p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Push Notification Toggle</span>
            <button
              onClick={handleEnablePush}
              disabled={isPushLoading || pushStatus === 'granted'}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[38px] ${
                pushStatus === 'granted'
                  ? 'bg-emerald-100 text-emerald-800 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95'
              }`}
            >
              {pushStatus === 'granted' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Push Active</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isPushLoading ? 'Connecting...' : 'Enable Push Alerts'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. Business Profile & Security */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Security &amp; Authorization</h3>
              <span className="text-[11px] text-slate-500">Row Level Security &amp; Signed Sessions</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            All administrative actions are authenticated with cryptographically signed tokens. Customer phone numbers and internal technician records are shielded from unauthenticated public scrapers.
          </p>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Admin Email:</span>
              <span className="font-mono font-bold text-slate-900">{adminEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Security Role:</span>
              <span className="font-mono font-bold text-emerald-700">Administrator</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Session Mode:</span>
              <span className="font-mono font-bold text-slate-900">Encrypted JWT Cookie</span>
            </div>
          </div>
        </div>

        {/* 4. Database & Backend Connectivity */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Backend &amp; Supabase Status</h3>
              <span className="text-[11px] text-slate-500">PostgreSQL Cloud Architecture</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            The platform synchronizes with your remote Supabase instance while maintaining local zero-latency offline fallbacks so the administrative desk can operate during network drops.
          </p>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Primary Database:</span>
              <span className="font-bold text-slate-900">Supabase PostgreSQL 15+</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Headquarters Hub:</span>
              <span className="font-bold text-slate-900">Erode, Tamil Nadu</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Helpline:</span>
              <span className="font-mono font-bold text-emerald-700">{VIKASA_CONFIG.phoneDisplay}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

