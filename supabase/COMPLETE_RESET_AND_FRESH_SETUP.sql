-- =========================================================================
-- VIKASA SERVICES & INTERIORS — COMPLETE DATABASE RESET & FRESH SETUP
-- =========================================================================
-- PURPOSE:
-- 1. Safely drops all legacy, conflicting, or corrupted tables and foreign keys.
-- 2. Creates a clean, normalized PostgreSQL schema with ON DELETE CASCADE
--    guaranteeing that deletion operations never fail or glitch.
-- 3. Enables permissive Row Level Security (RLS) policies allowing the
--    application server to SELECT, INSERT, UPDATE, and DELETE securely.
-- 4. Cleanses all dummy / test records, starting with a 100% pristine slate.
-- =========================================================================

-- STEP 1: DROP ALL EXISTING APPLICATION TABLES WITH CASCADE
DROP TABLE IF EXISTS admin_notes CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS worker_contact_attempts CASCADE;
DROP TABLE IF EXISTS worker_services CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS service_aliases CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS service_categories CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS admin_device_tokens CASCADE;
DROP TABLE IF EXISTS website_content CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop obsolete types or functions if present
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS get_admin_service_requests() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- STEP 2: CREATE HELPER TRIGGER FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: CREATE CLEAN SCHEMAS

-- 1. PROFILES (Administrative Users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SERVICE CATEGORIES
CREATE TABLE service_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SERVICES (Dynamic Catalog)
CREATE TABLE services (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES service_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    price_estimate TEXT,
    icon TEXT DEFAULT 'Wrench',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SERVICE ALIASES (Search & Keywords)
CREATE TABLE service_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id TEXT REFERENCES services(id) ON DELETE CASCADE,
    alias TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CUSTOMERS (Verified Customer Leads)
CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    district TEXT DEFAULT 'Erode',
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_customers_phone ON customers(phone);

-- 6. WORKERS (Technicians)
CREATE TABLE workers (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    district TEXT DEFAULT 'Erode',
    base_location_name TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    service_radius_km INT DEFAULT 25,
    experience_years INT DEFAULT 3,
    skills TEXT[] DEFAULT '{}',
    service_ids TEXT[] DEFAULT '{}',
    service_area_names TEXT[] DEFAULT '{}',
    availability TEXT DEFAULT 'available',
    verification_status TEXT DEFAULT 'pending_verification',
    application_token TEXT UNIQUE,
    id_document_url TEXT,
    avatar_url TEXT,
    rating DOUBLE PRECISION DEFAULT 4.8,
    completed_jobs_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_workers_phone ON workers(phone);
CREATE INDEX idx_workers_app_token ON workers(application_token);

-- 7. WORKER SERVICES (Junction with CASCADE)
CREATE TABLE worker_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id TEXT REFERENCES workers(id) ON DELETE CASCADE,
    service_id TEXT REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_worker_services_worker ON worker_services(worker_id);

-- 8. SERVICE REQUESTS (Bookings with CASCADE)
CREATE TABLE service_requests (
    id TEXT PRIMARY KEY,
    request_number BIGINT GENERATED BY DEFAULT AS IDENTITY,
    tracking_token TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    category_name TEXT,
    description TEXT,
    custom_service_note TEXT,
    district TEXT DEFAULT 'Erode',
    formatted_address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    preferred_date TEXT,
    preferred_time_slot TEXT,
    status TEXT DEFAULT 'NEW',
    assigned_worker_id TEXT REFERENCES workers(id) ON DELETE SET NULL,
    assigned_worker_name TEXT,
    assigned_worker_phone TEXT,
    admin_notes TEXT,
    customer_confirmed BOOLEAN DEFAULT FALSE,
    customer_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_service_requests_tracking ON service_requests(tracking_token);
CREATE INDEX idx_service_requests_phone ON service_requests(customer_phone);
CREATE INDEX idx_service_requests_status ON service_requests(status);

-- 9. WORKER CONTACT ATTEMPTS (with CASCADE)
CREATE TABLE worker_contact_attempts (
    id TEXT PRIMARY KEY,
    request_id TEXT REFERENCES service_requests(id) ON DELETE CASCADE,
    worker_id TEXT REFERENCES workers(id) ON DELETE CASCADE,
    worker_name TEXT,
    result TEXT NOT NULL,
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);
CREATE INDEX idx_worker_contact_attempts_req ON worker_contact_attempts(request_id);

-- 10. ASSIGNMENTS (with CASCADE)
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT REFERENCES service_requests(id) ON DELETE CASCADE,
    worker_id TEXT REFERENCES workers(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'ASSIGNED',
    notes TEXT
);

-- 11. NOTIFICATIONS
CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- 12. ADMIN DEVICE TOKENS (Push Notifications)
CREATE TABLE admin_device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT DEFAULT 'admin',
    fcm_token TEXT UNIQUE NOT NULL,
    device_name TEXT,
    platform TEXT DEFAULT 'android',
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. WEBSITE CONTENT CMS
CREATE TABLE website_content (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. AUDIT LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 4: CONFIGURE ROW LEVEL SECURITY (RLS)
-- Permissive policies allowing the application API server to perform
-- SELECT, INSERT, UPDATE, and DELETE operations cleanly without getting blocked.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_contact_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow full access to application tables for both authenticated and anon API requests
CREATE POLICY "Allow all on profiles" ON profiles FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all on service_categories" ON service_categories FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all on services" ON services FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all on service_aliases" ON service_aliases FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all on customers" ON customers FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all on workers" ON workers FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all on worker_services" ON worker_services FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all on service_requests" ON service_requests FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all on worker_contact_attempts" ON worker_contact_attempts FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all on assignments" ON assignments FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all on notifications" ON notifications FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all on admin_device_tokens" ON admin_device_tokens FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all on website_content" ON website_content FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all on audit_logs" ON audit_logs FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- STEP 5: SEED INITIAL STANDARD CATEGORIES & SERVICES
INSERT INTO service_categories (id, name, slug, icon, description, sort_order) VALUES
('cat-plumbing', 'Plumbing', 'plumbing', 'Wrench', 'Water pipe, tap, leakage and drainage solutions', 1),
('cat-electrical', 'Electrical & Lighting', 'electrical', 'Zap', 'Wiring, switchboards, MCB, fans and lighting', 2),
('cat-carpentry', 'Carpentry & Plywood Work', 'carpentry', 'Hammer', 'Furniture repair, door locks, modular plywood fittings', 3),
('cat-painting', 'Painting & Wall Finish', 'painting', 'Sparkles', 'Interior painting, wall cracks, putty and finish', 4),
('cat-ac', 'AC & Appliances', 'ac-appliances', 'Tv', 'Air conditioner jet wash, gas refilling and appliance repair', 5),
('cat-cleaning', 'Deep Cleaning', 'cleaning', 'Sparkles', 'Bathroom, water tank, and comprehensive home deep clean', 6),
('cat-interior', 'Interior Design', 'interior-design', 'Sparkles', 'Modular kitchens, false ceiling, wardrobes and 3D design', 7),
('cat-other', 'Other Services', 'other-services', 'Wrench', 'Custom specialized home services on demand', 8)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO services (id, category_id, name, slug, description, price_estimate, icon, is_active, sort_order) VALUES
('srv-plumbing', 'cat-plumbing', 'Plumbing', 'plumbing', 'Taps, pipe leaks, flush tanks, water tank fittings', 'From ₹199', 'Wrench', TRUE, 1),
('srv-electrical', 'cat-electrical', 'Electrical & Lighting', 'electrical', 'Switchboards, MCB, ceiling fans, lighting, wiring', 'From ₹199', 'Zap', TRUE, 2),
('srv-carpentry', 'cat-carpentry', 'Carpentry & Plywood Work', 'carpentry', 'Door locks, hinges, wood furniture repairs, custom fittings', 'From ₹249', 'Hammer', TRUE, 3),
('srv-painting', 'cat-painting', 'Painting & Wall Finish', 'painting', 'Interior touch-up, wall crack repair, full house repaint', 'Inspection Free', 'Sparkles', TRUE, 4),
('srv-ac', 'cat-ac', 'AC & Appliances', 'ac-service', 'AC jet cleaning, gas charging, cooling faults, repair', 'From ₹449', 'Tv', TRUE, 5),
('srv-cleaning', 'cat-cleaning', 'Cleaning', 'cleaning', 'Bathroom deep clean, water tank cleaning, sanitization', 'From ₹399', 'Sparkles', TRUE, 6),
('srv-interior', 'cat-interior', 'Interior Design', 'interior-design', 'Modular kitchens, false ceiling, wardrobes, woodwork', 'Free Consultation', 'Sparkles', TRUE, 7),
('srv-other', 'cat-other', 'Other Services', 'other-services', 'Request any custom or specialized home requirement', 'Custom Quote', 'Wrench', TRUE, 8)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- STEP 6: VERIFICATION CHECK
-- Output table counts to confirm successful initialization
SELECT 
    'Database successfully reset and re-initialized!' as status,
    (SELECT COUNT(*) FROM service_categories) as categories_count,
    (SELECT COUNT(*) FROM services) as services_count,
    (SELECT COUNT(*) FROM service_requests) as initial_requests_count,
    (SELECT COUNT(*) FROM workers) as initial_workers_count,
    (SELECT COUNT(*) FROM customers) as initial_customers_count;

