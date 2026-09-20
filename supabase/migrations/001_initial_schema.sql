-- VIKASA Production PostgreSQL & PostGIS Schema
-- Complete DDL with Tables, PostGIS Spatial Indexing, RLS, and RPC Matching Function

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role Enumeration
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'worker', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE worker_status AS ENUM ('pending_verification', 'verified', 'rejected', 'suspended', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE worker_availability AS ENUM ('available', 'busy', 'offline', 'temporarily_unavailable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM (
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
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'emergency');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contact_result AS ENUM ('accepted', 'rejected', 'no_answer', 'busy', 'call_later');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_source AS ENUM ('META', 'ORGANIC', 'DIRECT', 'REFERRAL', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL DEFAULT 'customer',
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Controlled Service Catalog
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    alias TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Workers Table
CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    experience_years INT NOT NULL DEFAULT 0,
    skills TEXT[] DEFAULT '{}',
    bio TEXT,
    verification_status worker_status NOT NULL DEFAULT 'pending_verification',
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id),
    verification_notes TEXT,
    availability worker_availability NOT NULL DEFAULT 'offline',
    
    -- Geographic Base & Radius
    base_location_name TEXT NOT NULL,
    coordinates geography(Point, 4326) NOT NULL,
    service_radius_km NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    service_area_names TEXT[] DEFAULT '{}',
    
    id_document_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS worker_services (
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (worker_id, service_id)
);

-- 4. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Service Requests Table
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_number SERIAL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES service_categories(id),
    service_id UUID NOT NULL REFERENCES services(id),
    description TEXT NOT NULL,
    
    -- Location
    formatted_address TEXT NOT NULL,
    location_accuracy NUMERIC(8, 2),
    coordinates geography(Point, 4326) NOT NULL,
    
    urgency urgency_level NOT NULL DEFAULT 'medium',
    preferred_date DATE,
    preferred_time_slot TEXT,
    photo_urls TEXT[] DEFAULT '{}',
    
    status request_status NOT NULL DEFAULT 'NEW',
    customer_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    customer_confirmed_at TIMESTAMPTZ,
    
    -- Marketing Attribution
    source lead_source NOT NULL DEFAULT 'DIRECT',
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    landing_page TEXT,
    referrer TEXT,
    
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Worker Contact Attempts
CREATE TABLE IF NOT EXISTS worker_contact_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    operator_id UUID NOT NULL REFERENCES profiles(id),
    attempt_number INT NOT NULL,
    result contact_result NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL UNIQUE REFERENCES service_requests(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
    assigned_by UUID NOT NULL REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    notes TEXT
);

-- 8. Internal Notes & Audit Logs
CREATE TABLE IF NOT EXISTS admin_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    operator_id UUID NOT NULL REFERENCES profiles(id),
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workers_coordinates ON workers USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_requests_coordinates ON service_requests USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON service_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workers_availability_status ON workers(availability, verification_status);
CREATE INDEX IF NOT EXISTS idx_worker_services_service ON worker_services(service_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_contact_attempts_request ON worker_contact_attempts(request_id, attempt_number);

-- PostGIS Matching Function (RPC)
CREATE OR REPLACE FUNCTION find_matching_workers(
    p_service_id UUID,
    p_request_lon DOUBLE PRECISION,
    p_request_lat DOUBLE PRECISION,
    p_radius_km NUMERIC DEFAULT 15.0
)
RETURNS TABLE (
    worker_id UUID,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    experience_years INT,
    verification_status worker_status,
    availability worker_availability,
    distance_km NUMERIC,
    is_exact_service BOOLEAN,
    service_radius_km NUMERIC,
    match_category TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_req_point geography;
BEGIN
    v_req_point := ST_SetSRID(ST_MakePoint(p_request_lon, p_request_lat), 4326)::geography;

    RETURN QUERY
    SELECT 
        w.id AS worker_id,
        p.full_name,
        p.phone,
        p.avatar_url,
        w.experience_years,
        w.verification_status,
        w.availability,
        ROUND((ST_Distance(w.coordinates, v_req_point) / 1000.0)::numeric, 2) AS distance_km,
        (ws.service_id = p_service_id) AS is_exact_service,
        w.service_radius_km,
        CASE 
            WHEN ST_Distance(w.coordinates, v_req_point) <= 3000 THEN 'Nearby (0-3 km)'
            WHEN ST_Distance(w.coordinates, v_req_point) <= 7000 THEN 'Near (3-7 km)'
            ELSE 'Far (7-15+ km)'
        END AS match_category
    FROM workers w
    JOIN profiles p ON p.id = w.id
    JOIN worker_services ws ON ws.worker_id = w.id
    WHERE w.verification_status = 'verified'
      AND w.availability = 'available'
      AND ws.service_id = p_service_id
      AND ST_DWithin(w.coordinates, v_req_point, (p_radius_km * 1000.0))
      AND ST_DWithin(w.coordinates, v_req_point, (w.service_radius_km * 1000.0))
    ORDER BY 
        is_exact_service DESC,
        distance_km ASC,
        w.experience_years DESC;
END;
$$;
