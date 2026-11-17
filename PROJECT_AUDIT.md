# VIKASA SERVICES & INTERIORS — COMPREHENSIVE ARCHITECTURE & STATE AUDIT
> **Living Document for AI Agents & Engineers**  
> **Last Updated:** 2026-11-17  
> **Git Branch:** `main` (Synced with `origin/main`)  
> **Production URL:** `https://vikasaservices.in`  
> **HQ Coordinates:** Erode, Tamil Nadu (11.3410° N, 77.7172° E)

---

## 1. Executive Summary & Business Context

**Vikasa Services & Interiors** is a production-grade, hyper-local home services coordination and bespoke interior design platform headquartered on Perundurai Road, Erode, Tamil Nadu.

### Core Value Proposition
1. **Verified Technicians & Craftsmen:** Connects homeowners with vetted specialists (plumbing, carpentry, electrical, painting, AC service, deep cleaning) across all 38 districts of Tamil Nadu, with zero middleman commissions.
2. **Turnkey Interior Craftsmanship:** Custom plywood carpentry, modular kitchens, 3D room visualization, and strict material transparency.
3. **Frictionless Lead Capture:** Simplified single-purpose customer booking without confusing multi-role toggles, equipped with instant GPS reverse-geocoding, automated Tamil Nadu district matching, and WhatsApp sharing.
4. **Privileged Operations Hub:** Real-time admin portal with dispatch maps, one-click technician matching, SMS/WhatsApp contact logs, dynamic service catalog management, and a dedicated **Suggestions Hub** to convert user-requested "Other" trades into official services in one click.

---

## 2. Technical Stack

| Tier | Technology / Library | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router, Webpack) | 16.3.5 | Server/Client rendering, Route handlers |
| **Runtime** | Node.js / React | 19.x | Application engine |
| **Language** | TypeScript | 5.x | Strict type safety (`npx tsc --noEmit` = 0 errors) |
| **Database** | Supabase (PostgreSQL 15+) | Cloud | Primary data store with RLS & RPC functions |
| **Local Store** | `VikasaDataStore` (`dataStore`) | In-House | In-memory singleton with `localStorage` fallback |
| **Styling** | Tailwind CSS v4, Lucide Icons | Latest | Responsive mobile-first UI with Emerald theme |
| **PWA & Offline**| Service Worker (`/sw.js`) | v2 | Offline fallback, PWA install prompt, Web Push |
| **Push Alerts** | Firebase Cloud Messaging (FCM) | Web SDK | Web Push notifications + Web Audio alarm buzzer |
| **Geolocation** | Dual-stage GPS + BigDataCloud | Browser | Instant cached fix + WiFi/cell tower indoor fallback |
| **Maps** | Leaflet / OpenStreetMap | Latest | District boundary dispatch and visual radius map |

---

## 3. Directory Structure & Key Files

```
├── app/
│   ├── (public)/                      # Public-facing customer & worker pages
│   │   ├── page.tsx                   # Landing page (Hero, Services Grid, Trust badges)
│   │   ├── request/page.tsx           # Book a Service page (Houses LeadForm)
│   │   ├── request/success/[id]/      # Booking confirmation & tracking token display
│   │   ├── track/[id]/page.tsx        # Customer real-time job tracking page
│   │   └── worker-register/page.tsx   # Technician onboarding & custom trade registration
│   ├── admin/                         # Privileged administrative back-office
│   │   ├── layout.tsx                 # Admin layout, sidebar navigation, dynamic badge counters
│   │   ├── dashboard/page.tsx         # Operational overview, high-level metrics, activity feed
│   │   ├── requests/page.tsx          # Leads management, dispatch modal, WhatsApp job sharing
│   │   ├── suggestions/page.tsx       # Dedicated Customer & Technician custom suggestions hub
│   │   ├── workers/page.tsx           # Technician directory, multi-skill editor, verification
│   │   ├── services/page.tsx          # Dynamic services catalog manager (Add/Edit/Delete/Price)
│   │   ├── website-editor/page.tsx    # Live CMS for editing landing page content
│   │   ├── operations/page.tsx        # Daily coordination checklist and quick actions
│   │   ├── audit/page.tsx             # Complete immutable system audit trail
│   │   ├── contacts/page.tsx          # Customer & technician phone directory
│   │   ├── settings/page.tsx          # Admin configuration, notifications toggle, reset tools
│   │   ├── login/page.tsx             # HMAC SHA-256 password-protected admin sign-in
│   │   └── guide/page.tsx             # Interactive operator onboarding manual
│   ├── api/                           # Next.js Route Handlers (REST Endpoints)
│   │   ├── admin/auth/login/route.ts  # Admin token signing and HTTP-only cookie issuer
│   │   ├── admin/auth/session/        # Admin session verification endpoint
│   │   ├── admin/device-tokens/       # Web Push FCM device token registration
│   │   ├── admin/notifications/       # In-app and push notification dispatch
│   │   ├── geocode/reverse/route.ts   # Server-side Nominatim proxy (CORS safe, compliant UA)
│   │   ├── requests/route.ts          # Public booking submission (POST) & Admin list (GET)
│   │   ├── requests/[id]/route.ts     # Request status update (PATCH) & permanent deletion (DELETE)
│   │   ├── requests/[id]/assign/      # Technician dispatch assignment endpoint
│   │   ├── technicians/route.ts       # Public technician registration (POST) & Admin list (GET)
│   │   ├── technicians/[id]/route.ts  # Technician edit (PATCH) & removal (DELETE)
│   │   ├── technicians/status/        # Public technician application status lookup
│   │   ├── services/route.ts          # Dynamic services catalog retrieval and creation
│   │   ├── categories/route.ts        # Services taxonomy category management
│   │   ├── customers/route.ts         # Customer profile directory and order history
│   │   └── track/[token]/route.ts     # Public read-only job status tracker
│   ├── offline/page.tsx               # Service Worker offline fallback screen
│   └── globals.css                    # Tailwind CSS v4 styling rules
├── components/
│   ├── admin/                         # Admin modals, delete confirmations, push alert manager
│   ├── customer/                      # LeadForm.tsx, HeroEstimateWidget.tsx, ServiceDiscovery.tsx
│   ├── maps/                          # LocationPicker.tsx, DispatchMap.tsx
│   ├── navigation/                    # HeaderNav.tsx, FooterNav.tsx
│   └── pwa/                           # PWAInstallButton.tsx, PWARegistration.tsx
├── lib/
│   ├── auth/admin.ts                  # HMAC-SHA256 session token signer and verifier
│   ├── constants.ts                   # Standardized services, 38 Tamil Nadu districts, Vikasa config
│   ├── data/store.ts                  # Hybrid in-memory + localStorage repository
│   ├── data/website_content.ts        # Default CMS copy and hero assets
│   ├── matching/algorithm.ts          # Geo-distance (Haversine), trade match, district scoring
│   ├── notifications/dispatcher.ts    # Admin notification dispatcher (FCM + Web Push)
│   ├── notifications/fcmClient.ts     # Client-side Firebase Cloud Messaging initialization
│   ├── taxonomy/catalog.ts            # Canonical categories and services taxonomy
│   ├── taxonomy/i18n.ts               # Bilingual Tamil/English dictionary
│   ├── utils/audioAlert.ts            # High-intensity alarm buzzer synthesizer (Web Audio API)
│   ├── utils/location.ts              # Two-stage GPS accuracy handler & district reverse geocoder
│   └── utils/phone.ts                 # Indian 10-digit mobile sanitizer & WhatsApp link generators
├── public/
│   ├── sw.js                          # Service Worker v2 (caching, offline, push event receiver)
│   ├── manifest.webmanifest           # Progressive Web App installation manifest
│   ├── sounds/alarm-buzzer.mp3        # Emergency alert sound file
│   └── logo/                          # Vikasa brand logo and favicon assets
└── supabase/migrations/
    ├── 001_initial_schema.sql         # Legacy relational schema
    ├── 005_complete_production_setup.sql # Legacy interim migration
    └── 007_complete_reset_and_unified_schema.sql # Canonical master migration
```

---

## 4. Database Schema (Supabase PostgreSQL Migration 007)

The canonical database schema is defined in **`supabase/migrations/007_complete_reset_and_unified_schema.sql`**.

### 10 Core Tables
1. **`service_requests`**: Stores customer job bookings, GPS coordinates, status pipeline, customer confirmation, tracking tokens, and assigned technician details.
2. **`workers`**: Directory of technicians and tradesmen, trade skills array (`skills`), verification status (`pending_verification`, `verified`, `rejected`), district, radius, and custom trade notes.
3. **`services`**: Live catalog of services (`id`, `category_id`, `name`, `slug`, `price_estimate`, `is_active`, `sort_order`).
4. **`service_categories`**: Core taxonomy categories (`Interior Design`, `Carpentry`, `Electrical`, `Plumbing`, `Painting`, `AC & Appliances`, `Cleaning`, `Other Services`).
5. **`customers`**: Deduplicated customer profiles indexed by Indian 10-digit phone number.
6. **`admin_notifications`**: In-app and push notification records with read/unread flags.
7. **`admin_device_tokens`**: FCM registration tokens for devices that opted into push alerts.
8. **`audit_logs`**: Immutable security and administrative action audit trail.
9. **`worker_contact_attempts`**: Call log of dispatch attempts made to technicians.
10. **`website_content`**: Key-value JSON CMS store for landing page text and hero images.

### Security Definer RPC Functions
* `get_admin_service_requests()`: High-performance function returning all service requests ordered by `created_at DESC` bypassing table-level RLS restrictions for authorized admin queries.
* `get_admin_workers()`: Returns all technician records ordered by `created_at DESC`.

---

## 5. Core Architectural Workflows

### 1. Lead Generation & Booking Flow
```
Customer Visits /request
       │
       ▼
LeadForm.tsx (Auto-fills: Lang, Standardized Service)
       │
       ├─► Clicks "Use Current Location"
       │   └─► lib/utils/location.ts
       │       Stage 1: High-accuracy GPS (cached < 5 mins)
       │       Stage 2: Indoor fallback to WiFi / Cell-tower
       │       Stage 3: Reverse-geocode via BigDataCloud + /api/geocode/reverse
       │       Stage 4: Auto-selects District (e.g. Erode) and formats street address
       │
       ├─► Selects "Other Services"
       │   └─► Enters custom service specification
       │
       ▼
Submits to POST /api/requests
       │
       ├─► Sanitizes phone to Indian standard (+91 9XXXX XXXXX)
       ├─► Validates coordinates (defaults to Erode Center if out of bounds)
       ├─► Inserts to Supabase service_requests
       ├─► Auto-upserts to Supabase customers
       ├─► Dispatches Web Push + Web Audio alert buzzer to Admin
       └─► Redirects user to /request/success/[id] with confidential tracking_token
```

### 2. Technician Onboarding & Verification Flow
```
Technician Visits /worker-register
       │
       ▼
WorkerRegisterPage.tsx
       │
       ├─► Enters full name, phone, WhatsApp
       ├─► Selects trade skills (or enters custom trade note)
       ├─► Captures GPS location via lib/utils/location.ts
       │
       ▼
Submits to POST /api/technicians
       │
       ├─► Strictly forced to verification_status: 'pending_verification'
       ├─► Generates secure application_token (e.g. VK-TECH-XXXX)
       ├─► Inserts to Supabase workers
       └─► Alerts Admin via push notification
              │
              ▼
Admin reviews at /admin/workers
       ├─► Can Add / Delete / Edit trade skills
       ├─► Clicks "Verify & Approve" (status: 'verified')
       └─► Technician enters active dispatch pool
```

### 3. Suggestions & Custom Trades Hub (`/admin/suggestions`)
When customers book with "Other Services" or technicians register with unlisted trades, they enter the **Suggestions Hub**:
* **Customer Suggestions Column:** Displays exact client requirements, phone number, district, and exact GPS coordinates.
* **Technician Suggestions Column:** Displays custom trade specialties and years of experience.
* **1-Click "Add to Catalog" Modal:** Allows the administrator to instantly promote any suggested service (e.g., "Solar Inverter Maintenance") into the official database catalog (`POST /api/services`) with custom pricing and icon. It immediately becomes selectable in the customer booking dropdown with zero code changes.

### 4. Technician Matching Algorithm (`lib/matching/algorithm.ts`)
When assigning a technician to a job in `/admin/requests`:
1. **District Match (Primary):** Technicians located in the exact same district are ranked first (`matches_district: true`).
2. **Trade Skill Match:** Technicians possessing the requested skill in `worker.skills` or `worker.service_ids` are prioritized.
3. **Availability:** `available` technicians appear above `busy` or `offline`.
4. **Uncontacted Technicians:** Technicians who have not yet been contacted for this specific job request are ranked before already contacted candidates.
5. **Haversine Distance:** Calculates exact straight-line distance in kilometers between job GPS and technician base GPS; nearest ranked first.
6. **Experience:** Ties broken deterministically by `experience_years`.

---

## 6. Security & Authentication Architecture

1. **Admin Portal Authentication:**
   * Handled via **`lib/auth/admin.ts`**.
   * Admin credentials verified at `/api/admin/auth/login`.
   * **In-Memory Rate Limiting & Lockout:** Max 5 failed login attempts per IP in a 15-minute sliding window; returns HTTP 429 with `Retry-After`.
   * **Stripped Legacy Insecure Bypasses:** Legacy bypass cookies (`vikasa_admin_token === 'active'`) and arbitrary bypass headers (`x-admin-portal: true`) have been completely removed.
   * Issues cryptographically signed HMAC-SHA256 session tokens with 7-day expiration.
   * Stored in `vikasa_admin_session` HTTP-only, `sameSite: lax`, secure cookie and verified via Bearer header with constant-time comparison (`crypto.timingSafeEqual`).
2. **Public Endpoint & IDOR Protection:**
   * All public endpoints (`/api/requests`, `/api/technicians`, `/api/technicians/status`, `/api/track/[token]`) treat incoming payloads as untrusted.
   * **IDOR Prevention on Job Tracking:** `getPublicTrackingStatus` in `lib/data/store.ts` and `/api/track/[token]` reject sequential request numbers (e.g. `1001`) and internal identifiers (`req-1001`). Only confidential random UUID tokens with >=16 characters are resolved.
   * **Technician Status IDOR Protection:** Public status lookups at `/api/technicians/status` strictly require confidential `application_token` (e.g. `VK-TECH-XXXX`); direct internal database IDs are rejected.
   * **Zero PII Exposure:** Public tracking projection exposes only `request_number`, `service_name`, `category_name`, `status`, `preferred_date`, `general_area`, and the assigned technician's first name. Exact customer phone numbers, customer names, technician full phone numbers, and internal coordinates are never returned to public queries.
3. **Database Security & Migration 007 Alignment:**
   * **Function Search Path Hijacking Protection:** Added `SET search_path = public, pg_temp` on PostgreSQL `SECURITY DEFINER` RPC functions (`get_admin_service_requests`, `get_admin_workers`, `get_public_tracking_status`) to prevent search path escalation.
   * **Safe Public Projection RPC:** Defined `get_public_tracking_status(TEXT)` in Supabase SQL with explicit column whitelisting.
   * **Table & Column Alignment:** Synced `notifications` table alongside `admin_notifications` with `is_read` column; aligned `admin_device_tokens` schema with `fcm_token` (UNIQUE), `admin_email`, and `platform`.
   * **Row Level Security (RLS):** Enabled and enforced across all core tables.
4. **PWA & Offline Resilience (`public/sw.js`):**
   * Service Worker bumped to `vikasa-cache-v3`.
   * Enforced Network-First with Offline Fallback strategy for `/request` and `/worker-register` to guarantee users receive live forms.
   * Added `http` scheme check to prevent browser extension requests (`chrome-extension:`) from throwing `cache.put` exceptions.

---

## 7. Environment Variables (`.env.local`)

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API gateway (`https://obsitdudxijmbqavdmit.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anon/client JWT key |
| `NEXT_PUBLIC_USE_LOCAL_MOCK_DB` | Set to `false` in production to use real Supabase database |
| `NEXT_PUBLIC_APP_URL` | Base public canonical URL (`https://vikasaservices.in` or `http://localhost:3000`) |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY`| Web Push VAPID public key for browser push notification registration |
| `FIREBASE_PROJECT_ID` | Firebase service project ID for backend FCM push dispatch |
| `FIREBASE_CLIENT_EMAIL` | Firebase administrative service account email |
| `FIREBASE_PRIVATE_KEY` | RSA private key for Firebase administrative authentication |
| `ADMIN_SESSION_SECRET` | Secret key used for signing administrative session HMAC tokens |

---

## 8. Development & Maintenance Guidelines for AI Agents

When modifying or extending this codebase, every AI agent must strictly follow these rules:

1. **Type Safety & Build Verification:**
   * Always run `npx tsc --noEmit` before concluding any turn. There must be **0 TypeScript errors**.
   * Run `npx next build --webpack` to ensure all 40 static and dynamic routes compile cleanly.
   * *Windows OneDrive Warning:* Next.js build or `.git` commands on Windows may encounter file-locking (`EPERM` on `.next` or `.git/index.lock`). Always execute commands that change packages, build, or touch `.git` with `BypassSandbox: true`.
2. **Do Not Re-introduce the Client/Technician Toggle:**
   * The customer booking page (`/request` and `LeadForm.tsx`) must remain strictly a customer booking form. Never re-introduce the `[Client / Homeowner]` vs `[Technician / Partner]` toggle button on the booking page. Technicians must onboard exclusively via `/worker-register`.
3. **Preserve Erode & Tamil Nadu Geolocation Standards:**
   * Erode Center coordinates are canonical: `lat: 11.3410`, `lon: 77.7172`.
   * Standard Tamil Nadu districts are locked in `lib/constants.ts` (`TAMIL_NADU_DISTRICTS`). Never hardcode outside districts.
4. **Update This Audit File:**
   * Whenever a new route, schema modification, or major architectural feature is implemented, you **must update this `PROJECT_AUDIT.md` document** with the timestamp and commit hash.

---

## 9. Current Audit Status & Commit History

| Date | Commit | Changes |
| :--- | :--- | :--- |
| **2026-11-17** | `HEAD` | **Heavy-Noise Client Lead Alarm & 10-Minute Continuous Acknowledgment Engine:**<br>• **Heavy-Noise Industrial Siren (`lib/utils/audioAlert.ts`):** Synthesizes a 3-layer emergency siren: 180Hz square sub-bass punch, sweeping 840Hz <-> 1260Hz dual industrial siren, and 2400Hz resonant acoustic overtone with 0.85 gain. Synchronized with aggressive tactile vibration (`[450, 100, 450, 100, 600, 800]ms`).<br>• **Client-Only Rule:** Heavy alarm activates strictly and exclusively for new Client / Homeowner service bookings (`service_request`), never for technician registrations or minor inquiries.<br>• **10-Minute Auto-Silence Loop:** Loops every 2.2 seconds until an administrator clicks `[🔕 ACKNOWLEDGE & SILENCE ALARM]` or auto-terminates after exactly 10 minutes (600,000ms).<br>• **Global Emergency Banner (`components/admin/HeavyAlarmBanner.tsx`):** Fixed top banner mounted across all `/admin/*` pages with flashing siren, customer name, service, district, live ringing timer (`Ringing MM:SS`), auto-off countdown, and 1-click Acknowledge/Silence and View buttons.<br>• **Acknowledgment Persistence:** Session-stored (`sessionStorage`) acknowledgment registry ensures once an admin acknowledges a booking or clicks on it in `/admin/requests` or `NotificationCenter`, the alarm immediately stops and never re-triggers.<br>• **Admin Settings Test Harness (`/admin/settings`):** Added live test triggers for single chime and 10-minute heavy client siren loop with silence toggle.<br>• Verified with full test suite (`lib/testing/heavy_client_alarm_test.ts`). |
| **2026-11-17** | `da7bb91` | **Technician Call Validation Gate, Pinpoint 6-Decimal GPS & Post-Allocation Single Share Button:**<br>• **Phone Call Validation Gate (`/admin/workers`):** Technicians in `pending_verification` cannot be approved until an administrator verifies them via a phone call interview. The "Verify" button remains locked (`Verify (Locked)`) with a `[Validate by Call]` trigger opening a modal with candidate profile, direct dialer link (`tel:+91...`), WhatsApp interview button, call notes log, and mandatory verification checkbox. Once confirmed, `call_validated: true`, `call_validated_at`, and `call_notes` are persisted to both local dataStore and Supabase `workers` table, unlocking the `[Verify & Approve]` action.<br>• **Pinpoint 6-Decimal Doorstep GPS (`lib/utils/location.ts`, `LeadForm.tsx`, `worker-register/page.tsx`):** Geolocation uses `maximumAge: 0` to force fresh satellite locks rounded to 6 decimal places (sub-meter precision). Automatic centroid snapping via `TAMIL_NADU_DISTRICT_COORDINATES` covers all 38 districts with fuzzy matching when a user selects a district before acquiring GPS.<br>• **Single Post-Allocation Share Button (`/admin/requests`):** Location sharing is strictly disabled prior to technician allocation (`Share Location (Allocate Tech First)`). Once a technician is assigned, a single prominent button unlocks: `Share Location to [Tech Name] (WhatsApp)`. It directly targets the assigned technician's WhatsApp with customer name, phone number, required service, and exact clickable Google Maps GPS navigation link (`https://maps.google.com/?q=LAT,LON`).<br>• **Database Migration 007 Hardening:** Added `call_validated`, `call_validated_at`, and `call_notes` columns to Supabase `workers` table with backward-compatible safe `ALTER TABLE` fallbacks.<br>• Verified 100% with automated test suite (`lib/testing/call_validation_and_allocation_share_test.ts`). |
| **2026-11-17** | `d934929` | **Master Security Hardening & Complete Platform Verification:**<br>• Fixed P0 IDOR in public tracking (`getPublicTrackingStatus` & `/api/track/[token]`); strictly enforced confidential UUID matching and zero PII exposure.<br>• Hardened admin auth: stripped insecure cookie/header bypasses and added brute-force rate-limiting (max 5 attempts/15min).<br>• Secured technician status lookup by requiring `application_token`.<br>• Hardened Supabase Migration 007 with `SET search_path = public, pg_temp`, safe tracking projection RPC, notifications table RLS, and FCM schema alignment.<br>• Unified 5-tier technician dispatch algorithm in `lib/matching/algorithm.ts`.<br>• Hardened PWA Service Worker (v3) with network-first form strategy and chrome-extension scheme guards.<br>• Verified all automated test suites and verified production build (40/40 routes). |
| **2026-11-17** | `ed41421` | **Unified Supabase Migration 007 & Geolocation Overhaul:**<br>• Created `supabase/migrations/007_complete_reset_and_unified_schema.sql` resolving schema mismatches across all 10 tables.<br>• Built `app/api/geocode/reverse/route.ts` and `lib/utils/location.ts` with indoor WiFi fallback and compliant Nominatim User-Agent.<br>• Synchronized all request and worker attributes with Supabase backend. |
| **2026-11-17** | `2d4c1c8` | **PWA Cache Invalidation & Requester Badges Clean-up:**<br>• Bumped PWA service worker cache to `vikasa-cache-v2` in `public/sw.js`.<br>• Cleaned up modal requester tags in `/admin/requests`. |
| **2026-11-15** | `32320eb` | **Technician Multi-Skill Editor & Suggestions Hub:**<br>• Created `/admin/suggestions` for customer/technician custom trade requests with 1-click catalog promotion.<br>• Added multi-service add/delete/edit badges in `/admin/workers`.<br>• Stripped client/technician toggle from `LeadForm.tsx`. |
