import { formatIndianPhone } from '../utils/formatters';
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Company, HRContact, JD, OutreachOutcome, OutcomeStatus } from '../types';
import {
  Building2,
  Mail,
  Phone,
  Linkedin,
  Search,
  Award,
  CheckCircle,
  X,
  FileText,
  Check,
  Plus,
  Users,
  ExternalLink,
  UserCheck,
  Copy,
  Sparkles,
} from 'lucide-react';
import { CompanyDetailsModal } from '../components/CompanyDetailsModal';
import { DocumentIntakeModal } from '../components/DocumentIntakeModal';

interface OutcomeModalState {
  contact: HRContact;
  jdReceived: boolean;
  jdId: string;
  isEligible: boolean;
  notes: string;
  status: OutcomeStatus;
}

interface CRMListPageProps {
  onAddRole?: (companyName: string) => void;
}

export const CRMListPage: React.FC<CRMListPageProps> = ({ onAddRole }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<HRContact[]>([]);
  const [jds, setJds] = useState<JD[]>([]);
  const [outcomes, setOutcomes] = useState<Record<string, OutreachOutcome>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'contacts' | 'companies'>('contacts');
  const [outcomeModal, setOutcomeModal] = useState<OutcomeModalState | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Modals
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isCompanyDetailsOpen, setIsCompanyDetailsOpen] = useState(false);
  const [isDocumentIntakeOpen, setIsDocumentIntakeOpen] = useState(false);

  const loadData = () => {
    Promise.all([api.getCompanies(), api.getContacts(), api.getJDs()])
      .then(([compData, contactData, jdData]) => {
        setCompanies(compData);
        setContacts(contactData);
        setJds(jdData);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCompanyDetails = (comp: Company) => {
    // Attach current contacts and JDs
    const compContacts = contacts.filter((c) => c.company_id === comp.id);
    const compJds = jds.filter((j) => j.company_id === comp.id);
    setSelectedCompany({
      ...comp,
      contacts: compContacts,
      jds: compJds,
    });
    setIsCompanyDetailsOpen(true);
  };

  const handleCopyPhone = (phone: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleOpenOutcomeModal = async (contact: HRContact) => {
    try {
      const current = outcomes[contact.id] || await api.getOutreachOutcome(contact.id);
      setOutcomeModal({
        contact,
        jdReceived: current.jd_received || false,
        jdId: current.jd_id || '',
        isEligible: current.is_eligible ?? true,
        notes: current.eligibility_notes || '',
        status: current.outcome_status || 'pending',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to fetch contact outcome' });
    }
  };

  const handleSaveOutcome = async () => {
    if (!outcomeModal) return;
    try {
      const updated = await api.updateOutreachOutcome(outcomeModal.contact.id, {
        jd_received: outcomeModal.jdReceived,
        jd_id: outcomeModal.jdId || undefined,
        is_eligible: outcomeModal.isEligible,
        eligibility_notes: outcomeModal.notes,
        outcome_status: outcomeModal.status,
      });
      setOutcomes({ ...outcomes, [outcomeModal.contact.id]: updated });
      setFeedback({ type: 'success', text: `Saved outcome for ${outcomeModal.contact.name}` });
      setOutcomeModal(null);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save outcome' });
    }
  };

  const handleDataStoredFromDoc = (newComp: Company, newContacts: HRContact[]) => {
    setCompanies((prev) => {
      const exists = prev.some((c) => c.id === newComp.id);
      return exists ? prev.map((c) => (c.id === newComp.id ? newComp : c)) : [newComp, ...prev];
    });
    setContacts((prev) => [...newContacts, ...prev]);
    setFeedback({
      type: 'success',
      text: `Stored "${newComp.name}" with ${newContacts.length} HR contact(s). Entered by: ${newComp.entered_by_name}`,
    });
  };

  const handleUpdateCompany = (updated: Company) => {
    setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedCompany(updated);
  };

  const handleContactAdded = (newContact: HRContact) => {
    setContacts((prev) => [newContact, ...prev]);
    if (selectedCompany && selectedCompany.id === newContact.company_id) {
      setSelectedCompany({
        ...selectedCompany,
        contacts: [newContact, ...(selectedCompany.contacts || [])],
      });
    }
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.title && c.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.entered_by_name && c.entered_by_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCompanies = companies.filter(
    (comp) =>
      comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comp.industry && comp.industry.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (comp.entered_by_name && comp.entered_by_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (comp.employee_count && comp.employee_count.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (st: OutcomeStatus) => {
    switch (st) {
      case 'eligible_active':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md text-xs font-bold">Eligible & Active</span>;
      case 'jd_received':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-md text-xs font-bold">JD Received</span>;
      case 'community_joined':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-md text-xs font-bold">Community Joined</span>;
      case 'not_eligible':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md text-xs font-bold">Not Eligible</span>;
      case 'rejected':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-md text-xs font-bold">Rejected</span>;
      default:
        return <span className="bg-gray-700 text-gray-400 px-2 py-0.5 rounded-md text-xs font-semibold">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CRA CRM Directory</h1>
          <p className="text-gray-400 text-sm">
            Audited employer network, company employee counts, LinkedIn profiles, and verified HR numbers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* PDF & Document Intake Button */}
          <button
            onClick={() => setIsDocumentIntakeOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-purple-900/30 shrink-0 cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>Import from PDF / Document</span>
            <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] uppercase font-bold">AI</span>
          </button>

          <div className="relative w-64">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies, HRs, numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === 'contacts' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              HR Contacts ({contacts.length})
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === 'companies' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Companies ({companies.length})
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between gap-2 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* HR Contacts View */}
      {activeTab === 'contacts' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-sm">
          {/* Mobile Swipe Hint */}
          <div className="md:hidden px-3.5 py-2.5 bg-gray-900/90 border-b border-gray-700 flex items-center justify-between text-xs text-indigo-300">
            <span className="flex items-center gap-1.5 font-medium">
              <span>👉 Swipe sideways to view all contact columns & actions</span>
            </span>
            <span className="text-[10px] text-indigo-300 font-semibold px-2 py-0.5 rounded bg-indigo-900/60 border border-indigo-700/50">
              Scrollable
            </span>
          </div>
          <div className="overflow-x-auto w-full touch-pan-x scrollbar-thin scrollbar-thumb-gray-600">
            <table className="w-full min-w-[760px] text-left text-sm text-gray-300">
              <thead className="bg-gray-900/60 text-xs uppercase text-gray-400 font-semibold border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4">Name & Title</th>
                  <th className="px-6 py-4">Target Company</th>
                  <th className="px-6 py-4">HR Numbers & Details</th>
                  <th className="px-6 py-4">Entered By</th>
                  <th className="px-6 py-4">Outcome Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No HR Contacts found in CRM. Use "Import from PDF / Document" to add them!
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((c) => {
                    const out = outcomes[c.id];
                    const comp = companies.find((co) => co.id === c.company_id) || c.company;
                    return (
                      <tr key={c.id} className="hover:bg-gray-700/30 transition">
                        <td className="px-6 py-4">
                          <p className="font-bold text-white">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.title || 'HR Lead'}</p>
                          {c.linkedin_url && (
                            <a
                              href={c.linkedin_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] inline-flex items-center gap-1 text-sky-400 hover:underline mt-1"
                            >
                              <Linkedin className="h-3 w-3" />
                              <span>HR LinkedIn</span>
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {comp ? (
                            <button
                              onClick={() => handleOpenCompanyDetails(comp)}
                              className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline text-left flex items-center gap-1.5 group"
                              title="Click to view full company details and people working"
                            >
                              <Building2 className="h-4 w-4 text-gray-500 group-hover:text-indigo-400" />
                              <span>{comp.name}</span>
                            </button>
                          ) : (
                            <span className="text-gray-400 italic">Target Account</span>
                          )}
                          {comp?.employee_count && (
                            <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <Users className="h-3 w-3 text-blue-400" />
                              <span>{comp.employee_count}</span>
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 space-y-1">
                          {c.phone ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5 text-emerald-400" />
                                {formatIndianPhone(c.phone)}
                              </span>
                              <button
                                onClick={(e) => handleCopyPhone(c.phone!, e)}
                                className="p-1 hover:bg-gray-700 text-gray-400 hover:text-white rounded text-[10px] transition"
                                title="Copy HR phone number"
                              >
                                {copiedPhone === c.phone ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 italic">No phone listed</span>
                          )}
                          {c.email && (
                            <p className="text-xs flex items-center gap-1 text-gray-300">
                              <Mail className="h-3 w-3 text-gray-400" /> {c.email}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            <UserCheck className="h-3 w-3" />
                            <span>{c.entered_by_name || (c.creator ? c.creator.name : 'Aravind Reddy')}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(out ? out.outcome_status : 'pending')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenOutcomeModal(c)}
                            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-xs font-medium transition inline-flex items-center gap-1"
                          >
                            <Award className="h-3.5 w-3.5" />
                            <span>Evaluate</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Companies Grid View */}
      {activeTab === 'companies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((comp) => {
            const compContacts = contacts.filter((c) => c.company_id === comp.id);
            return (
              <div
                key={comp.id}
                onClick={() => handleOpenCompanyDetails(comp)}
                className="bg-gray-800/90 border border-gray-700/80 hover:border-indigo-500/70 hover:bg-gray-800 rounded-xl p-5 transition shadow-sm flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition">
                        {comp.name}
                      </h3>
                      <p className="text-xs text-indigo-400 capitalize">{comp.industry || 'Information Technology'}</p>
                    </div>
                    <div className="h-9 w-9 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center text-gray-400 group-hover:text-indigo-400 group-hover:border-indigo-500/40 transition">
                      <Building2 className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Highlights Grid: People Working & LinkedIn */}
                  <div className="mt-4 space-y-2">
                    {/* People Working */}
                    <div className="flex items-center justify-between text-xs bg-gray-900/60 p-2 rounded-lg border border-gray-800">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-blue-400" />
                        <span>People Working:</span>
                      </span>
                      <span className="font-bold text-white">
                        {comp.employee_count || '100-500 employees'}
                      </span>
                    </div>

                    {/* LinkedIn Page */}
                    <div className="flex items-center justify-between text-xs bg-gray-900/60 p-2 rounded-lg border border-gray-800">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Linkedin className="h-3.5 w-3.5 text-sky-400" />
                        <span>LinkedIn Page:</span>
                      </span>
                      <a
                        href={comp.linkedin_url || `https://www.linkedin.com/company/${comp.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 truncate max-w-[140px]"
                      >
                        <span>Open Page</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>

                    {/* HR Contact Count */}
                    <div className="flex items-center justify-between text-xs bg-gray-900/60 p-2 rounded-lg border border-gray-800">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-emerald-400" />
                        <span>HR Numbers:</span>
                      </span>
                      <span className="font-bold text-emerald-300">
                        {compContacts.length} Contacts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-700/50 text-xs text-gray-400 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <UserCheck className="h-3 w-3 text-emerald-400" />
                    <span>
                      Entered by: <strong className="text-gray-200">{comp.entered_by_name || (comp.creator ? comp.creator.name : 'Aravind Reddy')}</strong>
                    </span>
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenCompanyDetails(comp)}
                      className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-xs font-semibold transition"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => onAddRole?.(comp.name)}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg text-xs font-medium transition flex items-center gap-1"
                      title="Add Job Description"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Role</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Outcome Evaluation Modal */}
      {outcomeModal && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setOutcomeModal(null)}
        >
          <div
            className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-gray-700/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="h-5 w-5 text-indigo-400" />
                  Evaluate Outcome & Qualification
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Contact: <span className="text-white font-medium">{outcomeModal.contact.name}</span> ({outcomeModal.contact.company?.name})
                </p>
              </div>
              <button
                onClick={() => setOutcomeModal(null)}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-700 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={outcomeModal.jdReceived}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setOutcomeModal({
                      ...outcomeModal,
                      jdReceived: checked,
                      status: checked ? 'jd_received' : outcomeModal.status,
                    });
                  }}
                  className="h-4 w-4 rounded bg-gray-900 border-gray-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-gray-200">
                  Did this HR Contact send back a Job Description (JD)?
                </span>
              </label>

              {outcomeModal.jdReceived && (
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Link Received JD (Optional)
                  </label>
                  <select
                    value={outcomeModal.jdId}
                    onChange={(e) => setOutcomeModal({ ...outcomeModal, jdId: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">Select JD or leave unlinked...</option>
                    {jds
                      .filter((j) => j.company_id === outcomeModal.contact.company_id)
                      .map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title} ({j.is_verified ? 'Verified' : 'Unverified'})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <label className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-700 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={outcomeModal.isEligible}
                  onChange={(e) => setOutcomeModal({ ...outcomeModal, isEligible: e.target.checked })}
                  className="h-4 w-4 rounded bg-gray-900 border-gray-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-gray-200">
                  Is this opportunity / candidate pool eligible for our candidates?
                </span>
              </label>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Outcome Qualification Status
                </label>
                <select
                  value={outcomeModal.status}
                  onChange={(e) =>
                    setOutcomeModal({ ...outcomeModal, status: e.target.value as OutcomeStatus })
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="pending">Pending</option>
                  <option value="eligible_active">Eligible & Active</option>
                  <option value="jd_received">JD Received</option>
                  <option value="community_joined">Community Joined</option>
                  <option value="not_eligible">Not Eligible</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Eligibility / Feedback Notes
                </label>
                <textarea
                  rows={3}
                  value={outcomeModal.notes}
                  onChange={(e) => setOutcomeModal({ ...outcomeModal, notes: e.target.value })}
                  placeholder="Record HR feedback, eligibility criteria, student batch details..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOutcomeModal(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveOutcome}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition shadow-md flex items-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  <span>Save Outcome Evaluation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Details Modal */}
      <CompanyDetailsModal
        company={selectedCompany}
        isOpen={isCompanyDetailsOpen}
        onClose={() => {
          setIsCompanyDetailsOpen(false);
          setSelectedCompany(null);
        }}
        onUpdateCompany={handleUpdateCompany}
        onAddRole={onAddRole}
        onContactAdded={handleContactAdded}
      />

      {/* Document & PDF Intake Modal */}
      <DocumentIntakeModal
        isOpen={isDocumentIntakeOpen}
        onClose={() => setIsDocumentIntakeOpen(false)}
        onDataStored={handleDataStoredFromDoc}
        onViewCompany={(comp) => {
          handleOpenCompanyDetails(comp);
        }}
      />
    </div>
  );
};
