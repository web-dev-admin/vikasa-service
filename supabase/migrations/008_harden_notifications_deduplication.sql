-- =========================================================================
-- VIKASA SERVICES & INTERIORS — NOTIFICATION HARDENING & DEDUPLICATION
-- Version: 008
-- Purpose:
-- 1. Deduplicate legacy notifications for the same underlying service request or worker
-- 2. Enforce unique index on (type, related_id) to prevent duplicate notification inserts
-- 3. Add composite indexes on (is_read, created_at DESC) for low-latency queries
-- 4. Verify RLS policies for notifications and admin_notifications
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/obsitdudxijmbqavdmit/sql/new
-- =========================================================================

-- 1. Deduplicate existing notifications (retain latest entry per event)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        DELETE FROM notifications a
        USING notifications b
        WHERE a.ctid < b.ctid
          AND a.type = b.type
          AND a.related_id = b.related_id
          AND a.related_id IS NOT NULL
          AND a.related_id != '';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_notifications') THEN
        DELETE FROM admin_notifications a
        USING admin_notifications b
        WHERE a.ctid < b.ctid
          AND a.type = b.type
          AND a.related_id = b.related_id
          AND a.related_id IS NOT NULL
          AND a.related_id != '';
    END IF;
END $$;

-- 2. Create Unique Partial Indexes to guarantee idempotency on (type, related_id)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_type_related_id 
        ON notifications (type, related_id) 
        WHERE (related_id IS NOT NULL AND related_id != '');

        CREATE INDEX IF NOT EXISTS idx_notifications_is_read_created 
        ON notifications (is_read, created_at DESC);

        CREATE INDEX IF NOT EXISTS idx_notifications_created_desc 
        ON notifications (created_at DESC);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_notifications') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_notifications_type_related_id 
        ON admin_notifications (type, related_id) 
        WHERE (related_id IS NOT NULL AND related_id != '');

        CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read_created 
        ON admin_notifications (is_read, created_at DESC);

        CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_desc 
        ON admin_notifications (created_at DESC);
    END IF;
END $$;

-- 3. Confirm RLS & Permissions
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow notifications access" ON notifications;
        CREATE POLICY "Allow notifications access" ON notifications FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_notifications') THEN
        ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow admin_notifications access" ON admin_notifications;
        CREATE POLICY "Allow admin_notifications access" ON admin_notifications FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
