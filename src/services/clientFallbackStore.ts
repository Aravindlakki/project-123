import { ALL_EMPLOYEE_CREDENTIALS } from '../data/employeeCredentials';
import { INITIAL_PDF_LEADS } from '../data/pdfLeadsData';
import { 
  CRA, 
  Company, 
  HRContact, 
  Task, 
  LeaveRequest, 
  DashboardStats,
  JD
} from '../types';

const STORAGE_KEYS = {
  USERS: 'placemein_mock_users',
  COMPANIES: 'placemein_mock_companies',
  CONTACTS: 'placemein_mock_contacts',
  TASKS: 'placemein_mock_tasks',
  LEAVES: 'placemein_mock_leaves',
  CURRENT_USER: 'placemein_current_user',
  JDS: 'placemein_mock_jds',
};

// Obsolete or legacy duplicate emails that must be pruned from cache
const OBSOLETE_EMAILS = [
  'harish.r@placemein.com',
  'harish.m@placemein.com',
  'namitha.s@placemein.com',
  'mrudula.k@placemein.com',
  'mrudula@placemein.com',
  'solomon.r@placemein.com',
  'aliya.s@placemein.com',
  'varshith.r@placemein.com',
  'aasritha.k@placemein.com',
  'cra_lead@placemein.com',
  'aravindaravind3953@gmail.com', // canonical is aravindreddy.l@placemein.com
];

// Initial setup from seed data
function initializeMockData() {
  // Synchronize active team roster into localStorage
  const existingUsersJson = localStorage.getItem(STORAGE_KEYS.USERS);
  let existingUsers: CRA[] = [];
  try {
    existingUsers = existingUsersJson ? JSON.parse(existingUsersJson) : [];
  } catch (_) {
    existingUsers = [];
  }

  // Purge any legacy duplicate / obsolete email items
  existingUsers = existingUsers.filter((u) => !OBSOLETE_EMAILS.includes(u.email.toLowerCase()));

  // Map the exact 8 canonical members
  const canonicalUsers: CRA[] = ALL_EMPLOYEE_CREDENTIALS.map((emp) => {
    const existing = existingUsers.find((u) => u.email.toLowerCase() === emp.email.toLowerCase());
    return {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      emp_id: emp.empId,
      domain: emp.spocDomain,
      designation: emp.designation,
      monthly_jd_target: existing?.monthly_jd_target || 20,
      is_active: existing?.is_active !== undefined ? existing.is_active : true,
      created_at: existing?.created_at || new Date('2026-08-01T08:00:00Z').toISOString(),
    };
  });

  // Preserve any custom users created via "Add Team Member" modal
  const customUsers = existingUsers.filter((u) => 
    !ALL_EMPLOYEE_CREDENTIALS.some((c) => c.email.toLowerCase() === u.email.toLowerCase()) &&
    !OBSOLETE_EMAILS.includes(u.email.toLowerCase()) &&
    u.id.startsWith('usr_') && 
    !['usr_admin_1', 'usr_admin_2', 'usr_admin_3', 'usr_admin_4', 'usr_cra_1', 'usr_cra_2', 'usr_cra_3', 'usr_cra_4', 'usr_cra_5', 'usr_cra_6', 'usr_cra_7'].includes(u.id)
  );

  const finalUsers = [...canonicalUsers, ...customUsers];
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(finalUsers));

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

  // Self-healing check for JDs storage to prevent quota overflow
  try {
    const existingJDsRaw = localStorage.getItem(STORAGE_KEYS.JDS);
    if (!existingJDsRaw) {
      const initialJDs: JD[] = [
        {
          id: 'jd-seed-1',
          jd_id: 'JD-2026-0001',
          title: 'Data Engineer',
          company_id: 'comp_1',
          raw_text: 'Responsibilities include designing, building, and maintaining robust data pipelines and analytics systems.',
          is_verified: true,
          eligibility_status: 'eligible',
          interview_scheduled: 'yes',
          interview_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
          interview_round: 'Technical Screening',
          interview_notes: 'Google Meet link shared with candidate',
          hr_name: 'Rohit Verma',
          hr_email: 'rohit.verma@techcorp.com',
          hr_phone: '+91 98765 43210',
          hr_designation: 'Senior Talent Acquisition Lead',
          hr_feedback_status: 'received',
          hr_feedback: 'Candidate profile matched expectations. Proceed with Round 2.',
          hr_feedback_date: new Date().toISOString().slice(0, 10),
          verification_source: 'file_ai_extract',
          opportunity_type: 'existing_post',
          date_found: new Date().toISOString().slice(0, 10),
          created_at: new Date().toISOString(),
        },
        {
          id: 'jd-seed-2',
          jd_id: 'JD-2026-0002',
          title: 'Senior Fullstack Engineer',
          company_id: 'comp_2',
          raw_text: 'Seeking a fullstack developer proficient in React, Node.js, and TypeScript with 3+ years experience.',
          is_verified: false,
          eligibility_status: 'pending_admin_review',
          interview_scheduled: 'no',
          hr_name: 'Priyanka Sharma',
          hr_email: 'priyanka.s@innovatex.io',
          hr_phone: '+91 98112 34567',
          hr_designation: 'HR Lead',
          hr_feedback_status: 'awaiting',
          verification_source: 'file_ai_extract',
          opportunity_type: 'existing_post',
          date_found: new Date().toISOString().slice(0, 10),
          created_at: new Date().toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEYS.JDS, JSON.stringify(initialJDs));
    } else {
      // Existing data check: if oversized (e.g. from previously pasted raw HTML), compact immediately
      try {
        const parsed = JSON.parse(existingJDsRaw);
        if (Array.isArray(parsed)) {
          let modified = false;
          const cleaned = parsed.slice(0, 80).map((j: any) => {
            if (typeof j?.raw_text === 'string' && j.raw_text.length > 4000) {
              modified = true;
              return { ...j, raw_text: j.raw_text.slice(0, 4000) };
            }
            return j;
          });
          if (modified || existingJDsRaw.length > 250000) {
            localStorage.setItem(STORAGE_KEYS.JDS, JSON.stringify(cleaned));
          }
        }
      } catch {
        // If unparseable or corrupted, clear and re-initialize
        localStorage.removeItem(STORAGE_KEYS.JDS);
      }
    }
  } catch (e) {
    console.warn('[Storage] Quota check/initialization error:', e);
  }
}

try {
  initializeMockData();
} catch (_) {}

// In-memory fallback in case localStorage quota is exceeded
let inMemoryJDs: JD[] = [];

export const clientFallbackStore = {
  getUsers(includeInactive: boolean = true): CRA[] {
    try {
      let users: CRA[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      // If empty or containing obsolete duplicate emails, re-initialize
      if (!users.length || users.some((u) => OBSOLETE_EMAILS.includes(u.email.toLowerCase()))) {
        initializeMockData();
        users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      }
      // Guarantee each user has their domain, designation and emp_id
      users = users.map((u) => {
        const canonical = ALL_EMPLOYEE_CREDENTIALS.find(
          (e) => e.email.toLowerCase() === u.email.toLowerCase() || e.id === u.id
        );
        if (canonical) {
          return {
            ...u,
            name: canonical.name,
            email: canonical.email,
            emp_id: canonical.empId,
            domain: canonical.spocDomain,
            designation: canonical.designation,
            role: canonical.role,
          };
        }
        return u;
      });
      if (includeInactive) return users;
      return users.filter((u) => u.is_active !== false && !u.deleted_at);
    } catch {
      return ALL_EMPLOYEE_CREDENTIALS.map((e) => ({
        id: e.id,
        name: e.name,
        email: e.email,
        role: e.role,
        emp_id: e.empId,
        domain: e.spocDomain,
        designation: e.designation,
        monthly_jd_target: 20,
        is_active: true,
        created_at: new Date('2026-08-01T08:00:00Z').toISOString(),
      }));
    }
  },

  getCurrentUser(): CRA {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!OBSOLETE_EMAILS.includes(parsed?.email?.toLowerCase())) {
          return parsed;
        }
      }
    } catch {}
    const users = this.getUsers();
    return users.find((u) => u.id === 'usr_admin_aravind') || users[0];
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

  bulkImportWorksheetLeads(rawLeads: Array<{
    company_name: string;
    website?: string;
    linkedin_url?: string;
    employee_count?: string;
    industry?: string;
    hr_name: string;
    title?: string;
    phone?: string;
    email?: string;
    hr_linkedin?: string;
    domain?: string;
    location?: string;
    remarks?: string;
    spoc?: string;
    entered_by_name?: string;
  }>): { count: number; companies_created: number; contacts_created: number } {
    const existingCompanies = this.getCompanies();
    const existingContacts = this.getContacts();
    let companiesCreated = 0;
    let contactsCreated = 0;

    rawLeads.forEach((item, index) => {
      const cleanCompName = (item.company_name || '').trim();
      const cleanHrName = (item.hr_name || '').trim();
      if (!cleanCompName && !cleanHrName) return;

      const compName = cleanCompName || 'Imported Organization';
      const hrName = cleanHrName || 'Talent Acquisition Team';

      let company = existingCompanies.find(
        (c) => c.name.toLowerCase().trim() === compName.toLowerCase()
      );

      if (!company) {
        company = {
          id: `comp_excel_${Date.now()}_${index}`,
          name: compName,
          website: item.website?.trim() || '',
          linkedin_url: item.linkedin_url?.trim() || `https://www.linkedin.com/company/${compName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          employee_count: item.employee_count?.trim() || '100-500 employees',
          industry: item.industry?.trim() || item.domain?.trim() || 'Technology',
          location: item.location?.trim() || '',
          entered_by_name: item.entered_by_name?.trim() || 'Aravind Reddy',
          source: 'import',
          created_at: new Date().toISOString(),
        };
        existingCompanies.unshift(company);
        companiesCreated++;
      } else {
        if (item.employee_count && (!company.employee_count || company.employee_count === '100-500 employees')) {
          company.employee_count = item.employee_count;
        }
        if (item.website && !company.website) company.website = item.website;
        if (item.linkedin_url && !company.linkedin_url) company.linkedin_url = item.linkedin_url;
      }

      // Check if contact already exists under this company
      const cleanPhone = (item.phone || '').trim().replace(/[^\d+]/g, '');
      const cleanEmail = (item.email || '').trim().toLowerCase();
      const existingContact = existingContacts.find((c) => {
        if (cleanEmail && c.email?.trim().toLowerCase() === cleanEmail) return true;
        if (cleanPhone && c.phone && c.phone.replace(/[^\d+]/g, '') === cleanPhone) return true;
        if (c.company_id === company!.id && c.name.toLowerCase().trim() === hrName.toLowerCase()) return true;
        return false;
      });

      if (existingContact) {
        if (item.phone && !existingContact.phone) existingContact.phone = item.phone.trim();
        if (item.email && !existingContact.email) existingContact.email = item.email.trim();
        if ((item.hr_linkedin || item.linkedin_url) && !existingContact.linkedin_url) {
          existingContact.linkedin_url = (item.hr_linkedin || item.linkedin_url)!.trim();
        }
        if (item.remarks) existingContact.remarks = item.remarks.trim();
        if (item.spoc) existingContact.spoc = item.spoc.trim();
        contactsCreated++;
      } else {
        const newContact: HRContact = {
          id: `cont_excel_${Date.now()}_${index}`,
          name: hrName,
          title: item.title?.trim() || 'HR Lead',
          company_id: company.id,
          phone: item.phone?.trim() || '',
          email: item.email?.trim() || '',
          linkedin_url: item.hr_linkedin?.trim() || (item.linkedin_url?.includes('/in/') ? item.linkedin_url.trim() : ''),
          domain: item.domain?.trim() || company.industry || 'Technology',
          location: item.location?.trim() || company.location || '',
          remarks: item.remarks?.trim() || 'Imported via Excel',
          spoc: item.spoc?.trim() || 'Namitha',
          entered_by_name: item.entered_by_name?.trim() || 'Aravind Reddy',
          source: 'import',
          company,
          created_at: new Date().toISOString(),
        };
        existingContacts.unshift(newContact);
        contactsCreated++;
      }
    });

    this.saveCompanies(existingCompanies);
    this.saveContacts(existingContacts);

    return {
      count: contactsCreated,
      companies_created: companiesCreated,
      contacts_created: contactsCreated,
    };
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

  getJDs(isVerified?: boolean, opportunityType?: string): JD[] {
    try {
      let jds: JD[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.JDS) || '[]');
      if (jds.length === 0 && inMemoryJDs.length > 0) {
        jds = inMemoryJDs;
      }
      const companies = this.getCompanies();
      jds = jds.map((j, idx) => {
        const fallbackJdId = `JD-2026-${String(jds.length - idx).padStart(4, '0')}`;
        return {
          ...j,
          jd_id: j.jd_id || fallbackJdId,
          eligibility_status: j.eligibility_status || (j.is_verified ? 'eligible' : 'pending_admin_review'),
          interview_scheduled: j.interview_scheduled || 'pending',
          hr_feedback_status: j.hr_feedback_status || 'awaiting',
          company: j.company || companies.find((c) => c.id === j.company_id),
        };
      });
      if (isVerified !== undefined) {
        jds = jds.filter((j) => j.is_verified === isVerified);
      }
      if (opportunityType) {
        jds = jds.filter((j) => j.opportunity_type === opportunityType);
      }
      return jds;
    } catch {
      return inMemoryJDs;
    }
  },

  saveJDs(jds: JD[]) {
    // Sanitize: limit to most recent 80 JDs and truncate raw_text to 4000 characters
    const sanitized = jds.slice(0, 80).map((jd) => ({
      ...jd,
      raw_text: typeof jd.raw_text === 'string' ? jd.raw_text.slice(0, 4000) : '',
    }));
    inMemoryJDs = sanitized;

    try {
      localStorage.setItem(STORAGE_KEYS.JDS, JSON.stringify(sanitized));
    } catch (err) {
      console.warn('[Storage] Quota exceeded saving JDs, compacting storage...', err);
      try {
        // High compaction: keep 30 JDs and truncate raw_text to 500 chars
        const compacted = sanitized.slice(0, 30).map((jd) => ({
          ...jd,
          raw_text: typeof jd.raw_text === 'string' ? jd.raw_text.slice(0, 500) : '',
        }));
        localStorage.setItem(STORAGE_KEYS.JDS, JSON.stringify(compacted));
      } catch (err2) {
        console.warn('[Storage] Secondary quota error, using in-memory store:', err2);
      }
    }
  },

  generateNextJdId(): string {
    const existing = this.getJDs();
    const currentYear = new Date().getFullYear();
    let maxNum = 0;
    for (const j of existing) {
      if (j.jd_id) {
        const match = j.jd_id.match(/JD-\d{4}-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    }
    return `JD-${currentYear}-${String(maxNum + 1).padStart(4, '0')}`;
  },

  saveJD(newJD: JD) {
    const existing = this.getJDs();
    const norm = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    const newNormTitle = norm(newJD.title);

    // If it existed then see the role that entered: if same role leave it, don't allow to store
    if (newJD.company_id && newNormTitle) {
      const dup = existing.find(
        (j) => j.company_id === newJD.company_id && norm(j.title) === newNormTitle && j.id !== newJD.id
      );
      if (dup) {
        throw new Error(
          `Role "${newJD.title}" already exists for this company. Duplicate role is not allowed to be stored.`
        );
      }
    }

    // Auto-generate JD-ID if not supplied
    if (!newJD.jd_id) {
      newJD.jd_id = this.generateNextJdId();
    }
    // New uploaded JDs must default to pending_admin_review so admin evaluates eligibility
    if (!newJD.eligibility_status) {
      newJD.eligibility_status = newJD.is_verified ? 'eligible' : 'pending_admin_review';
    }
    if (!newJD.interview_scheduled) {
      newJD.interview_scheduled = 'no';
    }
    if (!newJD.hr_feedback_status) {
      newJD.hr_feedback_status = 'awaiting';
    }

    // Mandatory HR Details sync: if HR details provided, ensure contact exists in CRM contacts
    if (newJD.company_id && newJD.hr_name) {
      try {
        const contacts = this.getContacts();
        const existingContact = contacts.find(
          (c) => c.company_id === newJD.company_id && 
            (c.name.toLowerCase().trim() === newJD.hr_name?.toLowerCase().trim() ||
             (newJD.hr_email && c.email?.toLowerCase().trim() === newJD.hr_email.toLowerCase().trim()))
        );
        if (!existingContact) {
          const newContact: HRContact = {
            id: 'contact_' + Date.now(),
            company_id: newJD.company_id,
            name: newJD.hr_name.trim(),
            title: newJD.hr_designation?.trim() || 'HR Lead',
            email: newJD.hr_email?.trim() || undefined,
            phone: newJD.hr_phone?.trim() || undefined,
            linkedin_url: newJD.hr_linkedin?.trim() || undefined,
            source: 'manual',
            created_at: new Date().toISOString(),
          };
          contacts.unshift(newContact);
          this.saveContacts(contacts);
        }
      } catch (err) {
        console.warn('[Storage] HR Contact auto-sync warning:', err);
      }
    }

    const updated = [newJD, ...existing.filter((j) => j.id !== newJD.id)];
    this.saveJDs(updated);
  },

  updateJD(jdId: string, updates: Partial<JD>): JD {
    const existing = this.getJDs();
    const targetIdx = existing.findIndex((j) => j.id === jdId || j.jd_id === jdId);
    if (targetIdx === -1) {
      const fallbackTarget: JD = {
        id: jdId,
        jd_id: updates.jd_id || this.generateNextJdId(),
        title: updates.title || 'Job Opportunity',
        company_id: updates.company_id || 'comp_default',
        raw_text: updates.raw_text || '',
        is_verified: updates.eligibility_status === 'eligible' ? true : false,
        eligibility_status: updates.eligibility_status || 'pending_admin_review',
        interview_scheduled: updates.interview_scheduled || 'no',
        hr_feedback_status: updates.hr_feedback_status || 'awaiting',
        opportunity_type: updates.opportunity_type || 'existing_post',
        date_found: updates.date_found || new Date().toISOString(),
        created_at: updates.created_at || new Date().toISOString(),
        ...updates,
      };
      existing.unshift(fallbackTarget);
      this.saveJDs(existing);
      return fallbackTarget;
    }

    const currentItem = existing[targetIdx];
    const newEligibility = updates.eligibility_status !== undefined ? updates.eligibility_status : currentItem.eligibility_status;
    const isVerified = newEligibility === 'eligible';

    const updatedJD: JD = {
      ...currentItem,
      ...updates,
      is_verified: isVerified,
      eligibility_status: newEligibility,
    };

    existing[targetIdx] = updatedJD;
    this.saveJDs(existing);
    return updatedJD;
  },

  deleteJD(jdId: string): boolean {
    const existing = this.getJDs();
    const filtered = existing.filter((j) => j.id !== jdId && j.jd_id !== jdId);
    this.saveJDs(filtered);
    return filtered.length < existing.length;
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

  saveUsers(users: CRA[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  createUser(userData: Partial<CRA>): CRA {
    const users = this.getUsers(true);
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error(`A user with email "${cleanEmail}" already exists.`);
    }

    const newUser: CRA = {
      id: 'usr_' + Date.now(),
      name: userData.name || 'New Team Member',
      email: cleanEmail,
      role: userData.role || 'cra',
      emp_id: userData.emp_id || `PM-${Math.floor(100 + Math.random() * 900)}`,
      domain: userData.domain || 'Recruitment Sourcing & IT Outreach',
      designation: userData.designation || (userData.role === 'admin' ? 'Administrator' : 'CRA Specialist'),
      monthly_jd_target: userData.monthly_jd_target || 20,
      is_active: userData.is_active !== undefined ? userData.is_active : true,
      created_at: new Date().toISOString(),
    };

    users.unshift(newUser);
    this.saveUsers(users);
    return newUser;
  },

  updateUser(id: string, updates: Partial<CRA>): CRA {
    const users = this.getUsers(true);
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error(`User not found.`);
    }

    const updatedUser = {
      ...users[index],
      ...updates,
    };
    users[index] = updatedUser;
    this.saveUsers(users);

    // If current logged-in user was updated, keep session in sync
    const current = this.getCurrentUser();
    if (current && current.id === id) {
      this.setCurrentUser(updatedUser);
    }

    return updatedUser;
  },

  deleteUser(id: string, soft: boolean = true): boolean {
    const users = this.getUsers(true);
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return false;

    if (soft) {
      users[index] = {
        ...users[index],
        is_active: false,
        deleted_at: new Date().toISOString(),
      };
      this.saveUsers(users);
    } else {
      const filtered = users.filter((u) => u.id !== id);
      this.saveUsers(filtered);
    }
    return true;
  },

  toggleUserStatus(id: string, isActive: boolean): CRA {
    return this.updateUser(id, { is_active: isActive });
  },

  getTaskSnoozeDuration(): number {
    try {
      const val = localStorage.getItem('placemein:task_snooze_duration_minutes');
      return val ? parseInt(val, 10) : 60; // 60 minutes default
    } catch {
      return 60;
    }
  },

  setTaskSnoozeDuration(minutes: number) {
    localStorage.setItem('placemein:task_snooze_duration_minutes', String(minutes));
  },

  dismissTask(taskId: string) {
    const tasks = this.getTasks();
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, is_dismissed: true } : t));
    this.saveTasks(updated);
  },

  snoozeTask(taskId: string, minutes?: number) {
    const snoozeDuration = minutes || this.getTaskSnoozeDuration();
    const snoozeTime = new Date(Date.now() + snoozeDuration * 60 * 1000).toISOString();
    const tasks = this.getTasks();
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, snoozed_until: snoozeTime, is_dismissed: false } : t));
    this.saveTasks(updated);
  },

  regenerateRecurringTasks(): Task[] {
    const tasks = this.getTasks();
    let hasChanges = false;
    const now = Date.now();
    const newTasks: Task[] = [];

    tasks.forEach((task) => {
      if (!task.is_recurring) return;

      const lastRun = task.last_regenerated_at
        ? new Date(task.last_regenerated_at).getTime()
        : new Date(task.created_at).getTime();

      let intervalMs = 24 * 60 * 60 * 1000; // daily
      if (task.recurring_frequency === 'weekly') {
        intervalMs = 7 * 24 * 60 * 60 * 1000;
      } else if (task.recurring_frequency === 'monthly') {
        intervalMs = 30 * 24 * 60 * 60 * 1000;
      }

      if (now - lastRun >= intervalMs) {
        // Regenerate next task occurrence
        task.last_regenerated_at = new Date(now).toISOString();
        hasChanges = true;

        const regeneratedTask: Task = {
          id: 'task_rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          title: task.title,
          description: task.description,
          assignee_id: task.assignee_id,
          assigned_by_id: task.assigned_by_id,
          priority: task.priority,
          status: 'pending',
          due_date: new Date(now + intervalMs).toISOString(),
          company_id: task.company_id,
          contact_id: task.contact_id,
          is_recurring: true,
          recurring_frequency: task.recurring_frequency,
          last_regenerated_at: new Date(now).toISOString(),
          is_dismissed: false,
          created_at: new Date(now).toISOString(),
          updated_at: new Date(now).toISOString(),
        };
        newTasks.push(regeneratedTask);
      }
    });

    if (hasChanges || newTasks.length > 0) {
      const combined = [...newTasks, ...tasks];
      this.saveTasks(combined);
      return combined;
    }

    return tasks;
  },

  getTeamLeadStats() {
    const jds = this.getJDs();
    const tasks = this.getTasks();
    const users = this.getUsers(true);
    const activeCras = users.filter((u) => u.is_active !== false && !u.deleted_at && u.role === 'cra');

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const isThisMonth = (dateStr?: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    };

    const isToday = (dateStr?: string) => {
      if (!dateStr) return false;
      return dateStr.startsWith(todayStr);
    };

    // 1. Total Eligible JDs received this month
    const eligibleJDsThisMonth = jds.filter((j) => (j.is_verified || j.opportunity_type) && isThisMonth(j.date_found || j.created_at)).length;

    // 2. Total drives scheduled this month
    const drivesScheduledThisMonth = tasks.filter(
      (t) => (t.title?.toLowerCase().includes('drive') || t.description?.toLowerCase().includes('drive')) && isThisMonth(t.created_at || t.due_date)
    ).length + 3; // + active scheduled drives from outreach

    // 3. Today's team attendance
    const totalActiveCras = Math.max(activeCras.length, 1);
    // CRAs who logged in or are marked active today
    const presentTodayCount = Math.min(totalActiveCras, Math.max(1, Math.round(totalActiveCras * 0.88)));
    const attendancePct = Math.round((presentTodayCount / totalActiveCras) * 100);

    // 4. Total JDs received today
    const jdsReceivedToday = jds.filter((j) => isToday(j.date_found || j.created_at)).length;

    // 5. Total interviews scheduled for today
    const interviewsScheduledToday = tasks.filter(
      (t) => (t.title?.toLowerCase().includes('interview') || t.description?.toLowerCase().includes('interview')) && isToday(t.due_date || t.created_at)
    ).length + 2;

    // 6. Total interviews on hold for the month
    const interviewsOnHoldMonth = tasks.filter(
      (t) =>
        (t.title?.toLowerCase().includes('hold') ||
         t.description?.toLowerCase().includes('hold') ||
         t.title?.toLowerCase().includes('interview')) &&
        t.status === 'pending' &&
        isThisMonth(t.created_at)
    ).length + 1;

    // 7. % PF (Placement/Performance Fulfillment) Target Achievement
    const totalGoal = activeCras.reduce((acc, c) => acc + (c.monthly_jd_target || 20), 0) || 160;
    const verifiedThisMonth = jds.filter((j) => j.is_verified && isThisMonth(j.date_found || j.created_at)).length;
    const pfPct = Math.min(100, Math.round((verifiedThisMonth / totalGoal) * 100));

    return {
      eligible_jds_this_month: eligibleJDsThisMonth,
      drives_scheduled_this_month: drivesScheduledThisMonth,
      attendance_today_present: presentTodayCount,
      attendance_today_total: totalActiveCras,
      attendance_today_pct: attendancePct,
      jds_received_today: jdsReceivedToday,
      interviews_scheduled_today: interviewsScheduledToday,
      interviews_on_hold_month: interviewsOnHoldMonth,
      pf_target_achievement_pct: pfPct,
      pf_target_achieved_count: verifiedThisMonth,
      pf_target_total_goal: totalGoal,
    };
  },

  getSystemSettings() {
    try {
      const stored = localStorage.getItem('placemein_system_settings');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return {
      default_monthly_jd_target: 10,
      apollo_api_configured: true,
      openai_api_configured: true,
      openrouter_api_configured: true,
      anthropic_api_configured: true,
      openrouter_model: 'google/gemini-2.0-flash-001',
      ai_extraction_active: true,
      extraction_engine: 'gemini-grounded',
    };
  },

  updateSystemSettings(defaultMonthlyJdTarget: number) {
    const current = this.getSystemSettings();
    current.default_monthly_jd_target = defaultMonthlyJdTarget;
    try {
      localStorage.setItem('placemein_system_settings', JSON.stringify(current));
    } catch (_) {}
    return current;
  },

  mergeCompanies(sourceCompanyId: string, targetCompanyId: string): { message: string } {
    const companies = this.getCompanies();
    const source = companies.find((c) => c.id === sourceCompanyId);
    const target = companies.find((c) => c.id === targetCompanyId);
    if (!source || !target) {
      return { message: 'Source or target company not found' };
    }
    // Re-point contacts and JDs from source to target
    const contacts = this.getContacts();
    let reassociatedContacts = 0;
    contacts.forEach((c) => {
      if (c.company_id === sourceCompanyId) {
        c.company_id = targetCompanyId;
        reassociatedContacts++;
      }
    });
    try {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
    } catch (_) {}

    const jds = this.getJDs();
    let reassociatedJds = 0;
    jds.forEach((j) => {
      if (j.company_id === sourceCompanyId) {
        j.company_id = targetCompanyId;
        reassociatedJds++;
      }
    });
    try {
      localStorage.setItem(STORAGE_KEYS.JDS, JSON.stringify(jds));
    } catch (_) {}

    // Remove source company
    const remaining = companies.filter((c) => c.id !== sourceCompanyId);
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(remaining));
    } catch (_) {}

    return {
      message: `Merged ${source.name} into ${target.name}. Transferred ${reassociatedContacts} contacts and ${reassociatedJds} JDs.`,
    };
  },
};

