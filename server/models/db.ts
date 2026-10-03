import { 
  CRA, 
  Company, 
  HRContact, 
  JD, 
  Campaign, 
  OutreachChannel, 
  OutreachOutcome, 
  Task, 
  Attendance, 
  LeaveRequest, 
  SystemSettings 
} from './types';
import { hashPassword } from '../middlewares/authMiddleware';

// Initial Seed Users (Canonical 8 Team Members: 3 Administrators with Dual Access + 5 CRA Employees)
export const users: CRA[] = [
  {
    id: 'usr_admin_aravind',
    name: 'Aravind Reddy',
    email: 'aravindreddy.l@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'admin',
    emp_id: 'PM-100',
    domain: 'Corporate Outreach & IT Sourcing',
    designation: 'CRA Specialist',
    monthly_jd_target: 20,
    is_active: true,
    created_at: new Date('2026-08-01T08:00:00Z').toISOString(),
  },
  {
    id: 'usr_admin_mansi',
    name: 'Mansi Ramesh Peddi',
    email: 'mansi.p@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'admin',
    emp_id: 'PM-002',
    domain: 'Lead Verification, JDs Governance & Approvals',
    designation: 'Team Lead & Admin',
    monthly_jd_target: 20,
    is_active: true,
    created_at: new Date('2026-08-01T08:00:00Z').toISOString(),
  },
  {
    id: 'usr_admin_vineela',
    name: 'Vineela Bathula',
    email: 'Vineela.b@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'admin',
    emp_id: 'PM-003',
    domain: 'Corporate Relations, Operations & HR Management',
    designation: 'Manager & Admin',
    monthly_jd_target: 20,
    is_active: true,
    created_at: new Date('2026-08-01T08:00:00Z').toISOString(),
  },
  {
    id: 'usr_cra_harish',
    name: 'Harish Reddy',
    email: 'harish.r@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'cra',
    emp_id: 'PM-101',
    domain: 'Cyber Security & IT Services',
    designation: 'CRA Specialist',
    monthly_jd_target: 20,
    is_active: true,
    created_at: new Date('2026-08-10T09:00:00Z').toISOString(),
  },
  {
    id: 'usr_cra_solomon',
    name: 'Solomon Raj',
    email: 'solomon.r@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'cra',
    emp_id: 'PM-102',
    domain: 'Cloud & Cyber Security Tech',
    designation: 'CRA Specialist',
    monthly_jd_target: 20,
    is_active: true,
    created_at: new Date('2026-08-10T09:00:00Z').toISOString(),
  },
  {
    id: 'usr_cra_charan',
    name: 'Charan Kumar',
    email: 'charankumar.n@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'cra',
    emp_id: 'PM-103',
    domain: 'Gen AI & Recruitment Automation',
    designation: 'CRA Specialist',
    monthly_jd_target: 20,
    is_active: true,
    created_at: new Date('2026-08-15T09:00:00Z').toISOString(),
  },
  {
    id: 'usr_cra_mrudula',
    name: 'Mrudula',
    email: 'mrudula.k@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'cra',
    emp_id: 'PM-104',
    domain: 'Cloud Infrastructure & Enterprise Sourcing',
    designation: 'CRA Specialist',
    monthly_jd_target: 20,
    is_active: true,
    created_at: new Date('2026-08-15T09:00:00Z').toISOString(),
  },
  {
    id: 'usr_cra_namitha',
    name: 'Namitha K',
    email: 'namitha.k@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'cra',
    emp_id: 'PM-105',
    domain: 'Cyber Security & AI Enterprise Leads',
    designation: 'CRA Specialist',
    monthly_jd_target: 20,
    is_active: true,
    created_at: new Date('2026-08-10T09:00:00Z').toISOString(),
  },
];

// Clean Companies (Ready for fresh upload in 2 days)
export const companies: Company[] = [];

// Clean HR Contacts & Leads (Ready for fresh upload in 2 days)
export const hrContacts: HRContact[] = [];

// Clean JDs: empty so user can upload and team can add fresh data
export const jds: JD[] = [];

// Clean Campaigns & Outreach
export const campaigns: Campaign[] = [];
export const outreachChannels: OutreachChannel[] = [];
export const outreachOutcomes: OutreachOutcome[] = [];

// Clean Tasks: empty so team members create and track their own tasks
export const tasks: Task[] = [];

// Clean Attendance: ready for fresh check-ins
export const attendanceRecords: Attendance[] = [];

// Clean Leaves: empty so employees submit their own requests
export const leaves: LeaveRequest[] = [];

export const systemSettings: SystemSettings = {
  default_monthly_jd_target: 15,
  apollo_api_configured: !!process.env.APOLLO_API_KEY,
  openai_api_configured: !!process.env.OPENAI_API_KEY,
  openrouter_api_configured: !!process.env.OPENROUTER_API_KEY,
  anthropic_api_configured: false,
  gemini_api_configured: !!process.env.GEMINI_API_KEY,
  openrouter_model: 'google/gemma-4-31b-it:free',
  ai_extraction_active: true,
  extraction_engine: process.env.GEMINI_API_KEY ? 'Google Gemini 3.8 Flash' : 'CRM Intelligence Engine (Gemini/Smart OCR)',
};

// Enrichment helper functions
export function enrichContact(c: HRContact) {
  const comp = companies.find((co) => co.id === c.company_id);
  const creator = users.find((u) => u.id === c.created_by);
  const enteredByName = c.entered_by_name || (creator ? creator.name : 'Aravind Reddy');
  return { ...c, company: comp, creator, entered_by_name: enteredByName };
}

export function enrichJD(jd: JD) {
  const comp = companies.find((co) => co.id === jd.company_id);
  const creator = users.find((u) => u.id === jd.created_by);
  const contact = jd.hr_contact_id
    ? hrContacts.find((c) => c.id === jd.hr_contact_id)
    : (jd.hr_email
      ? hrContacts.find((c) => c.email?.toLowerCase() === jd.hr_email?.toLowerCase())
      : hrContacts.find((c) => c.company_id === jd.company_id));

  const numPart = jd.id.replace(/[^0-9]/g, '') || '1';
  const autoJdId = jd.jd_id || `JD-2026-${numPart.padStart(4, '0')}`;
  const compName = comp?.name || jd.company_name || 'Hiring Enterprise';
  const hrContactName = jd.hr_name || contact?.name || 'Talent Acquisition Partner';
  const hrContactEmail = jd.hr_email || contact?.email || '';

  return {
    ...jd,
    jd_id: autoJdId,
    company_name: compName,
    date_received: jd.date_received || jd.date_found || new Date().toISOString().slice(0, 10),
    status: jd.status || (jd.is_verified ? 'open' : 'in-progress'),
    company: comp,
    creator,
    hr_contact: contact ? enrichContact(contact) : undefined,
    hr_contact_id: contact?.id || jd.hr_contact_id,
    hr_name: hrContactName,
    hr_email: hrContactEmail,
  };
}

export function enrichCompany(comp: Company) {
  const creator = users.find((u) => u.id === comp.created_by);
  const compContacts = hrContacts.filter((c) => c.company_id === comp.id).map(enrichContact);
  const compJds = jds.filter((j) => j.company_id === comp.id);
  const enteredByName = comp.entered_by_name || (creator ? creator.name : 'Aravind Reddy');
  const employeeCount = comp.employee_count || '100-500 employees';
  const linkedinUrl = comp.linkedin_url || `https://www.linkedin.com/company/${comp.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  return {
    ...comp,
    creator,
    contacts: compContacts,
    contacts_count: compContacts.length,
    jds: compJds,
    entered_by_name: enteredByName,
    employee_count: employeeCount,
    linkedin_url: linkedinUrl,
  };
}

export function enrichTask(t: Task) {
  const assignee = users.find((u) => u.id === t.assignee_id);
  const assigned_by = users.find((u) => u.id === t.assigned_by_id);
  const comp = t.company_id ? companies.find((c) => c.id === t.company_id) : undefined;
  const cont = t.contact_id ? hrContacts.find((c) => c.id === t.contact_id) : undefined;
  return { ...t, assignee, assigned_by, company: comp, contact: cont };
}

export function enrichCampaign(c: Campaign) {
  const owner = users.find((u) => u.id === c.owner_id);
  const contacts = hrContacts.filter((contact) => c.contact_ids?.includes(contact.id)).map(enrichContact);
  return { ...c, owner, contacts };
}

export function enrichOutreach(o: OutreachChannel) {
  const contact = hrContacts.find((c) => c.id === o.contact_id);
  return { ...o, contact: contact ? enrichContact(contact) : undefined };
}

export function enrichLeave(l: LeaveRequest) {
  const cra = users.find((u) => u.id === l.cra_id);
  const reviewer = l.reviewed_by ? users.find((u) => u.id === l.reviewed_by) : undefined;
  return { ...l, cra, reviewer };
}
