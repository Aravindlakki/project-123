-- ==============================================================================
-- ROLLBACK SCRIPT: CRM TABLES ROW LEVEL SECURITY (RLS)
-- Tables: companies, contacts, candidates
-- Reverts restricted assigned_to policies back to open team-authenticated policies
-- ==============================================================================

-- 1. Drop new restricted policies
drop policy if exists "companies_select_assigned" on public.companies;
drop policy if exists "companies_update_assigned" on public.companies;
drop policy if exists "companies_insert" on public.companies;
drop policy if exists "companies_delete" on public.companies;

drop policy if exists "contacts_select_assigned" on public.contacts;
drop policy if exists "contacts_update_assigned" on public.contacts;
drop policy if exists "contacts_insert" on public.contacts;
drop policy if exists "contacts_delete" on public.contacts;

drop policy if exists "candidates_select_assigned" on public.candidates;
drop policy if exists "candidates_update_assigned" on public.candidates;
drop policy if exists "candidates_insert" on public.candidates;
drop policy if exists "candidates_delete" on public.candidates;

-- 2. Restore previous team policies (companies)
create policy "Team members can read companies"
  on public.companies for select
  using (auth.role() = 'authenticated');

create policy "Team members can create companies"
  on public.companies for insert
  with check (auth.role() = 'authenticated');

create policy "Admins and original creators can update companies"
  on public.companies for update
  using (public.is_admin() or auth.uid() = created_by);

create policy "Only Admins can delete companies"
  on public.companies for delete
  using (public.is_admin());

-- 3. Restore previous team policies (contacts)
create policy "Team members can read contacts"
  on public.contacts for select
  using (auth.role() = 'authenticated');

create policy "Team members can create contacts"
  on public.contacts for insert
  with check (auth.role() = 'authenticated');

create policy "Team members can update contacts"
  on public.contacts for update
  using (auth.role() = 'authenticated');

create policy "Only Admins can delete contacts"
  on public.contacts for delete
  using (public.is_admin());

-- 4. Restore open authenticated policies for candidates (if table is kept)
create policy "Team members can read candidates"
  on public.candidates for select
  using (auth.role() = 'authenticated');

create policy "Team members can insert candidates"
  on public.candidates for insert
  with check (auth.role() = 'authenticated');

create policy "Team members can update candidates"
  on public.candidates for update
  using (auth.role() = 'authenticated');

create policy "Only Admins can delete candidates"
  on public.candidates for delete
  using (public.is_admin());

-- 5. Drop helper function if no longer needed
drop function if exists public.is_admin_or_super_admin();
