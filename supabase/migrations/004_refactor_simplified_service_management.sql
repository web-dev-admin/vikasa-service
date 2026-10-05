-- Migration 004: Refactor Simplified Service Management
-- Safe schema enhancement for Permanent Customers, Technicians, Districts, and Simple Workflows

-- 1. Add district and whatsapp to customers table
ALTER TABLE IF EXISTS customers
    ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Salem',
    ADD COLUMN IF NOT EXISTS whatsapp TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION DEFAULT 11.6643,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT 78.1460;

-- 2. Add district, whatsapp, and active_status to workers table
ALTER TABLE IF EXISTS workers
    ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Salem',
    ADD COLUMN IF NOT EXISTS whatsapp TEXT,
    ADD COLUMN IF NOT EXISTS active_status TEXT DEFAULT 'active' CHECK (active_status IN ('active', 'inactive'));

-- 3. Add district, customer_whatsapp, and assigned_worker_phone to service_requests table
ALTER TABLE IF EXISTS service_requests
    ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Salem',
    ADD COLUMN IF NOT EXISTS customer_whatsapp TEXT,
    ADD COLUMN IF NOT EXISTS assigned_worker_phone TEXT;

-- 4. Create index on district for fast filtering
CREATE INDEX IF NOT EXISTS idx_customers_district ON customers(district);
CREATE INDEX IF NOT EXISTS idx_workers_district ON workers(district);
CREATE INDEX IF NOT EXISTS idx_requests_district ON service_requests(district);

-- 5. Safe update of default district for legacy rows
UPDATE customers SET district = 'Salem' WHERE district IS NULL;
UPDATE workers SET district = 'Salem' WHERE district IS NULL;
UPDATE service_requests SET district = 'Salem' WHERE district IS NULL;
