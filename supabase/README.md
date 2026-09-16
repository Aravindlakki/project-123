# Supabase Database Migration Guide for PLACEMEIN CRA CRM

This directory contains the SQL scripts required to provision your shared PostgreSQL database on Supabase for the PLACEMEIN CRA CRM.

---

## Order of Execution

Follow this exact order in the **Supabase Dashboard > SQL Editor**:

1. **`schema.sql`**:
   - Creates custom enum types (`user_role`, `task_priority`, `outreach_channel`, etc.).
   - Creates all core tables: `profiles`, `attendance`, `companies`, `hr_contacts`, `jds`, `campaigns`, `outreach_records`, `outreach_proofs`, `tasks`, and `leaves`.
   - Creates foreign keys, performance indexes, and enables Supabase Realtime publication.

2. **`rls.sql`**:
   - Enables Row-Level Security (RLS) on all CRM tables.
   - Defines helper functions `public.current_user_role()` and `public.is_admin()`.
   - Establishes granular policies for `cra`, `admin`, and `super_admin` roles.

3. **`seed.sql`**:
   - Inserts initial Tier 1 client companies (Infosys, Wipro, TCS, Cognizant, Accenture).
   - Inserts starter HR contact worksheet leads linked to SPOCs.
   - Sets up an automatic trigger on `auth.users` (`on_auth_user_created`) so that whenever a team member signs up or is invited via Supabase Auth, their CRA profile is automatically provisioned.

---

## Connecting Your Netlify Static Deployment

After executing the SQL scripts:

1. In your Supabase Project, go to **Project Settings > API**.
2. Copy:
   - **Project URL** (e.g., `https://abcdefghijkl.supabase.co`)
   - **Project API Anon Key** (`eyJhbGci...`)
3. In your **Netlify Dashboard**:
   - Open your site > **Site configuration > Environment variables**.
   - Add:
     - `VITE_SUPABASE_URL` = `<your-project-url>`
     - `VITE_SUPABASE_ANON_KEY` = `<your-anon-key>`
4. Trigger a redeploy on Netlify.
5. In your CRM header, the status indicator will automatically switch from **`DB: Local (Supabase Not Configured)`** to **`Supabase: Connected`** with a green live badge.
