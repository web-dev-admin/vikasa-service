-- =========================================================================
-- VIKASA: PURGE ALL DUMMY / TEST DATA (PRODUCTION READINESS)
-- =========================================================================
-- Run this script in the Supabase SQL Editor to wipe all sample/dummy records:
-- - Clears test service requests
-- - Clears test customers
-- - Clears test technicians (workers)
-- - Clears test contact attempts and assignments
-- - Clears test audit logs and notes
--
-- PRESERVED UNTOUCHED:
-- - All 8 Canonical Service Categories (Plumbing, Electrical, Carpentry, etc.)
-- - All 19 Standardized Services & Sub-services
-- - All 16 Service Search Aliases
-- - Admin Profiles
-- - All Tables, PostGIS Triggers, Indexes, RPC Functions, and Security Policies
-- =========================================================================

-- 1. Safely truncate all operational dummy tables in reverse dependency order
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN (
            'worker_contact_attempts', 
            'assignments', 
            'worker_services', 
            'service_requests', 
            'customers', 
            'workers', 
            'admin_notes', 
            'audit_logs'
          )
    LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(t) || ' RESTART IDENTITY CASCADE;';
    END LOOP;
END $$;

-- 2. Verify: Ensure Catalog is intact and Operational Data is zeroed out
SELECT 
    'SUCCESS: All dummy data wiped. Database is clean and ready for real production use.' AS status,
    (SELECT COUNT(*) FROM service_categories) AS remaining_categories,
    (SELECT COUNT(*) FROM services) AS remaining_services,
    (SELECT COUNT(*) FROM service_aliases) AS remaining_aliases,
    (SELECT COUNT(*) FROM workers) AS remaining_technicians,
    (SELECT COUNT(*) FROM customers) AS remaining_customers,
    (SELECT COUNT(*) FROM service_requests) AS remaining_requests;
