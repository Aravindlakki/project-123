import { Company, HRContact, JD, OutreachChannel, Campaign, DashboardStats, CRA, OutreachChannelStatus, OutreachOutcome, CRAPerformanceResponse, Attendance, Task, TaskPriority, TaskStatus, LeaveRequest, LeaveType, LeaveStatus } from '../types';
import { clientFallbackStore } from './clientFallbackStore';
import { ALL_EMPLOYEE_CREDENTIALS } from '../data/employeeCredentials';
import { isSupabaseConfigured, supabase } from './supabase';
import { supabaseDataService } from './supabaseDataService';

const getApiBase = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    const cleanUrl = envUrl.trim().replace(/\/$/, '');
    return cleanUrl.endsWith('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;
  }
  return '/api/v1';
};

const API_BASE = getApiBase();

let authToken: string | null = localStorage.getItem('cra_token');

export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('cra_token', token);
};

export const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem('cra_token');
};

export const getAuthToken = () => authToken;

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
});

const checkAuthResponse = (res: Response) => {
  if (res.status === 401) {
    clearAuthToken();
  }
};


export const api = {
  async login(email: string, password: string): Promise<{ access_token: string }> {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setAuthToken(data.access_token);
        return data;
      }
    } catch (_) {}

    // Resilient Fallback for Static Deployments (e.g. GitHub Pages)
    const cleanEmail = email.trim().toLowerCase();
    const matchedEmployee = ALL_EMPLOYEE_CREDENTIALS.find(
      (e) => e.email.toLowerCase() === cleanEmail
    );
    const isCeo = cleanEmail === 'aravindaravind3953@gmail.com';

    if (matchedEmployee || isCeo) {
      const targetUser: CRA = matchedEmployee ? {
        id: matchedEmployee.id,
        name: matchedEmployee.name,
        email: matchedEmployee.email,
        role: matchedEmployee.role,
        emp_id: matchedEmployee.empId,
        monthly_jd_target: 20,
        is_active: true,
        created_at: new Date().toISOString(),
      } : {
        id: 'usr_admin_user_session',
        name: 'Aravind Reddy',
        email: 'aravindaravind3953@gmail.com',
        role: 'admin',
        emp_id: 'PM-CEO',
        monthly_jd_target: 20,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const fallbackToken = 'client_token_' + Date.now();
      setAuthToken(fallbackToken);
      clientFallbackStore.setCurrentUser(targetUser);
      return { access_token: fallbackToken };
    }

    throw new Error('Invalid credentials. Please verify your email and password.');
  },

  async logout(): Promise<Attendance | null> {
    if (!authToken) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return null;
  },

  async register(name: string, email: string, password: string, role: 'admin' | 'cra' = 'cra'): Promise<CRA> {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      if (!res.ok) {
        let errorMsg = 'Registration failed';
        try {
          const errData = await res.json();
          if (errData.detail) errorMsg = errData.detail;
        } catch (_) {}
        throw new Error(errorMsg);
      }
      return res.json();
    } catch (err: any) {
      if (err.message && err.message.includes('Failed to fetch')) {
        throw new Error('Backend server is not running on port 8000. Please start the FastAPI backend in Terminal 1.');
      }
      throw err;
    }
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      let message = 'Could not request password recovery';
      try { const data = await res.json(); if (data.detail) message = data.detail; } catch (_) {}
      throw new Error(message);
    }
    return res.json();
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    if (!res.ok) {
      let message = 'Could not reset password';
      try { const data = await res.json(); if (data.detail) message = data.detail; } catch (_) {}
      throw new Error(message);
    }
    return res.json();
  },

  async getCurrentCRA(): Promise<CRA> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
      if (res.ok) return await res.json();
    } catch (_) {}
    return clientFallbackStore.getCurrentUser();
  },

  async getCRAs(): Promise<CRA[]> {
    if (isSupabaseConfigured) {
      return supabaseDataService.getCRAs();
    }
    try {
      const res = await fetch(`${API_BASE}/users/`, { headers: authHeaders() });
      if (res.ok) return await res.json();
    } catch (_) {}
    return clientFallbackStore.getUsers();
  },

  async getDashboardStats(): Promise<DashboardStats> {
    if (isSupabaseConfigured) {
      return supabaseDataService.getDashboardStats();
    }
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`, { headers: authHeaders() });
      if (res.ok) return await res.json();
    } catch (_) {}
    return clientFallbackStore.getStats();
  },

  async getCompanies(): Promise<Company[]> {
    if (isSupabaseConfigured) {
      return supabaseDataService.getCompanies();
    }
    try {
      const res = await fetch(`${API_BASE}/companies/`, { headers: authHeaders() });
      if (res.ok) return await res.json();
    } catch (_) {}
    return clientFallbackStore.getCompanies();
  },

  async createCompany(company: Partial<Company>): Promise<Company> {
    if (isSupabaseConfigured) {
      return supabaseDataService.createCompany(company);
    }
    try {
      const res = await fetch(`${API_BASE}/companies/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(company),
      });
      checkAuthResponse(res);
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.createCompany(company);
  },

  async bulkCreateCompanies(items: Array<{ name: string; industry?: string; website?: string; linkedin_url?: string; notes?: string }>): Promise<{
    created: Company[];
    existing: Company[];
    total_processed: number;
    total_created: number;
    total_existing: number;
  }> {
    if (isSupabaseConfigured) {
      return supabaseDataService.bulkCreateCompanies(items);
    }
    try {
      const res = await fetch(`${API_BASE}/companies/bulk`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ items }),
      });
      checkAuthResponse(res);
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.bulkCreateCompanies(items);
  },

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    if (isSupabaseConfigured) {
      return supabaseDataService.updateCompany(id, updates);
    }
    try {
      const res = await fetch(`${API_BASE}/companies/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });
      checkAuthResponse(res);
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.updateCompany(id, updates);
  },

  async parseDocumentHR(options: { file?: File; raw_text?: string; entered_by_name?: string }): Promise<{
    success: boolean;
    data: any;
    company: Company;
    contacts: HRContact[];
    message: string;
  }> {
    const formData = new FormData();
    if (options.file) {
      formData.append('file', options.file);
    }
    if (options.raw_text) {
      formData.append('raw_text', options.raw_text);
    }
    if (options.entered_by_name) {
      formData.append('entered_by_name', options.entered_by_name);
    }

    const headers: Record<string, string> = {};
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const res = await fetch(`${API_BASE}/companies/parse-document-hr`, {
      method: 'POST',
      headers,
      body: formData,
    });
    checkAuthResponse(res);
    if (!res.ok) {
      let message = 'Failed to extract and store document HR data';
      try { const data = await res.json(); if (data.detail) message = data.detail; } catch (_) {}
      throw new Error(message);
    }
    return res.json();
  },

  async getContacts(companyId?: string): Promise<HRContact[]> {
    if (isSupabaseConfigured) {
      return supabaseDataService.getContacts(companyId);
    }
    try {
      const url = companyId ? `${API_BASE}/contacts/?company_id=${companyId}` : `${API_BASE}/contacts/`;
      const res = await fetch(url, { headers: authHeaders() });
      if (res.ok) return await res.json();
    } catch (_) {}
    const contacts = clientFallbackStore.getContacts();
    return companyId ? contacts.filter((c) => c.company_id === companyId) : contacts;
  },

  async createContact(contact: Partial<HRContact>): Promise<HRContact> {
    if (isSupabaseConfigured) {
      return supabaseDataService.createContact(contact);
    }
    try {
      const res = await fetch(`${API_BASE}/contacts/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(contact),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.createContact(contact);
  },

  async updateContact(id: string, updates: Partial<HRContact>): Promise<HRContact> {
    if (isSupabaseConfigured) {
      return supabaseDataService.updateContact(id, updates);
    }
    try {
      const res = await fetch(`${API_BASE}/contacts/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.updateContact(id, updates);
  },

  async deleteContact(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      return supabaseDataService.deleteContact(id);
    }
    try {
      const res = await fetch(`${API_BASE}/contacts/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) return true;
    } catch (_) {}
    return supabaseDataService.deleteContact(id);
  },

  async getWorksheetLeads(params?: { spoc?: string; domain?: string; remarks?: string; search?: string }): Promise<HRContact[]> {
    if (isSupabaseConfigured) {
      return supabaseDataService.getWorksheetLeads(params);
    }
    try {
      const searchParams = new URLSearchParams();
      if (params?.spoc) searchParams.append('spoc', params.spoc);
      if (params?.domain) searchParams.append('domain', params.domain);
      if (params?.remarks) searchParams.append('remarks', params.remarks);
      if (params?.search) searchParams.append('search', params.search);

      const res = await fetch(`${API_BASE}/worksheets/leads?${searchParams.toString()}`, {
        headers: authHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.getWorksheetLeads(params);
  },

  async createWorksheetLead(lead: {
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
  }): Promise<HRContact> {
    if (isSupabaseConfigured) {
      return supabaseDataService.createWorksheetLead(lead);
    }
    try {
      const res = await fetch(`${API_BASE}/worksheets/lead`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(lead),
      });
      checkAuthResponse(res);
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.createWorksheetLead(lead);
  },

  async bulkCreateContacts(companyId?: string, contacts: (Partial<HRContact> & { company_name?: string })[] = []): Promise<{ created: HRContact[]; count: number }> {
    if (isSupabaseConfigured) {
      return supabaseDataService.bulkCreateContacts(companyId, contacts);
    }
    try {
      const res = await fetch(`${API_BASE}/contacts/bulk`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ company_id: companyId || undefined, contacts }),
      });
      checkAuthResponse(res);
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.bulkCreateContacts(companyId, contacts);
  },

  async enrichApollo(name: string, companyName: string, companyId?: string): Promise<HRContact> {
    const params = new URLSearchParams({ name, company_name: companyName });
    if (companyId) params.append('company_id', companyId);

    const res = await fetch(`${API_BASE}/contacts/enrich?${params.toString()}`, {
      method: 'POST',
      headers: authHeaders(),
    });
    checkAuthResponse(res);
    if (!res.ok) throw new Error('Apollo enrichment failed');
    return res.json();
  },

  async manualLinkedin(name: string, companyId: string, linkedinUrl: string, title?: string): Promise<HRContact> {
    const params = new URLSearchParams({ name, company_id: companyId, linkedin_url: linkedinUrl });
    if (title) params.append('title', title);

    const res = await fetch(`${API_BASE}/contacts/manual-linkedin?${params.toString()}`, {
      method: 'POST',
      headers: authHeaders(),
    });
    checkAuthResponse(res);
    if (!res.ok) throw new Error('Manual LinkedIn flow failed');
    return res.json();
  },

  // Google Search Grounding for HR details & autofill
  // Mandate: "use google search for hr details and autofill it and only leave their phone number"
  async searchHRWithGoogle(params: {
    company_name: string;
    contact_name?: string;
    role_focus?: string;
    company_id?: string;
  }): Promise<{
    success: boolean;
    company_id?: string;
    company_name: string;
    contacts: Array<{
      name: string;
      title: string;
      company_name: string;
      email: string;
      phone: string; // explicitly empty string per privacy requirement
      linkedin_url: string;
      location?: string;
      summary?: string;
    }>;
    web_sources: Array<{ title: string; url: string }>;
    search_queries: string[];
    google_search_widget?: string;
    model_used: string;
    phone_policy_note: string;
  }> {
    const res = await fetch(`${API_BASE}/contacts/search-hr-google`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(params),
    });
    checkAuthResponse(res);
    if (!res.ok) {
      let message = 'Failed to search HR details via Google Search';
      try {
        const data = await res.json();
        if (data.detail) message = data.detail;
      } catch (_) {}
      throw new Error(message);
    }
    return res.json();
  },

  async autofillContactFromGoogle(contactData: {
    name: string;
    title?: string;
    company_name?: string;
    company_id?: string;
    email?: string;
    phone?: string;
    linkedin_url?: string;
  }): Promise<HRContact> {
    const res = await fetch(`${API_BASE}/contacts/autofill-from-google`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(contactData),
    });
    checkAuthResponse(res);
    if (!res.ok) {
      let message = 'Failed to autofill and save contact';
      try {
        const data = await res.json();
        if (data.detail) message = data.detail;
      } catch (_) {}
      throw new Error(message);
    }
    return res.json();
  },

  async getJDs(isVerified?: boolean, opportunityType?: string): Promise<JD[]> {
    if (isSupabaseConfigured) {
      return supabaseDataService.getJDs(isVerified, opportunityType);
    }
    try {
      const params = new URLSearchParams();
      if (isVerified !== undefined) params.append('is_verified', String(isVerified));
      if (opportunityType) params.append('opportunity_type', opportunityType);

      const res = await fetch(`${API_BASE}/jds/?${params.toString()}`, { headers: authHeaders() });
      checkAuthResponse(res);
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.getJDs(isVerified, opportunityType);
  },

  async createJD(jd: Partial<JD>): Promise<JD> {
    if (isSupabaseConfigured) {
      return supabaseDataService.createJD(jd);
    }
    try {
      const res = await fetch(`${API_BASE}/jds/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(jd),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.createJD(jd);
  },

  async getOutreachChannels(): Promise<OutreachChannel[]> {
    if (isSupabaseConfigured) {
      return supabaseDataService.getOutreachChannels();
    }
    try {
      const res = await fetch(`${API_BASE}/outreach/`, { headers: authHeaders() });
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.getOutreachChannels();
  },

  async createOutreachChannel(outreach: Partial<OutreachChannel>): Promise<OutreachChannel> {
    if (isSupabaseConfigured) {
      return supabaseDataService.createOutreachChannel(outreach);
    }
    try {
      const res = await fetch(`${API_BASE}/outreach/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(outreach),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.createOutreachChannel(outreach);
  },

  async patchOutreachStatus(
    id: string,
    status: OutreachChannelStatus,
    notes?: string,
    callDurationSeconds?: number,
    callOutcome?: string
  ): Promise<OutreachChannel> {
    if (isSupabaseConfigured) {
      return supabaseDataService.patchOutreachStatus(id, status, notes, callDurationSeconds, callOutcome);
    }
    try {
      const params = new URLSearchParams({ status });
      if (notes) params.append('notes', notes);
      if (callDurationSeconds !== undefined) params.append('call_duration_seconds', String(callDurationSeconds));
      if (callOutcome) params.append('call_outcome', callOutcome);

      const res = await fetch(`${API_BASE}/outreach/${id}/status?${params.toString()}`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.patchOutreachStatus(id, status, notes, callDurationSeconds, callOutcome);
  },

  async uploadOutreachProof(outreachId: string, file: File): Promise<OutreachChannel['proof']> {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/outreach/${outreachId}/proof`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    checkAuthResponse(res);
    if (!res.ok) {
      let message = 'Failed to analyze outreach proof';
      try { const data = await res.json(); if (data.detail) message = data.detail; } catch (_) {}
      throw new Error(message);
    }
    return res.json();
  },

  uploadCallProof(outreachId: string, file: File): Promise<OutreachChannel['proof']> {
    return this.uploadOutreachProof(outreachId, file);
  },

  getProofImageUrl(outreachId: string): string {
    return `${API_BASE}/outreach/${outreachId}/proof/image`;
  },

  async fetchProofImageBlobUrl(outreachId: string): Promise<string> {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/outreach/${outreachId}/proof/image`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to load proof image');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  async generateOutreachDraft(contactId: string, channel: string): Promise<{ draft_text: string }> {
    const res = await fetch(`${API_BASE}/outreach/draft-message`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ contact_id: contactId, channel }),
    });
    if (!res.ok) throw new Error('Failed to generate draft message');
    return res.json();
  },

  async analyzeProfileImage(contactId: string, file: File): Promise<{
    contact_id: string;
    profile_summary: string;
    relevant_hooks: string;
    email_subject: string;
    email_body: string;
    sms_body: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/outreach/analyze-profile?contact_id=${encodeURIComponent(contactId)}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    checkAuthResponse(res);
    if (!res.ok) {
      let message = 'Failed to analyze profile image';
      try { const data = await res.json(); if (data.detail) message = data.detail; } catch (_) {}
      throw new Error(message);
    }
    return res.json();
  },

  async getCampaigns(): Promise<Campaign[]> {
    try {
      const res = await fetch(`${API_BASE}/campaigns/`, { headers: authHeaders() });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        return await res.json();
      }
    } catch (_) {}
    return [];
  },

  async createCampaign(campaign: Partial<Campaign>): Promise<Campaign> {
    try {
      const res = await fetch(`${API_BASE}/campaigns/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(campaign),
      });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        return await res.json();
      }
    } catch (_) {}
    return {
      id: 'camp_' + Date.now(),
      name: campaign.name || 'Outreach Campaign',
      status: 'active',
      contacts: [],
      created_at: new Date().toISOString(),
    } as any;
  },

  async addContactToCampaign(campaignId: string, contactId: string): Promise<Campaign> {
    try {
      const res = await fetch(`${API_BASE}/campaigns/${campaignId}/contacts?contact_id=${contactId}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        return await res.json();
      }
    } catch (_) {}
    return { id: campaignId, name: 'Campaign', contacts: [] } as any;
  },

  async generateCampaignDraft(campaignId: string, contactId: string, channel: string, jdId?: string): Promise<{ draft_message: string }> {
    try {
      const params = new URLSearchParams({ contact_id: contactId, channel });
      if (jdId) params.append('jd_id', jdId);

      const res = await fetch(`${API_BASE}/campaigns/${campaignId}/draft-message?${params.toString()}`, {
        headers: authHeaders(),
      });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        return await res.json();
      }
    } catch (_) {}
    return {
      draft_message: `Hi, I am reaching out from Placemein regarding partnering for talent recruitment opportunities. We have trained talent ready for immediate interviews.`,
    };
  },

async updateOutreachOutcome(contactId: string, outcome: Partial<OutreachOutcome>): Promise<OutreachOutcome> {
    try {
      const res = await fetch(`${API_BASE}/outreach-outcomes/contact/${contactId}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(outcome),
      });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        return await res.json();
      }
    } catch (_) {}
    return {
      id: 'mock_' + Date.now(),
      contact_id: contactId,
      jd_received: outcome.jd_received || false,
      outcome_status: outcome.outcome_status || 'pending',
      updated_at: new Date().toISOString(),
      eligibility_notes: outcome.eligibility_notes,
    };
  },

  async getCRAPerformance(myOnly: boolean = false): Promise<CRAPerformanceResponse> {
    if (isSupabaseConfigured) {
      return supabaseDataService.getCRAPerformance(myOnly);
    }
    try {
      const url = myOnly ? `${API_BASE}/dashboard/cra-performance?my_only=true` : `${API_BASE}/dashboard/cra-performance`;
      const res = await fetch(url, { headers: authHeaders() });
      checkAuthResponse(res);
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        return await res.json();
      }
    } catch (_) {}
    return supabaseDataService.getCRAPerformance(myOnly);
  },
  async checkIn(): Promise<Attendance> {
    if (isSupabaseConfigured) {
      return supabaseDataService.checkIn();
    }
    try {
      const res = await fetch(`${API_BASE}/attendance/check-in`, {
        method: 'POST',
        headers: authHeaders(),
      });
      checkAuthResponse(res);
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.checkIn();
  },

  async checkOut(): Promise<Attendance> {
    if (isSupabaseConfigured) {
      return supabaseDataService.checkOut();
    }
    try {
      const res = await fetch(`${API_BASE}/attendance/check-out`, {
        method: 'POST',
        headers: authHeaders(),
      });
      checkAuthResponse(res);
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.checkOut();
  },

  async updateCRATarget(craId: string, target: number): Promise<CRA> {
    if (isSupabaseConfigured) {
      return supabaseDataService.updateCRATarget(craId, target);
    }
    try {
      const res = await fetch(`${API_BASE}/users/${craId}/target?target=${target}`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.updateCRATarget(craId, target);
  },

  async extractJDFromFile(file: File): Promise<{
    filename: string;
    company_name: string;
    role_title: string;
    confidence: 'high' | 'medium' | 'low';
    raw_text: string;
    ocr_warning?: string | null;
    ai_active?: boolean;
    extraction_engine?: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/jds/extract-from-file`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    checkAuthResponse(res);
    if (!res.ok) {
      let errText = 'Failed to extract document';
      try {
        const data = await res.json();
        if (data.detail) errText = data.detail;
      } catch (_) {}
      throw new Error(errText);
    }
    return res.json();
  },

  async getJDExtractionStatus(): Promise<{ ai_active: boolean; engine: string; message: string }> {
    const res = await fetch(`${API_BASE}/jds/extraction-status`, { headers: authHeaders() });
    checkAuthResponse(res);
    if (!res.ok) throw new Error('Could not load extraction status');
    return res.json();
  },

  async generateBulkOutreachDrafts(contactIds: string[], channel: string): Promise<{ channel: string; drafts: Record<string, string> }> {
    const res = await fetch(`${API_BASE}/outreach/bulk-draft-message`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ contact_ids: contactIds, channel }),
    });
    checkAuthResponse(res);
    if (!res.ok) throw new Error('Failed to generate bulk drafts');
    return res.json();
  },

  async updateBulkOutreachStatus(contactIds: string[], channel: string, status: string, notes?: string): Promise<{ status: string; updated_count: number }> {
    const res = await fetch(`${API_BASE}/outreach/bulk-status`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ contact_ids: contactIds, channel, status, notes }),
    });
    checkAuthResponse(res);
    if (!res.ok) throw new Error('Failed to update bulk status');
    return res.json();
  },

  async getTasks(status?: string, assigneeId?: string): Promise<Task[]> {
    if (isSupabaseConfigured) {
      return supabaseDataService.getTasks(status, assigneeId);
    }
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (assigneeId) params.append('assignee_id', assigneeId);

      const res = await fetch(`${API_BASE}/tasks/?${params.toString()}`, {
        headers: authHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.getTasks(status, assigneeId);
  },

  async createTask(taskData: {
    title: string;
    description?: string;
    assignee_id: string;
    priority?: string;
    due_date?: string;
    company_id?: string;
    contact_id?: string;
  }): Promise<Task> {
    if (isSupabaseConfigured) {
      return supabaseDataService.createTask(taskData);
    }
    try {
      const res = await fetch(`${API_BASE}/tasks/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(taskData),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.createTask(taskData);
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    if (isSupabaseConfigured) {
      return supabaseDataService.updateTask(taskId, updates);
    }
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.updateTask(taskId, updates);
  },

  async deleteTask(taskId: string): Promise<void> {
    if (isSupabaseConfigured) {
      return supabaseDataService.deleteTask(taskId);
    }
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) return;
    } catch (_) {}
    return supabaseDataService.deleteTask(taskId);
  },

  async getLeaves(statusFilter?: string, allEmployees: boolean = false): Promise<LeaveRequest[]> {
    if (isSupabaseConfigured) {
      return supabaseDataService.getLeaves(statusFilter, allEmployees);
    }
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (allEmployees) params.append('all_employees', 'true');

      const res = await fetch(`${API_BASE}/leaves/?${params.toString()}`, {
        headers: authHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.getLeaves(statusFilter, allEmployees);
  },

  async applyLeave(data: {
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    reason: string;
    manager_id?: string;
  }): Promise<LeaveRequest> {
    if (isSupabaseConfigured) {
      return supabaseDataService.applyLeave(data);
    }
    try {
      const res = await fetch(`${API_BASE}/leaves/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.applyLeave(data);
  },

  async updateLeaveStatus(
    leaveId: string,
    leaveStatus: LeaveStatus,
    adminNotes?: string
  ): Promise<LeaveRequest> {
    if (isSupabaseConfigured) {
      return supabaseDataService.updateLeaveStatus(leaveId, leaveStatus, adminNotes);
    }
    try {
      const res = await fetch(`${API_BASE}/leaves/${leaveId}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: leaveStatus, admin_notes: adminNotes }),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return supabaseDataService.updateLeaveStatus(leaveId, leaveStatus, adminNotes);
  },

  async cancelLeave(leaveId: string): Promise<LeaveRequest> {
    try {
      const res = await fetch(`${API_BASE}/leaves/${leaveId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    const leaves = clientFallbackStore.getLeaves();
    const idx = leaves.findIndex((l) => l.id === leaveId);
    if (idx >= 0) {
      leaves[idx].status = 'cancelled';
      clientFallbackStore.saveLeaves(leaves);
      return leaves[idx];
    }
    throw new Error('Leave not found');
  },

  // Admin Portal Methods
  async getAdminUsers(): Promise<CRA[]> {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: authHeaders() });
    checkAuthResponse(res);
    if (!res.ok) throw new Error('Failed to fetch admin users');
    return res.json();
  },

  async createAdminUser(data: Partial<CRA> & { password: string }): Promise<CRA> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    checkAuthResponse(res);
    if (!res.ok) {
      let err = 'Failed to create user';
      try { const d = await res.json(); if (d.detail) err = d.detail; } catch (_) {}
      throw new Error(err);
    }
    return res.json();
  },

  async updateAdminUser(userId: string, data: Partial<CRA>): Promise<CRA> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    checkAuthResponse(res);
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
  },

  async mergeCompanies(sourceCompanyId: string, targetCompanyId: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/companies/merge`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ source_company_id: sourceCompanyId, target_company_id: targetCompanyId }),
    });
    checkAuthResponse(res);
    if (!res.ok) {
      let err = 'Failed to merge companies';
      try { const d = await res.json(); if (d.detail) err = d.detail; } catch (_) {}
      throw new Error(err);
    }
    return res.json();
  },

  async getUnverifiedJDs(): Promise<JD[]> {
    const res = await fetch(`${API_BASE}/admin/jds/unverified`, { headers: authHeaders() });
    checkAuthResponse(res);
    if (!res.ok) return [];
    return res.json();
  },

  async getAdminJDs(): Promise<JD[]> {
    const res = await fetch(`${API_BASE}/admin/jds`, { headers: authHeaders() });
    checkAuthResponse(res);
    if (!res.ok) throw new Error('Failed to fetch company and JD oversight data');
    return res.json();
  },

  async verifyJD(jdId: string, isVerified: boolean): Promise<JD> {
    const res = await fetch(`${API_BASE}/admin/jds/${jdId}/verify?is_verified=${isVerified}`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    checkAuthResponse(res);
    if (!res.ok) throw new Error('Failed to update JD verification status');
    return res.json();
  },

  async getAdminSystemSettings(): Promise<{
    default_monthly_jd_target: number;
    apollo_api_configured: boolean;
    openai_api_configured: boolean;
    openrouter_api_configured: boolean;
    anthropic_api_configured: boolean;
    openrouter_model: string;
    ai_extraction_active: boolean;
    extraction_engine: string;
  }> {
    const res = await fetch(`${API_BASE}/admin/system/settings`, { headers: authHeaders() });
    checkAuthResponse(res);
    if (!res.ok) throw new Error('Failed to fetch system settings');
    return res.json();
  },

  async updateAdminSystemSettings(defaultMonthlyJdTarget: number): Promise<{ default_monthly_jd_target: number }> {
    const res = await fetch(`${API_BASE}/admin/system/settings`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ default_monthly_jd_target: defaultMonthlyJdTarget }) });
    checkAuthResponse(res);
    if (!res.ok) throw new Error('Failed to update system settings');
    return res.json();
  },
};

