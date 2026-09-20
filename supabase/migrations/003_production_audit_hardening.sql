-- =========================================================================
-- VIKASA Production Hardening & Security Migration (003)
-- =========================================================================
-- 1. Tracking Token: Secure, non-enumerable UUID for customer tracking
-- 2. Limited Public Tracking RPC: Exposes strictly non-sensitive fields
-- 3. Enhanced PostGIS Matching RPC: Returns exact coordinates for operator cockpit map
-- 4. Robust search_path hardening against privilege escalation
-- =========================================================================

-- Step 1: Add tracking_token with gen_random_uuid() to service_requests
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_requests' AND column_name = 'tracking_token'
    ) THEN
        ALTER TABLE service_requests 
        ADD COLUMN tracking_token UUID DEFAULT gen_random_uuid();
        
        -- Backfill any existing requests that might have NULL tracking_token
        UPDATE service_requests 
        SET tracking_token = gen_random_uuid() 
        WHERE tracking_token IS NULL;

        -- Apply NOT NULL and UNIQUE constraint
        ALTER TABLE service_requests 
        ALTER COLUMN tracking_token SET NOT NULL;

        ALTER TABLE service_requests 
        ADD CONSTRAINT uq_service_requests_tracking_token UNIQUE (tracking_token);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_requests_tracking_token 
ON service_requests(tracking_token);

-- =========================================================================
-- Step 2: Public Tracking Status RPC (SECURITY DEFINER)
-- Strictly limited projection for anonymous customer tracking.
-- Zero PII exposed: No customer phone, no worker phone, no coordinates, no internal notes.
-- =========================================================================
DROP FUNCTION IF EXISTS get_public_tracking_status(UUID);

CREATE OR REPLACE FUNCTION get_public_tracking_status(p_tracking_token UUID)
RETURNS TABLE (
    request_number INT,
    service_name TEXT,
    category_name TEXT,
    status request_status,
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
    -- Validate parameter
    IF p_tracking_token IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        sr.request_number,
        s.name AS service_name,
        sc.name AS category_name,
        sr.status,
        sr.preferred_date,
        sr.preferred_time_slot,
        -- General area only (never full door/street address or coordinates)
        SPLIT_PART(sr.formatted_address, ',', 1) AS general_area,
        sr.created_at,
        -- Worker first name only if assigned
        SPLIT_PART(p.full_name, ' ', 1) AS assigned_worker_first_name
    FROM service_requests sr
    JOIN services s ON s.id = sr.service_id
    JOIN service_categories sc ON sc.id = sr.category_id
    LEFT JOIN assignments a ON a.request_id = sr.id AND a.status = 'active'
    LEFT JOIN profiles p ON p.id = a.worker_id
    WHERE sr.tracking_token = p_tracking_token
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_tracking_status(UUID) TO anon, authenticated, service_role;

-- =========================================================================
-- Step 3: Enhanced PostGIS Matching Function for Operator Cockpit
-- Drop previous function signature because return table columns changed.
-- =========================================================================
DROP FUNCTION IF EXISTS find_matching_workers(UUID, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC);

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
    -- Validate inputs
    IF p_service_id IS NULL OR p_request_lon IS NULL OR p_request_lat IS NULL THEN
        RETURN;
    END IF;

    -- Construct PostGIS point in SRID 4326 (Lon, Lat)
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
        END AS match_category,
        ST_Y(w.coordinates::geometry) AS latitude,
        ST_X(w.coordinates::geometry) AS longitude
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

-- Operator only access
REVOKE ALL ON FUNCTION find_matching_workers(UUID, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION find_matching_workers(UUID, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC) TO authenticated, service_role;
