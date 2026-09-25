-- ==============================================================================
-- SUPABASE POSTGRESQL ROW LEVEL SECURITY (RLS) MIGRATION SCRIPT
-- Tables: companies, contacts, candidates
-- 
-- Rules:
-- 1. Standard recruiters/CRAs can ONLY view and update records where assigned_to = auth.uid()
-- 2. Admins & Super Admins bypass the filter (via app_metadata, user_metadata, or public.profiles)
-- 3. Fully idempotent (safe to run multiple times)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: Ensure user_role enum supports 'super_admin' (if enum exists)
-- ------------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_type where typname = 'user_role') then
    alter type user_role add value if not exists 'super_admin';
  end if;
end
$$;

-- ------------------------------------------------------------------------------
-- STEP 2: Ensure tables and assigned_to columns exist
-- ------------------------------------------------------------------------------

-- Ensure 'candidates' table exists if not already present
create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  current_company text,
  current_title text,
  experience_years numeric(4,1),
  skills text[],
  status text not null default 'lead',
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure assigned_to column exists on companies, contacts, and candidates
alter table public.companies 
  add column if not exists assigned_to uuid references auth.users(id) on delete set null;

alter table public.contacts 
  add column if not exists assigned_to uuid references auth.users(id) on delete set null;

alter table public.candidates 
  add column if not exists assigned_to uuid references auth.users(id) on delete set null;

-- Performance indexes for RLS filter queries
create index if not exists idx_companies_assigned_to on public.companies (assigned_to);
create index if not exists idx_contacts_assigned_to on public.contacts (assigned_to);
create index if not exists idx_candidates_assigned_to on public.candidates (assigned_to);

-- ------------------------------------------------------------------------------
-- STEP 3: SECURITY DEFINER Helper Function for Role Evaluation
-- Checks:
--  1) JWT app_metadata ->> role (Admin set via Supabase Dashboard / Service Role)
--  2) JWT user_metadata ->> role (Fallback)
--  3) public.profiles table ->> role (Database profile table)
-- ------------------------------------------------------------------------------
create or replace function public.is_admin_or_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select (
    -- 1. Check JWT app_metadata (e.g. auth.jwt() -> 'app_metadata' ->> 'role')
    coalesce(
      (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'),
      false
    )
    or
    -- 2. Check JWT user_metadata (e.g. auth.jwt() -> 'user_metadata' ->> 'role')
    coalesce(
      (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'super_admin'),
      false
    )
    or
    -- 3. Check public.profiles table
    coalesce(
      (
        select role::text in ('admin', 'super_admin') 
        from public.profiles 
        where id = auth.uid()
      ),
      false
    )
  );
$$;

-- Grant execution permission to authenticated users
grant execute on function public.is_admin_or_super_admin() to authenticated;


-- ------------------------------------------------------------------------------
-- STEP 4: Enable Row-Level Security (RLS)
-- ------------------------------------------------------------------------------
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.candidates enable row level security;


-- ------------------------------------------------------------------------------
-- STEP 5: Drop conflicting legacy/permissive policies (Postgres ORs multiple policies)
-- ------------------------------------------------------------------------------
-- Companies legacy policies
drop policy if exists "Team members can read companies" on public.companies;
drop policy if exists "Team members can create companies" on public.companies;
drop policy if exists "Team members can update companies" on public.companies;
drop policy if exists "Admins and original creators can update companies" on public.companies;
drop policy if exists "Only Admins can delete companies" on public.companies;
drop policy if exists "companies_select_assigned" on public.companies;
drop policy if exists "companies_update_assigned" on public.companies;
drop policy if exists "companies_insert" on public.companies;
drop policy if exists "companies_delete" on public.companies;

-- Contacts legacy policies
drop policy if exists "Team members can read contacts" on public.contacts;
drop policy if exists "Team members can create contacts" on public.contacts;
drop policy if exists "Team members can update contacts" on public.contacts;
drop policy if exists "Only Admins can delete contacts" on public.contacts;
drop policy if exists "contacts_select_assigned" on public.contacts;
drop policy if exists "contacts_update_assigned" on public.contacts;
drop policy if exists "contacts_insert" on public.contacts;
drop policy if exists "contacts_delete" on public.contacts;

-- Candidates policies
drop policy if exists "candidates_select_assigned" on public.candidates;
drop policy if exists "candidates_update_assigned" on public.candidates;
drop policy if exists "candidates_insert" on public.candidates;
drop policy if exists "candidates_delete" on public.candidates;


-- ------------------------------------------------------------------------------
-- STEP 6: Apply Scoped RLS Policies
-- ------------------------------------------------------------------------------

-- ====================
-- A. COMPANIES POLICIES
-- ====================

-- 1. SELECT: CRA/Recruiter sees assigned records; Admin/Super Admin sees all
create policy "companies_select_assigned"
  on public.companies for select
  using (
    auth.uid() = assigned_to 
    or public.is_admin_or_super_admin()
  );

-- 2. UPDATE: CRA/Recruiter updates assigned records; Admin/Super Admin updates all
create policy "companies_update_assigned"
  on public.companies for update
  using (
    auth.uid() = assigned_to 
    or public.is_admin_or_super_admin()
  )
  with check (
    auth.uid() = assigned_to 
    or public.is_admin_or_super_admin()
  );

-- 3. INSERT: Authenticated users can insert; CRAs must assign to self or leave unassigned if allowed
create policy "companies_insert"
  on public.companies for insert
  with check (
    auth.uid() is not null 
    and (
      assigned_to = auth.uid() 
      or assigned_to is null 
      or public.is_admin_or_super_admin()
    )
  );

-- 4. DELETE: Admins and Super Admins only
create policy "companies_delete"
  on public.companies for delete
  using (
    public.is_admin_or_super_admin()
  );


-- ====================
-- B. CONTACTS POLICIES
-- ====================

-- 1. SELECT: CRA/Recruiter sees assigned contacts; Admin/Super Admin sees all
create policy "contacts_select_assigned"
  on public.contacts for select
  using (
    auth.uid() = assigned_to 
    or public.is_admin_or_super_admin()
  );

-- 2. UPDATE: CRA/Recruiter updates assigned contacts; Admin/Super Admin updates all
create policy "contacts_update_assigned"
  on public.contacts for update
  using (
    auth.uid() = assigned_to 
    or public.is_admin_or_super_admin()
  )
  with check (
    auth.uid() = assigned_to 
    or public.is_admin_or_super_admin()
  );

-- 3. INSERT: Authenticated users can insert contacts
create policy "contacts_insert"
  on public.contacts for insert
  with check (
    auth.uid() is not null 
    and (
      assigned_to = auth.uid() 
      or assigned_to is null 
      or public.is_admin_or_super_admin()
    )
  );

-- 4. DELETE: Admins and Super Admins only
create policy "contacts_delete"
  on public.contacts for delete
  using (
    public.is_admin_or_super_admin()
  );


-- ====================
-- C. CANDIDATES POLICIES
-- ====================

-- 1. SELECT: CRA/Recruiter sees assigned candidates; Admin/Super Admin sees all
create policy "candidates_select_assigned"
  on public.candidates for select
  using (
    auth.uid() = assigned_to 
    or public.is_admin_or_super_admin()
  );

-- 2. UPDATE: CRA/Recruiter updates assigned candidates; Admin/Super Admin updates all
create policy "candidates_update_assigned"
  on public.candidates for update
  using (
    auth.uid() = assigned_to 
    or public.is_admin_or_super_admin()
  )
  with check (
    auth.uid() = assigned_to 
    or public.is_admin_or_super_admin()
  );

-- 3. INSERT: Authenticated users can insert candidates
create policy "candidates_insert"
  on public.candidates for insert
  with check (
    auth.uid() is not null 
    and (
      assigned_to = auth.uid() 
      or assigned_to is null 
      or public.is_admin_or_super_admin()
    )
  );

-- 4. DELETE: Admins and Super Admins only
create policy "candidates_delete"
  on public.candidates for delete
  using (
    public.is_admin_or_super_admin()
  );
