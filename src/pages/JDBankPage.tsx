import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { pipelineService } from '../services/pipelineService';
import { clientFallbackStore } from '../services/clientFallbackStore';
import { JD, Company, CRA, PipelineLead, PipelineChannel } from '../types';
import {
  Briefcase,
  Building2,
  User,
  Search,
  Mail,
  Phone,
  Linkedin,
  Globe,
  MapPin,
  Users,
  Calendar,
  X,
  Copy,
  Check,
  Cpu,
  Layers,
  FileText,
  Send,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';

type Category = 'tech' | 'non_tech';

const CHANNEL_ICON: Record<PipelineChannel, React.ReactNode> = {
  linkedin: <Linkedin className="h-3.5 w-3.5" />,
  whatsapp: <MessageCircle className="h-3.5 w-3.5" />,
  mail: <Mail className="h-3.5 w-3.5" />,
};

const CHANNEL_LABEL: Record<PipelineChannel, string> = {
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
  mail: 'Mail',
};

/**
 * Admin JD Bank — every JD in the system, split into a whole separate
 * TECH and NON-TECH section. Clicking a JD opens the FULL JD: complete
 * description, HR contact details and company profile.
 */
export const JDBankPage: React.FC<{ currentUser?: CRA | null; defaultCategory?: Category; standalone?: boolean }> = ({
  currentUser,
  defaultCategory = 'tech',
  standalone = false,
}) => {
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [jds, setJds] = useState<JD[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pipelineLeads, setPipelineLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedJd, setSelectedJd] = useState<JD | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [jdList, compList] = await Promise.all([api.getJDs(), api.getCompanies()]);
      setJds(jdList);
      setCompanies(compList);
    } catch {
      setJds(clientFallbackStore.getJDs());
      setCompanies(clientFallbackStore.getCompanies());
    }
    setPipelineLeads(pipelineService.list());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const classify = (jd: JD): Category => {
    if (jd.hr_contact?.domain || (jd as any).role_category) return (jd as any).role_category;
    const techKeywords = [
      'software', 'engineer', 'developer', 'developer', 'full stack', 'fullstack', 'frontend', 'backend',
      'data', 'ai', 'ml', 'cyber', 'cloud', 'devops', 'java', 'python', 'react', 'node', 'qa', 'tester',
      'analyst', 'programmer', 'architect', 'sap', 'salesforce', 'it ', 'technical', 'web', 'mobile',
    ];
    const t = `${jd.title} ${jd.raw_text?.slice(0, 400) || ''}`.toLowerCase();
    return techKeywords.some((k) => t.includes(k)) ? 'tech' : 'non_tech';
  };

  const companyOf = (jd: JD): Company | undefined =>
    companies.find((c) => c.id === jd.company_id) || jd.company;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jds
      .filter((jd) => classify(jd) === category)
      .filter((jd) => {
        if (!q) return true;
        return (
          jd.title.toLowerCase().includes(q) ||
          (jd.company_name || '').toLowerCase().includes(q) ||
          (jd.hr_name || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }, [jds, companies, category, search]);

  const techCount = useMemo(() => jds.filter((j) => classify(j) === 'tech').length, [jds, companies]);
  const nonTechCount = jds.length - techCount;

  const copyJd = async (jd: JD) => {
    const text = `ROLE: ${jd.title}\nCOMPANY: ${jd.company_name || companyOf(jd)?.name || '—'}\n\n${jd.raw_text || ''}`;
    const ok = await pipelineService.copyText(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const sendToPipeline = (jd: JD) => {
    const company = companyOf(jd);
    const lead = pipelineService.create({
      company_name: jd.company_name || company?.name || 'Unknown Company',
      hr_name: jd.hr_name || jd.hr_contact?.name,
      hr_email: jd.hr_email || jd.hr_contact?.email,
      hr_phone: (jd.hr_contact as any)?.phone || (jd.hr_contact as any)?.hr_phone,
      hr_linkedin: (jd.hr_contact as any)?.linkedin_url || (jd.hr_contact as any)?.hr_linkedin,
      website: company?.website,
      linkedin_url: company?.linkedin_url,
      industry: company?.industry,
      location: company?.location,
      employee_count: company?.employee_count,
      role_title: jd.title,
      jd_id: jd.id,
      role_category: classify(jd),
      origin: 'jd_sourcing',
      created_by: currentUser?.id,
      created_by_name: currentUser?.name,
      notes: `Sourced from JD Bank (${jd.jd_id || jd.id})`,
    });
    setSelectedJd(null);
    return lead;
  };

  if (loading) {
    return <div className="bg-gray-950/70 border border-gray-800 rounded-3xl p-10 text-center text-xs text-gray-400">Loading JD Bank…</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-amber-400" /> JD Bank
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Every collected JD — Tech and Non-Tech kept as a whole separate sections, with full HR & company details.
          </p>
        </div>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search role, company, HR…"
            className="pl-9 pr-3 py-2.5 text-xs rounded-xl bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:border-amber-500 focus:outline-none w-64"
          />
        </div>
      </div>

      {/* Category switcher — separate Tech / Non-Tech */}
      <div className="flex gap-1 bg-gray-900/80 border border-gray-800 rounded-2xl p-1 w-fit">
        <button
          onClick={() => setCategory('tech')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition ${
            category === 'tech' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Cpu className="h-4 w-4" /> Tech ({techCount})
        </button>
        <button
          onClick={() => setCategory('non_tech')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition ${
            category === 'non_tech' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Layers className="h-4 w-4" /> Non-Tech ({nonTechCount})
        </button>
      </div>

      {/* JD cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.length === 0 && (
          <div className="md:col-span-2 xl:col-span-3 bg-gray-950/70 border border-gray-800 rounded-3xl p-10 text-center">
            <FileText className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-400">
              No {category === 'tech' ? 'Tech' : 'Non-Tech'} JDs yet. JDs arrive from JD Intake, CSV uploads and HR sourcing.
            </p>
          </div>
        )}
        {filtered.map((jd) => {
          const comp = companyOf(jd);
          const isTech = classify(jd) === 'tech';
          return (
            <button
              key={jd.id}
              onClick={() => setSelectedJd(jd)}
              className="text-left bg-gray-950/70 hover:bg-gray-900/80 border border-gray-800 hover:border-amber-700/60 rounded-3xl p-4 transition group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-black text-white truncate group-hover:text-amber-200">{jd.title}</p>
                  <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                    <Building2 className="h-3 w-3 shrink-0" /> {jd.company_name || comp?.name || '—'}
                  </p>
                </div>
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border shrink-0 ${
                    isTech ? 'bg-sky-950 border-sky-700/60 text-sky-300' : 'bg-fuchsia-950 border-fuchsia-700/60 text-fuchsia-300'
                  }`}
                >
                  {isTech ? 'Tech' : 'Non-Tech'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-500 flex-wrap">
                {jd.hr_name && (
                  <span className="flex items-center gap-1"><User className="h-3 w-3" /> {jd.hr_name}</span>
                )}
                {jd.hr_email && (
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {jd.hr_email}</span>
                )}
                {jd.date_received && (
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {jd.date_received}</span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border ${
                    jd.is_verified
                      ? 'bg-emerald-950 border-emerald-700/60 text-emerald-300'
                      : 'bg-amber-950 border-amber-700/60 text-amber-300'
                  }`}
                >
                  {jd.is_verified ? 'Verified' : 'Pending review'}
                </span>
                {jd.jd_id && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-gray-800 border border-gray-700 text-gray-400">
                    {jd.jd_id}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Full JD modal */}
      {selectedJd && (
        <JDDetailModal
          jd={selectedJd}
          company={companyOf(selectedJd)}
          category={classify(selectedJd)}
          currentUser={currentUser}
          onClose={() => setSelectedJd(null)}
          onSendToPipeline={sendToPipeline}
          onCopy={copyJd}
          copied={copied}
        />
      )}
    </div>
  );
};

const JDDetailModal: React.FC<{
  jd: JD;
  company?: Company;
  category: Category;
  currentUser?: CRA | null;
  onClose: () => void;
  onSendToPipeline: (jd: JD) => PipelineLead;
  onCopy: (jd: JD) => void;
  copied: boolean;
}> = ({ jd, company, category, currentUser, onClose, onSendToPipeline, onCopy, copied }) => {
  const [sentToast, setSentToast] = useState<string | null>(null);
  const [channel, setChannel] = useState<PipelineChannel>('mail');
  const [draft, setDraft] = useState('');
  const [createdLead, setCreatedLead] = useState<PipelineLead | null>(null);

  // When a pipeline lead exists for this JD (created just now), offer a ready outreach draft.
  React.useEffect(() => {
    if (createdLead) {
      setDraft(pipelineService.draftFor(createdLead, channel, currentUser?.name));
    }
  }, [createdLead, channel]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-950 border border-amber-800/50 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-800/80 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-black text-white truncate">{jd.title}</h3>
            <p className="text-[11px] text-gray-400">
              {jd.company_name || company?.name || '—'} · {jd.jd_id || jd.id} ·{' '}
              <span className={category === 'tech' ? 'text-sky-300 font-bold' : 'text-fuchsia-300 font-bold'}>
                {category === 'tech' ? 'Tech' : 'Non-Tech'}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Full JD text */}
          <section className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
              <FileText className="h-3 w-3 text-amber-400" /> Full Job Description
            </p>
            <pre className="text-[11px] text-gray-200 whitespace-pre-wrap font-sans leading-relaxed max-h-72 overflow-y-auto">
              {jd.raw_text || 'No JD text captured.'}
            </pre>
          </section>

          {/* HR details */}
          <section className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
              <User className="h-3 w-3 text-amber-400" /> HR Contact
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <p className="text-gray-200"><b className="text-gray-400">Name:</b> {jd.hr_name || company?.contacts?.[0]?.name || '—'}</p>
              <p className="text-gray-200"><b className="text-gray-400">Designation:</b> {jd.hr_designation || company?.contacts?.[0]?.title || '—'}</p>
              <p className="text-gray-200 flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-amber-400" /> {jd.hr_email || company?.contacts?.[0]?.email || '—'}
              </p>
              <p className="text-gray-200 flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-amber-400" /> {(jd.hr_contact as any)?.phone || (jd.hr_contact as any)?.hr_phone || company?.contacts?.[0]?.phone || '—'}
              </p>
              <p className="text-gray-200 flex items-center gap-1.5 sm:col-span-2">
                <Linkedin className="h-3 w-3 text-amber-400" />
                {(jd.hr_contact as any)?.linkedin_url || (jd.hr_contact as any)?.hr_linkedin || company?.contacts?.[0]?.linkedin_url ? (
                  <a
                    className="text-sky-400 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                    href={(jd.hr_contact as any)?.linkedin_url || (jd.hr_contact as any)?.hr_linkedin || company?.contacts?.[0]?.linkedin_url}
                  >
                    LinkedIn profile
                  </a>
                ) : (
                  '—'
                )}
              </p>
            </div>
          </section>

          {/* Company details */}
          <section className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
              <Building2 className="h-3 w-3 text-amber-400" /> Company
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <p className="text-gray-200"><b className="text-gray-400">Name:</b> {company?.name || jd.company_name || '—'}</p>
              <p className="text-gray-200 flex items-center gap-1.5"><Globe className="h-3 w-3 text-amber-400" /> {company?.website ? <a href={company.website} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">{company.website}</a> : '—'}</p>
              <p className="text-gray-200 flex items-center gap-1.5"><MapPin className="h-3 w-3 text-amber-400" /> {company?.location || '—'}</p>
              <p className="text-gray-200 flex items-center gap-1.5"><Users className="h-3 w-3 text-amber-400" /> {company?.employee_count || '—'}</p>
              <p className="text-gray-200 sm:col-span-2"><b className="text-gray-400">Industry:</b> {company?.industry || '—'}</p>
            </div>
          </section>

          {/* Send to pipeline + outreach */}
          <section className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Send className="h-3 w-3 text-amber-400" /> Source this JD into the recruitment pipeline
            </p>
            {!createdLead ? (
              <button
                onClick={() => setCreatedLead(onSendToPipeline(jd))}
                className="text-[11px] font-bold px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white"
              >
                → Create pipeline lead from this JD
              </button>
            ) : (
              <>
                <p className="text-[11px] text-emerald-300 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> Added to pipeline as {createdLead.lead_code}
                </p>
                <div className="flex gap-1.5">
                  {(Object.keys(CHANNEL_LABEL) as PipelineChannel[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setChannel(c)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
                        channel === c ? 'bg-purple-600 text-white' : 'bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      {CHANNEL_ICON[c]} {CHANNEL_LABEL[c]}
                    </button>
                  ))}
                </div>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-gray-950 border border-gray-700 text-gray-100 focus:border-purple-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await pipelineService.copyText(draft);
                      setSentToast('Outreach draft copied — paste it in LinkedIn / WhatsApp / Mail');
                      setTimeout(() => setSentToast(null), 2600);
                    }}
                    className="text-[11px] font-bold px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-gray-200 hover:bg-gray-800 flex items-center gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy draft
                  </button>
                  <button
                    onClick={() => {
                      const { outreach } = pipelineService.addDraft(createdLead.id, channel, draft);
                      if (outreach) pipelineService.markSent(createdLead.id, outreach.id, {});
                      setSentToast('Marked as sent — upload proof of response next');
                      setTimeout(() => setSentToast(null), 2600);
                    }}
                    className="text-[11px] font-bold px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" /> Mark as sent
                  </button>
                </div>
              </>
            )}
          </section>
        </div>

        <div className="p-4 border-t border-gray-800/80 flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => onCopy(jd)}
            className="text-[11px] font-bold px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-700 text-gray-200 hover:bg-gray-800 flex items-center gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} Copy JD
          </button>
          <button onClick={onClose} className="text-[11px] font-bold px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white">
            Close
          </button>
        </div>

        {sentToast && (
          <div className="absolute bottom-20 right-6 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl">{sentToast}</div>
        )}
      </div>
    </div>
  );
};
