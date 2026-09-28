-- ==============================================================================
-- Migration: Add status and rejection_reason to public.jds
-- File: supabase/add_jd_status_and_rejection_reason.sql
-- ==============================================================================

-- 1. Create enum for JD approval status if not already present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jd_approval_status') THEN
    CREATE TYPE jd_approval_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

-- 2. Add status column with default 'pending'
ALTER TABLE public.jds
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- 3. Add rejection_reason column for non-eligible/rejected JDs
ALTER TABLE public.jds
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 4. Backfill existing records: verified JDs become 'approved'
UPDATE public.jds
SET status = 'approved'
WHERE is_verified = true AND (status IS NULL OR status = 'pending');

UPDATE public.jds
SET status = 'pending'
WHERE is_verified = false AND status IS NULL;
