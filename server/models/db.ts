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
import { INITIAL_PDF_LEADS } from '../../src/data/pdfLeadsData';
import { hashPassword } from '../middlewares/authMiddleware';

// Initial Seed Users
export const users: CRA[] = [
  {
    id: 'usr_admin_user_session',
    name: 'Aravind Reddy',
    email: 'aravindaravind3953@gmail.com',
    passwordHash: hashPassword('Password123!'),
    role: 'admin',
    emp_id: 'PM-CEO',
    monthly_jd_target: 20,
    is_active: true,
    created_at: new Date('2026-08-01T08:00:00Z').toISOString(),
  },
  {
    id: 'usr_admin_1',
    name: 'Aravind Reddy',
    email: 'aravindreddy.l@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'admin',
    emp_id: 'PM-001',
    monthly_jd_target: 20,
    is_active: true,
    created_at: new Date('2026-08-01T08:00:00Z').toISOString(),
  },
  {
    id: 'usr_admin_2',
    name: 'CRA Associate Lead',
    email: 'cra_lead@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'admin',
    emp_id: 'PM-002',
    monthly_jd_target: 25,
    is_active: true,
    created_at: new Date('2026-08-01T08:00:00Z').toISOString(),
  },
  {
    id: 'usr_admin_3',
    name: 'Mansi Ramesh Peddi',
    email: 'mansi.p@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'admin',
    emp_id: 'PM-003',
    monthly_jd_target: 20,
    is_active: true,
    created_at: new Date('2026-08-01T08:00:00Z').toISOString(),
  },
  {
    id: 'usr_admin_4',
    name: 'Vineela Bathula',
    email: 'vineela.b@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'admin',
    emp_id: 'PM-004',
    monthly_jd_target: 20,
    is_active: true,
    created_at: new Date('2026-08-01T08:00:00Z').toISOString(),
  },
  {
    id: 'usr_cra_1',
    name: 'Harish Reddy',
    email: 'harish.r@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'cra',
    emp_id: 'PM-101',
    monthly_jd_target: 15,
    is_active: true,
    created_at: new Date('2026-08-10T09:00:00Z').toISOString(),
  },
  {
    id: 'usr_cra_2',
    name: 'Namitha K',
    email: 'namitha.k@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'cra',
    emp_id: 'PM-102',
    monthly_jd_target: 15,
    is_active: true,
    created_at: new Date('2026-08-10T09:00:00Z').toISOString(),
  },
  {
    id: 'usr_cra_3',
    name: 'Charan Kumar',
    email: 'charankumar.n@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'cra',
    emp_id: 'PM-103',
    monthly_jd_target: 15,
    is_active: true,
    created_at: new Date('2026-08-15T09:00:00Z').toISOString(),
  },
  {
    id: 'usr_cra_4',
    name: 'Aliya Shaik',
    email: 'aliya.s@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'cra',
    emp_id: 'PM-104',
    monthly_jd_target: 15,
    is_active: true,
    created_at: new Date('2026-08-15T09:00:00Z').toISOString(),
  },
  {
    id: 'usr_cra_5',
    name: 'Solomon Raj',
    email: 'solomon.r@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'cra',
    emp_id: 'PM-105',
    monthly_jd_target: 15,
    is_active: true,
    created_at: new Date('2026-08-15T09:00:00Z').toISOString(),
  },
  {
    id: 'usr_cra_6',
    name: 'Varshith Reddy',
    email: 'varshith.r@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'cra',
    emp_id: 'PM-106',
    monthly_jd_target: 15,
    is_active: true,
    created_at: new Date('2026-08-15T09:00:00Z').toISOString(),
  },
  {
    id: 'usr_cra_7',
    name: 'Aasritha K',
    email: 'aasritha.k@placemein.com',
    passwordHash: hashPassword('Password123!'),
    role: 'cra',
    emp_id: 'PM-107',
    monthly_jd_target: 15,
    is_active: true,
    created_at: new Date('2026-08-15T09:00:00Z').toISOString(),
  },
];

// Initial Seed Companies
export const companies: Company[] = [
  { id: 'comp_1', name: 'iGlobus Cyber', industry: 'Cybersecurity', website: 'https://iglobuscc.com', linkedin_url: 'https://www.linkedin.com/company/iglobus-cyber', employee_count: '250-500 employees', entered_by_name: 'Aravind Reddy', source: 'import', notes: 'Location: Hyderabad | SPOC: Harish', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'comp_2', name: 'Techolution', industry: 'Data Analytics & AI', website: 'https://techolution.com', linkedin_url: 'https://www.linkedin.com/company/techolution', employee_count: '500-1,000 employees', entered_by_name: 'Aravind Reddy', source: 'import', notes: 'Location: Pune | SPOC: Harish', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'comp_3', name: 'Zeno / 66degrees', industry: 'Cloud & Data', website: 'https://66degrees.com', linkedin_url: 'https://www.linkedin.com/company/66degrees', employee_count: '500-1,000 employees', entered_by_name: 'Aravind Reddy', source: 'import', notes: 'Location: Bengaluru | SPOC: Harish', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'comp_4', name: 'Artmac Soft', industry: 'IT Services', website: 'https://artmacsoft.com', linkedin_url: 'https://www.linkedin.com/company/artmac-soft', employee_count: '100-250 employees', entered_by_name: 'Aravind Reddy', source: 'import', notes: 'Location: Hyderabad | SPOC: Harish', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'comp_5', name: 'Jade Global', industry: 'Enterprise Software', website: 'https://jadeglobal.com', linkedin_url: 'https://www.linkedin.com/company/jade-global', employee_count: '1,000-5,000 employees', entered_by_name: 'Aravind Reddy', source: 'import', notes: 'Location: Pune | SPOC: Harish', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'comp_6', name: 'Heizen Systems', industry: 'Full Stack Development', website: 'https://heizensystems.com', linkedin_url: 'https://www.linkedin.com/company/heizen-systems', employee_count: '50-100 employees', entered_by_name: 'Aravind Reddy', source: 'import', notes: 'Location: Hyderabad | SPOC: Harish', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'comp_7', name: 'Tetrahed Inc', industry: 'Software Engineering', website: 'https://tetrahed.com', linkedin_url: 'https://www.linkedin.com/company/tetrahed', employee_count: '100-250 employees', entered_by_name: 'Aravind Reddy', source: 'import', notes: 'Location: Hyderabad | SPOC: Harish', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'comp_8', name: 'OATI', industry: 'Energy Tech', website: 'https://oati.com', linkedin_url: 'https://www.linkedin.com/company/oati', employee_count: '1,000-2,000 employees', entered_by_name: 'Aravind Reddy', source: 'import', notes: 'Location: Remote | SPOC: Harish', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'comp_9', name: 'BTree Systems', industry: 'EdTech & IT Training', website: 'https://btreesystems.com', linkedin_url: 'https://www.linkedin.com/company/btree-systems', employee_count: '50-150 employees', entered_by_name: 'Aravind Reddy', source: 'import', notes: 'Location: Chennai | SPOC: Harish', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'comp_10', name: 'CrowdStrike', industry: 'Cybersecurity', website: 'https://crowdstrike.com', linkedin_url: 'https://www.linkedin.com/company/crowdstrike', employee_count: '8,000+ employees', entered_by_name: 'Aravind Reddy', source: 'import', notes: 'Location: Bengaluru | SPOC: Harish', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'comp_11', name: 'Palo Alto Networks', industry: 'Cybersecurity', website: 'https://paloaltonetworks.com', linkedin_url: 'https://www.linkedin.com/company/palo-alto-networks', employee_count: '13,000+ employees', entered_by_name: 'Aravind Reddy', source: 'import', notes: 'Location: Bengaluru | SPOC: Harish', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'comp_12', name: 'Fortinet', industry: 'Cybersecurity', website: 'https://fortinet.com', linkedin_url: 'https://www.linkedin.com/company/fortinet', employee_count: '14,000+ employees', entered_by_name: 'Aravind Reddy', source: 'import', notes: 'Location: Bengaluru | SPOC: Harish', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'comp_13', name: 'Quickhyre AI', industry: 'Gen AI & Recruitment', website: 'https://quickhyre.ai', linkedin_url: 'https://www.linkedin.com/company/quickhyre-ai', employee_count: '20-50 employees', entered_by_name: 'Namitha K', source: 'import', notes: 'Location: Hyderabad | SPOC: Namitha', created_by: 'usr_cra_2', created_at: new Date('2026-08-20').toISOString() },
  { id: 'comp_14', name: 'TensorGo', industry: 'Enterprise AI', website: 'https://tensorgo.com', linkedin_url: 'https://www.linkedin.com/company/tensorgo', employee_count: '50-100 employees', entered_by_name: 'Aravind Reddy', source: 'import', notes: 'Location: Hyderabad | SPOC: Harish', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
];

// Initial Seed HR Contacts
export const hrContacts: HRContact[] = [
  { id: 'cont_1', name: 'Monisha Kanduri', title: 'HR Manager', company_id: 'comp_1', email: 'monisha@iglobuscc.com', phone: '7330715197', linkedin_url: 'https://www.linkedin.com/in/monishak', source: 'import', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'cont_2', name: 'Steven Lobu', title: 'Talent Acquisition Lead', company_id: 'comp_2', phone: '8806803989', linkedin_url: 'https://www.linkedin.com/in/stevenlobu', source: 'import', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'cont_3', name: 'Sugitha Mohan', title: 'Recruiter', company_id: 'comp_3', email: 'rashmikhanna@66degrees.com', phone: '9986039547', linkedin_url: 'https://www.linkedin.com/in/sugitha', source: 'import', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'cont_4', name: 'Sharmila Shaik', title: 'Head of People', company_id: 'comp_4', email: 'sharmila.shaik@artmacsoft.com', phone: '7013271253', linkedin_url: 'https://www.linkedin.com/in/sharmilashaik', source: 'import', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'cont_5', name: 'Nishant Dhakulkar', title: 'Senior Tech Recruiter', company_id: 'comp_5', email: 'nishant.dhakulkar@jadeglobal.com', phone: '9209198120', linkedin_url: 'https://www.linkedin.com/in/nishantd', source: 'import', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'cont_6', name: 'Nijansh Verma', title: 'HR Specialist', company_id: 'comp_6', email: 'Deepshikha.anand@gmail.com', linkedin_url: 'https://www.linkedin.com/in/nijansh', source: 'import', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'cont_7', name: 'Sai Sandesh', title: 'Director of HR', company_id: 'comp_7', email: 'sai@tetrahed.com', linkedin_url: 'https://www.linkedin.com/in/saisandesh', source: 'import', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'cont_8', name: 'Varun Joshi', title: 'Campus Relations Lead', company_id: 'comp_10', email: 'varun.joshi@crowdstrike.com', phone: '5103704605', linkedin_url: 'https://www.linkedin.com/in/varunjoshi', source: 'import', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'cont_9', name: 'Pallavi Vishnoi', title: 'Staffing Lead', company_id: 'comp_12', email: 'pvishnoi@fortinet.com', phone: '9910571481', linkedin_url: 'https://www.linkedin.com/in/pallaviv', source: 'import', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
  { id: 'cont_10', name: 'Sarath Chandra', title: 'Founder & Hiring Lead', company_id: 'comp_13', email: 'sarathpenmatsa@quickhyre.ai', phone: '9494663000', linkedin_url: 'https://www.linkedin.com/in/sarathc', source: 'import', created_by: 'usr_cra_2', created_at: new Date('2026-08-20').toISOString() },
  { id: 'cont_11', name: 'Deepika Agarwal', title: 'Talent Acquisition Partner', company_id: 'comp_14', email: 'deepika.agarwal@tensorgo.com', phone: '9963499004', linkedin_url: 'https://www.linkedin.com/in/deepikaa', source: 'import', created_by: 'usr_cra_1', created_at: new Date('2026-08-19').toISOString() },
];

// Seed leads from initial PDF sheet data
INITIAL_PDF_LEADS.forEach((lead) => {
  let comp = companies.find((c) => c.name.toLowerCase().trim() === lead.company_name.toLowerCase().trim());
  if (!comp) {
    comp = {
      id: `comp_pdf_${lead.id}`,
      name: lead.company_name,
      industry: lead.industry || lead.domain,
      website: lead.website,
      linkedin_url: lead.linkedin_url,
      employee_count: lead.employee_count || '100-500 employees',
      location: lead.location,
      entered_by_name: lead.entered_by_name,
      source: 'import',
      notes: `SPOC: ${lead.spoc} | Domain: ${lead.domain}`,
      created_by: 'usr_cra_1',
      created_at: new Date('2026-08-20').toISOString(),
    };
    companies.push(comp);
  }

  const contactExists = hrContacts.some(
    (c) => c.name.toLowerCase().trim() === lead.hr_name.toLowerCase().trim() && c.company_id === comp!.id
  );
  if (!contactExists) {
    hrContacts.push({
      id: `cont_pdf_${lead.id}`,
      name: lead.hr_name,
      title: lead.title,
      company_id: comp.id,
      email: lead.email,
      phone: lead.phone,
      linkedin_url: lead.hr_linkedin,
      source: 'import',
      domain: lead.domain,
      location: lead.location,
      remarks: lead.remarks,
      spoc: lead.spoc,
      entered_by_name: lead.entered_by_name,
      created_by: 'usr_cra_1',
      created_at: new Date('2026-08-20').toISOString(),
    });
  }
});

export const jds: JD[] = [
  {
    id: 'jd_1',
    title: 'Cyber Security Analyst / Intern',
    company_id: 'comp_1',
    raw_text: 'Role: Cyber Security Analyst. Key skills: Network security, SOC operations, SIEM tools, vulnerability assessment. Fresh graduates or 0-1 yr exp welcome.',
    is_verified: true,
    verification_source: 'html_url_parser',
    opportunity_type: 'existing_post',
    date_found: '2026-08-19',
    created_by: 'usr_cra_1',
    created_at: new Date('2026-08-19T10:00:00Z').toISOString(),
  },
  {
    id: 'jd_2',
    title: 'Data Analyst (SQL / Python)',
    company_id: 'comp_2',
    raw_text: 'Looking for enthusiastic Data Analysts with proficiency in SQL, Python, Tableau or Power BI. Hyderabad/Pune locations.',
    is_verified: true,
    verification_source: 'manual_entry',
    opportunity_type: 'existing_post',
    date_found: '2026-08-19',
    created_by: 'usr_cra_1',
    created_at: new Date('2026-08-19T11:00:00Z').toISOString(),
  },
  {
    id: 'jd_3',
    title: 'Full Stack Engineer (React + Node.js)',
    company_id: 'comp_4',
    raw_text: 'Artmac Soft is hiring Full Stack Developers with strong JavaScript/TypeScript skills. React frontend, Node/Express backend.',
    is_verified: true,
    verification_source: 'manual_entry',
    opportunity_type: 'cold_outreach',
    date_found: '2026-08-19',
    created_by: 'usr_cra_1',
    created_at: new Date('2026-08-19T14:00:00Z').toISOString(),
  },
  {
    id: 'jd_4',
    title: 'Generative AI Developer (LLMs & LangChain)',
    company_id: 'comp_13',
    raw_text: 'Immediate opening for Generative AI engineers. Experience with fine-tuning open-source models, vector databases, RAG architecture.',
    is_verified: false,
    verification_source: 'file_ai_extract',
    opportunity_type: 'existing_post',
    date_found: '2026-08-20',
    created_by: 'usr_cra_2',
    created_at: new Date('2026-08-20T12:00:00Z').toISOString(),
  },
  {
    id: 'jd_5',
    title: 'Cloud Security Specialist (Prisma Cloud)',
    company_id: 'comp_11',
    raw_text: 'Seeking Cloud Security Engineers for Palo Alto Networks Bangalore engineering team. Must understand container security, Kubernetes, AWS/GCP IAM policies, and Prisma Cloud postures. Open to verified campus talent pipelines.',
    is_verified: true,
    verification_source: 'html_url_parser',
    opportunity_type: 'existing_post',
    date_found: '2026-08-21',
    created_by: 'usr_cra_1',
    created_at: new Date('2026-08-21T09:30:00Z').toISOString(),
  },
  {
    id: 'jd_6',
    title: 'Smart Grid Distributed Systems Engineer',
    company_id: 'comp_8',
    raw_text: 'OATI is hiring high-potential software engineering graduates for energy grid orchestration software. C++, Python, Linux systems, real-time message brokers. Strong foundation in algorithms and distributed state management.',
    is_verified: true,
    verification_source: 'html_url_parser',
    opportunity_type: 'cold_outreach',
    date_found: '2026-08-22',
    created_by: 'usr_cra_1',
    created_at: new Date('2026-08-22T14:15:00Z').toISOString(),
  },
];

export const campaigns: Campaign[] = [
  {
    id: 'camp_1',
    name: 'Q3 Cyber Security Campus Outreach',
    owner_id: 'usr_cra_1',
    status: 'active',
    contact_ids: ['cont_1', 'cont_8', 'cont_9'],
    created_at: new Date('2026-08-20T09:00:00Z').toISOString(),
  },
  {
    id: 'camp_2',
    name: 'Data Science & GenAI Talent Sourcing',
    owner_id: 'usr_cra_2',
    status: 'active',
    contact_ids: ['cont_2', 'cont_3', 'cont_5', 'cont_10', 'cont_11'],
    created_at: new Date('2026-08-21T09:00:00Z').toISOString(),
  },
];

export const outreachChannels: OutreachChannel[] = [
  { id: 'out_1', contact_id: 'cont_1', channel: 'mail', status: 'replied', timestamp: '2026-08-20T10:30:00Z', notes: 'Replied asking for 10 shortlisted student profiles.', created_at: new Date('2026-08-20').toISOString() },
  { id: 'out_2', contact_id: 'cont_1', channel: 'call', status: 'replied', timestamp: '2026-08-21T11:00:00Z', notes: 'Discussed campus drive schedule for next month.', call_duration_seconds: 320, call_outcome: 'Drive Scheduled', created_at: new Date('2026-08-21').toISOString() },
  { id: 'out_3', contact_id: 'cont_2', channel: 'linkedin', status: 'sent', timestamp: '2026-08-20T14:00:00Z', notes: 'InMail invitation sent.', created_at: new Date('2026-08-20').toISOString() },
  { id: 'out_4', contact_id: 'cont_3', channel: 'mail', status: 'replied', timestamp: '2026-08-21T09:15:00Z', notes: 'Positive response, forwarded to tech panel.', created_at: new Date('2026-08-21').toISOString() },
  { id: 'out_5', contact_id: 'cont_4', channel: 'whatsapp', status: 'replied', timestamp: '2026-08-21T15:30:00Z', notes: 'Connected on WhatsApp, received JD guidelines.', created_at: new Date('2026-08-21').toISOString() },
  { id: 'out_6', contact_id: 'cont_8', channel: 'mail', status: 'sent', timestamp: '2026-08-22T10:00:00Z', notes: 'Outreach email sent with CRA brochure.', created_at: new Date('2026-08-22').toISOString() },
  { id: 'out_7', contact_id: 'cont_10', channel: 'call', status: 'replied', timestamp: '2026-08-22T11:30:00Z', notes: 'Sarath confirmed interest in hiring 3 Gen AI interns.', call_duration_seconds: 450, call_outcome: 'JD Promised', created_at: new Date('2026-08-22').toISOString() },
];

export const outreachOutcomes: OutreachOutcome[] = [
  { id: 'outc_1', contact_id: 'cont_1', jd_received: true, jd_id: 'jd_1', is_eligible: true, eligibility_notes: 'B.Tech CS/IT with min 60% eligible', outcome_status: 'eligible_active', updated_by: 'usr_cra_1', updated_at: new Date('2026-08-21').toISOString() },
  { id: 'outc_2', contact_id: 'cont_3', jd_received: true, jd_id: 'jd_2', is_eligible: true, eligibility_notes: 'All branches eligible for Data Analyst test', outcome_status: 'eligible_active', updated_by: 'usr_cra_1', updated_at: new Date('2026-08-21').toISOString() },
  { id: 'outc_3', contact_id: 'cont_4', jd_received: true, jd_id: 'jd_3', is_eligible: true, eligibility_notes: 'Full stack assessment round approved', outcome_status: 'eligible_active', updated_by: 'usr_cra_1', updated_at: new Date('2026-08-22').toISOString() },
  { id: 'outc_4', contact_id: 'cont_10', jd_received: true, jd_id: 'jd_4', is_eligible: true, eligibility_notes: 'Prompt engineering & Python test', outcome_status: 'eligible_active', updated_by: 'usr_cra_2', updated_at: new Date('2026-08-22').toISOString() },
];

export const tasks: Task[] = [
  { id: 'tsk_1', title: 'Follow up with Monisha (iGlobus) on test links', description: 'Ensure test platform links are received by Friday', assignee_id: 'usr_cra_1', assigned_by_id: 'usr_admin_1', priority: 'high', status: 'in_progress', due_date: '2026-09-12', company_id: 'comp_1', contact_id: 'cont_1', created_at: new Date('2026-08-22').toISOString(), updated_at: new Date('2026-08-22').toISOString() },
  { id: 'tsk_2', title: 'Schedule campus presentation with Quickhyre AI', description: 'Arrange 45-min Zoom presentation for 2026 batch', assignee_id: 'usr_cra_2', assigned_by_id: 'usr_admin_2', priority: 'high', status: 'pending', due_date: '2026-09-14', company_id: 'comp_13', contact_id: 'cont_10', created_at: new Date('2026-08-23').toISOString(), updated_at: new Date('2026-08-23').toISOString() },
  { id: 'tsk_3', title: 'Enrich contact database for Pune cybersecurity companies', description: 'Identify 15 new HR contacts on Apollo / LinkedIn', assignee_id: 'usr_cra_3', assigned_by_id: 'usr_admin_1', priority: 'medium', status: 'in_progress', due_date: '2026-09-15', created_at: new Date('2026-08-24').toISOString(), updated_at: new Date('2026-08-24').toISOString() },
];

export const attendanceRecords: Attendance[] = [
  { id: 'att_1', cra_id: 'usr_admin_1', work_date: new Date().toISOString().slice(0, 10), login_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString() },
  { id: 'att_2', cra_id: 'usr_cra_1', work_date: new Date().toISOString().slice(0, 10), login_at: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString() },
  { id: 'att_3', cra_id: 'usr_cra_2', work_date: new Date().toISOString().slice(0, 10), login_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
];

export const leaves: LeaveRequest[] = [
  { id: 'lv_1', cra_id: 'usr_cra_3', leave_type: 'casual', start_date: '2026-09-18', end_date: '2026-09-19', days_count: 2, reason: 'Family function in home town', status: 'approved', reviewed_by: 'usr_admin_1', admin_notes: 'Approved. Ensure tasks are delegated to Harish.', created_at: new Date('2026-08-25').toISOString(), updated_at: new Date('2026-08-26').toISOString() },
];

export const systemSettings: SystemSettings = {
  default_monthly_jd_target: 15,
  apollo_api_configured: !!process.env.APOLLO_API_KEY,
  openai_api_configured: !!process.env.OPENAI_API_KEY,
  openrouter_api_configured: !!process.env.OPENROUTER_API_KEY,
  anthropic_api_configured: false,
  gemini_api_configured: !!process.env.GEMINI_API_KEY,
  openrouter_model: 'google/gemma-4-31b-it:free',
  ai_extraction_active: true,
  extraction_engine: process.env.GEMINI_API_KEY ? 'Google Gemini 3.8 Flash' : 'PLACEMEIN Intelligence Engine (Gemini/Smart OCR)',
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
  return { ...jd, company: comp, creator };
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
