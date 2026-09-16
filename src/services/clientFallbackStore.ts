import { ALL_EMPLOYEE_CREDENTIALS } from '../data/employeeCredentials';
import { INITIAL_PDF_LEADS } from '../data/pdfLeadsData';
import { 
  CRA, 
  Company, 
  HRContact, 
  Task, 
  LeaveRequest, 
  DashboardStats 
} from '../types';

const STORAGE_KEYS = {
  USERS: 'placemein_mock_users',
  COMPANIES: 'placemein_mock_companies',
  CONTACTS: 'placemein_mock_contacts',
  TASKS: 'placemein_mock_tasks',
  LEAVES: 'placemein_mock_leaves',
  CURRENT_USER: 'placemein_current_user',
};

// Initial setup from seed data
function initializeMockData() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUsers: CRA[] = ALL_EMPLOYEE_CREDENTIALS.map((emp) => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      emp_id: emp.empId,
      monthly_jd_target: 20,
      is_active: true,
      created_at: new Date().toISOString(),
    }));
    // Add primary CEO
    if (!defaultUsers.some((u) => u.email === 'aravindaravind3953@gmail.com')) {
      defaultUsers.unshift({
        id: 'usr_admin_aravind',
        name: 'Aravind Reddy',
        email: 'aravindaravind3953@gmail.com',
        role: 'admin',
        emp_id: 'PM-CEO',
        monthly_jd_target: 20,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.COMPANIES) || !localStorage.getItem(STORAGE_KEYS.CONTACTS)) {
    const companies: Company[] = [];
    const contacts: HRContact[] = [];

    INITIAL_PDF_LEADS.forEach((lead) => {
      let company = companies.find((c) => c.name.toLowerCase() === lead.company_name.toLowerCase());
      if (!company) {
        company = {
          id: 'comp_' + lead.id,
          name: lead.company_name,
          employee_count: lead.employee_count,
          linkedin_url: lead.linkedin_url,
          website: lead.website,
          industry: lead.industry,
          source: 'import',
          location: lead.location,
          created_at: new Date().toISOString(),
        };
        companies.push(company);
      }

      contacts.push({
        id: lead.id,
        company_id: company.id,
        name: lead.hr_name,
        title: lead.title,
        email: lead.email,
        phone: lead.phone,
        linkedin_url: lead.hr_linkedin,
        remarks: lead.remarks,
        spoc: lead.spoc,
        domain: lead.domain,
        location: lead.location,
        entered_by_name: lead.entered_by_name,
        source: 'import',
        company,
        created_at: new Date().toISOString(),
      });
    });

    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  }

  if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
    const initialTasks: Task[] = [
      {
        id: 'task-1',
        title: 'Source 15 Cyber Security Lead Profiles',
        description: 'Target Mid to Senior Talent Acquisition Specialists in Bengaluru & Hyderabad.',
        assignee_id: 'usr_cra_1',
        assigned_by_id: 'usr_admin_aravind',
        due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
        priority: 'high',
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'task-2',
        title: 'Verify 10 FinTech HR Phone Numbers',
        description: 'Direct dial outreach verification for upcoming Q3 placement drive.',
        assignee_id: 'usr_cra_2',
        assigned_by_id: 'usr_admin_aravind',
        due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
        priority: 'medium',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(initialTasks));
  }

  if (!localStorage.getItem(STORAGE_KEYS.LEAVES)) {
    const initialLeaves: LeaveRequest[] = [
      {
        id: 'leave-1',
        cra_id: 'usr_cra_1',
        leave_type: 'casual',
        start_date: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
        end_date: new Date(Date.now() + 86400000 * 6).toISOString().slice(0, 10),
        days_count: 2,
        reason: 'Personal travel',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(initialLeaves));
  }
}

try {
  initializeMockData();
} catch (_) {}

export const clientFallbackStore = {
  getUsers(): CRA[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    } catch {
      return [];
    }
  },

  getCurrentUser(): CRA {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
    } catch {}
    const users = this.getUsers();
    return users[0] || {
      id: 'usr_admin_aravind',
      name: 'Aravind Reddy',
      email: 'aravindaravind3953@gmail.com',
      role: 'admin',
      emp_id: 'PM-CEO',
      monthly_jd_target: 20,
      is_active: true,
      created_at: new Date().toISOString(),
    };
  },

  setCurrentUser(user: CRA) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  getCompanies(): Company[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES) || '[]');
    } catch {
      return [];
    }
  },

  getContacts(): HRContact[] {
    try {
      const contacts: HRContact[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTACTS) || '[]');
      const companies = this.getCompanies();
      return contacts.map((c) => ({
        ...c,
        company: c.company || companies.find((comp) => comp.id === c.company_id),
      }));
    } catch {
      return [];
    }
  },

  saveContacts(contacts: HRContact[]) {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  },

  saveCompanies(companies: Company[]) {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
  },

  getTasks(): Task[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    } catch {
      return [];
    }
  },

  saveTasks(tasks: Task[]) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  getLeaves(): LeaveRequest[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.LEAVES) || '[]');
    } catch {
      return [];
    }
  },

  saveLeaves(leaves: LeaveRequest[]) {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaves));
  },

  getStats(): DashboardStats {
    const contacts = this.getContacts();
    const companies = this.getCompanies();
    return {
      total_verified_opportunities: 14,
      total_contacts: contacts.length || 28,
      total_companies: companies.length || 12,
      active_campaign_count: 3,
      outreach_by_channel: [
        { channel: 'mail', count: 20 },
        { channel: 'linkedin', count: 15 },
        { channel: 'call', count: 6 },
        { channel: 'whatsapp', count: 4 },
      ],
      outreach_by_status: [
        { status: 'sent', count: 25 },
        { status: 'replied', count: 12 },
        { status: 'not_started', count: 10 },
        { status: 'failed', count: 3 },
      ],
    };
  },
};
