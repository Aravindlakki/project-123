-- ==============================================================================
-- PLACEMEIN CRA CRM - ROW LEVEL SECURITY POLICIES & SECURITY TRIGGERS (rls.sql)
-- Run this SECOND in your Supabase SQL Editor after schema.sql.
-- ==============================================================================

-- 1. SECURITY DEFINER HELPER FUNCTIONS
-- Returns the role of the authenticated user ('cra' or 'admin')
create or replace function public.current_user_role()
returns user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- Returns true if current user is an admin
create or replace function public.is_admin()
returns boolean as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$ language sql stable security definer;

-- ==============================================================================
-- 2. SECURITY ENFORCEMENT TRIGGERS (COLUMN-LEVEL SECURITY GUARDS)
-- Prevents privilege escalation and unauthorized verification by CRAs
-- ==============================================================================

-- TRIGGER 1: Protect restricted profile fields (role, monthly_jd_target, is_active, emp_id)
create or replace function public.check_profile_updates()
returns trigger as $$
begin
  -- If the user is an admin, allow all updates
  if public.is_admin() then
    return new;
  end if;

  -- If non-admin (CRA), forbid changing sensitive administrative columns
  if (new.role is distinct from old.role) then
    raise exception 'Unauthorized: Only admins can modify user roles (attempted to change role from % to %)', old.role, new.role;
  end if;

  if (new.monthly_jd_target is distinct from old.monthly_jd_target) then
    raise exception 'Unauthorized: Only admins can modify monthly JD targets';
  end if;

  if (new.is_active is distinct from old.is_active) then
    raise exception 'Unauthorized: Only admins can activate or deactivate accounts';
  end if;

  if (new.emp_id is distinct from old.emp_id) then
    raise exception 'Unauthorized: Employee ID cannot be modified';
  end if;

  -- Non-admins can safely update: name, avatar_url, updated_at
  new.updated_at := now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_check_profile_updates on public.profiles;
create trigger trg_check_profile_updates
  before update on public.profiles
  for each row execute function public.check_profile_updates();


-- TRIGGER 2: Protect JD verification (only admins can change is_verified or verification_source)
create or replace function public.check_jd_verification()
returns trigger as $$
begin
  -- If is_verified or verification_source is being changed
  if (new.is_verified is distinct from old.is_verified) or
     (new.verification_source is distinct from old.verification_source) then
    if not public.is_admin() then
      raise exception 'Unauthorized: Only admins can verify JDs or modify verification source';
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_check_jd_verification on public.jds;
create trigger trg_check_jd_verification
  before update on public.jds
  for each row execute function public.check_jd_verification();


-- ==============================================================================
-- 3. ENABLE RLS ON ALL TABLES
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.attendance enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.jds enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_contacts enable row level security;
alter table public.outreach_outcomes enable row level security;
alter table public.outreach_records enable row level security;
alter table public.outreach_proofs enable row level security;
alter table public.tasks enable row level security;
alter table public.leaves enable row level security;


-- ==============================================================================
-- 4. PROFILES POLICIES
-- ==============================================================================
create policy "Authenticated users can read active profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- CRAs can only target their own row; column updates are guarded by trg_check_profile_updates
create policy "Users can update their own profile details"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can manage all profile fields"
  on public.profiles for all
  using (public.is_admin());


-- ==============================================================================
-- 5. ATTENDANCE POLICIES
-- ==============================================================================
-- CRAs can only see their own attendance logs; Admins see all logs
create policy "Attendance read access"
  on public.attendance for select
  using (auth.uid() = user_id or public.is_admin());

-- Users punch in for themselves
create policy "Attendance punch in"
  on public.attendance for insert
  with check (auth.uid() = user_id);

-- Users punch out / update their own session; Admins can update
create policy "Attendance punch out"
  on public.attendance for update
  using (auth.uid() = user_id or public.is_admin());

create policy "Only Admins can delete attendance logs"
  on public.attendance for delete
  using (public.is_admin());


-- ==============================================================================
-- 6. COMPANIES POLICIES
-- ==============================================================================
create policy "Team members can read companies"
  on public.companies for select
  using (auth.role() = 'authenticated');

create policy "Team members can create companies"
  on public.companies for insert
  with check (auth.role() = 'authenticated');

create policy "Team members can update companies"
  on public.companies for update
  using (auth.role() = 'authenticated');

create policy "Only Admins can delete companies"
  on public.companies for delete
  using (public.is_admin());


-- ==============================================================================
-- 7. CONTACTS POLICIES (formerly hr_contacts)
-- ==============================================================================
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


-- ==============================================================================
-- 8. JOB DESCRIPTIONS (JDs) POLICIES
-- ==============================================================================
create policy "Team members can read JDs"
  on public.jds for select
  using (auth.role() = 'authenticated');

create policy "Team members can insert JDs"
  on public.jds for insert
  with check (auth.role() = 'authenticated');

-- CRAs can edit metadata/raw_text; is_verified is strictly guarded by trg_check_jd_verification
create policy "Team members can update JDs"
  on public.jds for update
  using (auth.role() = 'authenticated');

create policy "Only Admins can delete JDs"
  on public.jds for delete
  using (public.is_admin());


-- ==============================================================================
-- 9. CAMPAIGNS & CAMPAIGN_CONTACTS POLICIES
-- ==============================================================================
create policy "Team members can read campaigns"
  on public.campaigns for select
  using (auth.role() = 'authenticated');

create policy "Team members can create campaigns"
  on public.campaigns for insert
  with check (auth.role() = 'authenticated');

create policy "Campaign owners or Admins can update campaigns"
  on public.campaigns for update
  using (auth.uid() = owner_id or public.is_admin());

create policy "Only Admins can delete campaigns"
  on public.campaigns for delete
  using (public.is_admin());

create policy "Team members can read campaign_contacts"
  on public.campaign_contacts for select
  using (auth.role() = 'authenticated');

create policy "Team members can add contacts to campaigns"
  on public.campaign_contacts for insert
  with check (auth.role() = 'authenticated');

create policy "Team members can update campaign_contacts status"
  on public.campaign_contacts for update
  using (auth.role() = 'authenticated');

create policy "Team members can remove contacts from campaigns"
  on public.campaign_contacts for delete
  using (auth.role() = 'authenticated');


-- ==============================================================================
-- 10. OUTREACH_OUTCOMES POLICIES
-- ==============================================================================
create policy "Team members can read outreach outcomes"
  on public.outreach_outcomes for select
  using (auth.role() = 'authenticated');

create policy "Only Admins can manage outreach outcome definitions"
  on public.outreach_outcomes for all
  using (public.is_admin());


-- ==============================================================================
-- 11. OUTREACH_RECORDS & OUTREACH_PROOFS POLICIES
-- ==============================================================================
create policy "Team members can read all outreach records"
  on public.outreach_records for select
  using (auth.role() = 'authenticated');

create policy "Team members can log outreach records"
  on public.outreach_records for insert
  with check (auth.role() = 'authenticated');

create policy "Outreach creator or Admins can update outreach records"
  on public.outreach_records for update
  using (auth.uid() = created_by or public.is_admin());

create policy "Only Admins can delete outreach records"
  on public.outreach_records for delete
  using (public.is_admin());

create policy "Team members can view outreach proofs"
  on public.outreach_proofs for select
  using (auth.role() = 'authenticated');

create policy "Team members can attach proofs"
  on public.outreach_proofs for insert
  with check (auth.role() = 'authenticated');

create policy "Admins can update proof verification status"
  on public.outreach_proofs for update
  using (public.is_admin());

create policy "Only Admins can delete outreach proofs"
  on public.outreach_proofs for delete
  using (public.is_admin());


-- ==============================================================================
-- 12. TASKS POLICIES
-- ==============================================================================
-- CRAs see tasks assigned to them or created by them; Admins see all tasks
create policy "Users can view assigned tasks, created tasks, or all if Admin"
  on public.tasks for select
  using (auth.uid() = assignee_id or auth.uid() = assigned_by_id or public.is_admin());

create policy "Team members can create tasks"
  on public.tasks for insert
  with check (auth.role() = 'authenticated');

create policy "Assignees can update task status; Admins can update full task"
  on public.tasks for update
  using (auth.uid() = assignee_id or public.is_admin());

create policy "Creator or Admins can delete tasks"
  on public.tasks for delete
  using (auth.uid() = assigned_by_id or public.is_admin());


-- ==============================================================================
-- 13. LEAVES POLICIES
-- ==============================================================================
create policy "Users view own leaves; Admins view all leaves"
  on public.leaves for select
  using (auth.uid() = cra_id or public.is_admin());

create policy "Users can submit leave requests"
  on public.leaves for insert
  with check (auth.uid() = cra_id);

create policy "Only Admins can approve, reject, or update leaves"
  on public.leaves for update
  using (public.is_admin());

create policy "Only Admins can delete leaves"
  on public.leaves for delete
  using (public.is_admin());
