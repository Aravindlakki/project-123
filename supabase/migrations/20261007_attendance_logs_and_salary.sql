-- ============================================================================
-- Migration: 20261007_attendance_logs_and_salary.sql
-- Description:
-- 1. Create attendance_logs table for exact login/logout tracking in IST.
-- 2. Create attendance_settings table for admin-configurable thresholds & targets.
-- 3. Create leave_balances table (per employee, set by admin).
-- 4. Create close_stale_attendance_logs function to auto-close midnight IST sessions.
-- 5. Row-Level Security (RLS) policies ensuring employees read their own rows
--    and admins read/manage all rows.
-- ============================================================================

-- 1. ATTENDANCE LOGS TABLE
create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  emp_id text not null,
  work_date date not null,
  login_at timestamptz not null default now(),
  logout_at timestamptz,
  total_minutes integer not null default 0,
  status text not null check (status in ('present', 'half_day', 'absent', 'in_progress')) default 'in_progress',
  auto_closed boolean not null default false,
  override_status text check (override_status in ('present', 'half_day', 'absent')),
  override_by uuid references public.profiles(id) on delete set null,
  override_at timestamptz,
  override_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_attendance_logs_user_date on public.attendance_logs (user_id, work_date);
create index if not exists idx_attendance_logs_work_date on public.attendance_logs (work_date);
create index if not exists idx_attendance_logs_emp_id on public.attendance_logs (emp_id);

-- 2. ATTENDANCE & SALARY SETTINGS TABLE
create table if not exists public.attendance_settings (
  id text primary key default 'default',
  full_day_hours numeric not null default 6.0,
  half_day_hours numeric not null default 3.0,
  default_logout_time text not null default '19:00',
  daily_rate numeric not null default 500,
  target_contacts integer not null default 750,
  target_jds integer not null default 15,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Seed default settings row
insert into public.attendance_settings (id, full_day_hours, half_day_hours, default_logout_time, daily_rate, target_contacts, target_jds)
values ('default', 6.0, 3.0, '19:00', 500, 750, 15)
on conflict (id) do nothing;

-- 3. LEAVE BALANCES TABLE
create table if not exists public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  emp_id text,
  total_leave_days numeric not null default 0,
  used_leave_days numeric not null default 0,
  remaining_leave_days numeric not null default 0,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_leave_balances_user_id on public.leave_balances (user_id);

-- 4. AUTO-CLOSE STALE SESSIONS AT MIDNIGHT IST
create or replace function public.close_stale_attendance_logs(default_logout text default '19:00')
returns integer
language plpgsql
security definer
as $$
declare
  affected_count integer := 0;
begin
  with updated as (
    update public.attendance_logs
    set 
      logout_at = (work_date + default_logout::time) at time zone 'Asia/Kolkata',
      total_minutes = greatest(0, extract(epoch from ((work_date + default_logout::time) at time zone 'Asia/Kolkata' - login_at)) / 60)::integer,
      auto_closed = true,
      status = case 
        when extract(epoch from ((work_date + default_logout::time) at time zone 'Asia/Kolkata' - login_at)) / 3600 >= 6.0 then 'present'
        when extract(epoch from ((work_date + default_logout::time) at time zone 'Asia/Kolkata' - login_at)) / 3600 >= 3.0 then 'half_day'
        else 'absent'
      end,
      updated_at = now()
    where logout_at is null 
      and work_date < (timezone('Asia/Kolkata', now())::date)
    returning id
  )
  select count(*) into affected_count from updated;
  return affected_count;
end;
$$;

-- 5. ROW LEVEL SECURITY (RLS)
alter table public.attendance_logs enable row level security;
alter table public.attendance_settings enable row level security;
alter table public.leave_balances enable row level security;

-- attendance_logs policies
drop policy if exists "attendance_logs_select_policy" on public.attendance_logs;
create policy "attendance_logs_select_policy"
  on public.attendance_logs for select
  using (
    auth.uid() = user_id 
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "attendance_logs_insert_policy" on public.attendance_logs;
create policy "attendance_logs_insert_policy"
  on public.attendance_logs for insert
  with check (
    auth.uid() = user_id 
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "attendance_logs_update_policy" on public.attendance_logs;
create policy "attendance_logs_update_policy"
  on public.attendance_logs for update
  using (
    auth.uid() = user_id 
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "attendance_logs_delete_policy" on public.attendance_logs;
create policy "attendance_logs_delete_policy"
  on public.attendance_logs for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- attendance_settings policies
drop policy if exists "attendance_settings_select_policy" on public.attendance_settings;
create policy "attendance_settings_select_policy"
  on public.attendance_settings for select
  using (true);

drop policy if exists "attendance_settings_admin_policy" on public.attendance_settings;
create policy "attendance_settings_admin_policy"
  on public.attendance_settings for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- leave_balances policies
drop policy if exists "leave_balances_select_policy" on public.leave_balances;
create policy "leave_balances_select_policy"
  on public.leave_balances for select
  using (
    auth.uid() = user_id 
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "leave_balances_admin_policy" on public.leave_balances;
create policy "leave_balances_admin_policy"
  on public.leave_balances for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
