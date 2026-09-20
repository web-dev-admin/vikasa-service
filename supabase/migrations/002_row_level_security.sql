-- Row Level Security (RLS) Policies for VIKASA
-- Strictly enforces Privacy Rules:
-- 1. Worker phone NEVER exposed to customer.
-- 2. Customer phone NEVER exposed to worker.
-- 3. Worker can only read assigned job minimal fulfillment info.
-- 4. Admins have complete operational access.

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

-- Helper function: Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Service Categories & Services: Public read for active rows, Admin full access
CREATE POLICY "Public read active categories" ON service_categories
    FOR SELECT USING (is_active = TRUE OR is_admin());

CREATE POLICY "Admin manage categories" ON service_categories
    FOR ALL USING (is_admin());

CREATE POLICY "Public read active services" ON services
    FOR SELECT USING (is_active = TRUE OR is_admin());

CREATE POLICY "Admin manage services" ON services
    FOR ALL USING (is_admin());

CREATE POLICY "Public read service aliases" ON service_aliases
    FOR SELECT USING (TRUE);

-- Profiles: Users can read/write their own profile; Admins can read all
CREATE POLICY "Users view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Workers:
-- Worker can view & update their own record.
-- Admins can view and update all workers.
CREATE POLICY "Worker view own profile" ON workers
    FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY "Worker update own profile" ON workers
    FOR UPDATE USING (auth.uid() = id OR is_admin());

CREATE POLICY "Admin full worker access" ON workers
    FOR ALL USING (is_admin());

-- Worker Services:
CREATE POLICY "Worker manage own services" ON worker_services
    FOR ALL USING (auth.uid() = worker_id OR is_admin());

-- Customers:
-- Customers can view their own profile; Admins view all.
CREATE POLICY "Customer view own" ON customers
    FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Anonymous customer create lead" ON customers
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admin manage customers" ON customers
    FOR ALL USING (is_admin());

-- Service Requests:
-- 1. Anyone (anonymous or logged-in) can insert a new service request.
CREATE POLICY "Allow public insert service request" ON service_requests
    FOR INSERT WITH CHECK (TRUE);

-- 2. Customer can view their own service requests.
CREATE POLICY "Customer view own requests" ON service_requests
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM customers WHERE id = service_requests.customer_id)
        OR is_admin()
    );

-- 3. Worker can only view request if assigned to them.
CREATE POLICY "Worker view assigned request only" ON service_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignments 
            WHERE assignments.request_id = service_requests.id 
            AND assignments.worker_id = auth.uid()
        )
    );

-- 4. Admins have full access to service requests.
CREATE POLICY "Admin manage service requests" ON service_requests
    FOR ALL USING (is_admin());

-- Worker Contact Attempts: Only operators/admins can view or insert.
CREATE POLICY "Admin manage contact attempts" ON worker_contact_attempts
    FOR ALL USING (is_admin());

-- Assignments:
CREATE POLICY "Admin manage assignments" ON assignments
    FOR ALL USING (is_admin());

CREATE POLICY "Worker view own assignments" ON assignments
    FOR SELECT USING (auth.uid() = worker_id OR is_admin());

-- Admin Notes & Audit Logs: strictly Admin only
CREATE POLICY "Admin notes access" ON admin_notes
    FOR ALL USING (is_admin());

CREATE POLICY "Admin audit logs access" ON audit_logs
    FOR ALL USING (is_admin());
