# VIKASA SERVICES & INTERIORS
## Pre-Merge Verification & Comprehensive Quality Audit Report

**Project:** Vikasa Services & Interiors  
**Production Domain:** [https://www.vikasaservices.in](https://www.vikasaservices.in)  
**Admin Portal:** [https://www.vikasaservices.in/admin/](https://www.vikasaservices.in/admin/)  
**Git Branch:** `fix/vercel-usage-and-remove-firebase`  
**Base Commit:** `bb903cc`  
**Date of Audit:** November 18, 2026  
**Auditor:** Principal Software Architect, Security Engineer & QA Lead  
**Status:** Verification Complete — Awaiting Final User Approval to Merge & Deploy  

---

### Executive Summary

In response to excessive Vercel resource usage (1.5M function invocations and 5h 02m Fluid Active CPU) and the requirement to completely eliminate Firebase, a comprehensive audit and hardening pass was executed.

All source code fixes, performance optimizations, security hardening, and test suites have been verified on the dedicated branch `fix/vercel-usage-and-remove-firebase`. The `main` production branch has been preserved without changes.

---

### 1. Specific Issues Discovered & Fixed in this Session

#### 1.1 Concurrency Burst Throttle in Smart Polling (`lib/hooks/useSmartPolling.ts`)
- **Issue:** When an administrator switched back to an open browser tab, the browser dispatched both a `visibilitychange` event (tab visible) and a `focus` event (window focused) within 5ms–15ms of each other, firing two duplicate API requests in rapid succession.
- **Fix:** Implemented a timestamp throttle guard (`throttleMs = 2000`) in `useSmartPolling`. Consecutive trigger events within 2 seconds are automatically deduplicated. Manual refreshes pass `force = true` to allow instant on-demand updates.
- **Safety:** Added `isMountedRef` flag and clean event listener removal on unmount.

#### 1.2 Notification Polling Memory Bloat & Deduplication (`lib/data/store.ts` & `/api/admin/notifications`)
- **Issue:** The `/api/admin/notifications` GET route previously called `dataStore.addNotification()` inside a loop for every row retrieved from Supabase. On every polling tick, this generated up to 50 duplicate notification objects with newly generated random IDs, flooding the 100-notification memory buffer and resetting `is_read` status flags.
- **Fix:** Engineered `dataStore.mergeNotifications(incoming: AdminNotification[])` which maps incoming items by unique ID, updates read statuses in place, and prevents duplicate records. Updated `/api/admin/notifications/route.ts` to call `dataStore.mergeNotifications(data)`.

#### 1.3 Dual-Table Supabase Resilience (`notifications` vs `admin_notifications`)
- **Issue:** Supabase migration 007 defined both `notifications` and `admin_notifications` tables for backward compatibility. If one table was queried in an environment where the other was active, errors could occur.
- **Fix:** Added automatic fallback handling in both `lib/notifications/dispatcher.ts` and `app/api/admin/notifications/route.ts`. Insertion, read, update (`mark_read`, `mark_all_read`), and `delete` operations seamlessly fall back to `admin_notifications` if `notifications` encounters a table or permission error.

#### 1.4 Private Admin Security Headers (`Cache-Control: no-store, private`)
- **Issue:** While public catalog endpoints had Edge caching enabled, private admin API routes lacked explicit cache-prevention headers, leaving open the risk that misconfigured corporate proxies or browser caches might retain privileged admin queues.
- **Fix:** Explicitly configured `'Cache-Control': 'no-store, private'` on all privileged routes:
  - `/api/requests`
  - `/api/technicians`
  - `/api/customers`
  - `/api/admin/notifications`
  - `/api/track/[token]`

#### 1.5 Safe Public District Projection (`types/index.ts` & `/api/track/[token]`)
- **Issue:** Public tracking status was missing the standardized `district` field on the public projection whitelist.
- **Fix:** Added `district?: string` to `PublicTrackingData` and `/api/track/[token]`, exposing safe geographical context without leaking customer phone numbers, street addresses, or technician private phone numbers.

#### 1.6 Test Reporting Discrepancy Resolved (`delete_operations_comprehensive_test.ts`)
- **Issue:** The delete operations test suite hardcoded `const total = 25` while asserting 27 test invariants, causing an unusual `(27/25)` output.
- **Fix:** Aligned the count to `const total = 27`, yielding a clean `ALL DELETE OPERATIONS TESTS PASSED (27/27)`.

---

### 2. Complete Test Execution Results

#### 2.1 Static Analysis & Type Checking
```bash
npx tsc --noEmit
```
- **Result:** **0 errors**. 100% type soundness across all components, API routes, types, and test suites.

#### 2.2 Automated Unit & Integration Test Suites

| Suite # | Test File | Domain / Invariants Tested | Assertions | Result |
| :---: | :--- | :--- | :---: | :---: |
| **1** | `overhaul_verification_test.ts` | Phone sanitization, request creation, zero-PII tracking, JWT tokens, notification deduplication, CMS persistence | 23 / 23 | ✅ **PASSED (100%)** |
| **2** | `delete_operations_comprehensive_test.ts` | Service request deletion, customer suggestion ("others request") deletion, worker deletion & FK unlinking, customer profile deletion | 27 / 27 | ✅ **PASSED (100%)** |
| **3** | `heavy_client_alarm_test.ts` | Web Audio API siren, 10-minute auto-silence loop for client leads, admin acknowledgment gate, client vs tech discrimination | 25 / 25 | ✅ **PASSED (100%)** |
| **4** | `call_validation_and_allocation_share_test.ts` | 38 Tamil Nadu district centroids, candidate call validation gate before verification, pinpoint GPS formatting, single-click WhatsApp share | 49 / 49 | ✅ **PASSED (100%)** |
| **5** | `improvements_verification_test.ts` | 56-key Tamil technician localization, contact idempotency, WhatsApp URLs, record suppression | 109 / 109 | ✅ **PASSED (100%)** |
| **6** | `category_catalog_test.ts` | Taxonomy management, dynamic service/category additions, slugging, price estimation | 10 / 10 | ✅ **PASSED (100%)** |
| **7** | `security_audit_test.ts` | IDOR prevention, zero-PII leak check, worker assignment privacy, availability state transitions | 6 / 6 | ✅ **PASSED (100%)** |
| **8** | `phase3_enhancements_test.ts` | Dynamic service tooltip descriptions, record deletion race-condition protection, SQL setup script validation, WhatsApp dispatch URLs | 52 / 52 | ✅ **PASSED (100%)** |
| **9** | `full_e2e_test.ts` | Full lifecycle dispatch: submission -> validation -> matching -> call logging -> assignment -> completion -> CSV injection escaping | 22 / 22 | ✅ **PASSED (100%)** |

**Total Automated Assertions Verified:** **323 / 323 PASSED (100% Success Rate)**.

#### 2.3 Next.js Webpack Production Build
```bash
npm run build
```
- **Result:** **Compiled successfully in 12.2s**.
- **Static Pages Generated:** **40 / 40 routes** (0 build errors, 0 runtime SSR errors).

---

### 3. Local Request & Performance Verification

#### 3.1 Measured Local Polling Frequency
- **Idle / Background Tab:**
  - Before: 55 requests / min (continuous 24/7).
  - After: **0 requests / min** (`document.hidden === true` suspends all timer ticks).
- **Active Foreground Tab:**
  - Before: 55 requests / min (every 4s across multiple components).
  - After: **2–3 requests / min** (synchronized 30s interval with 2000ms focus throttle).
  - *Measured Local Request Reduction:* **~95% in active foreground, 100% in background**.

#### 3.2 Service Worker Caching Verification
- Upgraded to `vikasa-cache-v4` with strict Cache-First strategy for static assets (`/logo/`, `/icons/`, `/favicon.ico`, and pre-cached pages).
- All redundant background network fetches eliminated.
- Sensitive dynamic endpoints (`/api/*`, `/admin/*`, `/track/*`, `/request/*`, `/worker-register/*`) strictly enforce Network-First with offline JSON fallback.

---

### 4. Security & Data Protection Audit

1. **Zero Customer PII Exposure:**
   - Tracking tokens must be valid UUIDs (min 16 characters). Sequential request numbers (`1001`) and IDs (`req-1001`) are rejected with 400 Bad Request (preventing IDOR attacks).
   - Public tracking endpoint returns only whitelisted fields: `request_number`, `service_name`, `category_name`, `status`, `preferred_date`, `preferred_time_slot`, `district`, `general_area`, `created_at`, `assigned_worker_first_name`.
   - Customer phone numbers, street addresses, and technician phone numbers are never returned to unauthenticated tracking endpoints.
2. **Supabase Secrets Protected:**
   - Client bundles strictly contain only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Zero service-role keys are exposed in client code.
3. **Admin Authentication & Authorization:**
   - Protected admin API routes enforce cryptographically signed HMAC-SHA256 tokens.
   - Tokens verified with constant-time comparison `crypto.timingSafeEqual` and expiration checks.
   - Failed authentication attempts are rate-limited.

---

### 5. Remaining Considerations & Edge Cases

1. **Browser Web Audio Autoplay Policy:**
   - Modern browsers (Chrome, Edge, Safari, Firefox) restrict synthesized audio playback until the user has interacted with the document (e.g., clicked anywhere on the screen).
   - The admin UI includes interactive buttons ("Single Chime", "Test Heavy Siren", "Silence / Acknowledge") in Admin Settings and header elements that satisfy this browser user-gesture requirement upon initial login.
2. **Obsolete Vercel Environment Variables:**
   - Once merged to `main`, the following variables can be safely removed from Vercel Project Settings:
     - `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_CLIENT_EMAIL`
     - `FIREBASE_PRIVATE_KEY`
     - `FIREBASE_SERVICE_ACCOUNT`

---

### 6. Pre-Merge Checklist

- [x] All Firebase files deleted (`fcmClient.ts`, `firebase-messaging-sw.js`).
- [x] Zero Firebase/FCM runtime dependencies remain in source code.
- [x] Supabase remains sole production backend.
- [x] Smart polling pauses in background tab.
- [x] Smart polling throttles concurrent focus/visibility bursts.
- [x] Duplicate API requests prevented.
- [x] Notification deduplication (`mergeNotifications`) implemented.
- [x] Dual-table Supabase notification fallback active.
- [x] Edge caching headers active on public catalog routes.
- [x] Strict `no-store, private` headers active on admin routes.
- [x] Service Worker v4 uses Cache-First for static assets.
- [x] TypeScript check passed with 0 errors.
- [x] All 9 automated test suites passed (323/323 assertions).
- [x] Production build completed (40/40 routes).
- [x] Branch `main` untouched.

**Awaiting your approval before executing any merge or production deployment.**
