export interface EmployeeCredential {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cra';
  roleDisplay?: string;
  isDualRole?: boolean;
  empId: string;
  designation: string;
  spocDomain: string;
  avatarBg: string;
  passwordDefault: string;
  notes?: string;
}

export const DEFAULT_EMPLOYEE_PASSWORD = 'Password123!';

// THE CANONICAL 8-MEMBER TEAM ROSTER (EXACTLY 8, NO DUPLICATES)
// 1 CEO Admin + 2 Admins + 5 CRA Employees (reverted 4 employees back to previous canonical names & emails)
export const ALL_EMPLOYEE_CREDENTIALS: EmployeeCredential[] = [
  // 1. CEO ADMIN
  {
    id: 'usr_admin_aravind',
    name: 'Aravind Reddy',
    email: 'aravindreddy.l@placemein.com',
    role: 'admin',
    roleDisplay: 'CEO Admin',
    isDualRole: true,
    empId: 'PM-CEO',
    designation: 'Founder & CEO (CEO Admin)',
    spocDomain: 'Executive Strategy & Corporate Outreach',
    avatarBg: 'bg-amber-600',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'Founder & CEO with full administrative authority and strategic corporate outreach'
  },
  // 2. ADMIN (TEAM LEAD)
  {
    id: 'usr_admin_mansi',
    name: 'Mansi Ramesh Peddi',
    email: 'mansi.p@placemein.com',
    role: 'admin',
    roleDisplay: 'Admin',
    empId: 'PM-002',
    designation: 'CRA Team Lead & Verification Head',
    spocDomain: 'Lead Verification, JDs Governance & Approvals',
    avatarBg: 'bg-purple-700',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'Team Lead and admin rights for verifying company leads, JDs and team performance'
  },
  // 3. ADMIN (MANAGER)
  {
    id: 'usr_admin_vineela',
    name: 'Vineela Bathula',
    email: 'vineela.b@placemein.com',
    role: 'admin',
    roleDisplay: 'Admin',
    empId: 'PM-003',
    designation: 'Manager & Talent Partner',
    spocDomain: 'Corporate Relations, Operations & HR Management',
    avatarBg: 'bg-indigo-700',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'Managerial and administrative rights for employee rosters & leave management'
  },
  // 4. CRA EMPLOYEE - Harish Reddy
  {
    id: 'usr_cra_harish',
    name: 'Harish Reddy',
    email: 'harish.r@placemein.com',
    role: 'cra',
    roleDisplay: 'CRA Employee',
    empId: 'PM-101',
    designation: 'CRA Specialist',
    spocDomain: 'Cyber Security & IT Services',
    avatarBg: 'bg-purple-600',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'Handles major IT & Cyber security corporate leads'
  },
  // 5. CRA EMPLOYEE - Solomon Raj (reverted back to previous name & email)
  {
    id: 'usr_cra_solomon',
    name: 'Solomon Raj',
    email: 'solomon.r@placemein.com',
    role: 'cra',
    roleDisplay: 'CRA Employee',
    empId: 'PM-102',
    designation: 'CRA Specialist',
    spocDomain: 'Cloud & Cyber Security Tech',
    avatarBg: 'bg-blue-600',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'SPOC for Cloud Security & IT sourcing'
  },
  // 6. CRA EMPLOYEE - Charan Kumar (reverted back to previous name & email)
  {
    id: 'usr_cra_charan',
    name: 'Charan Kumar',
    email: 'charankumar.n@placemein.com',
    role: 'cra',
    roleDisplay: 'CRA Employee',
    empId: 'PM-103',
    designation: 'CRA Specialist',
    spocDomain: 'Gen AI & Recruitment Automation',
    avatarBg: 'bg-teal-600',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'SPOC for Gen AI & Recruitment Automation corporate outreach'
  },
  // 7. CRA EMPLOYEE - Mrudula (reverted back to previous name & email)
  {
    id: 'usr_cra_mrudula',
    name: 'Mrudula',
    email: 'mrudula.k@placemein.com',
    role: 'cra',
    roleDisplay: 'CRA Employee',
    empId: 'PM-104',
    designation: 'CRA Specialist',
    spocDomain: 'Cloud Infrastructure & Enterprise Sourcing',
    avatarBg: 'bg-pink-600',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'SPOC for Cloud Infrastructure & IT recruitment sourcing'
  },
  // 8. CRA EMPLOYEE - Namitha K
  {
    id: 'usr_cra_namitha',
    name: 'Namitha K',
    email: 'namitha.k@placemein.com',
    role: 'cra',
    roleDisplay: 'CRA Employee',
    empId: 'PM-105',
    designation: 'CRA Specialist',
    spocDomain: 'Cyber Security & AI Enterprise Leads',
    avatarBg: 'bg-emerald-600',
    passwordDefault: DEFAULT_EMPLOYEE_PASSWORD,
    notes: 'Primary SPOC for Cyber Security enterprise leads'
  },
];

// Helper to normalize and resolve any login alias into the canonical team member
export function resolveEmployeeCredential(inputEmail: string): EmployeeCredential | undefined {
  const clean = inputEmail.trim().toLowerCase();
  
  // Direct match
  const direct = ALL_EMPLOYEE_CREDENTIALS.find(e => e.email.toLowerCase() === clean);
  if (direct) return direct;

  // Seamless alias resolution for historical email variants
  if (clean === 'aravindaravind3953@gmail.com') {
    return ALL_EMPLOYEE_CREDENTIALS.find(e => e.id === 'usr_admin_aravind');
  }
  if (clean === 'vineela.b@placemein.com') {
    return ALL_EMPLOYEE_CREDENTIALS.find(e => e.id === 'usr_admin_vineela');
  }
  if (clean === 'harish.r@placemein.com' || clean === 'harish.reddy@placemein.com' || clean === 'harish.m@placemein.com') {
    return ALL_EMPLOYEE_CREDENTIALS.find(e => e.id === 'usr_cra_harish');
  }
  if (clean === 'solomon.r@placemein.com' || clean === 'solomon.raju@placemein.com') {
    return ALL_EMPLOYEE_CREDENTIALS.find(e => e.id === 'usr_cra_solomon');
  }
  if (clean === 'charankumar.n@placemein.com' || clean === 'charan.k@placemein.com') {
    return ALL_EMPLOYEE_CREDENTIALS.find(e => e.id === 'usr_cra_charan');
  }
  if (clean === 'mrudula.k@placemein.com' || clean === 'mrudula.t@placemein.com' || clean === 'mrudula@placemein.com') {
    return ALL_EMPLOYEE_CREDENTIALS.find(e => e.id === 'usr_cra_mrudula');
  }
  if (clean === 'namitha.k@placemein.com' || clean === 'namitha.s@placemein.com') {
    return ALL_EMPLOYEE_CREDENTIALS.find(e => e.id === 'usr_cra_namitha');
  }
  
  return undefined;
}

export function getFormattedCredentialsText(): string {
  let output = '=== PLACEMEIN OFFICIAL TEAM ROSTER & LOGIN CREDENTIALS ===\n';
  output += `Universal Default Password: ${DEFAULT_EMPLOYEE_PASSWORD}\n\n`;

  output += '--- 1. CEO ADMIN ---\n';
  ALL_EMPLOYEE_CREDENTIALS.filter(e => e.id === 'usr_admin_aravind').forEach(e => {
    output += `• ${e.name} (${e.empId}) | Designation: ${e.designation}\n`;
    output += `  Email: ${e.email}\n`;
    output += `  Password: ${e.passwordDefault}\n`;
    output += `  Domain: ${e.spocDomain}\n\n`;
  });

  output += '--- 2. ADMINISTRATORS (2 ADMINS) ---\n';
  ALL_EMPLOYEE_CREDENTIALS.filter(e => e.role === 'admin' && e.id !== 'usr_admin_aravind').forEach(e => {
    output += `• ${e.name} (${e.empId}) | Designation: ${e.designation}\n`;
    output += `  Email: ${e.email}\n`;
    output += `  Password: ${e.passwordDefault}\n`;
    output += `  Domain: ${e.spocDomain}\n\n`;
  });

  output += '--- 3. CRA EMPLOYEES (5 SPECIALISTS) ---\n';
  ALL_EMPLOYEE_CREDENTIALS.filter(e => e.role === 'cra').forEach(e => {
    output += `• ${e.name} (${e.empId}) | Designation: ${e.designation}\n`;
    output += `  Email: ${e.email}\n`;
    output += `  Password: ${e.passwordDefault}\n`;
    output += `  Domain: ${e.spocDomain}\n\n`;
  });

  return output;
}
