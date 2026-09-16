-- ==============================================================================
-- PLACEMEIN CRA CRM - SUPABASE SCHEMA (schema.sql)
-- Run this FIRST in your Supabase SQL Editor.
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. CUSTOM ENUMS
-- Strictly TWO roles: 'cra' and 'admin'
create type user_role as enum ('cra', 'admin');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type task_status as enum ('pending', 'in_progress', 'completed');
create type leave_type as enum ('casual', 'sick', 'emergency');
create type leave_status as enum ('pending', 'approved', 'rejected');
create type outreach_channel as enum ('call', 'mail', 'text', 'whatsapp', 'linkedin');
create type outreach_status as enum ('not_started', 'sent', 'replied', 'failed');
create type opportunity_type as enum ('existing_post', 'cold_outreach');
create type source_type as enum ('linkedin', 'apollo', 'manual', 'import', 'google_search');

-- 3. PROFILES TABLE (Linked to Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  emp_id text unique not null,
  name text not null,
  email text unique not null,
  role user_role not null default 'cra',
  monthly_jd_target integer not null default 20,
  is_active boolean not null default true,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. ATTENDANCE TABLE
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  work_date date not null default current_date,
  login_at timestamptz not null default now(),
  logout_at timestamptz,
  session_duration_minutes integer default 0,
  work_mode text not null default 'Office',
  created_at timestamptz not null default now()
);

-- 5. COMPANIES TABLE
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  website text,
  linkedin_url text,
  employee_count text,
  location text,
  source source_type not null default 'manual',
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. CONTACTS TABLE (formerly hr_contacts)
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade not null,
  name text not null,
  title text,
  email text,
  phone text,
  linkedin_url text,
  domain text,
  location text,
  remarks text,
  spoc text,
  source source_type not null default 'manual',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. JOB DESCRIPTIONS (JDs) TABLE
create table public.jds (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade not null,
  title text not null,
  raw_text text not null,
  is_verified boolean not null default false,
  verification_source text default 'manual_entry',
  opportunity_type opportunity_type not null default 'existing_post',
  date_found date not null default current_date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 8. CAMPAIGNS TABLE
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid references public.profiles(id) on delete set null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. CAMPAIGN_CONTACTS (Junction table linking campaigns to contacts)
create table public.campaign_contacts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  status text not null default 'queued',
  added_by uuid references public.profiles(id) on delete set null,
  added_at timestamptz not null default now(),
  unique(campaign_id, contact_id)
);

-- 10. OUTREACH_OUTCOMES (Outcome taxonomy & status tracking)
create table public.outreach_outcomes (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  category text not null, -- 'positive', 'neutral', 'negative'
  is_conversion boolean not null default false,
  description text,
  created_at timestamptz not null default now()
);

-- 11. OUTREACH_RECORDS TABLE
create table public.outreach_records (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete cascade not null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  channel outreach_channel not null,
  status outreach_status not null default 'sent',
  outcome_id uuid references public.outreach_outcomes(id) on delete set null,
  call_duration_seconds integer default 0,
  call_outcome text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  timestamp timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 12. OUTREACH_PROOFS TABLE (Evidence / screenshots)
create table public.outreach_proofs (
  id uuid primary key default gen_random_uuid(),
  outreach_id uuid references public.outreach_records(id) on delete cascade not null,
  file_url text not null,
  filename text not null,
  mime_type text not null,
  evidence_type text not null default 'screenshot',
  verification_status text not null default 'needs_review',
  confidence text not null default 'medium',
  summary text,
  created_at timestamptz not null default now()
);

-- 13. TASKS TABLE
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assignee_id uuid references public.profiles(id) on delete cascade not null,
  assigned_by_id uuid references public.profiles(id) on delete set null,
  priority task_priority not null default 'medium',
  status task_status not null default 'pending',
  due_date timestamptz,
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 14. LEAVES TABLE
create table public.leaves (
  id uuid primary key default gen_random_uuid(),
  cra_id uuid references public.profiles(id) on delete cascade not null,
  leave_type leave_type not null default 'casual',
  start_date date not null,
  end_date date not null,
  days_count numeric(3,1) not null default 1,
  reason text not null,
  status leave_status not null default 'pending',
  admin_notes text,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 15. PERFORMANCE INDEXES
create index idx_companies_name on public.companies (name);
create index idx_contacts_company on public.contacts (company_id);
create index idx_contacts_spoc on public.contacts (spoc);
create index idx_contacts_domain on public.contacts (domain);
create index idx_campaign_contacts on public.campaign_contacts (campaign_id, contact_id);
create index idx_outreach_contact on public.outreach_records (contact_id);
create index idx_outreach_created_by on public.outreach_records (created_by);
create index idx_tasks_assignee on public.tasks (assignee_id);
create index idx_tasks_status on public.tasks (status);
create index idx_attendance_user_date on public.attendance (user_id, work_date);

-- 16. REALTIME SUBSCRIPTIONS (For instant team sync without manual refresh)
alter publication supabase_realtime add table public.companies;
alter publication supabase_realtime add table public.contacts;
alter publication supabase_realtime add table public.jds;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.attendance;
alter publication supabase_realtime add table public.outreach_records;
alter publication supabase_realtime add table public.leaves;
