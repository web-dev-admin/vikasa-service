'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminNotification } from '@/types';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  Wrench,
  UserCheck,
  PhoneCall,
  Clock,
  Radio,
  AlertCircle,
  X,
  Volume2,
} from 'lucide-react';
import {
  isPushNotificationSupported,
  getNotificationPermissionStatus,
  enableAdminPushNotifications,
} from '@/lib/notifications/fcmClient';

export default function NotificationCenter({ adminEmail }: { adminEmail: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushStatus, setPushStatus] = useState<string>('default');
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const token = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
        : null;

      const res = await fetch('/api/admin/notifications', {
        headers: {
          'x-admin-portal': 'true',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNotifications(json.data);
          setUnreadCount(json.unreadCount ?? json.data.filter((n: AdminNotification) => !n.is_read).length);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 6000);

    // Push permission check
    if (isPushNotificationSupported()) {
      setPushStatus(getNotificationPermissionStatus());
    } else {
      setPushStatus('unsupported');
    }

    // Listen for live client-side broadcast
    const handleLiveNotification = (e: Event) => {
      const customEvent = e as CustomEvent<AdminNotification>;
      if (customEvent.detail) {
        setNotifications((prev) => [customEvent.detail, ...prev]);
        setUnreadCount((c) => c + 1);
      }
    };

    window.addEventListener('vikasa_notification_received', handleLiveNotification);
    window.addEventListener('vikasa_data_updated', fetchNotifications);

    // Close on outside click
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      clearInterval(interval);
      window.removeEventListener('vikasa_notification_received', handleLiveNotification);
      window.removeEventListener('vikasa_data_updated', fetchNotifications);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      const token = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
        : null;

      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-portal': 'true',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'mark_read', id }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
        : null;

      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-portal': 'true',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const token = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
        : null;

      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-portal': 'true',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'delete', id }),
      });

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleEnablePush = async () => {
    setIsPushLoading(true);
    setPushMessage(null);
    try {
      const res = await enableAdminPushNotifications(adminEmail);
      if (res.success) {
        setPushStatus('granted');
        setPushMessage('Android Push Notifications enabled successfully!');
      } else {
        setPushStatus(res.status);
        setPushMessage(res.error || 'Could not enable notifications.');
      }
    } catch {
      setPushMessage('Error requesting permission.');
    } finally {
      setIsPushLoading(false);
    }
  };

  const getItemTargetUrl = (notif: AdminNotification) => {
    if (notif.type === 'service_request') {
      return notif.related_id ? `/admin/requests?id=${notif.related_id}` : '/admin/requests';
    }
    if (notif.type === 'technician_application') {
      return notif.related_id ? `/admin/workers?id=${notif.related_id}` : '/admin/workers';
    }
    if (notif.type === 'contact_inquiry') {
      return '/admin/contacts';
    }
    return '/admin/dashboard';
  };

  const formatTimeAgo = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[38px] min-w-[38px] flex items-center justify-center"
        aria-label={`Notifications Center (${unreadCount} unread)`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-slate-950 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-slate-900 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              <span className="font-extrabold text-xs tracking-tight">Notification Center</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-semibold transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Android Web Push Enable Banner */}
          {pushStatus !== 'granted' && pushStatus !== 'unsupported' && (
            <div className="p-3 bg-emerald-50 border-b border-emerald-200 flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Receive Android Push Alerts</span>
                </div>
                <button
                  onClick={handleEnablePush}
                  disabled={isPushLoading}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs active:scale-95 disabled:opacity-50 shrink-0 min-h-[30px]"
                >
                  {isPushLoading ? 'Enabling...' : 'Enable Push'}
                </button>
              </div>
              <p className="text-[11px] text-emerald-800 leading-tight">
                Get instant notifications on your phone when new customer requests or technician registrations arrive.
              </p>
              {pushMessage && (
                <span className="text-[10px] text-emerald-700 font-semibold">{pushMessage}</span>
              )}
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1">
                <Bell className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                <p className="text-xs font-bold text-slate-600">No notifications yet</p>
                <p className="text-[11px] text-slate-400">
                  New customer bookings and technician registrations will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const targetUrl = getItemTargetUrl(n);

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) handleMarkRead(n.id);
                      setIsOpen(false);
                      router.push(targetUrl);
                    }}
                    className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                      !n.is_read ? 'bg-emerald-50/50' : 'bg-white'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        n.type === 'service_request'
                          ? 'bg-amber-100 text-amber-700'
                          : n.type === 'technician_application'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {n.type === 'service_request' ? (
                        <Wrench className="w-4 h-4" />
                      ) : n.type === 'technician_application' ? (
                        <UserCheck className="w-4 h-4" />
                      ) : (
                        <PhoneCall className="w-4 h-4" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs truncate ${!n.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {formatTimeAgo(n.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                        {n.message}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <button
                      onClick={(e) => handleDelete(e, n.id)}
                      className="p-1 text-slate-300 hover:text-rose-500 rounded-md transition-colors shrink-0"
                      title="Delete notification"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Real-time connected</span>
            </span>
            <Link
              href="/admin/requests"
              onClick={() => setIsOpen(false)}
              className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View all bookings</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

