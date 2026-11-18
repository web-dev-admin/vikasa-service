# VIKASA SERVICES & INTERIORS
## Complete Firebase Removal Technical Report

**Project:** Vikasa Services & Interiors  
**Production Domain:** [vikasaservices.in](https://www.vikasaservices.in)  
**Date:** November 18, 2026  
**Auditor:** Principal Software Architect & Backend Engineer  
**Git Branch:** `fix/vercel-usage-and-remove-firebase`  
**Status:** 100% Removed & Verified  

---

### Executive Summary

Firebase was evaluated and previously utilized for experimental Android Web Push notifications via Firebase Cloud Messaging (FCM HTTP v1) and Google OAuth2 service account tokens. 

In accordance with architectural requirements:
- **Firebase is completely non-essential** to platform business operations.
- **Supabase PostgreSQL** remains the sole, unified production database and authentication engine.
- Push notification mechanisms have been **100% removed** from the repository, completely eliminating external Google service account dependencies, RS256 token exchanges, and Web Push service worker hooks.
- Administrative alerting is now powered exclusively by the **In-App Notification Center** and high-priority Web Audio API sound synthesis (including the 10-minute continuous heavy siren for customer leads).

---

### 1. Deleted Files

The following files were identified as Firebase-specific and were permanently deleted:

1. `public/firebase-messaging-sw.js`
   - *Previous Purpose:* Background service worker script intended to capture FCM push payloads.
   - *Status:* Permanently removed.
2. `lib/notifications/fcmClient.ts`
   - *Previous Purpose:* Client-side browser push permission requester and FCM token generator using VAPID keys.
   - *Status:* Permanently removed.

---

### 2. Refactored Core Components & Handlers

#### 2.1 Notification Dispatcher (`lib/notifications/dispatcher.ts`)
- **Removed:**
  - Google RFC 7523 JWT Bearer Profile RS256 token exchange (`https://oauth2.googleapis.com/token`).
  - Native Node.js `crypto.createSign('RSA-SHA256')` signing logic.
  - FCM HTTP v1 dispatch endpoint (`https://fcm.googleapis.com/v1/projects/.../messages:send`).
  - Checks for `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, and `FIREBASE_SERVICE_ACCOUNT`.
  - Database queries to `admin_device_tokens`.
- **Preserved & Hardened:**
  - Standardized `dispatchAdminNotification(params)` interface.
  - Direct, non-blocking inserts into Supabase PostgreSQL `notifications` table.
  - In-memory `dataStore.addNotification()` persistence fallback.
  - Guarantees zero failures for customer bookings and worker registrations.

#### 2.2 Notification Center UI (`components/admin/NotificationCenter.tsx`)
- **Removed:**
  - Imports from `fcmClient`.
  - `pushStatus`, `isPushLoading`, and `pushMessage` state variables.
  - `handleEnablePush()` handler.
  - "Receive Android Push Alerts" banner in the dropdown UI.
- **Preserved & Enhanced:**
  - Real-time in-app notification dropdown with unread counter badge.
  - Single alert audio chime for worker/system events.
  - **10-Minute Looping Heavy Client Siren** for customer bookings until acknowledged.
  - Direct navigation to relevant bookings or technician profiles.
  - Mark-as-read and permanent deletion capabilities.
  - Visibility-aware polling via `useSmartPolling(fetchNotifications, { intervalMs: 25000 })`.

#### 2.3 Admin Settings Page (`app/admin/settings/page.tsx`)
- **Removed:**
  - Web Push permission status badges (`GRANTED`, `DENIED`, `DEFAULT`).
  - Registered device count counter and `/api/admin/device-tokens` fetch.
  - Push notification test and toggle buttons.
- **Replaced With:**
  - "In-App Audio Alerts & 10-Minute Siren Controls" card.
  - "Single Chime" test button.
  - "Test Heavy Siren (10-Min Loop)" button.
  - "Silence / Acknowledge" button.

#### 2.4 Device Tokens API Route (`app/api/admin/device-tokens/route.ts`)
- **Hardened for Graceful Deprecation:**
  - Stripped all Supabase database queries against `admin_device_tokens`.
  - Configured GET, POST, and DELETE handlers to return safe, static no-op JSON responses (`{ success: true, deprecated: true }`) with zero database load.

#### 2.5 Service Worker (`public/sw.js`)
- **Removed:**
  - `self.addEventListener('push', ...)` event listener.
  - `self.addEventListener('notificationclick', ...)` event listener.
  - Upgraded to `vikasa-cache-v4` focusing purely on offline fallback and Cache-First static asset delivery.

#### 2.6 Local Storage & Store Engine (`lib/data/store.ts`)
- **Removed:**
  - `deviceTokens` private state.
  - `localStorage.getItem('vikasa_device_tokens')` and `localStorage.setItem('vikasa_device_tokens')`.
  - Legacy token management methods replaced with no-ops to ensure 100% backward compatibility for callers.

---

### 3. Verification & Grep Audit

A comprehensive case-insensitive codebase search confirmed zero active Firebase/FCM runtime dependencies:

```bash
git grep -in "firebase\|fcm"
```
**Results:**
- Zero npm dependencies in `package.json`.
- Zero imports in frontend components or API route handlers.
- Only historical SQL migrations and audit documentation mention Firebase for archival lineage.

---

### 4. Preservation of Critical Business Workflows

| Feature | Pre-Removal State | Post-Removal State | Status |
| :--- | :--- | :--- | :--- |
| **Customer Booking Journey** | Saves to Supabase `service_requests` | Saves to Supabase `service_requests` | ✅ 100% Preserved |
| **Technician Registration** | Saves to Supabase `workers` | Saves to Supabase `workers` | ✅ 100% Preserved |
| **Customer Lead Heavy Alarm** | Web Audio API Oscillator | Web Audio API Oscillator (10-Min Loop) | ✅ 100% Preserved |
| **In-App Notification Center** | Supabase `notifications` table | Supabase `notifications` table | ✅ 100% Preserved |
| **Public Order Tracking** | Supabase `service_requests` | Supabase `service_requests` | ✅ 100% Preserved |
| **Worker Allocation & Sharing** | WhatsApp Deep Links & GPS | WhatsApp Deep Links & GPS | ✅ 100% Preserved |
