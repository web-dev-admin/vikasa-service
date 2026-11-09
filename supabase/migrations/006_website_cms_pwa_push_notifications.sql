-- =========================================================================
-- VIKASA SERVICES & INTERIORS — MIGRATION 006
-- WEBSITE CMS, PWA DEVICE TOKENS, AND REAL-TIME WEB PUSH NOTIFICATIONS
-- =========================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Website Content Table (CMS for Live Website Editing)
CREATE TABLE IF NOT EXISTS website_content (
    key TEXT PRIMARY KEY,
    content JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT
);

-- Index for instant key lookups
CREATE INDEX IF NOT EXISTS idx_website_content_key ON website_content(key);

-- 3. Admin FCM Device Tokens (PWA & Android Push Notifications)
CREATE TABLE IF NOT EXISTS admin_device_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_email TEXT NOT NULL,
    fcm_token TEXT NOT NULL UNIQUE,
    device_name TEXT,
    platform TEXT DEFAULT 'android' CHECK (platform IN ('android', 'ios', 'web')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_device_tokens_active ON admin_device_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_device_tokens_email ON admin_device_tokens(admin_email);

-- 4. In-App & Push Notifications Center Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('service_request', 'technician_application', 'contact_inquiry', 'status_update')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id TEXT,
    related_type TEXT CHECK (related_type IN ('request', 'worker', 'contact')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 5. Row Level Security (RLS) Policies
ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Website Content: Public read is permitted so the customer frontend can display live CMS updates
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public can view website content" ON website_content;
    CREATE POLICY "Public can view website content"
        ON website_content FOR SELECT
        USING (true);
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Website Content: Only authenticated administrators can modify
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admin can manage website content" ON website_content;
    CREATE POLICY "Admin can manage website content"
        ON website_content FOR ALL
        USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin') OR auth.role() = 'service_role');
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Device Tokens: Privileged access only
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admin can manage device tokens" ON admin_device_tokens;
    CREATE POLICY "Admin can manage device tokens"
        ON admin_device_tokens FOR ALL
        USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin') OR auth.role() = 'service_role');
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Notifications: Privileged access only
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admin can manage notifications" ON notifications;
    CREATE POLICY "Admin can manage notifications"
        ON notifications FOR ALL
        USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin') OR auth.role() = 'service_role');
EXCEPTION WHEN undefined_object THEN null;
END $$;

