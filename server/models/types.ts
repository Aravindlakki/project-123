export interface CRA {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'cra';
  emp_id?: string;
  monthly_jd_target: number;
  is_active: boolean;
  deleted_at?: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  linkedin_url?: string;
  source: 'linkedin' | 'apollo' | 'manual' | 'import' | 'google_search' | 'csv_upload' | 'pdf_upload' | string;
  notes?: string;
  created_by?: string;
  created_at: string;
  employee_count?: string;
  location?: string;
  entered_by_name?: string;
  contacts?: HRContact[];
  contacts_count?: number;
  jds?: JD[];
  creator?: CRA;
}

export interface HRContact {
  id: string;
  name: string;
  title?: string;
  company_id: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  source: 'linkedin' | 'apollo' | 'manual' | 'import' | 'google_search' | 'csv_upload' | 'pdf_upload' | string;
  created_by?: string;
  created_at: string;
  entered_by_name?: string;
  domain?: string;
  location?: string;
  remarks?: string;
  spoc?: string;
  company?: Company;
  creator?: CRA;
}

export interface JD {
  id: string;
  title: string;
  company_id: string;
  raw_text: string;
  is_verified: boolean;
  verification_source?: 'html_url_parser' | 'manual_entry' | 'file_ai_extract' | 'csv_upload';
  opportunity_type: 'existing_post' | 'cold_outreach';
  date_found: string;
  created_by?: string;
  created_at: string;
  company?: Company;
  creator?: CRA;
}

export interface Campaign {
  id: string;
  name: string;
  owner_id?: string;
  status: 'draft' | 'active' | 'completed';
  contact_ids: string[];
  created_at: string;
  owner?: CRA;
  contacts?: HRContact[];
}

export interface OutreachProof {
  id: string;
  outreach_id: string;
  filename: string;
  mime_type: string;
  evidence_type: string;
  verification_status: 'verified' | 'needs_review' | 'not_verified';
  confidence: 'high' | 'medium' | 'low';
  summary: string;
  extracted_details: string;
  concerns: string;
  file_buffer?: string; // base64
  created_at: string;
}

export interface OutreachChannel {
  id: string;
  contact_id: string;
  channel: 'call' | 'mail' | 'text' | 'whatsapp' | 'linkedin';
  status: 'not_started' | 'sent' | 'replied' | 'failed';
  timestamp: string;
  notes?: string;
  call_duration_seconds?: number;
  call_outcome?: string;
  campaign_id?: string;
  created_at: string;
  proof?: OutreachProof;
  contact?: HRContact;
}

export interface OutreachOutcome {
  id: string;
  contact_id: string;
  jd_received: boolean;
  jd_id?: string;
  is_eligible?: boolean;
  eligibility_notes?: string;
  outcome_status: 'pending' | 'jd_received' | 'not_eligible' | 'eligible_active' | 'rejected' | 'community_joined';
  updated_by?: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee_id: string;
  assigned_by_id?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  due_date?: string;
  company_id?: string;
  contact_id?: string;
  created_at: string;
  updated_at: string;
  assignee?: CRA;
  assigned_by?: CRA;
  company?: Company;
  contact?: HRContact;
}

export interface Attendance {
  id: string;
  cra_id: string;
  work_date: string;
  login_at?: string;
  logout_at?: string;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  cra_id: string;
  leave_type: 'casual' | 'sick' | 'earned' | 'unpaid' | 'other';
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewed_by?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  cra?: CRA;
  reviewer?: CRA;
}

export interface SystemSettings {
  default_monthly_jd_target: number;
  apollo_api_configured: boolean;
  openai_api_configured: boolean;
  openrouter_api_configured: boolean;
  anthropic_api_configured: boolean;
  gemini_api_configured: boolean;
  openrouter_model: string;
  ai_extraction_active: boolean;
  extraction_engine: string;
}
