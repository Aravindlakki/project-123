-- ==============================================================================
-- CRM - Migration: Company Soft Delete, Audit Logs & Message Templates
-- File: supabase/migrations/20261006_company_delete_and_message_templates.sql
-- ==============================================================================

-- 1. Add soft-delete and audit columns to public.companies
alter table public.companies 
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null;

create index if not exists idx_companies_deleted_at on public.companies (deleted_at);

-- 2. Add outreach tracking columns to public.contacts
alter table public.contacts
  add column if not exists last_outreach_channel text,
  add column if not exists last_outreach_at timestamptz,
  add column if not exists last_draft_type text,
  add column if not exists draft_was_edited boolean default false;

-- 3. Company Audit Logs Table
create table if not exists public.company_audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  company_name text not null,
  action text not null, -- 'create', 'update', 'delete', 'restore'
  performed_by uuid references public.profiles(id) on delete set null,
  performed_by_name text,
  linked_records_affected jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_company_audit_logs_company on public.company_audit_logs (company_id);
create index if not exists idx_company_audit_logs_action on public.company_audit_logs (action);

-- 4. Message Templates Table
create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null, -- 'email', 'whatsapp', 'linkedin'
  template_type text not null default 'first_contact', -- 'first_contact', 'follow_up'
  subject text, -- used for email
  body text not null,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_message_templates_channel on public.message_templates (channel);
create index if not exists idx_message_templates_type on public.message_templates (template_type);
create index if not exists idx_message_templates_active on public.message_templates (is_active);

-- Seed Initial High-Converting Outreach Templates
insert into public.message_templates (name, channel, template_type, subject, body, is_active)
values
  -- Email: First Contact
  (
    'Standard Graduate Partnership Intro',
    'email',
    'first_contact',
    'Pre-screened Fresher & Engineering Talent for {Company_Name} — Placemein Partnership',
    'Hi {HR_Name},

I hope this email finds you well.

I am reaching out from Placemein, an early-career recruitment and campus placement partnership organization. We support technology companies like {Company_Name} by providing pre-assessed, interview-ready graduates across {Job_Domain} and software engineering roles — with zero upfront sourcing effort.

Given your active focus on hiring for {Job_Role}, we would love to share a curated shortlist of 2–3 pre-screened candidate profiles that match your stack.

Would you be open to a brief 10-minute introductory call this week?

Warm regards,
{Employee_Name}
Corporate Relations Associate
Placemein Career Solutions',
    true
  ),
  -- Email: Follow-up
  (
    'Day-2 Gentle Follow-up',
    'email',
    'follow_up',
    'Re: Pre-screened Fresher Talent for {Company_Name} — Placemein',
    'Hi {HR_Name},

I wanted to follow up briefly on my earlier note regarding hiring support for {Company_Name}.

We currently have a freshly evaluated cohort of candidates specializing in {Job_Domain} available for immediate technical evaluations and interviews.

If you have 5 minutes this week, I would be glad to share sample candidate profiles or coordinate an exploratory conversation.

Best regards,
{Employee_Name}
Placemein Career Solutions',
    true
  ),
  -- WhatsApp: First Contact
  (
    'Direct WhatsApp Intro',
    'whatsapp',
    'first_contact',
    null,
    'Hello {HR_Name} 👋

This is {Employee_Name} from Placemein Career Solutions.

We partner with tech organizations like {Company_Name} to provide pre-screened, job-ready fresh graduates in {Job_Domain} and tech roles (including {Job_Role}).

Can I share a 1-page summary of our available candidates for your review? Thank you!',
    true
  ),
  -- WhatsApp: Follow-up
  (
    'WhatsApp Follow-up (Day 2+)',
    'whatsapp',
    'follow_up',
    null,
    'Hi {HR_Name} 👋

Gentle reminder regarding hiring support for {Company_Name}. We have vetted candidates ready for immediate interviews in {Job_Domain}.

May I send across 2–3 matching profiles for your current openings? – {Employee_Name}, Placemein',
    true
  ),
  -- LinkedIn: First Contact
  (
    'LinkedIn Connection Note (Under 300 chars)',
    'linkedin',
    'first_contact',
    null,
    'Hi {HR_Name}, saw your hiring focus at {Company_Name}. At Placemein, we support tech teams with pre-vetted graduate talent in {Job_Domain}. Would love to connect and share a candidate shortlist whenever helpful! – {Employee_Name}',
    true
  ),
  -- LinkedIn: Follow-up
  (
    'LinkedIn InMail Follow-up',
    'linkedin',
    'follow_up',
    null,
    'Hi {HR_Name}, floating this back to your inbox regarding {Job_Role} at {Company_Name}. We have pre-screened graduates ready for immediate interviews. Open to a quick connect? – {Employee_Name}, Placemein',
    true
  )
on conflict do nothing;

-- 5. Row-Level Security Policies
alter table public.company_audit_logs enable row level security;
alter table public.message_templates enable row level security;

-- COMPANY AUDIT LOGS POLICIES
create policy "Admins can view audit logs"
  on public.company_audit_logs for select
  using (public.is_admin());

create policy "Admins and authenticated users can insert audit logs"
  on public.company_audit_logs for insert
  with check (auth.role() = 'authenticated');

-- MESSAGE TEMPLATES POLICIES
-- CRA and Admins can view active message templates
create policy "Authenticated users can view active templates"
  on public.message_templates for select
  using (auth.role() = 'authenticated' and (is_active = true or public.is_admin()));

-- Strictly Admins can create, update, or delete templates
create policy "Only Admins can create message templates"
  on public.message_templates for insert
  with check (public.is_admin());

create policy "Only Admins can update message templates"
  on public.message_templates for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Only Admins can delete message templates"
  on public.message_templates for delete
  using (public.is_admin());

-- COMPANIES TABLE: Update RLS to hide soft-deleted companies from standard selects unless admin
drop policy if exists "Team members can read companies" on public.companies;
create policy "Team members can read active companies"
  on public.companies for select
  using (auth.role() = 'authenticated' and (deleted_at is null or public.is_admin()));

-- Strictly Admins can delete or soft-delete companies
drop policy if exists "Only Admins can delete companies" on public.companies;
create policy "Only Admins can delete companies"
  on public.companies for delete
  using (public.is_admin());
