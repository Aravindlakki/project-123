-- ==============================================================================
-- PLACEMEIN CRM - ROLLBACK SCRIPT FOR DAILY SHEETS & PERMISSIONS
-- File: supabase/migrations/20260929_daily_sheets_and_permissions_rollback.sql
-- ==============================================================================

-- 1. Drop trigger guard on contacts
DROP TRIGGER IF EXISTS trg_check_contact_updates ON public.contacts;
DROP FUNCTION IF EXISTS public.check_contact_updates();

-- 2. Restore previous policies on contacts
DROP POLICY IF EXISTS "Admins and lead creators can update contacts" ON public.contacts;
CREATE POLICY "Team members can update contacts"
  ON public.contacts FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 3. Restore previous policies on companies
DROP POLICY IF EXISTS "Only Admins can update companies" ON public.companies;
CREATE POLICY "Admins and original creators can update companies"
  ON public.companies FOR UPDATE
  USING (public.is_admin() OR auth.uid() = created_by);

-- 4. Drop performance index
DROP INDEX IF EXISTS idx_contacts_created_at_desc;

-- Note: entered_by_name is a non-destructive nullable text column; 
-- to drop it if ever desired, run:
-- ALTER TABLE public.contacts DROP COLUMN IF EXISTS entered_by_name;
