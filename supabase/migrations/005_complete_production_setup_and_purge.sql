-- =========================================================================
-- VIKASA INTERIORS — COMPLETE PRODUCTION SUPABASE SCRIPT (005)
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/obsitdudxijmbqavdmit/sql/new
-- =========================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Ensure Service Requests Table Has District and WhatsApp Fields
ALTER TABLE IF EXISTS service_requests
    ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Erode',
    ADD COLUMN IF NOT EXISTS customer_whatsapp TEXT,
    ADD COLUMN IF NOT EXISTS assigned_worker_phone TEXT,
    ADD COLUMN IF NOT EXISTS tracking_token UUID DEFAULT gen_random_uuid();

-- 3. Ensure Customers Table Has District and WhatsApp
ALTER TABLE IF EXISTS customers
    ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Erode',
    ADD COLUMN IF NOT EXISTS whatsapp TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION DEFAULT 11.3410,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT 77.7172;

-- 4. Ensure Workers Table Has District, WhatsApp, and Active Status
ALTER TABLE IF EXISTS workers
    ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Erode',
    ADD COLUMN IF NOT EXISTS whatsapp TEXT,
    ADD COLUMN IF NOT EXISTS active_status TEXT DEFAULT 'active';

-- 5. Safe Defaults Alignment to Erode
ALTER TABLE IF EXISTS service_requests ALTER COLUMN district SET DEFAULT 'Erode';
ALTER TABLE IF EXISTS customers ALTER COLUMN district SET DEFAULT 'Erode';
ALTER TABLE IF EXISTS workers ALTER COLUMN district SET DEFAULT 'Erode';

UPDATE customers SET district = 'Erode' WHERE district IS NULL OR district = 'Salem';
UPDATE workers SET district = 'Erode' WHERE district IS NULL OR district = 'Salem';
UPDATE service_requests SET district = 'Erode' WHERE district IS NULL OR district = 'Salem';

-- 6. Fast Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_requests_district ON service_requests(district);
CREATE INDEX IF NOT EXISTS idx_customers_district ON customers(district);
CREATE INDEX IF NOT EXISTS idx_workers_district ON workers(district);
CREATE INDEX IF NOT EXISTS idx_requests_tracking_token ON service_requests(tracking_token);

-- 7. Ensure Admin Retrieval RPC Exists
CREATE OR REPLACE FUNCTION get_admin_service_requests()
RETURNS SETOF service_requests
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM service_requests ORDER BY created_at DESC;
$$;

-- =========================================================================
-- OPTIONAL: RUN THIS ONLY IF YOU WANT TO CLEAR ALL TEST / DUMMY DATA
-- (Uncomment the lines below to wipe dummy bookings, technicians & customers)
-- =========================================================================
-- TRUNCATE TABLE worker_contact_attempts CASCADE;
-- TRUNCATE TABLE service_requests CASCADE;
-- TRUNCATE TABLE customers CASCADE;
-- TRUNCATE TABLE workers CASCADE;
-- TRUNCATE TABLE audit_logs CASCADE;
