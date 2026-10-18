-- =========================================================================
-- VIKASA DEDUPLICATE & CANONICAL DATA RESTORATION SCRIPT
-- =========================================================================
-- Use this script in the Supabase SQL Editor if you have existing tables
-- and want to remove all duplicate categories, services, aliases, or workers
-- and ensure only 100% correct, verified canonical records exist.
-- =========================================================================

-- =========================================================================
-- STEP 1: MIGRATE & UNIFY OBSOLETE OR CONFLICTING CATEGORIES
-- =========================================================================

-- 1.1 First ensure the canonical categories exist
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

-- 1.2 Remap any services pointing to obsolete 'cat-cleaning-painting'
UPDATE services 
SET category_id = 'cat-cleaning' 
WHERE category_id = 'cat-cleaning-painting' AND (slug ILIKE '%clean%' OR name ILIKE '%clean%');

UPDATE services 
SET category_id = 'cat-painting' 
WHERE category_id = 'cat-cleaning-painting' AND (slug ILIKE '%paint%' OR name ILIKE '%paint%');

UPDATE services 
SET category_id = 'cat-cleaning' 
WHERE category_id = 'cat-cleaning-painting';

-- Remap requests pointing to obsolete 'cat-cleaning-painting'
UPDATE service_requests
SET category_id = 'cat-cleaning', category_name = 'Cleaning'
WHERE category_id = 'cat-cleaning-painting' AND (service_name ILIKE '%clean%' OR description ILIKE '%clean%');

UPDATE service_requests
SET category_id = 'cat-painting', category_name = 'Painting'
WHERE category_id = 'cat-cleaning-painting';

-- 1.3 Remove duplicate categories keeping only canonical IDs
DELETE FROM service_categories 
WHERE id NOT IN (
    'cat-plumbing', 'cat-cleaning', 'cat-interior', 'cat-electrical',
    'cat-ac-appliances', 'cat-painting', 'cat-carpentry', 'cat-other'
);

-- Delete any remaining duplicate categories sharing a slug or name
DELETE FROM service_categories a USING service_categories b
WHERE a.slug = b.slug AND a.id > b.id;

DELETE FROM service_categories a USING service_categories b
WHERE a.name = b.name AND a.id > b.id;


-- =========================================================================
-- STEP 2: DEDUPLICATE & STANDARDIZE SERVICES
-- =========================================================================

-- 2.1 Upsert 8 Canonical Primary Trades and 11 Detailed Subservices
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

-- 2.2 Remap any requests pointing to non-canonical duplicate service IDs
UPDATE service_requests SET service_id = 'srv-plumbing' WHERE service_id NOT IN (SELECT id FROM services) AND (service_name ILIKE '%plumb%');
UPDATE service_requests SET service_id = 'srv-electrical' WHERE service_id NOT IN (SELECT id FROM services) AND (service_name ILIKE '%elect%');
UPDATE service_requests SET service_id = 'srv-cleaning' WHERE service_id NOT IN (SELECT id FROM services) AND (service_name ILIKE '%clean%');
UPDATE service_requests SET service_id = 'srv-ac' WHERE service_id NOT IN (SELECT id FROM services) AND (service_name ILIKE '%ac%');
UPDATE service_requests SET service_id = 'srv-painting' WHERE service_id NOT IN (SELECT id FROM services) AND (service_name ILIKE '%paint%');
UPDATE service_requests SET service_id = 'srv-carpentry' WHERE service_id NOT IN (SELECT id FROM services) AND (service_name ILIKE '%carp%');
UPDATE service_requests SET service_id = 'srv-interior' WHERE service_id NOT IN (SELECT id FROM services) AND (service_name ILIKE '%interior%');

-- 2.3 Delete any legacy duplicate services by slug (preserving canonical 'srv-' IDs)
DELETE FROM services 
WHERE id NOT LIKE 'srv-%' 
  AND slug IN (SELECT slug FROM services WHERE id LIKE 'srv-%');

DELETE FROM services a USING services b
WHERE a.slug = b.slug AND a.id > b.id;


-- =========================================================================
-- STEP 3: DEDUPLICATE & STANDARDIZE SERVICE ALIASES
-- =========================================================================

-- 3.1 Clean existing duplicate aliases
DELETE FROM service_aliases a USING service_aliases b
WHERE LOWER(TRIM(a.alias)) = LOWER(TRIM(b.alias)) AND a.id > b.id;

-- 3.2 Insert standard aliases
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


-- =========================================================================
-- STEP 4: DEDUPLICATE & UPDATE TECHNICIANS (WORKERS)
-- =========================================================================

-- 4.1 Delete any duplicate technicians sharing normalized phone numbers
DELETE FROM workers a USING workers b
WHERE REGEXP_REPLACE(a.phone, '[^0-9]', '', 'g') = REGEXP_REPLACE(b.phone, '[^0-9]', '', 'g')
  AND a.id > b.id;

-- 4.2 Upsert 9 verified regional technicians
INSERT INTO workers (
    id, full_name, phone, whatsapp, email, experience_years, skills, bio,
    verification_status, availability, active_status, district, base_location_name,
    latitude, longitude, service_radius_km, service_area_names, service_ids
) VALUES
(
    'w-kumar',
    'Kumarasamy R.',
    '+91 98427 11029',
    '+91 98427 11029',
    'kumar.plumbing@example.com',
    7,
    ARRAY['Pipe Leakage', 'Tap Fitting', 'Bathroom Plumbing', 'Water Tank'],
    'Experienced master plumber specialized in high-pressure bathroom and concealed pipe repairs.',
    'verified',
    'available',
    'active',
    'Salem',
    'Suramangalam, Salem',
    11.6710,
    78.1250,
    20.00,
    ARRAY['Suramangalam', 'Fairlands', 'Meyyanur', 'Salem Junction'],
    ARRAY['srv-plumbing', 'srv-pipe-leakage', 'srv-tap-repair', 'srv-water-tank', 'srv-toilet-repair']
),
(
    'w-mani',
    'Manikandan S.',
    '+91 97890 44211',
    '+91 97890 44211',
    'mani.plumbing@example.com',
    5,
    ARRAY['Angle Cock Repair', 'Drain Blockage Clear', 'Overhead Tank Connection'],
    'Quick response emergency plumber with rotary drain clear tools.',
    'verified',
    'available',
    'active',
    'Salem',
    'Fairlands, Salem',
    11.6685,
    78.1410,
    15.00,
    ARRAY['Fairlands', 'Hasthampatti', 'Alagapuram', 'Meyyanur'],
    ARRAY['srv-plumbing', 'srv-pipe-leakage', 'srv-tap-repair', 'srv-water-tank']
),
(
    'w-ravi-erode',
    'Ravi Kumar',
    '+91 94432 88102',
    '+91 94432 88102',
    'ravi.plumber.erode@example.com',
    11,
    ARRAY['Plumbing', 'Pipe Repair', 'Drainage Laying', 'Motor Pump'],
    'Senior plumbing technician with over a decade of residential and commercial plumbing experience.',
    'verified',
    'available',
    'active',
    'Erode',
    'Perundurai Road, Erode',
    11.3410,
    77.7172,
    25.00,
    ARRAY['Perundurai Road', 'Brough Road', 'Thindal', 'Surampatti'],
    ARRAY['srv-plumbing', 'srv-pipe-leakage', 'srv-water-tank', 'srv-toilet-repair']
),
(
    'w-selvam-elec',
    'Selvamurugan K.',
    '+91 98941 55670',
    '+91 98941 55670',
    'selvam.electrician@example.com',
    8,
    ARRAY['MCB Tripping', '3-Phase Wiring', 'Inverter Installation', 'Switchboard Fixes'],
    'Licensed B-grade electrical contractor. Fast fault-finding specialist.',
    'verified',
    'available',
    'active',
    'Salem',
    'Meyyanur, Salem',
    11.6620,
    78.1320,
    18.00,
    ARRAY['Meyyanur', 'New Bus Stand', 'Kandhampatti', 'Fairlands'],
    ARRAY['srv-electrical', 'srv-switchboard-repair', 'srv-fan-installation', 'srv-wiring-lighting']
),
(
    'w-prakash-elec',
    'Prakash Velu',
    '+91 96291 33455',
    '+91 96291 33455',
    NULL,
    4,
    ARRAY['Ceiling Fan Repair', 'Switchboard Assembly', 'Geyser Electrical Connection'],
    'Prompt and detail-oriented electrician for quick domestic troubleshooting.',
    'verified',
    'available',
    'active',
    'Salem',
    'Ammapet, Salem',
    11.6540,
    78.1750,
    15.00,
    ARRAY['Ammapet', 'Ponnammapet', 'Udayapatty', 'Pattai'],
    ARRAY['srv-electrical', 'srv-fan-installation', 'srv-switchboard-repair']
),
(
    'w-murugan-carp',
    'Murugesan A.',
    '+91 94862 77019',
    '+91 94862 77019',
    NULL,
    12,
    ARRAY['Teakwood Door Fixing', 'Godrej Lock Fitting', 'Modular Kitchen Hinge Repair', 'Interior Woodwork'],
    'Master carpenter with 12 years experience in door alignments, sliding wardrobes, and lock sets.',
    'verified',
    'available',
    'active',
    'Salem',
    'Shevapet, Salem',
    11.6510,
    78.1390,
    20.00,
    ARRAY['Shevapet', 'Gugai', 'Bazaar', 'Dadagapatty'],
    ARRAY['srv-carpentry', 'srv-door-repair', 'srv-lock-repair', 'srv-wood-furniture', 'srv-interior']
),
(
    'w-vijay-ac',
    'Vijay Anand',
    '+91 97500 22341',
    '+91 97500 22341',
    NULL,
    6,
    ARRAY['Inverter AC Servicing', 'Gas Charging R32/R410A', 'Compressor Replacement', 'Jet Wash'],
    'Certified HVAC technician equipped with pressure gauges and jet wash pump.',
    'verified',
    'available',
    'active',
    'Salem',
    'Alagapuram, Salem',
    11.6810,
    78.1430,
    25.00,
    ARRAY['Alagapuram', 'Fairlands', 'Hasthampatti', 'Reddiyur'],
    ARRAY['srv-ac', 'srv-washing-machine']
),
(
    'w-karthik-cleaning',
    'Karthik Deepan',
    '+91 98433 99881',
    '+91 98433 99881',
    NULL,
    5,
    ARRAY['Deep Bathroom Cleaning', 'Water Tank Jet Cleaning', 'Floor Polishing'],
    'Professional residential and commercial deep cleaning specialist.',
    'verified',
    'available',
    'active',
    'Dharmapuri',
    'Collectorate Area, Dharmapuri',
    12.1211,
    78.1582,
    25.00,
    ARRAY['Dharmapuri Town', 'Pennagaram Road', 'Nallampalli'],
    ARRAY['srv-cleaning', 'srv-painting']
),
(
    'w-saravanan-coimbatore',
    'Saravanan M.',
    '+91 99441 66520',
    '+91 99441 66520',
    NULL,
    9,
    ARRAY['Interior Design Consultation', 'Modular Kitchen', 'False Ceiling', 'Carpentry'],
    'Interior finishes and architectural woodwork specialist in Western Tamil Nadu.',
    'verified',
    'available',
    'active',
    'Coimbatore',
    'Gandhipuram, Coimbatore',
    11.0168,
    76.9558,
    30.00,
    ARRAY['Gandhipuram', 'RS Puram', 'Peelamedu', 'Saravanampatti'],
    ARRAY['srv-interior', 'srv-carpentry', 'srv-painting']
)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    whatsapp = EXCLUDED.whatsapp,
    experience_years = EXCLUDED.experience_years,
    skills = EXCLUDED.skills,
    bio = EXCLUDED.bio,
    verification_status = EXCLUDED.verification_status,
    availability = EXCLUDED.availability,
    active_status = EXCLUDED.active_status,
    district = EXCLUDED.district,
    base_location_name = EXCLUDED.base_location_name,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    service_radius_km = EXCLUDED.service_radius_km,
    service_area_names = EXCLUDED.service_area_names,
    service_ids = EXCLUDED.service_ids;


-- =========================================================================
-- STEP 5: DEDUPLICATE & UPDATE CUSTOMERS & SAMPLE REQUESTS
-- =========================================================================

-- 5.1 Deduplicate customers by phone
DELETE FROM customers a USING customers b
WHERE REGEXP_REPLACE(a.phone, '[^0-9]', '', 'g') = REGEXP_REPLACE(b.phone, '[^0-9]', '', 'g')
  AND a.id > b.id;

INSERT INTO customers (id, full_name, phone, whatsapp, district, address, latitude, longitude) VALUES
('cust-1', 'Arun Kumar', '+91 98401 22334', '+91 98401 22334', 'Erode', 'Plot 42, 5th Cross, Perundurai Road, Erode', 11.3410, 77.7172),
('cust-2', 'Meena Sundaram', '+91 97892 11456', '+91 97892 11456', 'Salem', 'No 18, Meyyanur Main Road, Salem', 11.6630, 78.1330),
('cust-3', 'Karthik N.', '+91 94433 77881', '+91 94433 77881', 'Dharmapuri', '12 Gandhi Nagar, Near Collectorate, Dharmapuri', 12.1211, 78.1582),
('cust-4', 'Dr. Anitha Mohan', '+91 98421 99012', '+91 98421 99012', 'Salem', 'Fairlands Main Road, Salem', 11.6720, 78.1380),
('cust-5', 'Suresh Babu', '+91 96290 88712', '+91 96290 88712', 'Coimbatore', '45 Cross Cut Road, Gandhipuram, Coimbatore', 11.0168, 76.9558)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    whatsapp = EXCLUDED.whatsapp,
    district = EXCLUDED.district,
    address = EXCLUDED.address,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude;

-- 5.2 Upsert sample requests
INSERT INTO service_requests (
    id, request_number, customer_id, customer_name, customer_phone, customer_whatsapp,
    category_id, category_name, service_id, service_name, description,
    formatted_address, district, latitude, longitude, preferred_date,
    status, customer_confirmed, customer_confirmed_at, tracking_token,
    assigned_worker_id, assigned_worker_name, assigned_worker_phone
) VALUES
(
    'req-1042', 1042, 'cust-1', 'Arun Kumar', '+91 98401 22334', '+91 98401 22334',
    'cat-plumbing', 'Plumbing', 'srv-plumbing', 'Plumbing',
    'Bathroom pipe joint leaking under washbasin, water dripping continuously.',
    'Plot 42, 5th Cross, Perundurai Road, Erode', 'Erode', 11.3410, 77.7172, '2026-10-06',
    'NEW', FALSE, NULL, 'e7b1a234-8c90-4d56-a123-456789abc101',
    NULL, NULL, NULL
),
(
    'req-1043', 1043, 'cust-2', 'Meena Sundaram', '+91 97892 11456', '+91 97892 11456',
    'cat-electrical', 'Electrical', 'srv-electrical', 'Electrical',
    'Kitchen main switchboard sparking when induction stove is plugged in.',
    'No 18, Meyyanur Main Road, Salem', 'Salem', 11.6630, 78.1330, '2026-10-06',
    'CUSTOMER_CONFIRMED', TRUE, NOW() - INTERVAL '30 minutes', 'e7b1a234-8c90-4d56-a123-456789abc102',
    NULL, NULL, NULL
),
(
    'req-1044', 1044, 'cust-3', 'Karthik N.', '+91 94433 77881', '+91 94433 77881',
    'cat-cleaning', 'Cleaning', 'srv-cleaning', 'Cleaning',
    'Full house deep cleaning required before housewarming.',
    '12 Gandhi Nagar, Near Collectorate, Dharmapuri', 'Dharmapuri', 12.1211, 78.1582, '2026-10-07',
    'ASSIGNED', TRUE, NOW() - INTERVAL '1 hour', 'e7b1a234-8c90-4d56-a123-456789abc103',
    'w-karthik-cleaning', 'Karthik Deepan', '+91 98433 99881'
),
(
    'req-1045', 1045, 'cust-4', 'Dr. Anitha Mohan', '+91 98421 99012', '+91 98421 99012',
    'cat-ac-appliances', 'AC & Appliances', 'srv-ac', 'AC Service',
    'Split AC not cooling properly in master bedroom, need filter cleaning and gas check.',
    'Fairlands Main Road, Salem', 'Salem', 11.6720, 78.1380, '2026-10-05',
    'COMPLETED', TRUE, NOW() - INTERVAL '4 hours', 'e7b1a234-8c90-4d56-a123-456789abc104',
    'w-vijay-ac', 'Vijay Anand', '+91 97500 22341'
)
ON CONFLICT (id) DO UPDATE SET
    customer_id = EXCLUDED.customer_id,
    customer_name = EXCLUDED.customer_name,
    customer_phone = EXCLUDED.customer_phone,
    customer_whatsapp = EXCLUDED.customer_whatsapp,
    category_id = EXCLUDED.category_id,
    category_name = EXCLUDED.category_name,
    service_id = EXCLUDED.service_id,
    service_name = EXCLUDED.service_name,
    description = EXCLUDED.description,
    formatted_address = EXCLUDED.formatted_address,
    district = EXCLUDED.district,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    status = EXCLUDED.status,
    customer_confirmed = EXCLUDED.customer_confirmed,
    assigned_worker_id = EXCLUDED.assigned_worker_id,
    assigned_worker_name = EXCLUDED.assigned_worker_name,
    assigned_worker_phone = EXCLUDED.assigned_worker_phone;

-- =========================================================================
-- FINAL CLEANUP STATUS
-- =========================================================================
SELECT 
    'SUCCESS: Duplicates purged and canonical records restored.' AS result,
    (SELECT COUNT(*) FROM service_categories) AS total_categories,
    (SELECT COUNT(*) FROM services) AS total_services,
    (SELECT COUNT(*) FROM service_aliases) AS total_aliases,
    (SELECT COUNT(*) FROM workers) AS total_technicians,
    (SELECT COUNT(*) FROM customers) AS total_customers,
    (SELECT COUNT(*) FROM service_requests) AS total_requests;
