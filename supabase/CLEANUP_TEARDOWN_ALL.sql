-- =========================================================================
-- VIKASA DATABASE CLEANUP & TEARDOWN SCRIPT
-- =========================================================================
-- Run this script in the Supabase SQL Editor to completely wipe all old tables,
-- functions, types, and triggers from previous migration attempts with zero errors.
-- =========================================================================

-- 1. Drop Functions and RPCs
DROP FUNCTION IF EXISTS get_public_tracking_status(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_public_tracking_status(UUID) CASCADE;
DROP FUNCTION IF EXISTS find_matching_workers(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS find_matching_workers(UUID, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS sync_coordinates() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- 2. Drop Tables with CASCADE (Order handles foreign keys automatically)
DROP TABLE IF EXISTS admin_notes CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS worker_contact_attempts CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS worker_services CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS service_aliases CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS service_categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Drop Custom Types (if any were created)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS worker_status CASCADE;
DROP TYPE IF EXISTS worker_availability CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS urgency_level CASCADE;
DROP TYPE IF EXISTS contact_result CASCADE;
DROP TYPE IF EXISTS lead_source CASCADE;

SELECT 'All old VIKASA tables, functions, and types successfully removed. Ready for fresh setup.' AS status;
