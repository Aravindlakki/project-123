import {
  PipelineLead,
  PipelineStage,
  PipelineChannel,
  PipelineOutreach,
  PipelineFollowUp,
  PipelineProof,
  PipelineStats,
  PIPELINE_STAGE_ORDER,
  PipelineLeadStatus,
  PipelineLeadOrigin,
  PipelineContactSnapshot,
  PipelineCompanySnapshot,
} from '../types/pipeline';
import { clientFallbackStore } from './clientFallbackStore';

const STORAGE_KEY = 'placemein_pipeline_leads_v1';

let inMemoryLeads: PipelineLead[] | null = null;

const todayStr = (): string => new Date().toISOString().slice(0, 10);

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const uid = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function loadLeads(): PipelineLead[] {
  if (inMemoryLeads) return inMemoryLeads;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    inMemoryLeads = raw ? (JSON.parse(raw) as PipelineLead[]) : [];
  } catch {
    inMemoryLeads = [];
  }
  return inMemoryLeads!;
}

function persist(leads: PipelineLead[]) {
  inMemoryLeads = leads;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  } catch (err) {
    console.warn('[pipelineStore] localStorage quota exceeded, keeping in memory only:', err);
  }
}

function nextCode(leads: PipelineLead[]): string {
  const year = new Date().getFullYear();
  let max = 0;
  for (const l of leads) {
    const m = l.lead_code?.match(/LEAD-\d{4}-(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `LEAD-${year}-${String(max + 1).padStart(4, '0')}`;
}

/** Pull whatever HR/company info we already know from the CRM directory. */
function enrichFromCrm(companyName: string): {
  company: PipelineCompanySnapshot;
  contact: PipelineContactSnapshot;
} {
  const companies = clientFallbackStore.getCompanies();
  const contacts = clientFallbackStore.getContacts();
  const norm = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const comp = companies.find((c) => norm(c.name) === norm(companyName));
  const contact = comp ? contacts.find((c) => c.company_id === comp.id) : undefined;
  return {
    company: {
      company_name: comp?.name || companyName,
      website: comp?.website,
      linkedin_url: comp?.linkedin_url,
      industry: comp?.industry,
      location: comp?.location,
      employee_count: comp?.employee_count,
    },
    contact: {
      hr_name: contact?.name || '',
      hr_designation: contact?.title,
      hr_email: contact?.email,
      hr_phone: contact?.phone,
      hr_linkedin: contact?.linkedin_url,
    },
  };
}

export const pipelineStore = {
  list(): PipelineLead[] {
    const leads = loadLeads();
    // newest first
    return [...leads].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  },

  get(id: string): PipelineLead | undefined {
    return loadLeads().find((l) => l.id === id);
  },

  /** Create a new pipeline lead. If hrName is empty we try to auto-find HR info. */
  create(input: {
    company_name: string;
    hr_name?: string;
    hr_designation?: string;
    hr_email?: string;
    hr_phone?: string;
    hr_linkedin?: string;
    website?: string;
    linkedin_url?: string;
    industry?: string;
    location?: string;
    employee_count?: string;
    role_title?: string;
    jd_id?: string;
    role_category?: 'tech' | 'non_tech';
    origin?: PipelineLeadOrigin;
    notes?: string;
    created_by?: string;
    created_by_name?: string;
  }): PipelineLead {
    const leads = loadLeads();
    const now = new Date().toISOString();
    const enriched = enrichFromCrm(input.company_name);

    const lead: PipelineLead = {
      id: uid('plead'),
      lead_code: nextCode(leads),
      created_at: now,
      updated_at: now,
      origin: input.origin || (input.jd_id ? 'jd_sourcing' : 'manual'),
      stage: 'leads',
      status: 'new',
      company: {
        company_name: input.company_name,
        website: input.website || enriched.company.website,
        linkedin_url: input.linkedin_url || enriched.company.linkedin_url,
        industry: input.industry || enriched.company.industry,
        location: input.location || enriched.company.location,
        employee_count: input.employee_count || enriched.company.employee_count,
      },
      contact: {
        hr_name: input.hr_name || enriched.contact.hr_name,
        hr_designation: input.hr_designation || enriched.contact.hr_designation,
        hr_email: input.hr_email || enriched.contact.hr_email,
        hr_phone: input.hr_phone || enriched.contact.hr_phone,
        hr_linkedin: input.hr_linkedin || enriched.contact.hr_linkedin,
      },
      role_title: input.role_title,
      jd_id: input.jd_id,
      role_category: input.role_category,
      notes: input.notes,
      created_by: input.created_by,
      created_by_name: input.created_by_name,
      outreach: [],
      proofs: [],
      follow_ups: [],
      response_status: 'pending',
    };

    leads.unshift(lead);
    persist(leads);
    return lead;
  },

  update(id: string, updates: Partial<PipelineLead>): PipelineLead | undefined {
    const leads = loadLeads();
    const idx = leads.findIndex((l) => l.id === id);
    if (idx === -1) return undefined;
    const updated: PipelineLead = {
      ...leads[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    leads[idx] = updated;
    persist(leads);
    return updated;
  },

  remove(id: string): boolean {
    const leads = loadLeads();
    const filtered = leads.filter((l) => l.id !== id);
    if (filtered.length === leads.length) return false;
    persist(filtered);
    return true;
  },

  /** Move a lead into HR Sourcing (finding HR info / contact details). */
  startSourcing(id: string, contactPatch?: Partial<PipelineContactSnapshot>): PipelineLead | undefined {
    const lead = this.get(id);
    if (!lead) return undefined;
    const contact = { ...lead.contact, ...(contactPatch || {}) };
    return this.update(id, {
      contact,
      stage: 'hr_sourcing',
      status: 'sourcing',
    });
  },

  /** Save HR contact details and promote the lead to the Outreach stage. */
  saveHrContact(
    id: string,
    contact: Partial<PipelineContactSnapshot>
  ): PipelineLead | undefined {
    const lead = this.get(id);
    if (!lead) return undefined;
    const merged = { ...lead.contact, ...contact };
    const hasAnyHandle = Boolean(merged.hr_email || merged.hr_phone || merged.hr_linkedin);
    return this.update(id, {
      contact: merged,
      stage: hasAnyHandle ? 'outreach' : lead.stage,
      status: hasAnyHandle ? 'contacted' : 'sourcing',
    });
  },

  /** Create a personalized outreach draft for a channel (custom name per lead). */
  addDraft(
    leadId: string,
    channel: PipelineChannel,
    draftText: string
  ): { lead?: PipelineLead; outreach?: PipelineOutreach } {
    const lead = this.get(leadId);
    if (!lead) return {};
    const now = new Date().toISOString();
    const outreach: PipelineOutreach = {
      id: uid('pout'),
      channel,
      status: 'draft',
      draft_text: draftText,
      created_at: now,
      updated_at: now,
    };
    const updated = this.update(leadId, {
      outreach: [outreach, ...lead.outreach],
      stage: 'outreach',
    });
    return { lead: updated, outreach };
  },

  updateDraft(
    leadId: string,
    outreachId: string,
    updates: Partial<PipelineOutreach>
  ): PipelineLead | undefined {
    const lead = this.get(leadId);
    if (!lead) return undefined;
    const outreach = lead.outreach.map((o) =>
      o.id === outreachId ? { ...o, ...updates, updated_at: new Date().toISOString() } : o
    );
    return this.update(leadId, { outreach });
  },

  /** Mark an outreach as sent — with the draft text or the recruiter's own message. */
  markSent(
    leadId: string,
    outreachId: string,
    opts: { sent_text?: string; used_own_message?: boolean; notes?: string }
  ): PipelineLead | undefined {
    const lead = this.get(leadId);
    if (!lead) return undefined;
    const outreach = lead.outreach.map((o) =>
      o.id === outreachId
        ? {
            ...o,
            status: 'sent' as const,
            sent_text: opts.sent_text || (opts.used_own_message ? opts.sent_text : o.draft_text),
            used_own_message: Boolean(opts.used_own_message),
            notes: opts.notes ?? o.notes,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : o
    );
    return this.update(leadId, {
      outreach,
      stage: 'proof_of_response',
      status: 'contacted',
    });
  },

  /** Upload a proof-of-response screenshot. Goes to Admin for verification. */
  addProof(
    leadId: string,
    proof: Omit<PipelineProof, 'id' | 'uploaded_at' | 'verification'>
  ): PipelineLead | undefined {
    const lead = this.get(leadId);
    if (!lead) return undefined;
    const full: PipelineProof = {
      ...proof,
      id: uid('proof'),
      uploaded_at: new Date().toISOString(),
      verification: 'pending',
    };
    return this.update(leadId, { proofs: [full, ...lead.proofs] });
  },

  /** Admin-only: verify or reject an uploaded proof. */
  reviewProof(
    leadId: string,
    proofId: string,
    decision: 'approved' | 'rejected',
    adminNotes?: string,
    reviewer?: string
  ): PipelineLead | undefined {
    const lead = this.get(leadId);
    if (!lead) return undefined;
    const proofs = lead.proofs.map((p) =>
      p.id === proofId
        ? {
            ...p,
            verification: decision,
            admin_notes: adminNotes || p.admin_notes,
            verified_by: reviewer,
            verified_at: new Date().toISOString(),
          }
        : p
    );
    // When a proof is approved, the lead has responded → schedule 2-day follow-up horizon.
    let patch: Partial<PipelineLead> = { proofs };
    if (decision === 'approved') {
      patch = {
        ...patch,
        response_status: 'responded',
        responded_at: new Date().toISOString(),
        status: 'responded',
        stage: 'follow_up',
      };
    }
    return this.update(leadId, patch);
  },

  /** Recruiter marks the response manually (e.g. they got a reply by phone). */
  markResponse(
    leadId: string,
    responded: boolean,
    note?: string
  ): PipelineLead | undefined {
    const lead = this.get(leadId);
    if (!lead) return undefined;
    if (responded) {
      return this.update(leadId, {
        response_status: 'responded',
        response_note: note || lead.response_note,
        responded_at: new Date().toISOString(),
        status: 'responded',
        stage: 'follow_up',
      });
    }
    // Explicit no-response → schedule follow-up 2 days out (notebook rule).
    return this.scheduleFollowUpFromToday(leadId, note);
  },

  /** Schedule the next follow-up `days` days from today. Default = 2 days. */
  scheduleFollowUpFromToday(leadId: string, note?: string, days = 2): PipelineLead | undefined {
    const lead = this.get(leadId);
    if (!lead) return undefined;
    const due = addDays(todayStr(), days);
    return this.update(leadId, {
      response_status: lead.response_status === 'responded' ? 'responded' : 'no_response',
      response_note: note || lead.response_note,
      status: 'awaiting_follow_up',
      stage: 'follow_up',
      next_follow_up_date: due,
    });
  },

  /** Log a completed follow-up touch for a lead. */
  logFollowUp(
    leadId: string,
    data: { channel: PipelineChannel; message: string; notes?: string; logged_by?: string; due_date?: string }
  ): PipelineLead | undefined {
    const lead = this.get(leadId);
    if (!lead) return undefined;
    const today = todayStr();
    const fu: PipelineFollowUp = {
      id: uid('pfu'),
      channel: data.channel,
      message: data.message,
      logged_at: new Date().toISOString(),
      due_date: data.due_date || today,
      notes: data.notes,
      logged_by: data.logged_by,
    };
    return this.update(leadId, {
      follow_ups: [fu, ...lead.follow_ups],
      next_follow_up_date: addDays(today, 2),
      status: 'awaiting_follow_up',
      stage: 'follow_up',
      updated_at: new Date().toISOString(),
    });
  },

  /** Complete a follow-up with an outcome. 'replied' flips response_status. */
  completeFollowUp(
    leadId: string,
    followUpId: string,
    outcome: PipelineFollowUp['outcome'],
    notes?: string
  ): PipelineLead | undefined {
    const lead = this.get(leadId);
    if (!lead) return undefined;
    const follow_ups = lead.follow_ups.map((f) =>
      f.id === followUpId ? { ...f, completed_at: new Date().toISOString(), outcome, notes: notes ?? f.notes } : f
    );
    let patch: Partial<PipelineLead> = { follow_ups };
    if (outcome === 'replied') {
      patch = {
        ...patch,
        response_status: 'responded',
        responded_at: new Date().toISOString(),
        status: 'responded',
      };
    } else if (outcome === 'still_no_response') {
      patch = { ...patch, next_follow_up_date: addDays(todayStr(), 2) };
    } else if (outcome === 'not_interested' || outcome === 'wrong_contact') {
      patch = { ...patch, status: 'closed_lost', stage: 'closed' };
    }
    return this.update(leadId, patch);
  },

  closeLead(leadId: string, won: boolean, note?: string): PipelineLead | undefined {
    const lead = this.get(leadId);
    if (!lead) return undefined;
    return this.update(leadId, {
      status: won ? 'closed_won' : 'closed_lost',
      stage: 'closed',
      notes: note || lead.notes,
    });
  },

  // ── Views ─────────────────────────────────────────────────────────────────

  byStage(stage: PipelineStage): PipelineLead[] {
    return this.list().filter((l) => l.stage === stage);
  },

  /** Leads awaiting a follow-up that is due today or overdue. */
  todaysFollowUps(): PipelineLead[] {
    const today = todayStr();
    return this.list().filter(
      (l) =>
        l.next_follow_up_date &&
        l.next_follow_up_date <= today &&
        l.status !== 'closed_won' &&
        l.status !== 'closed_lost'
    );
  },

  /** Leads that never responded and whose 2-day window has passed. */
  pendingFollowUps(): PipelineLead[] {
    const today = todayStr();
    return this.list().filter(
      (l) =>
        l.response_status !== 'responded' &&
        l.status !== 'closed_won' &&
        l.status !== 'closed_lost' &&
        (!l.next_follow_up_date || l.next_follow_up_date <= addDays(today, 0))
    );
  },

  proofsPendingReview(): Array<{ lead: PipelineLead; proof: PipelineProof }> {
    const items: Array<{ lead: PipelineLead; proof: PipelineProof }> = [];
    for (const lead of this.list()) {
      for (const proof of lead.proofs) {
        if (proof.verification === 'pending') items.push({ lead, proof });
      }
    }
    return items;
  },

  stats(): PipelineStats {
    const leads = this.list();
    const today = todayStr();
    const byStage = PIPELINE_STAGE_ORDER.reduce((acc, s) => {
      acc[s] = 0;
      return acc;
    }, {} as Record<PipelineStage, number>);
    const statusOrder: PipelineLeadStatus[] = [
      'new',
      'sourcing',
      'contacted',
      'responded',
      'awaiting_follow_up',
      'closed_won',
      'closed_lost',
    ];
    const byStatus = statusOrder.reduce((acc, s) => {
      acc[s] = 0;
      return acc;
    }, {} as Record<PipelineLeadStatus, number>);

    let outreachSent = 0;
    let responses = 0;
    let proofsPending = 0;
    let dueToday = 0;
    let overdue = 0;

    for (const l of leads) {
      byStage[l.stage] = (byStage[l.stage] || 0) + 1;
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
      outreachSent += l.outreach.filter((o) => o.status === 'sent').length;
      if (l.response_status === 'responded') responses++;
      proofsPending += l.proofs.filter((p) => p.verification === 'pending').length;
      if (
        l.next_follow_up_date &&
        l.next_follow_up_date <= today &&
        l.status !== 'closed_won' &&
        l.status !== 'closed_lost'
      ) {
        dueToday++;
        if (l.next_follow_up_date < today) overdue++;
      }
    }

    return {
      total_leads: leads.length,
      by_stage: byStage,
      by_status: byStatus,
      outreach_sent: outreachSent,
      responses_received: responses,
      response_rate_pct: outreachSent > 0 ? Math.round((responses / outreachSent) * 100) : 0,
      proofs_pending_review: proofsPending,
      follow_ups_due_today: dueToday,
      follow_ups_overdue: overdue,
    };
  },

  /** Seed a few demo leads the first time so the pipeline is never empty on a fresh browser. */
  ensureDemoData(createdBy?: string, createdByName?: string) {
    const leads = loadLeads();
    if (leads.length > 0) return;
    const now = new Date().toISOString();
    const today = todayStr();
    const seed: Array<Partial<PipelineLead> & { company: PipelineCompanySnapshot; contact: PipelineContactSnapshot }> = [
      {
        lead_code: 'LEAD-2026-0001',
        company: { company_name: 'TechNova Solutions', industry: 'Information Technology', location: 'Hyderabad', employee_count: '200-500 employees' },
        contact: { hr_name: 'Priya Sharma', hr_designation: 'Talent Acquisition Lead', hr_email: 'priya.sharma@technova.example.com', hr_linkedin: 'https://www.linkedin.com/in/priya-sharma-hr' },
        stage: 'outreach', status: 'contacted', response_status: 'pending', role_title: 'Java Full Stack Developer', role_category: 'tech', origin: 'uploaded',
        outreach: [{ id: uid('pout'), channel: 'linkedin', status: 'sent', draft_text: '', sent_text: '', sent_at: now, created_at: now, updated_at: now }],
      },
      {
        lead_code: 'LEAD-2026-0002',
        company: { company_name: 'MediCore Health', industry: 'Healthcare', location: 'Bengaluru', employee_count: '50-200 employees' },
        contact: { hr_name: 'Rahul Verma', hr_designation: 'HR Manager', hr_email: 'rahul.verma@medicore.example.com' },
        stage: 'proof_of_response', status: 'contacted', response_status: 'pending', role_title: 'Medical Billing Executive', role_category: 'non_tech', origin: 'manual',
        outreach: [{ id: uid('pout'), channel: 'mail', status: 'sent', draft_text: '', sent_text: '', sent_at: now, created_at: now, updated_at: now }],
        proofs: [{ id: uid('proof'), channel: 'mail', screenshot_url: '', filename: 'mail-proof.png', uploaded_at: now, verification: 'pending' as const }],
      },
      {
        lead_code: 'LEAD-2026-0003',
        company: { company_name: 'FinEdge Analytics', industry: 'Fintech', location: 'Pune', employee_count: '100-250 employees' },
        contact: { hr_name: 'Anita Desai', hr_designation: 'Recruitment Specialist', hr_phone: '+91 98490 12345' },
        stage: 'follow_up', status: 'awaiting_follow_up', response_status: 'no_response', role_title: 'Business Analyst', role_category: 'non_tech', origin: 'uploaded',
        outreach: [{ id: uid('pout'), channel: 'whatsapp', status: 'sent', draft_text: '', sent_text: '', sent_at: now, created_at: now, updated_at: now }],
        follow_ups: [{ id: uid('pfu'), channel: 'whatsapp', message: 'Day-2 follow-up sent', logged_at: now, due_date: today, completed_at: now, outcome: 'still_no_response' as const }],
        next_follow_up_date: today,
      },
    ];
    const built: PipelineLead[] = seed.map((s, i) => ({
      id: uid('plead'),
      created_at: now,
      updated_at: now,
      origin: 'manual' as const,
      stage: 'leads' as const,
      status: 'new' as const,
      outreach: [],
      proofs: [],
      follow_ups: [],
      response_status: 'pending' as const,
      created_by: createdBy,
      created_by_name: createdByName,
      ...s,
    } as PipelineLead));
    // stagger stage/status properly for demo rows
    persist([...built, ...leads]);
  },
};

export const pipelineDateUtils = { todayStr, addDays };
