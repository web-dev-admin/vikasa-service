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
1. **District Match (Primary):** Technicians located in the exact same district are ranked first.
2. **Trade Skill Match:** Technicians possessing the requested skill in `worker.skills` or `worker.service_ids` are prioritized.
3. **Availability:** `available` technicians appear above `busy` or `offline`.
4. **Haversine Distance:** Calculates exact straight-line distance in kilometers between job GPS and technician base GPS; nearest ranked first.
5. **Experience:** Ties broken by `experience_years`.

---

## 6. Security & Authentication Architecture

1. **Admin Portal Authentication:**
   * Handled via **`lib/auth/admin.ts`**.
   * Admin credentials verified at `/api/admin/auth/login`.
   * Issues cryptographically signed HMAC-SHA256 session tokens with 7-day expiration.
   * Stored in `vikasa_admin_session` HTTP-only, `sameSite: lax`, secure cookie and verified via Bearer header.
2. **Public Endpoint Hardening:**
   * All public endpoints (`/api/requests`, `/api/technicians`, `/api/technicians/status`) treat incoming payloads as untrusted.
   * Public technician registrations CANNOT set their own verification status.
   * Public requests only receive sanitized public summaries (`request_number`, `tracking_token`, `district`), never exposing worker private phone numbers or internal notes.
3. **Row Level Security (RLS):**
   * Configured in Supabase with permissive public inserts for bookings/technician registrations and authorized administrative reads.

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
| **2026-11-17** | `ed41421` | **Unified Supabase Migration 007 & Geolocation Overhaul:**<br>• Created `supabase/migrations/007_complete_reset_and_unified_schema.sql` resolving schema mismatches across all 10 tables.<br>• Built `app/api/geocode/reverse/route.ts` and `lib/utils/location.ts` with indoor WiFi fallback and compliant Nominatim User-Agent.<br>• Synchronized all request and worker attributes with Supabase backend. |
| **2026-11-17** | `2d4c1c8` | **PWA Cache Invalidation & Requester Badges Clean-up:**<br>• Bumped PWA service worker cache to `vikasa-cache-v2` in `public/sw.js`.<br>• Cleaned up modal requester tags in `/admin/requests`. |
| **2026-11-15** | `32320eb` | **Technician Multi-Skill Editor & Suggestions Hub:**<br>• Created `/admin/suggestions` for customer/technician custom trade requests with 1-click catalog promotion.<br>• Added multi-service add/delete/edit badges in `/admin/workers`.<br>• Stripped client/technician toggle from `LeadForm.tsx`. |
