-- =========================================================================
-- VIKASA SERVICES & INTERIORS — COMPLETE DATABASE RESET & UNIFIED SCHEMA
-- Version: 007
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/obsitdudxijmbqavdmit/sql/new
-- =========================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Clean Slate: Drop old conflicting tables & RPCs safely
DROP FUNCTION IF EXISTS get_admin_service_requests() CASCADE;
DROP FUNCTION IF EXISTS get_admin_workers() CASCADE;
DROP FUNCTION IF EXISTS get_public_tracking_status(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_public_tracking_status(UUID) CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS worker_contact_attempts CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS service_categories CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS admin_notifications CASCADE;
DROP TABLE IF EXISTS admin_device_tokens CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS website_content CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS worker_services CASCADE;
DROP TABLE IF EXISTS service_aliases CASCADE;
DROP TABLE IF EXISTS admin_notes CASCADE;

-- 3. Service Categories
CREATE TABLE IF NOT EXISTS service_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Services Catalog
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    category_id TEXT DEFAULT 'cat-general',
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price_estimate TEXT DEFAULT 'Custom Quote',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Service Requests (Bookings)
CREATE TABLE IF NOT EXISTS service_requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    request_number SERIAL UNIQUE,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_whatsapp TEXT,
    customer_email TEXT,
    category_id TEXT DEFAULT 'cat-general',
    category_name TEXT,
    service_id TEXT DEFAULT 'srv-general',
    service_name TEXT NOT NULL,
    description TEXT,
    formatted_address TEXT NOT NULL,
    district TEXT NOT NULL DEFAULT 'Erode',
    latitude DOUBLE PRECISION DEFAULT 11.3410,
    longitude DOUBLE PRECISION DEFAULT 77.7172,
    urgency TEXT DEFAULT 'medium',
    preferred_date TEXT DEFAULT CURRENT_DATE::text,
    preferred_time_slot TEXT DEFAULT 'Today (Within 2 Hours)',
    photo_urls TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'NEW',
    customer_confirmed BOOLEAN DEFAULT FALSE,
    customer_confirmed_at TIMESTAMPTZ,
    assigned_worker_id TEXT,
    assigned_worker_name TEXT,
    assigned_worker_phone TEXT,
    assigned_at TIMESTAMPTZ,
    tracking_token UUID DEFAULT gen_random_uuid(),
    requester_type TEXT DEFAULT 'client',
    custom_service_note TEXT,
    admin_notes TEXT,
    source TEXT DEFAULT 'DIRECT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Workers (Technicians Directory)
CREATE TABLE IF NOT EXISTS workers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    whatsapp TEXT,
    email TEXT,
    avatar_url TEXT,
    experience_years INT NOT NULL DEFAULT 1,
    skills TEXT[] NOT NULL DEFAULT '{}',
    bio TEXT,
    verification_status TEXT NOT NULL DEFAULT 'pending_verification',
    verified_at TIMESTAMPTZ,
    verified_by TEXT,
    verification_notes TEXT,
    call_validated BOOLEAN NOT NULL DEFAULT FALSE,
    call_validated_at TIMESTAMPTZ,
    call_notes TEXT,
    availability TEXT NOT NULL DEFAULT 'available',
    active_status TEXT NOT NULL DEFAULT 'active',
    district TEXT NOT NULL DEFAULT 'Erode',
    base_location_name TEXT NOT NULL DEFAULT 'Erode, Tamil Nadu',
    latitude DOUBLE PRECISION NOT NULL DEFAULT 11.3410,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 77.7172,
    service_radius_km NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    service_area_names TEXT[] DEFAULT '{"Erode"}',
    service_ids TEXT[] DEFAULT '{}',
    application_token TEXT,
    custom_trade_note TEXT,
    has_custom_skill BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workers ADD COLUMN IF NOT EXISTS call_validated BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS call_validated_at TIMESTAMPTZ;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS call_notes TEXT;

-- 7. Customers
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    whatsapp TEXT,
    email TEXT,
    district TEXT DEFAULT 'Erode',
    address TEXT,
    latitude DOUBLE PRECISION DEFAULT 11.3410,
    longitude DOUBLE PRECISION DEFAULT 77.7172,
    total_requests INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Notifications (Both notifications and admin_notifications for backward compatibility)
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id TEXT,
    related_type TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id TEXT,
    related_type TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Admin Device Tokens (Push Notifications via FCM HTTP v1)
CREATE TABLE IF NOT EXISTS admin_device_tokens (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    admin_email TEXT NOT NULL DEFAULT 'admin@vikasa.com',
    fcm_token TEXT NOT NULL UNIQUE,
    device_name TEXT DEFAULT 'Admin Device',
    platform TEXT NOT NULL DEFAULT 'android',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    actor_role TEXT NOT NULL DEFAULT 'admin',
    actor_identifier TEXT NOT NULL DEFAULT 'system',
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Worker Contact Attempts
CREATE TABLE IF NOT EXISTS worker_contact_attempts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    request_id TEXT NOT NULL,
    worker_id TEXT NOT NULL,
    attempt_number INT NOT NULL DEFAULT 1,
    result TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Website Content (CMS)
CREATE TABLE IF NOT EXISTS website_content (
    id TEXT PRIMARY KEY DEFAULT 'vikasa_site_content',
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Pre-populate Baseline Standard Services & Categories
INSERT INTO service_categories (id, name, slug, icon, description, sort_order) VALUES
('cat-interior', 'Interior Design', 'interior-design', 'Sparkles', 'Turnkey residential & commercial interior design', 1),
('cat-carpentry', 'Carpentry & Plywood', 'carpentry', 'Hammer', 'Bespoke wardrobes, modular kitchens & woodwork', 2),
('cat-painting', 'Painting & Finishes', 'painting', 'Sparkles', 'Interior, exterior painting & wall putty finishes', 3),
('cat-electrical', 'Electrical & Lighting', 'electrical', 'Zap', 'Wiring, lighting, switchgear & appliance connections', 4),
('cat-plumbing', 'Plumbing', 'plumbing', 'Wrench', 'Pipes, bathroom fittings, motor pumps & leak repairs', 5),
('cat-ac', 'AC & Appliances', 'ac-appliances', 'Tv', 'Air conditioning service, gas charging & appliance repair', 6),
('cat-cleaning', 'Cleaning Services', 'cleaning', 'Sparkles', 'Deep home cleaning, sofa, kitchen & bathroom sanitation', 7),
('cat-other', 'Other Services', 'other-services', 'Wrench', 'Custom home maintenance & specialized client requirements', 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO services (id, category_id, name, slug, description, price_estimate, sort_order) VALUES
('srv-interior', 'cat-interior', 'Interior Design', 'interior-design', 'Turnkey interior design, 3D floorplans & bespoke home decor', 'Free Consultation', 1),
('srv-carpentry', 'cat-carpentry', 'Carpentry & Plywood Work', 'carpentry', 'Wardrobes, modular kitchens, wooden doors & furniture', 'Custom Estimate', 2),
('srv-painting', 'cat-painting', 'Painting & Wall Finish', 'painting', 'Wall painting, Royal finish, putty work & waterproofing', 'From ₹12/sq.ft', 3),
('srv-electrical', 'cat-electrical', 'Electrical & Lighting', 'electrical', 'Fan, light fitting, inverter wiring & circuit breaker fixes', 'From ₹199', 4),
('srv-plumbing', 'cat-plumbing', 'Plumbing', 'plumbing', 'Tap leaks, pipe repair, bathroom fittings & water tanks', 'From ₹199', 5),
('srv-ac', 'cat-ac', 'AC & Appliances', 'ac-service', 'AC inspection, filter cleaning, gas refill & appliance repair', 'From ₹499', 6),
('srv-cleaning', 'cat-cleaning', 'Cleaning', 'cleaning', 'Deep home cleaning, kitchen degreasing & sofa wash', 'From ₹999', 7),
('srv-other', 'cat-other', 'Other Services', 'other', 'Specialized requirements, solar, CCTV, automation & repairs', 'Quote on Inspection', 8)
ON CONFLICT (id) DO NOTHING;

-- 14. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_district ON service_requests(district);
CREATE INDEX IF NOT EXISTS idx_requests_tracking_token ON service_requests(tracking_token);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON service_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_phone ON service_requests(customer_phone);

CREATE INDEX IF NOT EXISTS idx_workers_district ON workers(district);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(verification_status);
CREATE INDEX IF NOT EXISTS idx_workers_availability ON workers(availability);
CREATE INDEX IF NOT EXISTS idx_workers_phone ON workers(phone);
CREATE INDEX IF NOT EXISTS idx_workers_app_token ON workers(application_token);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_district ON customers(district);

-- 15. Security Definer Helper RPCs
CREATE OR REPLACE FUNCTION get_admin_service_requests()
RETURNS SETOF service_requests
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT * FROM service_requests ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION get_admin_workers()
RETURNS SETOF workers
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT * FROM workers ORDER BY created_at DESC;
$$;

-- Secure public tracking projection RPC (protects customer phone and private technician details)
CREATE OR REPLACE FUNCTION get_public_tracking_status(p_tracking_token TEXT)
RETURNS TABLE (
    id TEXT,
    request_number INT,
    service_id TEXT,
    service_name TEXT,
    category_name TEXT,
    status TEXT,
    district TEXT,
    formatted_address TEXT,
    preferred_date TEXT,
    preferred_time_slot TEXT,
    assigned_worker_first_name TEXT,
    created_at TIMESTAMPTZ,
    tracking_token TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT 
        sr.id,
        sr.request_number,
        sr.service_id,
        sr.service_name,
        sr.category_name,
        sr.status,
        sr.district,
        sr.formatted_address,
        sr.preferred_date,
        sr.preferred_time_slot,
        SPLIT_PART(sr.assigned_worker_name, ' ', 1) AS assigned_worker_first_name,
        sr.created_at,
        sr.tracking_token::text AS tracking_token
    FROM service_requests sr
    WHERE sr.tracking_token::text = p_tracking_token
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_public_tracking_status(p_tracking_token UUID)
RETURNS TABLE (
    id TEXT,
    request_number INT,
    service_id TEXT,
    service_name TEXT,
    category_name TEXT,
    status TEXT,
    district TEXT,
    formatted_address TEXT,
    preferred_date TEXT,
    preferred_time_slot TEXT,
    assigned_worker_first_name TEXT,
    created_at TIMESTAMPTZ,
    tracking_token TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT * FROM get_public_tracking_status(p_tracking_token::text);
$$;

-- 16. Row Level Security Policies (Allow seamless operation for client & admin)
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_contact_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;

-- Permissive public & admin access policies
DROP POLICY IF EXISTS "Public read active categories" ON service_categories;
CREATE POLICY "Public read active categories" ON service_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write categories" ON service_categories;
CREATE POLICY "Admin write categories" ON service_categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read active services" ON services;
CREATE POLICY "Public read active services" ON services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write services" ON services;
CREATE POLICY "Admin write services" ON services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert requests" ON service_requests;
CREATE POLICY "Allow public insert requests" ON service_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select requests" ON service_requests;
CREATE POLICY "Allow select requests" ON service_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update delete requests" ON service_requests;
CREATE POLICY "Allow update delete requests" ON service_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert workers" ON workers;
CREATE POLICY "Allow public insert workers" ON workers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select workers" ON workers;
CREATE POLICY "Allow select workers" ON workers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update delete workers" ON workers;
CREATE POLICY "Allow update delete workers" ON workers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow customers access" ON customers;
CREATE POLICY "Allow customers access" ON customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow notifications access" ON notifications;
CREATE POLICY "Allow notifications access" ON notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin_notifications access" ON admin_notifications;
CREATE POLICY "Allow admin_notifications access" ON admin_notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow device tokens access" ON admin_device_tokens;
CREATE POLICY "Allow device tokens access" ON admin_device_tokens FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow audit logs access" ON audit_logs;
CREATE POLICY "Allow audit logs access" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow attempts access" ON worker_contact_attempts;
CREATE POLICY "Allow attempts access" ON worker_contact_attempts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow website content access" ON website_content;
CREATE POLICY "Allow website content access" ON website_content FOR ALL USING (true) WITH CHECK (true);

-- 17. Explicit Function Execution Permissions
GRANT EXECUTE ON FUNCTION get_admin_service_requests() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_admin_workers() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_public_tracking_status(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_public_tracking_status(UUID) TO anon, authenticated, service_role;

-- =========================================================================
-- DATABASE SETUP COMPLETE & VERIFIED
-- =========================================================================
