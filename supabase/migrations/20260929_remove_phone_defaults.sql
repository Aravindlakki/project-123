-- Migration: 20260929_remove_phone_defaults.sql
-- Purpose: Remove any DB-level default or auto-generation for phone numbers.
-- Enforces manual-only phone entry (NULL allowed, no default value).
-- Extends contacts table for the new ADD LEAD -> HR SOURCING pipeline stage.

-- 1. Ensure phone column has no default and allows NULL
ALTER TABLE public.contacts ALTER COLUMN phone DROP DEFAULT;
DO $$ 
BEGIN
  -- Check if phone column has a not-null constraint and drop it if present
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'contacts' 
      AND column_name = 'phone' 
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.contacts ALTER COLUMN phone DROP NOT NULL;
  END IF;
END $$;

-- 2. Ensure job_descriptions / jds table has no phone default
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'job_descriptions' 
      AND column_name = 'hr_phone'
  ) THEN
    ALTER TABLE public.job_descriptions ALTER COLUMN hr_phone DROP DEFAULT;
  END IF;
END $$;

-- 3. Add HR Sourcing pipeline columns to contacts table if not existing
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS status text DEFAULT 'HR Sourcing';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS lead_source text DEFAULT 'Manual';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS role_title text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS notes text;

-- 4. Drop any legacy trigger or function that might auto-fill phone numbers
DROP TRIGGER IF EXISTS trg_fill_dummy_phone ON public.contacts;
DROP FUNCTION IF EXISTS fill_dummy_phone();

-- 5. Safe query for administrators to inspect potential legacy auto-generated numbers
-- (e.g. repeated numbers or numbers matching test patterns like '9876543210', '9123456789')
-- DO NOT automatically delete without CRA / Admin confirmation:
-- SELECT c.id, c.name AS hr_name, co.name AS company_name, c.phone, c.created_at
-- FROM public.contacts c
-- LEFT JOIN public.companies co ON co.id = c.company_id
-- WHERE c.phone IN ('+91 98765 43210', '9876543210', '+91 91234 56789', '+91 99887 76655', '+91 98450 11223')
--    OR c.phone LIKE '%98765 4321%'
--    OR c.phone LIKE '%1234 5678%';

COMMENT ON COLUMN public.contacts.phone IS 'Recruiter-verified direct HR contact phone number (entered manually only).';
