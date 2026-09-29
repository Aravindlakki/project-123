-- ==============================================================================
-- Optional helper migration to add missing columns to public.contacts table
-- File: supabase/migrations/20260929_optional_contacts_columns.sql
-- ==============================================================================

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS role_title text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS lead_source text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS proof_screenshot_url text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS proof_screenshot_uploaded_at timestamptz;
