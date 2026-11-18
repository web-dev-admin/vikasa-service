-- =========================================================================
-- VIKASA SERVICES & INTERIORS — NOTIFICATION HARDENING & DEDUPLICATION
-- Version: 008
-- Purpose:
-- 1. Deduplicate legacy notifications for the same underlying service request or worker
--    - Uses created_at DESC (newest record preserved)
--    - Uses is_read ASC as second priority (preserves unread status on timestamp ties)
--    - Uses id DESC as deterministic tie-breaker
--    - Properly excludes NULL and empty string related_id records (broadcasts)
-- 2. Standardize existing IDs to deterministic format 'notif-<type>-<related_id>'
-- 3. Enforce unique index on (type, related_id) to prevent duplicate notification inserts
-- 4. Add composite indexes on (is_read, created_at DESC) for low-latency queries
-- 5. Verify RLS policies for notifications and admin_notifications
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/obsitdudxijmbqavdmit/sql/new
-- =========================================================================

-- 1. Deduplicate existing notifications table (retain latest entry per entity event)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        WITH ranked AS (
            SELECT id,
                   ROW_NUMBER() OVER (
                       PARTITION BY type, related_id
                       ORDER BY
                           created_at DESC NULLS LAST,
                           is_read ASC,
                           id DESC
                   ) as rn
            FROM notifications
            WHERE related_id IS NOT NULL 
              AND related_id != ''
        )
        DELETE FROM notifications
        WHERE id IN (
            SELECT id FROM ranked WHERE rn > 1
        );

        -- Standardize IDs of remaining entity notifications to deterministic format
        -- to ensure upsert { onConflict: 'id' } perfectly aligns with unique index
        UPDATE notifications
        SET id = 'notif-' || type || '-' || related_id
        WHERE related_id IS NOT NULL 
          AND related_id != ''
          AND id != ('notif-' || type || '-' || related_id);
    END IF;

    -- 2. Deduplicate admin_notifications table independently
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_notifications') THEN
        WITH ranked_admin AS (
            SELECT id,
                   ROW_NUMBER() OVER (
                       PARTITION BY type, related_id
                       ORDER BY
                           created_at DESC NULLS LAST,
                           is_read ASC,
                           id DESC
                   ) as rn
            FROM admin_notifications
            WHERE related_id IS NOT NULL 
              AND related_id != ''
        )
        DELETE FROM admin_notifications
        WHERE id IN (
            SELECT id FROM ranked_admin WHERE rn > 1
        );

        -- Standardize IDs of remaining admin notifications
        UPDATE admin_notifications
        SET id = 'notif-' || type || '-' || related_id
        WHERE related_id IS NOT NULL 
          AND related_id != ''
          AND id != ('notif-' || type || '-' || related_id);
    END IF;
END $$;

-- 3. Create Unique Partial Indexes to guarantee idempotency on (type, related_id)
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

-- 4. Confirm RLS & Permissions
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
