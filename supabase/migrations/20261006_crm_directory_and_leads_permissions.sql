-- ==============================================================================
-- CRM - Migration: Final Permissions & RLS Hardening for CRM Directory, Leads, and JDs
-- File: supabase/migrations/20261006_crm_directory_and_leads_permissions.sql
-- ==============================================================================

-- 1. COMPANIES TABLE PERMISSIONS:
-- - SELECT: Allowed for all authenticated users (active companies or admin)
-- - INSERT: Allowed for authenticated users (Admin / CRA)
-- - UPDATE: Allowed ONLY for Admins (profiles.role = 'admin')
-- - DELETE: Allowed ONLY for Admins (profiles.role = 'admin')

drop policy if exists "Admins and original creators can update companies" on public.companies;
drop policy if exists "Team members can update companies" on public.companies;
drop policy if exists "Only Admins can update companies" on public.companies;

create policy "Only Admins can update companies"
  on public.companies for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Only Admins can delete companies" on public.companies;
create policy "Only Admins can delete companies"
  on public.companies for delete
  using (public.is_admin());


-- 2. CONTACTS TABLE PERMISSIONS (Leads / HR Contacts):
-- - SELECT: Allowed for all authenticated users
-- - INSERT: Allowed for all authenticated users (Additive-only: adding new HR contacts for roles)
-- - UPDATE: Allowed ONLY for Admins (profiles.role = 'admin')
-- - DELETE: Allowed ONLY for Admins (profiles.role = 'admin')

drop policy if exists "Team members can update contacts" on public.contacts;
drop policy if exists "Only Admins can update contacts" on public.contacts;

create policy "Only Admins can update contacts"
  on public.contacts for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Only Admins can delete contacts" on public.contacts;
create policy "Only Admins can delete contacts"
  on public.contacts for delete
  using (public.is_admin());


-- 3. JOB DESCRIPTIONS (JDs / Roles) PERMISSIONS:
-- - SELECT: Allowed for all authenticated users
-- - INSERT: Allowed for all authenticated users (Additive-only: adding new roles under existing companies)
-- - UPDATE: Allowed ONLY for Admins (profiles.role = 'admin')
-- - DELETE: Allowed ONLY for Admins (profiles.role = 'admin')

drop policy if exists "Team members can update JDs" on public.jds;
drop policy if exists "Only Admins can update JDs" on public.jds;

create policy "Only Admins can update JDs"
  on public.jds for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Only Admins can delete JDs" on public.jds;
create policy "Only Admins can delete JDs"
  on public.jds for delete
  using (public.is_admin());


-- 4. Unique Constraints for Duplicate Prevention (Safety on Database Engine)
-- Ensure no duplicate active role titles under the same company (case-insensitive)
create unique index if not exists idx_unique_jds_company_title 
  on public.jds (company_id, lower(trim(title)));

-- Ensure no duplicate HR names under the same company (case-insensitive)
create unique index if not exists idx_unique_contacts_company_name 
  on public.contacts (company_id, lower(trim(name)))
  where deleted_at is null;
