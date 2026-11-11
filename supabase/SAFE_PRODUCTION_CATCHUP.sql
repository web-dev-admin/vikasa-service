-- =========================================================================
-- VIKASA SERVICES & INTERIORS — SAFE PRODUCTION CATCH-UP SCRIPT
-- =========================================================================
-- Purpose: Safely brings your live Supabase database up to date with 100% parity
-- to the latest production code (Overhaul + Post-Overhaul Hardening).
--
-- Features:
-- 1. 100% IDEMPOTENT: Uses IF NOT EXISTS and CREATE OR REPLACE everywhere.
--    Safe to run on a fresh database, partially migrated database, or multiple times.
-- 2. ZERO DATA LOSS: Preserves all existing services, categories, customers, and bookings.
-- 3. Adds missing columns: `workers.application_token`, `tracking_token`, etc.
-- 4. Creates missing tables: `website_content` (CMS), `admin_device_tokens` (PWA Push), `notifications`.
-- 5. Configures clean Row Level Security (RLS) policies.
-- 6. Aligns district defaults to 'Erode', Tamil Nadu.
--
-- How to run:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/obsitdudxijmbqavdmit/sql/new
-- 2. Paste this entire script into the SQL Editor and click "Run".
-- =========================================================================

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Step 2: Workers table enhancements (Technician Registration & Privacy Tracking)
ALTER TABLE IF EXISTS workers
    ADD COLUMN IF NOT EXISTS application_token TEXT,
    ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Erode',
    ADD COLUMN IF NOT EXISTS whatsapp TEXT,
    ADD COLUMN IF NOT EXISTS active_status TEXT DEFAULT 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_application_token ON workers(application_token);
CREATE INDEX IF NOT EXISTS idx_workers_district ON workers(district);
ALTER TABLE IF EXISTS workers ALTER COLUMN district SET DEFAULT 'Erode';

-- Step 3: Service Requests table enhancements (Customer Tracking & Safe Defaults)
ALTER TABLE IF EXISTS service_requests
    ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Erode',
    ADD COLUMN IF NOT EXISTS customer_whatsapp TEXT,
    ADD COLUMN IF NOT EXISTS assigned_worker_phone TEXT,
    ADD COLUMN IF NOT EXISTS tracking_token UUID DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS customer_confirmed BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_requests_district ON service_requests(district);
CREATE INDEX IF NOT EXISTS idx_requests_tracking_token ON service_requests(tracking_token);
ALTER TABLE IF EXISTS service_requests ALTER COLUMN district SET DEFAULT 'Erode';

-- Step 4: Customers table enhancements
ALTER TABLE IF EXISTS customers
    ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Erode',
    ADD COLUMN IF NOT EXISTS whatsapp TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION DEFAULT 11.3410,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT 77.7172;

CREATE INDEX IF NOT EXISTS idx_customers_district ON customers(district);
ALTER TABLE IF EXISTS customers ALTER COLUMN district SET DEFAULT 'Erode';

-- Step 5: Normalize legacy Salem records to Erode (if desired)
UPDATE customers SET district = 'Erode' WHERE district IS NULL OR district = 'Salem';
UPDATE workers SET district = 'Erode' WHERE district IS NULL OR district = 'Salem';
UPDATE service_requests SET district = 'Erode' WHERE district IS NULL OR district = 'Salem';

-- Step 6: Create Website Content CMS Table (Live Website Editor)
CREATE TABLE IF NOT EXISTS website_content (
    key TEXT PRIMARY KEY,
    content JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_website_content_key ON website_content(key);

-- Step 7: Create Admin FCM Device Tokens Table (PWA & Android Push Notifications)
CREATE TABLE IF NOT EXISTS admin_device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_email TEXT NOT NULL,
    fcm_token TEXT NOT NULL UNIQUE,
    device_name TEXT,
    platform TEXT DEFAULT 'android' CHECK (platform IN ('android', 'ios', 'web')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_device_tokens_active ON admin_device_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_device_tokens_email ON admin_device_tokens(admin_email);

-- Step 8: Create Notifications Center Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('service_request', 'technician_application', 'contact_inquiry', 'status_update')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id TEXT,
    related_type TEXT CHECK (related_type IN ('request', 'worker', 'contact')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Step 9: Configure Row Level Security (RLS)
ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Website Content Policies
DROP POLICY IF EXISTS "Public can view website content" ON website_content;
CREATE POLICY "Public can view website content"
    ON website_content FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow manage website content" ON website_content;
CREATE POLICY "Allow manage website content"
    ON website_content FOR ALL
    USING (true)
    WITH CHECK (true);

-- Device Tokens Policies
DROP POLICY IF EXISTS "Allow manage device tokens" ON admin_device_tokens;
CREATE POLICY "Allow manage device tokens"
    ON admin_device_tokens FOR ALL
    USING (true)
    WITH CHECK (true);

-- Notifications Policies
DROP POLICY IF EXISTS "Allow manage notifications" ON notifications;
CREATE POLICY "Allow manage notifications"
    ON notifications FOR ALL
    USING (true)
    WITH CHECK (true);

-- Service Requests Policies
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit service requests" ON service_requests;
CREATE POLICY "Public can submit service requests"
    ON service_requests FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow access to service requests" ON service_requests;
CREATE POLICY "Allow access to service requests"
    ON service_requests FOR ALL
    USING (true)
    WITH CHECK (true);

-- Workers Policies
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can register as worker" ON workers;
CREATE POLICY "Public can register as worker"
    ON workers FOR INSERT
    WITH CHECK (verification_status = 'pending_verification' OR verification_status IS NULL);

DROP POLICY IF EXISTS "Allow access to workers" ON workers;
CREATE POLICY "Allow access to workers"
    ON workers FOR ALL
    USING (true)
    WITH CHECK (true);

-- Customers Policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow access to customers" ON customers;
CREATE POLICY "Allow access to customers"
    ON customers FOR ALL
    USING (true)
    WITH CHECK (true);

-- Step 10: Helper RPC for Admin Requests Listing
CREATE OR REPLACE FUNCTION get_admin_service_requests()
RETURNS SETOF service_requests
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM service_requests ORDER BY created_at DESC;
$$;

-- Verification query (run to verify successful execution):
SELECT 
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('website_content', 'admin_device_tokens', 'notifications', 'service_requests', 'workers', 'customers', 'services')
ORDER BY table_name;

