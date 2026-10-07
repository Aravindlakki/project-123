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
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';

export type JDCategory = 'it' | 'non_it';
export type JDFilter = 'all' | 'it' | 'non_it';

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

export const classifyJDCategory = (jd: JD): JDCategory => {
  const explicit = (jd as any).role_category || (jd as any).category;
  if (explicit === 'non_tech' || explicit === 'non_it' || explicit === 'Non-IT' || explicit === 'non-tech') return 'non_it';
  if (explicit === 'tech' || explicit === 'it' || explicit === 'IT') return 'it';

  const domain = (jd.hr_contact?.domain || (jd.company as any)?.domain || (jd as any).domain || '').toLowerCase();
  if (
    domain.includes('non-it') || domain.includes('non-tech') || domain.includes('non it') ||
    domain.includes('finance') || domain.includes('marketing') || domain.includes('operations') ||
    domain.includes('bpo') || domain.includes('sales') || domain.includes('hr')
  ) {
    return 'non_it';
  }
  if (domain.includes('cyber') || domain.includes('it services') || domain.includes('tech') || domain.includes('software')) {
    return 'it';
  }

  const techKeywords = [
    'software', 'engineer', 'developer', 'frontend', 'backend', 'full stack', 'fullstack',
    'data', 'ai', 'ml', 'cyber', 'cloud', 'devops', 'java', 'python', 'react', 'node', 'qa', 'tester',
    'analyst', 'programmer', 'architect', 'sap', 'salesforce', 'it ', 'technical', 'web', 'mobile',
    'system', 'security', 'database', 'network', 'aws', 'azure', 'dev', 'coder', 'stack'
  ];
  const t = `${jd.title} ${jd.raw_text?.slice(0, 400) || ''}`.toLowerCase();
  return techKeywords.some((k) => t.includes(k)) ? 'it' : 'non_it';
};

/**
 * Unified JD Bank — displays both IT and Non-IT JDs in a single list
 * with an (All / IT / Non-IT) filter, visible IT / Non-IT badges,
 * admin approval status, company name, and the uploading employee's name.
 */
export const JDBankPage: React.FC<{ currentUser?: CRA | null; defaultCategory?: string; standalone?: boolean }> = ({
  currentUser,
}) => {
  // Default the filter to All
  const [filter, setFilter] = useState<JDFilter>('all');
  const [jds, setJds] = useState<JD[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<CRA[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedJd, setSelectedJd] = useState<JD | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const refresh = async () => {
    setLoading(true);
    try {
      const [jdList, compList, craList] = await Promise.all([
        api.getJDs(),
        api.getCompanies(),
        api.getCRAs().catch(() => clientFallbackStore.getUsers(true)),
      ]);
      setJds(jdList);
      setCompanies(compList);
      setUsers(craList || []);
    } catch {
      setJds(clientFallbackStore.getJDs());
      setCompanies(clientFallbackStore.getCompanies());
      setUsers(clientFallbackStore.getUsers(true));
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const companyOf = (jd: JD): Company | undefined =>
    companies.find((c) => c.id === jd.company_id) || jd.company;

  const getUploaderName = (jd: JD): string => {
    if (jd.creator?.name) return jd.creator.name;
    if ((jd as any).created_by_name) return (jd as any).created_by_name;
    if (jd.created_by) {
      const found = users.find((u) => u.id === jd.created_by || u.emp_id === jd.created_by);
      if (found?.name) return found.name;
    }
    return 'CRA Associate';
  };

  const isJdApproved = (jd: JD): boolean => {
    return jd.is_verified || jd.eligibility_status === 'eligible';
  };

  const handleApproveJD = async (e: React.MouseEvent, jdId: string) => {
    e.stopPropagation();
    try {
      await api.verifyJD(jdId, true);
      setJds((prev) =>
        prev.map((j) => (j.id === jdId ? { ...j, is_verified: true, eligibility_status: 'eligible' } : j))
      );
      if (selectedJd && selectedJd.id === jdId) {
        setSelectedJd((prev) => (prev ? { ...prev, is_verified: true, eligibility_status: 'eligible' } : null));
      }
      setActionFeedback('JD approved & verified for hiring and incentive credit');
      setTimeout(() => setActionFeedback(null), 2500);
    } catch {
      clientFallbackStore.updateJD(jdId, { is_verified: true, eligibility_status: 'eligible' });
      setJds((prev) =>
        prev.map((j) => (j.id === jdId ? { ...j, is_verified: true, eligibility_status: 'eligible' } : j))
      );
      if (selectedJd && selectedJd.id === jdId) {
        setSelectedJd((prev) => (prev ? { ...prev, is_verified: true, eligibility_status: 'eligible' } : null));
      }
      setActionFeedback('JD approved & verified (local fallback)');
      setTimeout(() => setActionFeedback(null), 2500);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jds
      .filter((jd) => {
        if (filter === 'all') return true;
        const cat = classifyJDCategory(jd);
        return cat === filter;
      })
      .filter((jd) => {
        if (!q) return true;
        const uploader = getUploaderName(jd).toLowerCase();
        return (
          jd.title.toLowerCase().includes(q) ||
          (jd.company_name || '').toLowerCase().includes(q) ||
          (jd.hr_name || '').toLowerCase().includes(q) ||
          uploader.includes(q) ||
          (jd.jd_id || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }, [jds, companies, users, filter, search]);

  const itCount = useMemo(() => jds.filter((j) => classifyJDCategory(j) === 'it').length, [jds]);
  const nonItCount = jds.length - itCount;
  const totalCount = jds.length;

  const copyJd = async (jd: JD) => {
    const text = `ROLE: ${jd.title}\nCATEGORY: ${classifyJDCategory(jd) === 'it' ? 'IT' : 'Non-IT'}\nCOMPANY: ${jd.company_name || companyOf(jd)?.name || '—'}\nUPLOADED BY: ${getUploaderName(jd)}\n\n${jd.raw_text || ''}`;
    const ok = await pipelineService.copyText(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const sendToPipeline = (jd: JD) => {
    const company = companyOf(jd);
    const category = classifyJDCategory(jd);
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
      role_category: category === 'it' ? 'tech' : 'non_tech',
      origin: 'jd_sourcing',
      created_by: currentUser?.id,
      created_by_name: currentUser?.name,
      notes: `Sourced from Unified JD Bank (${jd.jd_id || jd.id}) [${category === 'it' ? 'IT' : 'Non-IT'}]`,
    });
    setSelectedJd(null);
    return lead;
  };

  if (loading) {
    return (
      <div className="bg-gray-950/70 border border-gray-800 rounded-3xl p-10 text-center text-xs text-gray-400">
        Loading JD Bank…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Action Toast Feedback */}
      {actionFeedback && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Header with Search and Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Briefcase className="h-6 w-6 text-amber-400" />
            <span>JD Bank</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Complete database of IT and Non-IT Job Descriptions with employer oversight, HR contacts, and CRA upload attribution.
          </p>
        </div>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search role, company, uploader, HR…"
            className="pl-9 pr-3 py-2.5 text-xs rounded-xl bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:border-amber-500 focus:outline-none w-72"
          />
        </div>
      </div>

      {/* Filter Bar: (All / IT / Non-IT) - defaulted to All */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-900/80 border border-gray-800 p-2 rounded-2xl">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer ${
              filter === 'all'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            <Layers className="h-3.5 w-3.5" /> All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('it')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer ${
              filter === 'it'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" /> IT ({itCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('non_it')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer ${
              filter === 'non_it'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            <Layers className="h-3.5 w-3.5" /> Non-IT ({nonItCount})
          </button>
        </div>

        <div className="text-[11px] text-gray-400 flex items-center gap-2 pr-2">
          <span>Showing <strong className="text-white">{filtered.length}</strong> of {totalCount} records</span>
        </div>
      </div>

      {/* JD Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.length === 0 && (
          <div className="md:col-span-2 xl:col-span-3 bg-gray-950/70 border border-gray-800 rounded-3xl p-10 text-center">
            <FileText className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-400">
              No {filter === 'all' ? '' : filter === 'it' ? 'IT' : 'Non-IT'} Job Descriptions found matching your search.
            </p>
          </div>
        )}

        {filtered.map((jd) => {
          const comp = companyOf(jd);
          const category = classifyJDCategory(jd);
          const isIT = category === 'it';
          const uploaderName = getUploaderName(jd);
          const approved = isJdApproved(jd);

          return (
            <div
              key={jd.id}
              onClick={() => setSelectedJd(jd)}
              className="text-left bg-gray-950/70 hover:bg-gray-900/80 border border-gray-800 hover:border-amber-700/60 rounded-3xl p-4 transition group cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header: Title + Visible IT / Non-IT Tag */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-white truncate group-hover:text-amber-200">
                      {jd.title}
                    </p>
                    <p className="text-[11px] text-gray-300 font-medium truncate flex items-center gap-1.5 mt-0.5">
                      <Building2 className="h-3.5 w-3.5 text-amber-400/90 shrink-0" />
                      <span>{jd.company_name || comp?.name || 'Enterprise'}</span>
                    </p>
                  </div>
                  {/* Visible IT / Non-IT Tag */}
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border shrink-0 tracking-wider ${
                      isIT
                        ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-950/40'
                        : 'bg-purple-950/80 border-purple-500/50 text-purple-300 shadow-sm shadow-purple-950/40'
                    }`}
                  >
                    {isIT ? 'IT' : 'Non-IT'}
                  </span>
                </div>

                {/* Uploading Employee Name */}
                <div className="mt-2.5 pt-2 border-t border-gray-800/60 flex items-center gap-1.5 text-[11px] text-gray-400">
                  <User className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">
                    Uploaded by: <strong className="text-gray-200 font-semibold">{uploaderName}</strong>
                  </span>
                </div>

                {/* HR & Date Info */}
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400 flex-wrap">
                  {jd.hr_name && (
                    <span className="flex items-center gap-1 truncate max-w-[140px]">
                      <User className="h-3 w-3 text-gray-500 shrink-0" />
                      {jd.hr_name}
                    </span>
                  )}
                  {jd.hr_email && (
                    <span className="flex items-center gap-1 truncate max-w-[150px]">
                      <Mail className="h-3 w-3 text-gray-500 shrink-0" />
                      {jd.hr_email}
                    </span>
                  )}
                  {jd.date_received && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {jd.date_received}
                    </span>
                  )}
                </div>
              </div>

              {/* Footer: Admin Approval Badge + ID */}
              <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                      approved
                        ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
                        : 'bg-amber-950/80 border-amber-700/60 text-amber-300'
                    }`}
                  >
                    {approved ? (
                      <>
                        <ShieldCheck className="h-3 w-3" />
                        <span>Approved</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        <span>Pending Review</span>
                      </>
                    )}
                  </span>

                  {/* 1-click Approve button for admins if pending */}
                  {!approved && isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => handleApproveJD(e, jd.id)}
                      className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider transition cursor-pointer"
                      title="Admin 1-Click Approve"
                    >
                      Approve
                    </button>
                  )}
                </div>

                {jd.jd_id && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-800/80 border border-gray-700 text-gray-400">
                    {jd.jd_id}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full JD Detail Modal */}
      {selectedJd && (
        <JDDetailModal
          jd={selectedJd}
          company={companyOf(selectedJd)}
          category={classifyJDCategory(selectedJd)}
          uploaderName={getUploaderName(selectedJd)}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onApprove={(jdId) => handleApproveJD({ stopPropagation: () => {} } as any, jdId)}
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
  category: JDCategory;
  uploaderName: string;
  currentUser?: CRA | null;
  isAdmin: boolean;
  onApprove: (jdId: string) => void;
  onClose: () => void;
  onSendToPipeline: (jd: JD) => PipelineLead;
  onCopy: (jd: JD) => void;
  copied: boolean;
}> = ({
  jd,
  company,
  category,
  uploaderName,
  currentUser,
  isAdmin,
  onApprove,
  onClose,
  onSendToPipeline,
  onCopy,
  copied,
}) => {
  const [sentToast, setSentToast] = useState<string | null>(null);
  const [channel, setChannel] = useState<PipelineChannel>('mail');
  const [draft, setDraft] = useState('');
  const [createdLead, setCreatedLead] = useState<PipelineLead | null>(null);

  const isApproved = jd.is_verified || jd.eligibility_status === 'eligible';

  useEffect(() => {
    if (createdLead) {
      setDraft(pipelineService.draftFor(createdLead, channel, currentUser?.name));
    }
  }, [createdLead, channel, currentUser]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-950 border border-amber-800/50 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-800/80 flex items-start justify-between gap-3 bg-gray-900/60">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-black text-white truncate">{jd.title}</h3>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider ${
                  category === 'it'
                    ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                    : 'bg-purple-950/80 border-purple-500/50 text-purple-300'
                }`}
              >
                {category === 'it' ? 'IT' : 'Non-IT'}
              </span>
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                  isApproved
                    ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
                    : 'bg-amber-950/80 border-amber-700/60 text-amber-300'
                }`}
              >
                {isApproved ? 'Approved' : 'Pending Review'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>{jd.company_name || company?.name || '—'}</span>
              <span>•</span>
              <span>Uploaded by: <strong className="text-gray-200">{uploaderName}</strong></span>
              <span>•</span>
              <span className="font-mono text-gray-500">{jd.jd_id || jd.id}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 shrink-0 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Admin Approval Callout */}
          {isAdmin && !isApproved && (
            <div className="bg-amber-950/40 border border-amber-600/50 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div className="text-xs text-amber-200">
                <p className="font-bold">Admin Approval Required</p>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  This JD is currently awaiting review. Approve it to count towards team salary targets and CRA incentive yields.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onApprove(jd.id)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 transition cursor-pointer"
              >
                ✓ Approve JD
              </button>
            </div>
          )}

          {/* Full JD Description */}
          <section className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-amber-400" /> Full Job Description
            </p>
            <pre className="text-[11px] text-gray-200 whitespace-pre-wrap font-sans leading-relaxed max-h-72 overflow-y-auto">
              {jd.raw_text || 'No description text captured.'}
            </pre>
          </section>

          {/* HR Contact details */}
          <section className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-amber-400" /> HR Contact Details
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <p className="text-gray-200">
                <span className="text-gray-400 font-medium">Name:</span> {jd.hr_name || company?.contacts?.[0]?.name || '—'}
              </p>
              <p className="text-gray-200">
                <span className="text-gray-400 font-medium">Designation:</span> {jd.hr_designation || company?.contacts?.[0]?.title || '—'}
              </p>
              <p className="text-gray-200 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-amber-400" /> {jd.hr_email || company?.contacts?.[0]?.email || '—'}
              </p>
              <p className="text-gray-200 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-amber-400" /> {(jd.hr_contact as any)?.phone || (jd.hr_contact as any)?.hr_phone || company?.contacts?.[0]?.phone || '—'}
              </p>
              <p className="text-gray-200 flex items-center gap-1.5 sm:col-span-2">
                <Linkedin className="h-3.5 w-3.5 text-amber-400" />
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
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-amber-400" /> Target Company
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <p className="text-gray-200">
                <span className="text-gray-400 font-medium">Name:</span> {company?.name || jd.company_name || '—'}
              </p>
              <p className="text-gray-200 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-amber-400" />
                {company?.website ? (
                  <a href={company.website} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
                    {company.website}
                  </a>
                ) : (
                  '—'
                )}
              </p>
              <p className="text-gray-200 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-amber-400" /> {company?.location || '—'}
              </p>
              <p className="text-gray-200 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-amber-400" /> {company?.employee_count || '—'}
              </p>
              <p className="text-gray-200 sm:col-span-2">
                <span className="text-gray-400 font-medium">Industry:</span> {company?.industry || '—'}
              </p>
            </div>
          </section>

          {/* Sourcing to Pipeline */}
          <section className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5 text-amber-400" /> Source into Outreach Pipeline
            </p>
            {!createdLead ? (
              <button
                type="button"
                onClick={() => setCreatedLead(onSendToPipeline(jd))}
                className="text-[11px] font-bold px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white cursor-pointer transition"
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
                      type="button"
                      onClick={() => setChannel(c)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
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
                  rows={5}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-gray-950 border border-gray-700 text-gray-100 focus:border-purple-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await pipelineService.copyText(draft);
                      setSentToast('Outreach draft copied — paste in your client');
                      setTimeout(() => setSentToast(null), 2500);
                    }}
                    className="text-[11px] font-bold px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-gray-200 hover:bg-gray-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy draft
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const { outreach } = pipelineService.addDraft(createdLead.id, channel, draft);
                      if (outreach) pipelineService.markSent(createdLead.id, outreach.id, {});
                      setSentToast('Marked as sent — upload proof of response next');
                      setTimeout(() => setSentToast(null), 2500);
                    }}
                    className="text-[11px] font-bold px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" /> Mark as sent
                  </button>
                </div>
              </>
            )}
          </section>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-800/80 flex flex-wrap gap-2 justify-end bg-gray-900/60">
          <button
            type="button"
            onClick={() => onCopy(jd)}
            className="text-[11px] font-bold px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-700 text-gray-200 hover:bg-gray-800 flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} Copy JD
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-bold px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white cursor-pointer"
          >
            Close
          </button>
        </div>

        {sentToast && (
          <div className="absolute bottom-20 right-6 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl">
            {sentToast}
          </div>
        )}
      </div>
    </div>
  );
};
