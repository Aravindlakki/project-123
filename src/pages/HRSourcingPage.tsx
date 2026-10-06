import React, { useState, useEffect, useMemo } from 'react';
import {
  PipelineLead,
  PipelineContactSnapshot,
} from '../types/pipeline';
import { pipelineService } from '../services/pipelineService';
import { CRA } from '../types';
import { HowToFindHRModal } from '../components/HowToFindHRModal';
import {
  Search,
  Users,
  Building2,
  Mail,
  Phone,
  Linkedin,
  Plus,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Send,
  FileText,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Globe,
  MapPin,
  RefreshCw,
  X,
  AlertCircle,
} from 'lucide-react';

interface HRSourcingPageProps {
  onNavigateToJDIntake?: () => void;
  currentUser?: CRA | null;
}

export const HRSourcingPage: React.FC<HRSourcingPageProps> = ({
  onNavigateToJDIntake,
  currentUser,
}) => {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sourcing' | 'ready' | 'all_pipeline'>('sourcing');
  const [selectedLeadForFindHR, setSelectedLeadForFindHR] = useState<PipelineLead | null>(null);
  const [editingLead, setEditingLead] = useState<PipelineLead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Form state for adding/editing HR contact
  const [editForm, setEditForm] = useState<Partial<PipelineContactSnapshot> & { role_title?: string }>({});

  // Form state for creating a new lead
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newHrName, setNewHrName] = useState('');
  const [newHrDesignation, setNewHrDesignation] = useState('');
  const [newHrEmail, setNewHrEmail] = useState('');
  const [newHrPhone, setNewHrPhone] = useState('');
  const [newHrLinkedin, setNewHrLinkedin] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newWebsite, setNewWebsite] = useState('');

  const refreshLeads = () => {
    setLeads(pipelineService.list());
  };

  useEffect(() => {
    refreshLeads();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleCopy = async (key: string, text: string) => {
    const ok = await pipelineService.copyText(text);
    if (ok) {
      setCopiedKey(key);
      showToast('Copied to clipboard!');
      setTimeout(() => setCopiedKey(null), 1800);
    }
  };

  // Open edit modal for an existing lead
  const handleOpenEdit = (lead: PipelineLead) => {
    setEditingLead(lead);
    setEditForm({
      hr_name: lead.contact.hr_name || '',
      hr_designation: lead.contact.hr_designation || '',
      hr_email: lead.contact.hr_email || '',
      hr_phone: lead.contact.hr_phone || '',
      hr_linkedin: lead.contact.hr_linkedin || '',
      role_title: lead.role_title || '',
    });
  };

  const handleSaveEdit = () => {
    if (!editingLead) return;
    const { role_title, ...contactUpdates } = editForm;

    // Update HR Contact and promotion stage
    pipelineService.saveHrContact(editingLead.id, contactUpdates);
    if (role_title !== undefined) {
      pipelineService.update(editingLead.id, { role_title });
    }

    showToast(`Updated HR contact for ${editingLead.company.company_name}`);
    setEditingLead(null);
    refreshLeads();
  };

  // Handoff lead to JD intake
  const handleHandoffToJD = (lead: PipelineLead) => {
    try {
      localStorage.setItem(
        'placemein:hr-sourcing-prefill',
        JSON.stringify({
          company: lead.company.company_name,
          title: lead.role_title || '',
        })
      );
    } catch (_) {}

    if (onNavigateToJDIntake) {
      onNavigateToJDIntake();
    } else {
      showToast(`Handoff prepared for ${lead.company.company_name}`);
    }
  };

  // Promote to Outreach stage directly
  const handlePromoteToOutreach = (lead: PipelineLead) => {
    pipelineService.update(lead.id, {
      stage: 'outreach',
      status: 'contacted',
    });
    showToast(`${lead.company.company_name} moved to Outreach`);
    refreshLeads();
  };

  // Create new lead for HR Sourcing
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    pipelineService.create({
      company_name: newCompanyName.trim(),
      role_title: newRoleTitle.trim() || undefined,
      hr_name: newHrName.trim() || undefined,
      hr_designation: newHrDesignation.trim() || undefined,
      hr_email: newHrEmail.trim() || undefined,
      hr_phone: newHrPhone.trim() || undefined,
      hr_linkedin: newHrLinkedin.trim() || undefined,
      location: newLocation.trim() || undefined,
      website: newWebsite.trim() || undefined,
      created_by: currentUser?.id,
      created_by_name: currentUser?.name || 'Recruiter',
      origin: 'manual',
    });

    showToast(`Added ${newCompanyName} to HR Sourcing`);
    setShowAddModal(false);
    setNewCompanyName('');
    setNewRoleTitle('');
    setNewHrName('');
    setNewHrDesignation('');
    setNewHrEmail('');
    setNewHrPhone('');
    setNewHrLinkedin('');
    setNewLocation('');
    setNewWebsite('');
    refreshLeads();
  };

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Status filter
      if (statusFilter === 'sourcing') {
        // Needs HR details (missing email, phone, or designation)
        const hasFullContact = Boolean(lead.contact.hr_email || lead.contact.hr_phone);
        if (lead.stage !== 'hr_sourcing' && hasFullContact) return false;
      } else if (statusFilter === 'ready') {
        const hasFullContact = Boolean(lead.contact.hr_email || lead.contact.hr_phone || lead.contact.hr_linkedin);
        if (!hasFullContact) return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesComp = lead.company.company_name.toLowerCase().includes(q);
        const matchesHr = (lead.contact.hr_name || '').toLowerCase().includes(q);
        const matchesRole = (lead.role_title || '').toLowerCase().includes(q);
        const matchesDesig = (lead.contact.hr_designation || '').toLowerCase().includes(q);
        if (!matchesComp && !matchesHr && !matchesRole && !matchesDesig) return false;
      }

      return true;
    });
  }, [leads, statusFilter, search]);

  // Compute stats
  const stats = useMemo(() => {
    const total = leads.length;
    const sourcingCount = leads.filter(
      (l) => l.stage === 'hr_sourcing' || (!l.contact.hr_email && !l.contact.hr_phone)
    ).length;
    const readyCount = leads.filter(
      (l) => Boolean(l.contact.hr_email || l.contact.hr_phone || l.contact.hr_linkedin)
    ).length;
    const phoneCount = leads.filter((l) => Boolean(l.contact.hr_phone)).length;
    return { total, sourcingCount, readyCount, phoneCount };
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-sm flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 text-xs font-medium mb-2 backdrop-blur-sm">
            <Search className="h-3.5 w-3.5" />
            <span>Recruitment Pipeline Stage 2</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">HR Sourcing Workstation</h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Find and verify HR, Talent Acquisition, and Hiring Manager contact information before launching outreach drafts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Target Company</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active In Sourcing</span>
            <Search className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{stats.sourcingCount}</div>
          <p className="text-xs text-slate-500 mt-0.5">Need HR / Contact info</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">HR Contact Found</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{stats.readyCount}</div>
          <p className="text-xs text-slate-500 mt-0.5">Ready for Outreach</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Direct Phones</span>
            <Phone className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{stats.phoneCount}</div>
          <p className="text-xs text-slate-500 mt-0.5">WhatsApp / Call verified</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Pipeline Leads</span>
            <Users className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</div>
          <p className="text-xs text-slate-500 mt-0.5">All tracked companies</p>
        </div>
      </div>

      {/* Controls & Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, HR name, designation, or role..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('sourcing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'sourcing'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Needs HR Details ({stats.sourcingCount})
          </button>
          <button
            onClick={() => setStatusFilter('ready')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'ready'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            HR Info Ready ({stats.readyCount})
          </button>
          <button
            onClick={() => setStatusFilter('all_pipeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'all_pipeline'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Companies ({stats.total})
          </button>
          <button
            onClick={refreshLeads}
            title="Refresh Leads"
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Sourcing Leads List */}
      <div className="space-y-4">
        {filteredLeads.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No leads found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {search
                ? 'No matching companies or HR profiles found for your search query.'
                : 'No companies are currently in this filter. Add a new company or upload leads to begin sourcing.'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Target Company</span>
            </button>
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const hasPhone = Boolean(lead.contact.hr_phone);
            const hasEmail = Boolean(lead.contact.hr_email);
            const hasLinkedin = Boolean(lead.contact.hr_linkedin);
            const isReadyForOutreach = hasPhone || hasEmail || hasLinkedin;

            const googleXRayQuery = `site:linkedin.com/in ("${lead.company.company_name}" AND ("Talent Acquisition" OR "Technical Recruiter" OR "HR Manager" OR "Head of HR"))`;
            const googlePhoneQuery = `"${lead.company.company_name}" ("HR" OR "Recruiter" OR "Talent Acquisition") (contact OR phone OR mobile OR "+91")`;

            return (
              <div
                key={lead.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Company & Role Details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-base">
                        {lead.company.company_name}
                      </span>
                      {lead.lead_code && (
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {lead.lead_code}
                        </span>
                      )}
                      {isReadyForOutreach ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />
                          Ready for Outreach
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Clock className="h-3 w-3" />
                          Sourcing Needed
                        </span>
                      )}
                      {lead.role_category && (
                        <span className="text-[11px] font-medium uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          {lead.role_category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      {lead.role_title && (
                        <span className="text-slate-700 font-medium">Role: {lead.role_title}</span>
                      )}
                      {lead.company.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {lead.company.location}
                        </span>
                      )}
                      {lead.company.website && (
                        <a
                          href={
                            lead.company.website.startsWith('http')
                              ? lead.company.website
                              : `https://${lead.company.website}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          Website
                        </a>
                      )}
                      {lead.created_by_name && (
                        <span>Added by: {lead.created_by_name}</span>
                      )}
                    </div>

                    {/* Middle: HR Contact Badge/Details */}
                    <div className="pt-2 flex items-center gap-3 flex-wrap">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-3 text-xs">
                        <Users className="h-4 w-4 text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-800">
                            {lead.contact.hr_name || (
                              <span className="text-slate-400 italic">HR Name not set</span>
                            )}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            {lead.contact.hr_designation || 'Talent Acquisition / HR'}
                          </div>
                        </div>
                      </div>

                      {/* Phone handle */}
                      {lead.contact.hr_phone ? (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                          <Phone className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="font-mono">{lead.contact.hr_phone}</span>
                          <button
                            onClick={() => handleCopy(`phone-${lead.id}`, lead.contact.hr_phone!)}
                            className="text-emerald-700 hover:text-emerald-900 ml-1"
                            title="Copy phone"
                          >
                            {copiedKey === `phone-${lead.id}` ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-slate-300" />
                          No phone
                        </span>
                      )}

                      {/* Email handle */}
                      {lead.contact.hr_email ? (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1.5 rounded-lg">
                          <Mail className="h-3.5 w-3.5 text-blue-600" />
                          <span>{lead.contact.hr_email}</span>
                          <button
                            onClick={() => handleCopy(`email-${lead.id}`, lead.contact.hr_email!)}
                            className="text-blue-700 hover:text-blue-900 ml-1"
                            title="Copy email"
                          >
                            {copiedKey === `email-${lead.id}` ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-slate-300" />
                          No email
                        </span>
                      )}

                      {/* LinkedIn handle */}
                      {lead.contact.hr_linkedin ? (
                        <a
                          href={
                            lead.contact.hr_linkedin.startsWith('http')
                              ? lead.contact.hr_linkedin
                              : `https://${lead.contact.hr_linkedin}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100"
                        >
                          <Linkedin className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Profile</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>

                  {/* Right: Sourcing Tools & Action Buttons */}
                  <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Find HR Assistant Button */}
                    <button
                      onClick={() => setSelectedLeadForFindHR(lead)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-medium border border-indigo-200 transition-colors"
                      title="Open Boolean search helpers and phone discovery guide"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Find HR Guide</span>
                    </button>

                    {/* Quick X-Ray Google Search Link */}
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(googleXRayQuery)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200"
                      title="Google X-Ray LinkedIn Search"
                    >
                      <Search className="h-3.5 w-3.5 text-slate-500" />
                      <span>X-Ray Search</span>
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </a>

                    {/* Edit Contact Button */}
                    <button
                      onClick={() => handleOpenEdit(lead)}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Edit Info</span>
                    </button>

                    {/* Handoff to JD Intake */}
                    <button
                      onClick={() => handleHandoffToJD(lead)}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
                      title="Prefill this company into JD Intake form"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>JD Intake</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>

                    {/* Promote to Outreach */}
                    {isReadyForOutreach && lead.stage !== 'outreach' && (
                      <button
                        onClick={() => handlePromoteToOutreach(lead)}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
                        title="Move to Outreach Drafts stage"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>To Outreach</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reusable HowToFindHRModal integration */}
      {selectedLeadForFindHR && (
        <HowToFindHRModal
          isOpen={Boolean(selectedLeadForFindHR)}
          onClose={() => setSelectedLeadForFindHR(null)}
          targetCompany={selectedLeadForFindHR.company.company_name}
          targetHRName={selectedLeadForFindHR.contact.hr_name}
          targetTitle={selectedLeadForFindHR.contact.hr_designation || selectedLeadForFindHR.role_title}
          targetWebsite={selectedLeadForFindHR.company.website}
          targetLocation={selectedLeadForFindHR.company.location}
          contactId={selectedLeadForFindHR.id}
          onSavePhone={async (leadId, phone) => {
            pipelineService.saveHrContact(leadId, { hr_phone: phone });
            showToast('Saved phone number to HR contact!');
            refreshLeads();
          }}
        />
      )}

      {/* Edit HR Contact Modal */}
      {editingLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-semibold text-slate-800 text-base">Edit HR Contact Info</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingLead.company.company_name}
                </p>
              </div>
              <button
                onClick={() => setEditingLead(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Role / Opportunity Title
                </label>
                <input
                  type="text"
                  value={editForm.role_title || ''}
                  onChange={(e) => setEditForm({ ...editForm, role_title: e.target.value })}
                  placeholder="e.g. Software Engineer, Talent Acquisition Specialist"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    HR / Recruiter Name
                  </label>
                  <input
                    type="text"
                    value={editForm.hr_name || ''}
                    onChange={(e) => setEditForm({ ...editForm, hr_name: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    HR Designation
                  </label>
                  <input
                    type="text"
                    value={editForm.hr_designation || ''}
                    onChange={(e) => setEditForm({ ...editForm, hr_designation: e.target.value })}
                    placeholder="e.g. Lead Technical Recruiter"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Direct Phone / Mobile
                  </label>
                  <input
                    type="text"
                    value={editForm.hr_phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, hr_phone: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    value={editForm.hr_email || ''}
                    onChange={(e) => setEditForm({ ...editForm, hr_email: e.target.value })}
                    placeholder="e.g. priya@company.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  LinkedIn Profile URL
                </label>
                <input
                  type="text"
                  value={editForm.hr_linkedin || ''}
                  onChange={(e) => setEditForm({ ...editForm, hr_linkedin: e.target.value })}
                  placeholder="e.g. https://linkedin.com/in/priyasharma"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingLead(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 shadow-xs"
              >
                Save Contact Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Target Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateLead}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-semibold text-slate-800 text-base">Add Company to HR Sourcing</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track a company and begin finding HR contacts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="e.g. Razorpay, Swiggy, Cred"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Target Role / Title
                  </label>
                  <input
                    type="text"
                    value={newRoleTitle}
                    onChange={(e) => setNewRoleTitle(e.target.value)}
                    placeholder="e.g. Frontend Developer"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Bengaluru, Hyderabad"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Company Website
                </label>
                <input
                  type="text"
                  value={newWebsite}
                  onChange={(e) => setNewWebsite(e.target.value)}
                  placeholder="e.g. razorpay.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
                  Known HR Contact (Optional)
                </span>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <input
                      type="text"
                      value={newHrName}
                      onChange={(e) => setNewHrName(e.target.value)}
                      placeholder="HR Name"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newHrDesignation}
                      onChange={(e) => setNewHrDesignation(e.target.value)}
                      placeholder="Designation"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      value={newHrPhone}
                      onChange={(e) => setNewHrPhone(e.target.value)}
                      placeholder="Phone / Mobile"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      value={newHrEmail}
                      onChange={(e) => setNewHrEmail(e.target.value)}
                      placeholder="Work Email"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 shadow-xs"
              >
                Add Company
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default HRSourcingPage;
