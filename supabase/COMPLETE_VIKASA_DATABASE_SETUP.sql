-- =========================================================================
-- VIKASA MANAGED SERVICE DISPATCH PLATFORM
-- COMPLETE PRODUCTION DATABASE SETUP & CLEANUP MIGRATION
-- =========================================================================
-- This script:
-- 1. Cleans up / drops all old tables, types, triggers, and functions safely.
-- 2. Creates the complete PostgreSQL + PostGIS schema compatible with standard string IDs & UUIDs.
-- 3. Sets up automated coordinates synchronization triggers.
-- 4. Creates spatial indexes and PostGIS matching RPC functions.
-- 5. Implements strict Row-Level Security (RLS) policies protecting customer & technician PII.
-- 6. Seeds approved service categories, standardized trade services, and initial verified technicians.
-- =========================================================================

-- =========================================================================
-- SECTION 1: COMPLETE TEARDOWN & CLEANUP
-- =========================================================================

-- 1.1 Drop Functions and RPCs
DROP FUNCTION IF EXISTS get_public_tracking_status(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_public_tracking_status(UUID) CASCADE;
DROP FUNCTION IF EXISTS find_matching_workers(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS find_matching_workers(UUID, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS sync_coordinates() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- 1.2 Drop Tables in reverse dependency order
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

-- 1.3 Drop Custom Types (if any were created)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS worker_status CASCADE;
DROP TYPE IF EXISTS worker_availability CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS urgency_level CASCADE;
DROP TYPE IF EXISTS contact_result CASCADE;
DROP TYPE IF EXISTS lead_source CASCADE;

-- =========================================================================
-- SECTION 2: EXTENSIONS & TABLES DEFINITIONS
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- 2.1 Admin Profiles Table
-- Linked to Supabase Auth users for the administrator
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('customer', 'worker', 'admin', 'super_admin')),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Service Categories Table
CREATE TABLE service_categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 Services Table
CREATE TABLE services (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    category_id TEXT NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 Service Aliases Table
CREATE TABLE service_aliases (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    alias TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 Workers Table
-- Technicians register publicly and do not require user accounts.
CREATE TABLE workers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    avatar_url TEXT,
    experience_years INT NOT NULL DEFAULT 1,
    skills TEXT[] DEFAULT '{}',
    bio TEXT,
    verification_status TEXT NOT NULL DEFAULT 'pending_verification' 
        CHECK (verification_status IN ('pending_verification', 'verified', 'rejected', 'suspended', 'inactive')),
    verified_at TIMESTAMPTZ,
    verified_by TEXT,
    verification_notes TEXT,
    availability TEXT NOT NULL DEFAULT 'available' 
        CHECK (availability IN ('available', 'busy', 'offline', 'temporarily_unavailable')),
    active_status TEXT NOT NULL DEFAULT 'active' 
        CHECK (active_status IN ('active', 'inactive')),
    district TEXT NOT NULL DEFAULT 'Salem',
    base_location_name TEXT NOT NULL DEFAULT 'Salem, Tamil Nadu',
    latitude DOUBLE PRECISION NOT NULL DEFAULT 11.6643,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 78.1460,
    coordinates geography(Point, 4326),
    service_radius_km NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    service_area_names TEXT[] DEFAULT '{}',
    service_ids TEXT[] DEFAULT '{}',
    id_document_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 Worker Services Link Table (Optional Normalization)
CREATE TABLE worker_services (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    worker_id TEXT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(worker_id, service_id)
);

-- 2.7 Customers Table
CREATE TABLE customers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    district TEXT NOT NULL DEFAULT 'Salem',
    address TEXT,
    latitude DOUBLE PRECISION DEFAULT 11.6643,
    longitude DOUBLE PRECISION DEFAULT 78.1460,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 Service Requests Table
CREATE TABLE service_requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    request_number SERIAL UNIQUE,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_whatsapp TEXT,
    customer_email TEXT,
    
    category_id TEXT,
    category_name TEXT,
    service_id TEXT,
    service_name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    
    formatted_address TEXT NOT NULL DEFAULT 'Salem',
    district TEXT NOT NULL DEFAULT 'Salem',
    latitude DOUBLE PRECISION DEFAULT 11.6643,
    longitude DOUBLE PRECISION DEFAULT 78.1460,
    coordinates geography(Point, 4326),
    location_accuracy NUMERIC(8, 2),
    
    urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),
    preferred_date DATE,
    preferred_time_slot TEXT,
    photo_urls TEXT[] DEFAULT '{}',
    
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (
        status IN (
            'NEW',
            'CUSTOMER_TO_CALL',
            'CUSTOMER_CONFIRMED',
            'MATCHING',
            'WORKER_CONTACTING',
            'WORKER_ACCEPTED',
            'ASSIGNED',
            'IN_PROGRESS',
            'COMPLETED',
            'CUSTOMER_CANCELLED',
            'NO_WORKER_AVAILABLE',
            'CANCELLED'
        )
    ),
    customer_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    customer_confirmed_at TIMESTAMPTZ,
    
    source TEXT NOT NULL DEFAULT 'DIRECT' CHECK (source IN ('META', 'ORGANIC', 'DIRECT', 'REFERRAL', 'OTHER')),
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    landing_page TEXT,
    referrer TEXT,
    
    admin_notes TEXT,
    assigned_worker_id TEXT REFERENCES workers(id) ON DELETE SET NULL,
    assigned_worker_name TEXT,
    assigned_worker_phone TEXT,
    preferred_worker_id TEXT,
    preferred_worker_name TEXT,
    
    tracking_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.8 Worker Contact Attempts Table
-- Admin telephone log for recording technician confirmations
CREATE TABLE worker_contact_attempts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    request_id TEXT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    worker_id TEXT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    worker_name TEXT NOT NULL,
    worker_phone TEXT NOT NULL,
    operator_id TEXT NOT NULL DEFAULT 'admin-1',
    operator_name TEXT NOT NULL DEFAULT 'VIKASA Admin',
    attempt_number INT NOT NULL DEFAULT 1,
    result TEXT NOT NULL CHECK (result IN ('accepted', 'rejected', 'no_answer', 'busy', 'call_later')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.9 Assignments Table
CREATE TABLE assignments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    request_id TEXT NOT NULL UNIQUE REFERENCES service_requests(id) ON DELETE CASCADE,
    worker_id TEXT NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
    worker_name TEXT NOT NULL,
    assigned_by TEXT NOT NULL DEFAULT 'admin-1',
    assigned_by_name TEXT NOT NULL DEFAULT 'VIKASA Admin',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    notes TEXT
);

-- 2.10 Admin Notes Table
CREATE TABLE admin_notes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    request_id TEXT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    operator_id TEXT NOT NULL DEFAULT 'admin-1',
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.11 Audit Logs Table
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT DEFAULT 'admin-1',
    user_name TEXT DEFAULT 'VIKASA Admin',
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- SECTION 3: AUTOMATED COORDINATES TRIGGER & INDEXES
-- =========================================================================

-- Automatically generates PostGIS Point geometry from latitude & longitude
CREATE OR REPLACE FUNCTION sync_coordinates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.coordinates := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_worker_coords
BEFORE INSERT OR UPDATE OF latitude, longitude ON workers
FOR EACH ROW EXECUTE FUNCTION sync_coordinates();

CREATE TRIGGER trg_sync_request_coords
BEFORE INSERT OR UPDATE OF latitude, longitude ON service_requests
FOR EACH ROW EXECUTE FUNCTION sync_coordinates();

-- Spatial & Performance Indexes
CREATE INDEX idx_workers_coords ON workers USING GIST(coordinates);
CREATE INDEX idx_requests_coords ON service_requests USING GIST(coordinates);
CREATE INDEX idx_requests_tracking_token ON service_requests(tracking_token);
CREATE INDEX idx_requests_status ON service_requests(status);
CREATE INDEX idx_requests_district ON service_requests(district);
CREATE INDEX idx_requests_created_at ON service_requests(created_at DESC);
CREATE INDEX idx_workers_verification_avail ON workers(verification_status, availability);
CREATE INDEX idx_workers_district ON workers(district);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_contact_attempts_req ON worker_contact_attempts(request_id, attempt_number);

-- =========================================================================
-- SECTION 4: RPC FUNCTIONS (POSTGIS MATCHING & PUBLIC TRACKING)
-- =========================================================================

-- 4.1 PostGIS Technician Matching Engine
CREATE OR REPLACE FUNCTION find_matching_workers(
    p_service_id TEXT,
    p_request_lon DOUBLE PRECISION,
    p_request_lat DOUBLE PRECISION,
    p_radius_km NUMERIC DEFAULT 15.0
)
RETURNS TABLE (
    worker_id TEXT,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    experience_years INT,
    verification_status TEXT,
    availability TEXT,
    distance_km NUMERIC,
    is_exact_service BOOLEAN,
    service_radius_km NUMERIC,
    match_category TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_req_point geography;
BEGIN
    IF p_request_lon IS NULL OR p_request_lat IS NULL THEN
        RETURN;
    END IF;

    v_req_point := ST_SetSRID(ST_MakePoint(p_request_lon, p_request_lat), 4326)::geography;

    RETURN QUERY
    SELECT 
        w.id AS worker_id,
        w.full_name,
        w.phone,
        w.avatar_url,
        w.experience_years,
        w.verification_status,
        w.availability,
        ROUND((ST_Distance(w.coordinates, v_req_point) / 1000.0)::numeric, 2) AS distance_km,
        (p_service_id = ANY(w.service_ids) OR p_service_id = 'other') AS is_exact_service,
        w.service_radius_km,
        CASE 
            WHEN ST_Distance(w.coordinates, v_req_point) <= 3000 THEN 'Nearby (0-3 km)'
            WHEN ST_Distance(w.coordinates, v_req_point) <= 7000 THEN 'Near (3-7 km)'
            ELSE 'Far (7-15+ km)'
        END AS match_category,
        w.latitude,
        w.longitude
    FROM workers w
    WHERE w.verification_status = 'verified'
      AND w.availability = 'available'
      AND (p_service_id = ANY(w.service_ids) OR p_service_id = 'other' OR array_length(w.service_ids, 1) IS NULL)
      AND ST_DWithin(w.coordinates, v_req_point, (p_radius_km * 1000.0))
      AND ST_DWithin(w.coordinates, v_req_point, (w.service_radius_km * 1000.0))
    ORDER BY 
        is_exact_service DESC,
        distance_km ASC,
        w.experience_years DESC;
END;
$$;

-- 4.2 Public Tracking Status RPC (SECURITY DEFINER)
-- Strictly limited projection for anonymous customer tracking.
-- Zero PII exposed: No customer phone, no worker phone, no coordinates, no internal notes.
CREATE OR REPLACE FUNCTION get_public_tracking_status(p_tracking_token TEXT)
RETURNS TABLE (
    request_number INT,
    service_name TEXT,
    category_name TEXT,
    status TEXT,
    preferred_date DATE,
    preferred_time_slot TEXT,
    general_area TEXT,
    created_at TIMESTAMPTZ,
    assigned_worker_first_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_tracking_token IS NULL OR TRIM(p_tracking_token) = '' THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        sr.request_number,
        sr.service_name,
        COALESCE(sr.category_name, 'General Service') AS category_name,
        sr.status,
        sr.preferred_date,
        sr.preferred_time_slot,
        SPLIT_PART(sr.formatted_address, ',', 1) AS general_area,
        sr.created_at,
        SPLIT_PART(sr.assigned_worker_name, ' ', 1) AS assigned_worker_first_name
    FROM service_requests sr
    WHERE sr.tracking_token::text = TRIM(p_tracking_token)
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_tracking_status(TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION get_public_tracking_status(p_tracking_token UUID)
RETURNS TABLE (
    request_number INT,
    service_name TEXT,
    category_name TEXT,
    status TEXT,
    preferred_date DATE,
    preferred_time_slot TEXT,
    general_area TEXT,
    created_at TIMESTAMPTZ,
    assigned_worker_first_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY SELECT * FROM get_public_tracking_status(p_tracking_token::text);
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_tracking_status(UUID) TO anon, authenticated, service_role;

-- =========================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_contact_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to check if current authenticated user has admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.1 Public Read for Catalog
CREATE POLICY "Public read categories" ON service_categories FOR SELECT USING (is_active = TRUE OR is_admin());
CREATE POLICY "Admin manage categories" ON service_categories FOR ALL USING (is_admin());

CREATE POLICY "Public read services" ON services FOR SELECT USING (is_active = TRUE OR is_admin());
CREATE POLICY "Admin manage services" ON services FOR ALL USING (is_admin());

CREATE POLICY "Public read aliases" ON service_aliases FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage aliases" ON service_aliases FOR ALL USING (is_admin());

CREATE POLICY "Public read worker_services" ON worker_services FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage worker_services" ON worker_services FOR ALL USING (is_admin());

-- 5.2 Technician Registration & Protection
-- Public can submit registration (forced pending verification), Admin manages all
CREATE POLICY "Public technician registration" ON workers FOR INSERT WITH CHECK (
    verification_status = 'pending_verification'
);
CREATE POLICY "Admin manage workers" ON workers FOR ALL USING (is_admin());

-- 5.3 Customer Request Creation & Protection
-- Public can create requests, only Admin can manage or view all requests
CREATE POLICY "Public insert request" ON service_requests FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admin manage requests" ON service_requests FOR ALL USING (is_admin());

-- 5.4 Customer Details Protection
CREATE POLICY "Public customer creation" ON customers FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admin manage customers" ON customers FOR ALL USING (is_admin());

-- 5.5 Privileged Operations
CREATE POLICY "Admin manage attempts" ON worker_contact_attempts FOR ALL USING (is_admin());
CREATE POLICY "Admin manage assignments" ON assignments FOR ALL USING (is_admin());
CREATE POLICY "Admin manage notes" ON admin_notes FOR ALL USING (is_admin());
CREATE POLICY "Admin manage logs" ON audit_logs FOR ALL USING (is_admin());
CREATE POLICY "Admin manage profiles" ON profiles FOR ALL USING (is_admin());

-- =========================================================================
-- SECTION 6: INITIAL SEED DATA (APPROVED CATALOG & VERIFIED TECHNICIANS)
-- =========================================================================

-- Safely clear previous seed rows in reverse dependency order
-- Uses dynamic information_schema inspection so it NEVER errors if any table does not exist
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN (
            'worker_contact_attempts', 'assignments', 'worker_services', 
            'service_requests', 'customers', 'workers', 
            'service_aliases', 'services', 'service_categories'
          )
    LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(t) || ' CASCADE;';
    END LOOP;
END $$;

-- 6.1 Categories (8 Canonical Trades)
INSERT INTO service_categories (id, name, slug, icon, description, sort_order, is_active) VALUES
('cat-plumbing', 'Plumbing', 'plumbing', 'Wrench', 'Pipe repairs, tap fittings, bathroom plumbing, and water tank solutions', 1, TRUE),
('cat-cleaning', 'Cleaning', 'cleaning', 'Sparkles', 'Deep bathroom cleaning, kitchen degreasing, water tank cleaning', 2, TRUE),
('cat-interior', 'Interior Design', 'interior-design', 'Layout', 'Modular kitchen renovation, false ceiling, custom wardrobes, woodwork', 3, TRUE),
('cat-electrical', 'Electrical', 'electrical', 'Zap', 'Wiring, switchboard fixes, fan installation, and lighting solutions', 4, TRUE),
('cat-ac-appliances', 'AC & Appliances', 'ac-appliances', 'Tv', 'AC servicing, washing machine repair, refrigerator cooling issues', 5, TRUE),
('cat-painting', 'Painting', 'painting', 'Sparkles', 'Interior touch-up painting, wall crack putty filling, waterproofing', 6, TRUE),
('cat-carpentry', 'Carpentry', 'carpentry', 'Hammer', 'Door repairs, wooden furniture fixes, locks, and custom woodwork', 7, TRUE),
('cat-other', 'Other Services', 'other-services', 'HelpCircle', 'Custom and specialized home trade requirements', 8, TRUE)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    slug = EXCLUDED.slug, 
    icon = EXCLUDED.icon, 
    description = EXCLUDED.description, 
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;

-- 6.2 Standardized Services (8 Primary Trades + 11 Detailed Sub-Services)
INSERT INTO services (id, category_id, name, slug, description, sort_order, is_active) VALUES
-- 8 Canonical Primary Trade Services
('srv-plumbing', 'cat-plumbing', 'Plumbing', 'plumbing', 'General plumbing inspection and repair', 1, TRUE),
('srv-cleaning', 'cat-cleaning', 'Cleaning', 'cleaning', 'Deep bathroom cleaning, kitchen cleaning, overhead tank cleaning', 2, TRUE),
('srv-interior', 'cat-interior', 'Interior Design', 'interior-design', 'Modular kitchens, false ceiling, wardrobes, woodwork consultation', 3, TRUE),
('srv-electrical', 'cat-electrical', 'Electrical', 'electrical', 'General electrical inspection and repairs', 4, TRUE),
('srv-ac', 'cat-ac-appliances', 'AC Service', 'ac-service', 'AC jet cleaning, gas charging, cooling fault troubleshooting', 5, TRUE),
('srv-painting', 'cat-painting', 'Painting', 'painting', 'Interior wall painting, touch-up painting, crack putty filling', 6, TRUE),
('srv-carpentry', 'cat-carpentry', 'Carpentry', 'carpentry', 'General carpentry, doors, hinges and wood fixing', 7, TRUE),
('srv-other', 'cat-other', 'Other', 'other', 'Custom, specialized or unlisted home service requirement', 8, TRUE),

-- Detailed Sub-Services
('srv-tap-repair', 'cat-plumbing', 'Tap Repair & Replacement', 'tap-repair', 'Leaking taps, new mixer installation, angle valve replacement', 9, TRUE),
('srv-pipe-leakage', 'cat-plumbing', 'Pipe Leakage & Drainage Repair', 'pipe-leakage', 'Concealed pipe leaks, bathroom sink drain blockages, PVC joint sealing', 10, TRUE),
('srv-water-tank', 'cat-plumbing', 'Water Tank & Motor Plumbing', 'water-tank-plumbing', 'Overhead tank pipe connection, float valve, booster pump piping', 11, TRUE),
('srv-toilet-repair', 'cat-plumbing', 'Toilet & Flush Tank Repair', 'toilet-flush-repair', 'Flush valve replacement, commode re-fixing, jet spray fitting', 12, TRUE),
('srv-switchboard-repair', 'cat-electrical', 'Switchboard Repair & Socket Replacement', 'switchboard-repair', 'Burnt switches, sparking plug points, modular box replacement', 13, TRUE),
('srv-fan-installation', 'cat-electrical', 'Ceiling Fan Installation & Repair', 'fan-installation', 'Ceiling fan mounting, regulator issues, wobbling fix, capacitor change', 14, TRUE),
('srv-wiring-lighting', 'cat-electrical', 'Short Circuit & Wiring Troubleshooting', 'wiring-lighting', 'Tripping MCB diagnosis, concealed wire burnt fault finding, new light points', 15, TRUE),
('srv-door-repair', 'cat-carpentry', 'Door & Window Repair', 'door-repair', 'Door sticking, alignment, new latch fitting, mesh door repair', 16, TRUE),
('srv-lock-repair', 'cat-carpentry', 'Lock Repair & Installation', 'lock-repair', 'Main door handle lock, cupboard lock, cylinder replacement, safety latch', 17, TRUE),
('srv-wood-furniture', 'cat-carpentry', 'Furniture Assembly & Woodwork Fix', 'wood-furniture', 'Bed hinge fix, modular cabinet repair, dining chair loose joints, drawer slider', 18, TRUE),
('srv-washing-machine', 'cat-ac-appliances', 'Washing Machine Repair', 'washing-machine-repair', 'Drum spinning fault, water inlet valve issue, vibration repair', 19, TRUE)
ON CONFLICT (id) DO UPDATE SET 
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name, 
    slug = EXCLUDED.slug, 
    description = EXCLUDED.description, 
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;

-- 6.3 Standardized Service Aliases
INSERT INTO service_aliases (id, service_id, alias) VALUES
('al-1', 'srv-tap-repair', 'tap leak'),
('al-2', 'srv-tap-repair', 'faucet repair'),
('al-3', 'srv-pipe-leakage', 'pipe burst'),
('al-4', 'srv-pipe-leakage', 'drain blockage'),
('al-5', 'srv-fan-installation', 'fan fitting'),
('al-6', 'srv-switchboard-repair', 'power problem'),
('al-7', 'srv-door-repair', 'lock change'),
('al-8', 'srv-wood-furniture', 'woodwork'),
('al-9', 'srv-ac', 'ac not cooling'),
('al-10', 'srv-tap-repair', 'kuzhai'),
('al-11', 'srv-tap-repair', 'water tap'),
('al-12', 'srv-pipe-leakage', 'leakage'),
('al-13', 'srv-fan-installation', 'fan repair'),
('al-14', 'srv-switchboard-repair', 'current switch'),
('al-15', 'srv-lock-repair', 'poottu repair'),
('al-16', 'srv-ac', 'ac gas filling')
ON CONFLICT (id) DO UPDATE SET 
    service_id = EXCLUDED.service_id, 
    alias = EXCLUDED.alias;

-- -- =========================================================================
-- SETUP VERIFICATION SUMMARY
-- =========================================================================
SELECT 
    'SUCCESS: Schema created and catalog loaded with 0 dummy records.' AS status,
    (SELECT COUNT(*) FROM service_categories) AS total_categories,
    (SELECT COUNT(*) FROM services) AS total_services,
    (SELECT COUNT(*) FROM service_aliases) AS total_aliases,
    (SELECT COUNT(*) FROM workers) AS total_technicians,
    (SELECT COUNT(*) FROM customers) AS total_customers,
    (SELECT COUNT(*) FROM service_requests) AS total_requests;


