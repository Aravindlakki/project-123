export interface EmployeeCredential {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cra';
  empId: string;
  designation: string;
  spocDomain: string;
  avatarBg: string;
  passwordDefault: string;
  notes?: string;
}

export const DEFAULT_EMPLOYEE_PASSWORD = 'Password123!';

export const ALL_EMPLOYEE_CREDENTIALS: EmployeeCredential[] = [
  // CRA Specialists (Sourcing & Outreach Employees)
  {
    id: 'usr_cra_1',
    name: 'Harish Reddy',
    email: 'harish.r@placemein.com',
    role: 'cra',
    empId: 'PM-101',
    designation: 'CRA Specialist',
    spocDomain: 'Cyber Security & IT Services',
    avatarBg: 'bg-purple-600',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'Handles major IT & Cyber security corporate leads'
  },
  {
    id: 'usr_cra_2',
    name: 'Namitha K',
    email: 'namitha.k@placemein.com',
    role: 'cra',
    empId: 'PM-102',
    designation: 'CRA Specialist',
    spocDomain: 'Cyber Security & AI',
    avatarBg: 'bg-emerald-600',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'Primary SPOC for Cyber Security enterprise leads'
  },
  {
    id: 'usr_cra_3',
    name: 'Charan Kumar',
    email: 'charankumar.n@placemein.com',
    role: 'cra',
    empId: 'PM-103',
    designation: 'CRA Specialist',
    spocDomain: 'Gen AI & Recruitment Automation',
    avatarBg: 'bg-teal-600',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'SPOC for AI & GenAI client accounts'
  },
  {
    id: 'usr_cra_4',
    name: 'Aliya Shaik',
    email: 'aliya.s@placemein.com',
    role: 'cra',
    empId: 'PM-104',
    designation: 'CRA Specialist',
    spocDomain: 'Cyber Security & Cloud Infrastructure',
    avatarBg: 'bg-pink-600',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'SPOC for Cyber Security partner outreach'
  },
  {
    id: 'usr_cra_5',
    name: 'Solomon Raj',
    email: 'solomon.r@placemein.com',
    role: 'cra',
    empId: 'PM-105',
    designation: 'CRA Specialist',
    spocDomain: 'Cloud & Cyber Security Tech',
    avatarBg: 'bg-blue-600',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'SPOC for Cloud Security & IT sourcing'
  },
  {
    id: 'usr_cra_6',
    name: 'Varshith Reddy',
    email: 'varshith.r@placemein.com',
    role: 'cra',
    empId: 'PM-106',
    designation: 'CRA Specialist',
    spocDomain: 'Cyber Security & Enterprise Outbound',
    avatarBg: 'bg-indigo-600',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'SPOC for Enterprise Cyber security pipelines'
  },
  {
    id: 'usr_cra_7',
    name: 'Aasritha K',
    email: 'aasritha.k@placemein.com',
    role: 'cra',
    empId: 'PM-107',
    designation: 'CRA Specialist',
    spocDomain: 'Cyber Security & Sourcing',
    avatarBg: 'bg-amber-600',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'SPOC for Cyber Security talent sourcing'
  },

  // Admin Leadership Accounts
  {
    id: 'usr_admin_1',
    name: 'Aravind Reddy',
    email: 'aravindreddy.l@placemein.com',
    role: 'admin',
    empId: 'PM-001',
    designation: 'CEO & Founder',
    spocDomain: 'Executive Leadership & Overall Strategy',
    avatarBg: 'bg-amber-600',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'Full administrative access and executive dashboard'
  },
  {
    id: 'usr_admin_user_session',
    name: 'Aravind Reddy (Admin)',
    email: 'aravindaravind3953@gmail.com',
    role: 'admin',
    empId: 'PM-CEO',
    designation: 'Founder Admin Access',
    spocDomain: 'System Master & Platform Admin',
    avatarBg: 'bg-amber-700',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'Root administrative account'
  },
  {
    id: 'usr_admin_2',
    name: 'CRA Associate Lead',
    email: 'cra_lead@placemein.com',
    role: 'admin',
    empId: 'PM-002',
    designation: 'Operations & CRA Team Lead',
    spocDomain: 'Team Operations & JDs Governance',
    avatarBg: 'bg-amber-600',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'Team lead oversight and task assignments'
  },
  {
    id: 'usr_admin_3',
    name: 'Mansi Ramesh Peddi',
    email: 'mansi.p@placemein.com',
    role: 'admin',
    empId: 'PM-003',
    designation: 'Admin & Verification Lead',
    spocDomain: 'Lead Verification & Approvals',
    avatarBg: 'bg-purple-700',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'Admin rights for verifying company leads and JDs'
  },
  {
    id: 'usr_admin_4',
    name: 'Vineela Bathula',
    email: 'vineela.b@placemein.com',
    role: 'admin',
    empId: 'PM-004',
    designation: 'Admin & Talent Partner',
    spocDomain: 'Corporate Relations & HR Management',
    avatarBg: 'bg-indigo-700',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'Admin access for employee rosters & leave management'
  }
];

export function getFormattedCredentialsText(): string {
  let output = '=== PLACEMEIN EMPLOYEE LOGIN CREDENTIALS ===\n';
  output += `Universal Default Password: ${DEFAULT_EMPLOYEE_PASSWORD}\n\n`;

  output += '--- CRA SPECIALISTS (RECRUITMENT EMPLOYEES) ---\n';
  ALL_EMPLOYEE_CREDENTIALS.filter(e => e.role === 'cra').forEach(e => {
    output += `• ${e.name} (${e.empId}) | Role: ${e.designation}\n`;
    output += `  Email: ${e.email}\n`;
    output += `  Password: ${e.passwordDefault}\n`;
    output += `  Domain: ${e.spocDomain}\n\n`;
  });

  output += '--- ADMIN LEADERSHIP ---\n';
  ALL_EMPLOYEE_CREDENTIALS.filter(e => e.role === 'admin').forEach(e => {
    output += `• ${e.name} (${e.empId}) | Role: ${e.designation}\n`;
    output += `  Email: ${e.email}\n`;
    output += `  Password: ${e.passwordDefault}\n`;
    output += `  Domain: ${e.spocDomain}\n\n`;
  });

  return output;
}
