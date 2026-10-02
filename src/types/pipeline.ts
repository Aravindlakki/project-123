// ─────────────────────────────────────────────────────────────────────────────
// CRM Recruitment Pipeline
// Flow: Leads → HR Sourcing → Outreach (draft msg) → Proof of Response → Follow-up
// See notebook spec: proof of contact screenshots go to Admin; non-responders
// get a follow-up after 2 days and appear in "Today's Follow-ups".
// ─────────────────────────────────────────────────────────────────────────────

export type PipelineStage =
  | 'leads'
  | 'hr_sourcing'
  | 'outreach'
  | 'proof_of_response'
  | 'follow_up'
  | 'closed';

export const PIPELINE_STAGE_ORDER: PipelineStage[] = [
  'leads',
  'hr_sourcing',
  'outreach',
  'proof_of_response',
  'follow_up',
  'closed',
];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  leads: 'Leads',
  hr_sourcing: 'HR Sourcing',
  outreach: 'Outreach',
  proof_of_response: 'Proof of Response',
  follow_up: 'Follow-up',
  closed: 'Closed',
};

/** How a lead entered the pipeline (from leads uploaded / manual / JD sourcing). */
export type PipelineLeadOrigin = 'uploaded' | 'manual' | 'jd_sourcing' | 'import';

/** Outreach channel per notebook: LinkedIn, WhatsApp and Mail. */
export type PipelineChannel = 'linkedin' | 'whatsapp' | 'mail';

export const PIPELINE_CHANNELS: PipelineChannel[] = ['linkedin', 'whatsapp', 'mail'];

export const PIPELINE_CHANNEL_LABELS: Record<PipelineChannel, string> = {
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
  mail: 'Mail',
};

/** Status of a single outreach attempt on one channel. */
export type PipelineOutreachStatus = 'draft' | 'sent' | 'responded' | 'no_response';

/** Verification state applied by Admin on an uploaded proof-of-response screenshot. */
export type ProofVerificationStatus = 'pending' | 'approved' | 'rejected';

/** Overall pipeline state of a lead. */
export type PipelineLeadStatus =
  | 'new'
  | 'sourcing'
  | 'contacted'
  | 'responded'
  | 'awaiting_follow_up'
  | 'closed_won'
  | 'closed_lost';

export const PIPELINE_LEAD_STATUS_LABELS: Record<PipelineLeadStatus, string> = {
  new: 'New Lead',
  sourcing: 'Sourcing HR Info',
  contacted: 'Contacted',
  responded: 'Responded',
  awaiting_follow_up: 'Awaiting Follow-up',
  closed_won: 'Closed — Won',
  closed_lost: 'Closed — Lost',
};

export interface PipelineContactSnapshot {
  hr_name: string;
  hr_designation?: string;
  hr_email?: string;
  hr_phone?: string;
  hr_linkedin?: string;
}

export interface PipelineCompanySnapshot {
  company_name: string;
  website?: string;
  linkedin_url?: string;
  industry?: string;
  location?: string;
  employee_count?: string;
}

/** One lead flowing through the recruitment pipeline. */
export interface PipelineLead {
  id: string;
  /** Human friendly id e.g. LEAD-2026-0007 */
  lead_code?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;

  origin: PipelineLeadOrigin;
  stage: PipelineStage;
  status: PipelineLeadStatus;

  company: PipelineCompanySnapshot;
  contact: PipelineContactSnapshot;

  /** Optional link to the role/JD this outreach is about. */
  role_title?: string;
  jd_id?: string;
  /** Tech vs Non-Tech classification used by the Admin JD Bank. */
  role_category?: 'tech' | 'non_tech';

  notes?: string;

  /** Per-channel outreach attempts (LinkedIn / WhatsApp / Mail). */
  outreach: PipelineOutreach[];
  /** Proof-of-contact screenshot uploads (go to Admin for verification). */
  proofs: PipelineProof[];
  /** Follow-up history (2-day rule for non-responders). */
  follow_ups: PipelineFollowUp[];

  /** Recruiter's own read of whether the lead replied, drives follow-up lists. */
  response_status: 'pending' | 'responded' | 'no_response';
  response_note?: string;
  responded_at?: string;

  /** Date (YYYY-MM-DD) when the next follow-up is due. */
  next_follow_up_date?: string;
}

export interface PipelineOutreach {
  id: string;
  channel: PipelineChannel;
  status: PipelineOutreachStatus;
  /** Personalized draft text (custom name per lead). */
  draft_text: string;
  /** Final text actually used — draft or recruiter's own message. */
  sent_text?: string;
  /** True if the recruiter typed their own message instead of using the draft. */
  used_own_message?: boolean;
  sent_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineProof {
  id: string;
  outreach_id?: string;
  channel: PipelineChannel;
  /** base64 data URL of the screenshot of the sent mail/WhatsApp/LinkedIn msg. */
  screenshot_url: string;
  filename?: string;
  uploaded_by?: string;
  uploaded_by_name?: string;
  uploaded_at: string;
  verification: ProofVerificationStatus;
  verified_by?: string;
  verified_at?: string;
  admin_notes?: string;
}

export interface PipelineFollowUp {
  id: string;
  channel: PipelineChannel;
  /** Day-2 follow-up message text (auto-drafted, editable). */
  message: string;
  logged_at: string;
  due_date: string;
  completed_at?: string;
  outcome?: 'replied' | 'still_no_response' | 'not_interested' | 'wrong_contact';
  notes?: string;
  logged_by?: string;
}

export interface PipelineStats {
  total_leads: number;
  by_stage: Record<PipelineStage, number>;
  by_status: Record<PipelineLeadStatus, number>;
  outreach_sent: number;
  responses_received: number;
  response_rate_pct: number;
  proofs_pending_review: number;
  follow_ups_due_today: number;
  follow_ups_overdue: number;
}

/** Admin proof-review queue item. */
export interface ProofReviewItem {
  proof: PipelineProof;
  lead: PipelineLead;
}

export interface PipelineDraftContext {
  lead: PipelineLead;
  channel: PipelineChannel;
  sender_name?: string;
  sender_designation?: string;
  follow_up_number?: number;
}

export const isPipelineChannel = (v: string): v is PipelineChannel =>
  v === 'linkedin' || v === 'whatsapp' || v === 'mail';
