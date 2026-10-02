-- ==============================================================================
-- CRM - DAILY WORKSHEETS & PERMISSIONS MIGRATION
-- File: supabase/migrations/20260929_daily_sheets_and_permissions.sql
-- Run this in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Performance index for rapid daily sheet sorting & date grouping
CREATE INDEX IF NOT EXISTS idx_contacts_created_at_desc 
  ON public.contacts (created_at DESC);

-- 2. Add entered_by_name (nullable text) for human-readable CRA attribution
-- Existing rows remain untouched (their uploader is resolved via created_by -> profiles)
ALTER TABLE public.contacts 
  ADD COLUMN IF NOT EXISTS entered_by_name text;

COMMENT ON COLUMN public.contacts.entered_by_name 
  IS 'Display name of the CRA who added this lead (fallback attribution).';

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES FOR SHARED TEAM VISIBILITY
-- ==============================================================================

-- Enable RLS on contacts and companies (if not already enabled)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- CONTACTS POLICIES
-- ------------------------------------------------------------------------------

-- SELECT: All authenticated team members can view all leads & daily sheets
DROP POLICY IF EXISTS "Team members can read contacts" ON public.contacts;
CREATE POLICY "Team members can read contacts"
  ON public.contacts FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT: All authenticated team members can add leads to the worksheet
DROP POLICY IF EXISTS "Team members can create contacts" ON public.contacts;
CREATE POLICY "Team members can create contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Admins can update everything; CRAs can only update leads they created
DROP POLICY IF EXISTS "Team members can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins and lead creators can update contacts" ON public.contacts;
CREATE POLICY "Admins and lead creators can update contacts"
  ON public.contacts FOR UPDATE
  USING (
    public.is_admin() OR 
    auth.uid() = created_by OR
    created_by IS NULL -- allow claimed/unassigned legacy leads to be updated
  );

-- DELETE: Strictly Admins only
DROP POLICY IF EXISTS "Only Admins can delete contacts" ON public.contacts;
CREATE POLICY "Only Admins can delete contacts"
  ON public.contacts FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- TRIGGER GUARD: Prevent non-admins from changing company_id or reassigning creator
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_contact_updates()
RETURNS trigger AS $$
BEGIN
  -- Admins can update any field
  IF public.is_admin() THEN
    RETURN new;
  END IF;

  -- Non-admins cannot transfer contact to another company
  IF (new.company_id IS DISTINCT FROM old.company_id) THEN
    RAISE EXCEPTION 'Unauthorized: Only Admins can reassign a lead to a different company.';
  END IF;

  -- Non-admins cannot alter the original created_by attribution
  IF (new.created_by IS DISTINCT FROM old.created_by) THEN
    RAISE EXCEPTION 'Unauthorized: Lead creator attribution cannot be altered.';
  END IF;

  new.updated_at := now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_contact_updates ON public.contacts;
CREATE TRIGGER trg_check_contact_updates
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.check_contact_updates();

-- ------------------------------------------------------------------------------
-- COMPANIES POLICIES
-- ------------------------------------------------------------------------------

-- SELECT: All authenticated team members can read companies
DROP POLICY IF EXISTS "Team members can read companies" ON public.companies;
CREATE POLICY "Team members can read companies"
  ON public.companies FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT: Authenticated users can insert a new company when adding a lead
DROP POLICY IF EXISTS "Team members can create companies" ON public.companies;
CREATE POLICY "Team members can create companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: STRICTLY ADMINS ONLY after creation (CRAs cannot change company size/data later)
DROP POLICY IF EXISTS "Admins and original creators can update companies" ON public.companies;
DROP POLICY IF EXISTS "Only Admins can update companies" ON public.companies;
CREATE POLICY "Only Admins can update companies"
  ON public.companies FOR UPDATE
  USING (public.is_admin());

-- DELETE: Strictly Admins only
DROP POLICY IF EXISTS "Only Admins can delete companies" ON public.companies;
CREATE POLICY "Only Admins can delete companies"
  ON public.companies FOR DELETE
  USING (public.is_admin());
