import React, { useMemo, useState, useEffect } from 'react';
import {
  PipelineLead,
  PipelineStage,
  PipelineChannel,
  PIPELINE_STAGE_ORDER,
  PIPELINE_STAGE_LABELS,
  PIPELINE_CHANNELS,
  PIPELINE_CHANNEL_LABELS,
  PIPELINE_LEAD_STATUS_LABELS,
} from '../types/pipeline';
import { pipelineService } from '../services/pipelineService';
import { pipelineStore } from '../services/pipelineStore';
import { CRA } from '../types';
import {
  Plus,
  Users,
  Search,
  Send,
  Camera,
  AlarmClock,
  CheckCircle2,
  Building2,
  Mail,
  Phone,
  Linkedin,
  MessageCircle,
  X,
  Copy,
  Check,
  ChevronRight,
  Trash2,
  Sparkles,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

const stageIcon: Record<PipelineStage, React.ReactNode> = {
  leads: <Users className="h-4 w-4" />,
  hr_sourcing: <Search className="h-4 w-4" />,
  outreach: <Send className="h-4 w-4" />,
  proof_of_response: <Camera className="h-4 w-4" />,
  follow_up: <AlarmClock className="h-4 w-4" />,
  closed: <CheckCircle2 className="h-4 w-4" />,
};

const channelIcon: Record<PipelineChannel, React.ReactNode> = {
  linkedin: <Linkedin className="h-3.5 w-3.5" />,
  whatsapp: <MessageCircle className="h-3.5 w-3.5" />,
  mail: <Mail className="h-3.5 w-3.5" />,
};

interface PipelinePageProps {
  currentUser?: CRA | null;
}

export const PipelinePage: React.FC<PipelinePageProps> = ({ currentUser }) => {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [stats, setStats] = useState(pipelineService.stats());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<PipelineLead | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const refresh = () => {
    setLeads(pipelineService.list());
    setStats(pipelineService.stats());
  };

  useEffect(() => {
    pipelineStore.ensureDemoData(currentUser?.id, currentUser?.name);
    refresh();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.company.company_name.toLowerCase().includes(q) ||
        l.contact.hr_name?.toLowerCase().includes(q) ||
        l.role_title?.toLowerCase().includes(q) ||
        l.lead_code?.toLowerCase().includes(q)
    );
  }, [leads, search]);

  const byStage = useMemo(() => {
    const map = {} as Record<PipelineStage, PipelineLead[]>;
    for (const s of PIPELINE_STAGE_ORDER) map[s] = [];
    for (const l of filtered) {
      if (!map[l.stage]) map[l.stage] = [];
      map[l.stage].push(l);
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Header + stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <RefreshCw className="h-6 w-6 text-purple-400" /> Recruitment Pipeline
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Leads → HR Sourcing → Outreach → Proof of Response → Follow-up
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, HR, role…"
              className="pl-9 pr-3 py-2.5 text-xs rounded-xl bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:border-purple-500 focus:outline-none w-56"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition"
          >
            <Plus className="h-4 w-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Leads', value: stats.total_leads, cls: 'text-purple-300' },
          { label: 'Outreach Sent', value: stats.outreach_sent, cls: 'text-sky-300' },
          { label: 'Responded', value: stats.responses_received, cls: 'text-emerald-300' },
          { label: 'Response Rate', value: `${stats.response_rate_pct}%`, cls: 'text-lime-300' },
          { label: 'Proofs Pending', value: stats.proofs_pending_review, cls: 'text-amber-300' },
          { label: "Today's Follow-ups", value: stats.follow_ups_due_today, cls: 'text-rose-300' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900/80 border border-gray-800 rounded-2xl p-3">
            <p className={`text-xl font-black ${s.cls}`}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {PIPELINE_STAGE_ORDER.map((stage) => (
          <div key={stage} className="bg-gray-950/70 border border-gray-800 rounded-3xl p-3 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between px-1 pb-2 mb-2 border-b border-gray-800/80">
              <div className="flex items-center gap-2 text-purple-200">
                {stageIcon[stage]}
                <span className="text-xs font-black uppercase tracking-wider">{PIPELINE_STAGE_LABELS[stage]}</span>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-700/50 text-purple-200">
                {byStage[stage].length}
              </span>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[420px] pr-1">
              {byStage[stage].length === 0 && (
                <p className="text-[11px] text-gray-600 text-center py-6">No leads here yet</p>
              )}
              {byStage[stage].map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="w-full text-left bg-gray-900 hover:bg-gray-800/90 border border-gray-800 hover:border-purple-700/60 rounded-2xl p-3 transition group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-100 truncate">{lead.company.company_name}</p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {lead.contact.hr_name || 'HR info pending'} {lead.role_title ? `· ${lead.role_title}` : ''}
                      </p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-600 group-hover:text-purple-400 shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-gray-800 border border-gray-700 text-gray-400">
                      {lead.lead_code || 'LEAD'}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border ${
                        lead.response_status === 'responded'
                          ? 'bg-emerald-950 border-emerald-700/60 text-emerald-300'
                          : lead.response_status === 'no_response'
                          ? 'bg-rose-950 border-rose-700/60 text-rose-300'
                          : 'bg-amber-950 border-amber-700/60 text-amber-300'
                      }`}
                    >
                      {PIPELINE_LEAD_STATUS_LABELS[lead.status]}
                    </span>
                    {lead.proofs.some((p) => p.verification === 'pending') && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-900/70 border border-amber-600/60 text-amber-200 flex items-center gap-1">
                        <ShieldCheck className="h-2.5 w-2.5" /> Proof pending
                      </span>
                    )}
                    {lead.next_follow_up_date && lead.stage === 'follow_up' && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-sky-950 border border-sky-700/60 text-sky-300">
                        FU: {lead.next_follow_up_date}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl">
          {toast}
        </div>
      )}

      {showAddModal && (
        <AddLeadModal
          currentUser={currentUser}
          onClose={() => setShowAddModal(false)}
          onCreated={(lead) => {
            refresh();
            setShowAddModal(false);
            showToast(`Lead ${lead.lead_code} added to pipeline`);
          }}
        />
      )}

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          currentUser={currentUser}
          onClose={() => setSelectedLead(null)}
          onChanged={(updated) => {
            if (updated) setSelectedLead(updated);
            refresh();
          }}
          onDeleted={() => {
            setSelectedLead(null);
            refresh();
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};

// ─── Add Lead Modal ──────────────────────────────────────────────────────────

const AddLeadModal: React.FC<{
  currentUser?: CRA | null;
  onClose: () => void;
  onCreated: (lead: PipelineLead) => void;
}> = ({ currentUser, onClose, onCreated }) => {
  const [form, setForm] = useState({
    company_name: '',
    hr_name: '',
    hr_designation: '',
    hr_email: '',
    hr_phone: '',
    hr_linkedin: '',
    website: '',
    role_title: '',
    role_category: 'tech' as 'tech' | 'non_tech',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim()) return;
    setSaving(true);
    const lead = pipelineService.create({
      ...form,
      company_name: form.company_name.trim(),
      origin: 'manual',
      created_by: currentUser?.id,
      created_by_name: currentUser?.name,
    });
    // If HR details were provided, jump straight into outreach stage
    if (form.hr_email || form.hr_phone || form.hr_linkedin) {
      pipelineService.saveHrContact(lead.id, {
        hr_name: form.hr_name,
        hr_designation: form.hr_designation,
        hr_email: form.hr_email,
        hr_phone: form.hr_phone,
        hr_linkedin: form.hr_linkedin,
      });
    }
    setSaving(false);
    onCreated(pipelineService.get(lead.id) || lead);
  };

  const inputCls =
    'w-full px-3 py-2.5 text-xs rounded-xl bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:border-purple-500 focus:outline-none';

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-950 border border-purple-800/50 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Plus className="h-4 w-4 text-purple-400" /> Add Pipeline Lead
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Company Name *</label>
            <input required value={form.company_name} onChange={(e) => set('company_name', e.target.value)} placeholder="e.g. TechNova Solutions" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">HR Name</label>
              <input value={form.hr_name} onChange={(e) => set('hr_name', e.target.value)} placeholder="Auto-found if blank" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">HR Designation</label>
              <input value={form.hr_designation} onChange={(e) => set('hr_designation', e.target.value)} placeholder="e.g. HR Manager" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">HR Email</label>
              <input type="email" value={form.hr_email} onChange={(e) => set('hr_email', e.target.value)} placeholder="hr@company.com" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">HR Phone</label>
              <input value={form.hr_phone} onChange={(e) => set('hr_phone', e.target.value)} placeholder="+91 …" className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">HR LinkedIn</label>
              <input value={form.hr_linkedin} onChange={(e) => set('hr_linkedin', e.target.value)} placeholder="https://linkedin.com/in/…" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Role Title</label>
              <input value={form.role_title} onChange={(e) => set('role_title', e.target.value)} placeholder="e.g. Java Developer" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Category</label>
              <select value={form.role_category} onChange={(e) => set('role_category', e.target.value)} className={inputCls}>
                <option value="tech">Tech</option>
                <option value="non_tech">Non-Tech</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Notes</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className={inputCls} />
          </div>
          <p className="text-[10px] text-gray-500">
            Leave HR fields blank — we auto-search the CRM directory for existing HR info of this company.
          </p>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-300 border border-gray-700 hover:bg-gray-900">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 disabled:opacity-50">
              {saving ? 'Adding…' : 'Add to Pipeline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Lead Detail Modal (stage actions) ───────────────────────────────────────

export const LeadDetailModal: React.FC<{
  lead: PipelineLead;
  currentUser?: CRA | null;
  onClose: () => void;
  onChanged: (lead?: PipelineLead) => void;
  onDeleted: () => void;
  showToast?: (msg: string) => void;
}> = ({ lead, currentUser, onClose, onChanged, onDeleted, showToast }) => {
  const [tab, setTab] = useState<'overview' | 'outreach' | 'proofs' | 'followups'>('overview');
  const sender = currentUser?.name || 'CRM Team';

  const act = (fn: () => PipelineLead | undefined) => {
    onChanged(fn());
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-950 border border-purple-800/50 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-800/80 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-black text-white truncate flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-400 shrink-0" /> {lead.company.company_name}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {lead.lead_code} · {PIPELINE_STAGE_LABELS[lead.stage]} · {PIPELINE_LEAD_STATUS_LABELS[lead.status]}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-3 border-b border-gray-800/60 overflow-x-auto">
          {(['overview', 'outreach', 'proofs', 'followups'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-[11px] font-black uppercase tracking-wider rounded-t-xl transition whitespace-nowrap ${
                tab === t ? 'bg-purple-900/60 text-white border-x border-t border-purple-700/50' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t === 'followups' ? 'Follow-ups' : t}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoCard title="HR Contact">
                  <p className="text-xs font-bold text-gray-100">{lead.contact.hr_name || '— not found yet —'}</p>
                  <p className="text-[11px] text-gray-400">{lead.contact.hr_designation || ''}</p>
                  <div className="mt-2 space-y-1">
                    {lead.contact.hr_email && (
                      <p className="text-[11px] text-gray-300 flex items-center gap-1.5"><Mail className="h-3 w-3 text-purple-400" /> {lead.contact.hr_email}</p>
                    )}
                    {lead.contact.hr_phone && (
                      <p className="text-[11px] text-gray-300 flex items-center gap-1.5"><Phone className="h-3 w-3 text-purple-400" /> {lead.contact.hr_phone}</p>
                    )}
                    {lead.contact.hr_linkedin && (
                      <a href={lead.contact.hr_linkedin} target="_blank" rel="noreferrer" className="text-[11px] text-sky-400 flex items-center gap-1.5 hover:underline">
                        <Linkedin className="h-3 w-3" /> LinkedIn profile
                      </a>
                    )}
                  </div>
                  {!lead.contact.hr_email && !lead.contact.hr_phone && !lead.contact.hr_linkedin && (
                    <button
                      onClick={() => act(() => pipelineService.startSourcing(lead.id))}
                      className="mt-2 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-purple-900/60 border border-purple-700/50 text-purple-200 hover:bg-purple-800/70"
                    >
                      Mark as “Finding HR Info”
                    </button>
                  )}
                </InfoCard>
                <InfoCard title="Company">
                  <p className="text-xs font-bold text-gray-100">{lead.company.company_name}</p>
                  <p className="text-[11px] text-gray-400">{[lead.company.industry, lead.company.location, lead.company.employee_count].filter(Boolean).join(' · ') || '—'}</p>
                  {lead.company.website && (
                    <a href={lead.company.website} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[11px] text-sky-400 hover:underline">{lead.company.website}</a>
                  )}
                </InfoCard>
              </div>

              <div className="flex flex-wrap gap-2">
                {lead.role_title && (
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-700 text-gray-300">
                    Role: {lead.role_title} {lead.role_category ? `(${lead.role_category === 'tech' ? 'Tech' : 'Non-Tech'})` : ''}
                  </span>
                )}
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-700 text-gray-300">
                  Origin: {lead.origin.replace('_', ' ')}
                </span>
                {lead.created_by_name && (
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-700 text-gray-300">
                    By: {lead.created_by_name}
                  </span>
                )}
              </div>

              {lead.notes && <InfoCard title="Notes"><p className="text-[11px] text-gray-300 whitespace-pre-wrap">{lead.notes}</p></InfoCard>}

              {/* Stage progression */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => act(() => pipelineService.saveHrContact(lead.id, {}))}
                  className="text-[10px] font-bold px-3 py-2 rounded-xl bg-purple-900/60 border border-purple-700/50 text-purple-200 hover:bg-purple-800/70"
                >
                  → Move to Outreach Stage
                </button>
                <button
                  onClick={() => act(() => pipelineService.markResponse(lead.id, true, 'Responded (manual)'))}
                  className="text-[10px] font-bold px-3 py-2 rounded-xl bg-emerald-900/60 border border-emerald-700/50 text-emerald-200 hover:bg-emerald-800/70"
                >
                  ✓ Mark Responded
                </button>
                <button
                  onClick={() => act(() => pipelineService.markResponse(lead.id, false, 'No response'))}
                  className="text-[10px] font-bold px-3 py-2 rounded-xl bg-amber-900/60 border border-amber-700/50 text-amber-200 hover:bg-amber-800/70"
                >
                  ⏰ No Response → Follow-up in 2 days
                </button>
                <button
                  onClick={() => act(() => pipelineService.closeLead(lead.id, true))}
                  className="text-[10px] font-bold px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Close · Won
                </button>
                <button
                  onClick={() => act(() => pipelineService.closeLead(lead.id, false))}
                  className="text-[10px] font-bold px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Close · Lost
                </button>
                <button
                  onClick={() => {
                    pipelineService.remove(lead.id);
                    onDeleted();
                  }}
                  className="text-[10px] font-bold px-3 py-2 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-300 hover:bg-rose-900/70 flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          )}

          {tab === 'outreach' && <OutreachTab lead={lead} sender={sender} act={act} showToast={showToast} />}
          {tab === 'proofs' && <ProofsTab lead={lead} currentUser={currentUser} act={act} showToast={showToast} />}
          {tab === 'followups' && <FollowUpsTab lead={lead} sender={sender} act={act} showToast={showToast} />}
        </div>
      </div>
    </div>
  );
};

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-3.5">
    <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1.5">{title}</p>
    {children}
  </div>
);

// ─── Outreach Tab ────────────────────────────────────────────────────────────

const OutreachTab: React.FC<{
  lead: PipelineLead;
  sender: string;
  act: (fn: () => PipelineLead | undefined) => void;
  showToast?: (msg: string) => void;
}> = ({ lead, sender, act, showToast }) => {
  const [channel, setChannel] = useState<PipelineChannel>('linkedin');
  const [draft, setDraft] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const generate = () => {
    const text = pipelineService.draftFor(lead, channel, sender);
    setDraft(text);
  };

  const saveDraft = () => {
    if (!draft.trim()) return;
    act(() => pipelineStoreAddDraft(lead.id, channel, draft));
    setDraft('');
    showToast?.('Draft saved — customize the name & text per lead before sending');
  };

  const copy = async (id: string, text: string) => {
    const ok = await pipelineService.copyText(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-3.5 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-purple-400" /> New outreach draft (custom name per lead)
        </p>
        <div className="flex gap-2">
          {PIPELINE_CHANNELS.map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
                channel === c ? 'bg-purple-600 text-white' : 'bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800'
              }`}
            >
              {channelIcon[c]} {PIPELINE_CHANNEL_LABELS[c]}
            </button>
          ))}
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={6}
          placeholder="Click “Generate draft” — a personalized message using the lead's name & company will appear here. Edit freely."
          className="w-full px-3 py-2.5 text-xs rounded-xl bg-gray-950 border border-gray-700 text-gray-100 placeholder-gray-600 focus:border-purple-500 focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          <button onClick={generate} className="text-[11px] font-bold px-3 py-2 rounded-xl bg-purple-900/60 border border-purple-700/50 text-purple-200 hover:bg-purple-800/70">
            Generate draft
          </button>
          <button onClick={saveDraft} disabled={!draft.trim()} className="text-[11px] font-bold px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40">
            Save draft
          </button>
          <button
            onClick={() => copy('new', draft)}
            disabled={!draft.trim()}
            className="text-[11px] font-bold px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40 flex items-center gap-1.5"
          >
            {copiedId === 'new' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />} Copy
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Drafts & sent messages ({lead.outreach.length})</p>
        {lead.outreach.length === 0 && <p className="text-[11px] text-gray-600">No outreach yet for this lead.</p>}
        {lead.outreach.map((o) => (
          <div key={o.id} className="bg-gray-900/70 border border-gray-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-200">
                  {channelIcon[o.channel]} {PIPELINE_CHANNEL_LABELS[o.channel]}
                </span>
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border ${
                    o.status === 'sent'
                      ? 'bg-sky-950 border-sky-700/60 text-sky-300'
                      : o.status === 'responded'
                      ? 'bg-emerald-950 border-emerald-700/60 text-emerald-300'
                      : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}
                >
                  {o.status.replace('_', ' ')}
                </span>
                {o.used_own_message && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-fuchsia-950 border border-fuchsia-700/60 text-fuchsia-300">
                    own msg
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {o.status === 'draft' && (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(o.id);
                        setEditText(o.draft_text);
                      }}
                      className="text-[10px] font-bold px-2 py-1 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => act(() => pipelineService.markSent(lead.id, o.id, {}))}
                      className="text-[10px] font-bold px-2 py-1 rounded-lg bg-sky-700 hover:bg-sky-600 text-white"
                    >
                      Mark sent
                    </button>
                  </>
                )}
                <button
                  onClick={() => copy(o.id, o.sent_text || o.draft_text)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                  title="Copy message"
                >
                  {copiedId === o.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            {editingId === o.id ? (
              <div className="space-y-2">
                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={5} className="w-full px-3 py-2 text-[11px] rounded-xl bg-gray-950 border border-gray-700 text-gray-100 focus:border-purple-500 focus:outline-none" />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      act(() => pipelineService.updateDraft(lead.id, o.id, { draft_text: editText }));
                      setEditingId(null);
                    }}
                    className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white"
                  >
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-300 whitespace-pre-wrap">{o.sent_text || o.draft_text}</p>
            )}
            {o.sent_at && <p className="text-[10px] text-gray-500">Sent {new Date(o.sent_at).toLocaleString()}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

const pipelineStoreAddDraft = (leadId: string, channel: PipelineChannel, text: string) =>
  pipelineStore.addDraft(leadId, channel, text).lead;

// ─── Proofs Tab ──────────────────────────────────────────────────────────────

const ProofsTab: React.FC<{
  lead: PipelineLead;
  currentUser?: CRA | null;
  act: (fn: () => PipelineLead | undefined) => void;
  showToast?: (msg: string) => void;
}> = ({ lead, currentUser, act, showToast }) => {
  const [channel, setChannel] = useState<PipelineChannel>('linkedin');
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const onFile = (file?: File | null) => {
    if (!file) return;
    if (file.size > 3.5 * 1024 * 1024) {
      showToast?.('Screenshot too large — please keep it under 3.5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      act(() =>
        pipelineStore.addProof(lead.id, {
          channel,
          screenshot_url: url,
          filename: file.name,
          uploaded_by: currentUser?.id,
          uploaded_by_name: currentUser?.name,
        })
      );
      showToast?.('Proof uploaded — sent to Admin for verification');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-3.5 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <Camera className="h-3 w-3 text-purple-400" /> Proof of contact — upload screenshot of the sent mail / WhatsApp / LinkedIn message
        </p>
        <p className="text-[10px] text-gray-500">
          Every uploaded screenshot goes to the <b className="text-amber-300">Admin review queue</b>. If you used your own message instead of the draft, upload that proof too.
        </p>
        <div className="flex gap-2">
          {PIPELINE_CHANNELS.map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
                channel === c ? 'bg-purple-600 text-white' : 'bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800'
              }`}
            >
              {channelIcon[c]} {PIPELINE_CHANNEL_LABELS[c]}
            </button>
          ))}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-3 rounded-xl border-2 border-dashed border-gray-700 hover:border-purple-600 text-[11px] font-bold text-gray-400 hover:text-purple-300 transition"
        >
          📷 Choose screenshot (PNG / JPG, max 3.5 MB)
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Uploaded proofs ({lead.proofs.length})</p>
        {lead.proofs.length === 0 && <p className="text-[11px] text-gray-600">No proofs uploaded yet.</p>}
        {lead.proofs.map((p) => (
          <div key={p.id} className="bg-gray-900/70 border border-gray-800 rounded-2xl p-3.5 flex items-center gap-3">
            {p.screenshot_url ? (
              <img src={p.screenshot_url} alt="proof" className="h-14 w-14 rounded-xl object-cover border border-gray-700 cursor-pointer" onClick={() => setPreview(p.screenshot_url)} />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-gray-800 border border-gray-700 grid place-items-center text-gray-500 text-[9px] font-bold">NO IMG</div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-gray-200 flex items-center gap-1.5">
                {channelIcon[p.channel]} {PIPELINE_CHANNEL_LABELS[p.channel]} {p.filename ? `· ${p.filename}` : ''}
              </p>
              <p className="text-[10px] text-gray-500">{new Date(p.uploaded_at).toLocaleString()} {p.uploaded_by_name ? `· by ${p.uploaded_by_name}` : ''}</p>
            </div>
            <span
              className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border shrink-0 ${
                p.verification === 'approved'
                  ? 'bg-emerald-950 border-emerald-700/60 text-emerald-300'
                  : p.verification === 'rejected'
                  ? 'bg-rose-950 border-rose-700/60 text-rose-300'
                  : 'bg-amber-950 border-amber-700/60 text-amber-300'
              }`}
            >
              {p.verification}
            </span>
          </div>
        ))}
      </div>

      {preview && (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-6" onClick={() => setPreview(null)}>
          <img src={preview} alt="proof preview" className="max-h-[85vh] max-w-full rounded-2xl border border-gray-700" />
        </div>
      )}
    </div>
  );
};

// ─── Follow-ups Tab ──────────────────────────────────────────────────────────

const FollowUpsTab: React.FC<{
  lead: PipelineLead;
  sender: string;
  act: (fn: () => PipelineLead | undefined) => void;
  showToast?: (msg: string) => void;
}> = ({ lead, sender, act, showToast }) => {
  const [channel, setChannel] = useState<PipelineChannel>('mail');
  const [msg, setMsg] = useState('');

  const generate = () => setMsg(pipelineService.draftFor(lead, channel, sender, 2));

  const log = () => {
    if (!msg.trim()) return;
    act(() => pipelineStoreLogFollowUp(lead.id, { channel, message: msg, logged_by: sender }));
    setMsg('');
    showToast?.('Follow-up logged — next follow-up scheduled after 2 days');
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-3.5 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <AlarmClock className="h-3 w-3 text-amber-400" /> Follow-up (day-2 reminder for non-responders)
        </p>
        {lead.next_follow_up_date && (
          <p className="text-[11px] text-gray-300">
            Next follow-up due: <b className={lead.next_follow_up_date <= pipelineService.utils.todayStr() ? 'text-rose-300' : 'text-sky-300'}>{lead.next_follow_up_date}</b>
          </p>
        )}
        <div className="flex gap-2">
          {PIPELINE_CHANNELS.map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
                channel === c ? 'bg-purple-600 text-white' : 'bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800'
              }`}
            >
              {channelIcon[c]} {PIPELINE_CHANNEL_LABELS[c]}
            </button>
          ))}
        </div>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} placeholder="Day-2 follow-up message…" className="w-full px-3 py-2.5 text-xs rounded-xl bg-gray-950 border border-gray-700 text-gray-100 placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
        <div className="flex gap-2">
          <button onClick={generate} className="text-[11px] font-bold px-3 py-2 rounded-xl bg-purple-900/60 border border-purple-700/50 text-purple-200 hover:bg-purple-800/70">
            Generate follow-up msg
          </button>
          <button onClick={log} disabled={!msg.trim()} className="text-[11px] font-bold px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40">
            Log follow-up sent
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Follow-up history ({lead.follow_ups.length})</p>
        {lead.follow_ups.length === 0 && <p className="text-[11px] text-gray-600">No follow-ups logged yet.</p>}
        {lead.follow_ups.map((f) => (
          <div key={f.id} className="bg-gray-900/70 border border-gray-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-200">
                {channelIcon[f.channel]} {PIPELINE_CHANNEL_LABELS[f.channel]} · due {f.due_date}
              </span>
              {f.completed_at ? (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-950 border border-emerald-700/60 text-emerald-300">
                  done · {f.outcome?.replace(/_/g, ' ')}
                </span>
              ) : (
                <div className="flex gap-1">
                  <button onClick={() => act(() => pipelineService.completeFollowUp(lead.id, f.id, 'replied'))} className="text-[9px] font-black uppercase px-2 py-1 rounded-md bg-emerald-800 hover:bg-emerald-700 text-white">
                    Replied
                  </button>
                  <button onClick={() => act(() => pipelineService.completeFollowUp(lead.id, f.id, 'still_no_response'))} className="text-[9px] font-black uppercase px-2 py-1 rounded-md bg-amber-800 hover:bg-amber-700 text-white">
                    No resp
                  </button>
                  <button onClick={() => act(() => pipelineService.completeFollowUp(lead.id, f.id, 'not_interested'))} className="text-[9px] font-black uppercase px-2 py-1 rounded-md bg-rose-900 hover:bg-rose-800 text-white">
                    Not int.
                  </button>
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-300 whitespace-pre-wrap">{f.message}</p>
            <p className="text-[10px] text-gray-500">{new Date(f.logged_at).toLocaleString()}{f.logged_by ? ` · by ${f.logged_by}` : ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const pipelineStoreLogFollowUp = (
  leadId: string,
  data: { channel: PipelineChannel; message: string; logged_by?: string }
) => pipelineStore.logFollowUp(leadId, data);
