-- ==============================================================================
-- PLACEMEIN CRA CRM - SEED DATA (seed.sql)
-- Run this THIRD in your Supabase SQL Editor.
-- ==============================================================================

-- 1. STANDARD OUTREACH OUTCOMES TAXONOMY
insert into public.outreach_outcomes (id, name, category, is_conversion, description)
values
  ('44444444-4444-4444-4444-444444444401', 'Meeting Scheduled', 'positive', true, 'Client agreed to interview drive or briefing call'),
  ('44444444-4444-4444-4444-444444444402', 'Interested', 'positive', false, 'Client requested candidate profiles or JD details'),
  ('44444444-4444-4444-4444-444444444403', 'Applied', 'neutral', false, 'Application or proposal submitted via portal'),
  ('44444444-4444-4444-4444-444444444404', 'No Response', 'neutral', false, 'Outreach delivered with no response yet'),
  ('44444444-4444-4444-4444-444444444405', 'Not Hiring Currently', 'negative', false, 'Freeze on campus/entry-level hiring'),
  ('44444444-4444-4444-4444-444444444406', 'Wrong SPOC / Re-routed', 'neutral', false, 'Contact referred us to a different department')
on conflict (id) do nothing;

-- 2. COMPANIES SEED DATA
insert into public.companies (id, name, industry, website, linkedin_url, location, employee_count, source, notes)
values
  ('11111111-1111-1111-1111-111111111101', 'Infosys', 'IT Services', 'https://infosys.com', 'https://linkedin.com/company/infosys', 'Bengaluru, Karnataka', '10000+', 'import', 'Key Tier 1 Tech Client - Campus Drives'),
  ('11111111-1111-1111-1111-111111111102', 'Wipro Technologies', 'IT Consulting', 'https://wipro.com', 'https://linkedin.com/company/wipro', 'Bengaluru, Karnataka', '10000+', 'import', 'Quarterly campus drive partner'),
  ('11111111-1111-1111-1111-111111111103', 'TCS (Tata Consultancy Services)', 'IT Services', 'https://tcs.com', 'https://linkedin.com/company/tata-consultancy-services', 'Mumbai / Bengaluru', '10000+', 'import', 'High volume hiring partner'),
  ('11111111-1111-1111-1111-111111111104', 'Cognizant', 'Software & IT', 'https://cognizant.com', 'https://linkedin.com/company/cognizant', 'Chennai / Hyderabad', '10000+', 'manual', 'Engineering fresher hiring'),
  ('11111111-1111-1111-1111-111111111105', 'Accenture India', 'Management & Tech Consulting', 'https://accenture.com', 'https://linkedin.com/company/accenture', 'Bengaluru / Hyderabad', '10000+', 'linkedin', 'Enterprise digital transformation roles')
on conflict (id) do nothing;

-- 3. CONTACTS SEED DATA (Table: contacts)
insert into public.contacts (id, company_id, name, title, email, phone, linkedin_url, domain, location, spoc, source, remarks)
values
  (
    '22222222-2222-2222-2222-222222222201',
    '11111111-1111-1111-1111-111111111101',
    'Rajesh Sharma',
    'Senior Campus Talent Acquisition Lead',
    'rajesh.sharma@infosys.com',
    '+91 98765 43210',
    'https://linkedin.com/in/rajesh-sharma-talent',
    'IT / Software',
    'Bengaluru',
    'Harish Reddy',
    'import',
    'Requested 50 candidate batch profile for Java Full Stack'
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111102',
    'Pooja Nair',
    'HR Manager - Early Careers',
    'pooja.nair@wipro.com',
    '+91 98451 12345',
    'https://linkedin.com/in/pooja-nair-careers',
    'Data Science & AI',
    'Bengaluru',
    'Namitha K',
    'import',
    'Follow-up scheduled for next Tuesday regarding internship pipeline'
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    '11111111-1111-1111-1111-111111111103',
    'Ananya Verma',
    'Talent Acquisition Lead',
    'ananya.verma@tcs.com',
    '+91 91234 56789',
    'https://linkedin.com/in/ananya-verma-hr',
    'Cloud & DevOps',
    'Mumbai',
    'Vineeth M',
    'linkedin',
    'Interested in specialized cloud certifications track'
  ),
  (
    '22222222-2222-2222-2222-222222222204',
    '11111111-1111-1111-1111-111111111104',
    'Siddharth Roy',
    'University Relations Specialist',
    'siddharth.r@cognizant.com',
    '+91 98111 22334',
    'https://linkedin.com/in/siddharth-roy-cognizant',
    'QA & Automation',
    'Chennai',
    'Sneha Rao',
    'manual',
    'Evaluating campus placement schedule for Q3'
  ),
  (
    '22222222-2222-2222-2222-222222222205',
    '11111111-1111-1111-1111-111111111105',
    'Kavitha Menon',
    'Associate Director - HR & Staffing',
    'kavitha.m@accenture.com',
    '+91 97400 33445',
    'https://linkedin.com/in/kavitha-menon-staffing',
    'Full Stack Engineering',
    'Bengaluru',
    'Deepthi S',
    'apollo',
    'Initial outreach completed; awaiting review of JD batch'
  )
on conflict (id) do nothing;

-- 4. JOB DESCRIPTIONS SEED DATA (Table: jds)
insert into public.jds (id, company_id, title, raw_text, is_verified, verification_source, opportunity_type, date_found)
values
  (
    '33333333-3333-3333-3333-333333333301',
    '11111111-1111-1111-1111-111111111101',
    'Junior Full Stack Developer (React / Node)',
    'Looking for entry-level engineering graduates proficient in React, TypeScript, and Node.js. 0-1 years experience required. CTC: 4.5 - 6.5 LPA.',
    true,
    'LinkedIn Job Post #89123',
    'existing_post',
    current_date
  ),
  (
    '33333333-3333-3333-3333-333333333302',
    '11111111-1111-1111-1111-111111111102',
    'Cloud Operations Trainee',
    'Opportunity for fresh graduates with foundational AWS/Azure knowledge, Linux fundamentals, and basic Docker understanding. CTC: 4.2 LPA.',
    true,
    'Direct Campus Intake Form',
    'cold_outreach',
    current_date
  )
on conflict (id) do nothing;

-- ==============================================================================
-- 5. AUTH USER AUTO-PROVISIONING TRIGGER
-- When team members are invited or sign up in Supabase Auth,
-- this trigger creates their public.profiles row automatically with 'cra' or 'admin'.
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, emp_id, name, email, role, monthly_jd_target)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'emp_id', 'PM-' || substr(new.id::text, 1, 4)),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    case
      when new.email in ('aravindreddy.l@placemein.com', 'aravindaravind3953@gmail.com') then 'admin'::user_role
      else coalesce((new.raw_user_meta_data->>'role')::user_role, 'cra'::user_role)
    end,
    20
  )
  on conflict (id) do update set
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
