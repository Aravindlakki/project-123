import React, { useState } from 'react';
import {
  X,
  Search,
  ExternalLink,
  Copy,
  Check,
  Phone,
  Building2,
  User,
  ShieldCheck,
  Sparkles,
  BookOpen,
  PhoneCall,
  Globe,
  Mail,
  HelpCircle,
  AlertCircle,
  Save,
} from 'lucide-react';

interface HowToFindHRModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCompany?: string;
  targetHRName?: string;
  targetTitle?: string;
  targetWebsite?: string;
  targetLocation?: string;
  contactId?: string;
  onSavePhone?: (contactId: string, phone: string) => Promise<void>;
}

export const HowToFindHRModal: React.FC<HowToFindHRModalProps> = ({
  isOpen,
  onClose,
  targetCompany = '',
  targetHRName = '',
  targetTitle = '',
  targetWebsite = '',
  targetLocation = '',
  contactId,
  onSavePhone,
}) => {
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);
  const [manualPhoneInput, setManualPhoneInput] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'methods' | 'boolean' | 'scripts' | 'tools'>('methods');

  if (!isOpen) return null;

  const compNameClean = targetCompany.trim() || 'Target Company';
  const locationClean = targetLocation.trim() || 'India';

  // Boolean search query tailored to current company
  const googleXRayQuery = `site:linkedin.com/in ("${compNameClean}" AND ("Talent Acquisition" OR "Technical Recruiter" OR "HR Manager" OR "Head of HR" OR "Campus Recruiter"))`;
  const googlePhoneQuery = `"${compNameClean}" ("HR" OR "Recruiter" OR "Talent Acquisition") (contact OR phone OR mobile OR email OR "+91")`;
  const companyCareersQuery = `"${compNameClean}" careers office contact phone ${locationClean}`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(id);
    setTimeout(() => setCopiedQuery(null), 2500);
  };

  const handleOpenGoogle = (query: string) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPhoneInput.trim() || !contactId || !onSavePhone) return;
    setIsSavingPhone(true);
    try {
      await onSavePhone(contactId, manualPhoneInput.trim());
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to save manual phone:', err);
    } finally {
      setIsSavingPhone(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-700/60 text-purple-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Recruiter Playbook: How to Find HR Contacts
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                  Manual Verification Only
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Official guide to sourcing verified HR contacts & phone numbers without random guessing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Target Context Banner if opened for specific company */}
        {targetCompany && (
          <div className="px-6 py-3 bg-purple-950/30 border-b border-purple-900/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 text-xs text-purple-200">
              <Building2 className="h-4 w-4 text-purple-400 shrink-0" />
              <span>
                Targeting: <strong className="text-white font-semibold">{targetCompany}</strong>
              </span>
              {targetHRName && (
                <span className="text-gray-400">
                  • Contact: <span className="text-purple-300">{targetHRName}</span>
                  {targetTitle && <span className="text-gray-400"> ({targetTitle})</span>}
                </span>
              )}
            </div>

            {/* Quick 1-Click Search Buttons for this company */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleOpenGoogle(googleXRayQuery)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/50 rounded-lg transition-colors"
                title="Search LinkedIn via Google for HR profiles at this company"
              >
                <Search className="h-3 w-3 text-purple-300" />
                Find HR on LinkedIn
                <ExternalLink className="h-3 w-3 opacity-60" />
              </button>

              <button
                onClick={() => handleOpenGoogle(googlePhoneQuery)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/50 rounded-lg transition-colors"
                title="Search Google for HR contact numbers"
              >
                <Phone className="h-3 w-3 text-emerald-300" />
                Find HR Phone on Google
                <ExternalLink className="h-3 w-3 opacity-60" />
              </button>

              <button
                onClick={() => handleOpenGoogle(companyCareersQuery)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/50 rounded-lg transition-colors"
                title="Search company careers and official office numbers"
              >
                <Globe className="h-3 w-3 text-blue-300" />
                Office Switchboard
                <ExternalLink className="h-3 w-3 opacity-60" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Save Found Phone Form */}
        {contactId && onSavePhone && (
          <div className="px-6 py-3 bg-gray-950/60 border-b border-gray-800 flex items-center justify-between gap-3 shrink-0">
            <form onSubmit={handleSavePhone} className="flex items-center gap-2.5 w-full flex-wrap">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 shrink-0">
                <Phone className="h-3.5 w-3.5 text-emerald-400" />
                Found the manual phone number?
              </label>
              <div className="flex-1 min-w-[200px] flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. +91 98450 12345 (Manual entry only)"
                  value={manualPhoneInput}
                  onChange={(e) => setManualPhoneInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={!manualPhoneInput.trim() || isSavingPhone}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Saved!
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" /> Save to Worksheet
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-800 px-6 bg-gray-900/50 shrink-0">
          <button
            onClick={() => setActiveTab('methods')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'methods'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Top 5 Sourcing Methods
          </button>
          <button
            onClick={() => setActiveTab('boolean')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'boolean'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            Google X-Ray & Boolean Strings
          </button>
          <button
            onClick={() => setActiveTab('scripts')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'scripts'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <PhoneCall className="h-3.5 w-3.5" />
            Direct Call & Switchboard Script
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'tools'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Free Lookup Extensions
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-300 flex-1 leading-relaxed">
          {/* POLICY BANNER */}
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200/90 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-200">Strict Rule: No Random or Fake Phone Numbers</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Random number generators are strictly forbidden. If an HR phone number cannot be discovered immediately, leave the phone column empty. Sourcing records must only contain genuine, manually verified contacts.
              </p>
            </div>
          </div>

          {activeTab === 'methods' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                Step-by-Step HR Contact Discovery Workflow
              </h3>

              {/* Method 1 */}
              <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/50 flex items-center justify-center text-[10px] font-mono">
                      1
                    </span>
                    Method 1: Google X-Ray Search on LinkedIn (Free & Highest Success)
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/50">
                    Recommended
                  </span>
                </div>
                <p className="text-gray-300 text-[11px]">
                  Google indexes LinkedIn profiles that LinkedIn itself hides behind paywalls. You can find exact Talent Acquisition Leads and HR Managers in under 10 seconds.
                </p>
                <div className="bg-gray-900 p-2.5 rounded-lg border border-gray-700 font-mono text-[11px] text-purple-300 flex items-center justify-between gap-2">
                  <span className="truncate">{googleXRayQuery}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopy(googleXRayQuery, 'xray-m1')}
                      className="p-1 hover:text-white text-gray-400 rounded hover:bg-gray-800 transition-colors"
                      title="Copy search query"
                    >
                      {copiedQuery === 'xray-m1' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => handleOpenGoogle(googleXRayQuery)}
                      className="p-1 hover:text-white text-gray-400 rounded hover:bg-gray-800 transition-colors"
                      title="Run on Google"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Method 2 */}
              <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/50 flex items-center justify-center text-[10px] font-mono">
                      2
                    </span>
                    Method 2: Corporate Switchboard & Reception Calling
                  </span>
                  <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800/50">
                    Direct Phone Access
                  </span>
                </div>
                <p className="text-gray-300 text-[11px]">
                  Almost all companies list their office reception or boardline on Google Maps or their Contact Us page. Call and request connection to the HR / Campus Recruitment desk using our professional script.
                </p>
                <div className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-700/60 text-[11px] text-gray-300">
                  <span className="font-semibold text-purple-300">Quick tip:</span> When calling, never ask "Is someone hiring?". Ask: <em className="text-white">"Could you please connect me to [HR Name from LinkedIn] or the Talent Acquisition desk regarding university placement?"</em>
                </div>
              </div>

              {/* Method 3 */}
              <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700/70 space-y-2">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/50 flex items-center justify-center text-[10px] font-mono">
                    3
                  </span>
                  Method 3: Official Careers Page & Job Post Descriptions
                </span>
                <p className="text-gray-300 text-[11px]">
                  Check the company’s official careers portal (e.g. {targetWebsite || 'https://company.com/careers'}). At the footer of job listings or on university relations pages, companies frequently provide direct HR recruiter contact emails and helpline numbers.
                </p>
              </div>

              {/* Method 4 */}
              <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700/70 space-y-2">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/50 flex items-center justify-center text-[10px] font-mono">
                    4
                  </span>
                  Method 4: Free Sourcing Extensions (Apollo, Hunter, ContactOut)
                </span>
                <p className="text-gray-300 text-[11px]">
                  Install verified recruitment plugins (Apollo.io, Hunter.io, SignalHire). While browsing LinkedIn, these plugins reveal verified corporate mobile numbers and email addresses without manual guesswork.
                </p>
              </div>

              {/* Method 5 */}
              <div className="p-4 rounded-xl bg-gray-800/60 border border-gray-700/70 space-y-2">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/50 flex items-center justify-center text-[10px] font-mono">
                    5
                  </span>
                  Method 5: Indian Corporate Filings (Zauba Corp & Tofler)
                </span>
                <p className="text-gray-300 text-[11px]">
                  For registered Indian private limited entities, Zauba Corp, Tofler, and MCA registry list the company’s official registered contact email and authorized corporate contact number.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'boolean' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="h-4 w-4 text-purple-400" />
                Ready-to-Use Google X-Ray & Boolean Query Templates
              </h3>
              <p className="text-xs text-gray-400">
                Copy and paste these exact strings into Google. Replace the company name as needed.
              </p>

              {/* Query 1: Talent Acquisition */}
              <div className="p-3.5 bg-gray-800/70 border border-gray-700 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">1. Find Talent Acquisition Leads & Recruiters</span>
                  <button
                    onClick={() => handleCopy(`site:linkedin.com/in ("${compNameClean}" AND ("Talent Acquisition" OR "Technical Recruiter" OR "Campus Recruiter"))`, 'b1')}
                    className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    {copiedQuery === 'b1' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy Query
                  </button>
                </div>
                <div className="p-2.5 bg-gray-900 rounded font-mono text-[11px] text-gray-300 border border-gray-700/60 break-all select-all">
                  site:linkedin.com/in ("{compNameClean}" AND ("Talent Acquisition" OR "Technical Recruiter" OR "Campus Recruiter"))
                </div>
              </div>

              {/* Query 2: HR Heads & Managers */}
              <div className="p-3.5 bg-gray-800/70 border border-gray-700 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">2. Find HR Managers & People Directors</span>
                  <button
                    onClick={() => handleCopy(`site:linkedin.com/in ("${compNameClean}" AND ("HR Manager" OR "Head of HR" OR "Director Human Resources" OR "People Partner"))`, 'b2')}
                    className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    {copiedQuery === 'b2' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy Query
                  </button>
                </div>
                <div className="p-2.5 bg-gray-900 rounded font-mono text-[11px] text-gray-300 border border-gray-700/60 break-all select-all">
                  site:linkedin.com/in ("{compNameClean}" AND ("HR Manager" OR "Head of HR" OR "Director Human Resources" OR "People Partner"))
                </div>
              </div>

              {/* Query 3: HR Phone & Mobile numbers */}
              <div className="p-3.5 bg-gray-800/70 border border-gray-700 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">3. Search Google for Publicly Shared HR Phone Numbers</span>
                  <button
                    onClick={() => handleCopy(`"${compNameClean}" ("HR" OR "Recruiter") ("+91" OR "phone" OR "mobile") -site:naukri.com`, 'b3')}
                    className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    {copiedQuery === 'b3' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy Query
                  </button>
                </div>
                <div className="p-2.5 bg-gray-900 rounded font-mono text-[11px] text-gray-300 border border-gray-700/60 break-all select-all">
                  "{compNameClean}" ("HR" OR "Recruiter") ("+91" OR "phone" OR "mobile") -site:naukri.com
                </div>
              </div>

              {/* Query 4: Indian Cities */}
              <div className="p-3.5 bg-gray-800/70 border border-gray-700 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">4. Target Specific Location (Bangalore, Hyderabad, Pune)</span>
                  <button
                    onClick={() => handleCopy(`site:linkedin.com/in ("${compNameClean}" AND ("Talent Acquisition" OR "HR") AND ("Bengaluru" OR "Hyderabad" OR "Pune" OR "Noida"))`, 'b4')}
                    className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    {copiedQuery === 'b4' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy Query
                  </button>
                </div>
                <div className="p-2.5 bg-gray-900 rounded font-mono text-[11px] text-gray-300 border border-gray-700/60 break-all select-all">
                  site:linkedin.com/in ("{compNameClean}" AND ("Talent Acquisition" OR "HR") AND ("Bengaluru" OR "Hyderabad" OR "Pune" OR "Noida"))
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scripts' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-emerald-400" />
                Reception & Gatekeeper Calling Script
              </h3>
              <p className="text-xs text-gray-400">
                When calling the corporate landline / switchboard found on Google Maps, use this tested call flow to get transferred to the Talent Acquisition team.
              </p>

              <div className="p-4 rounded-xl bg-gray-800/70 border border-gray-700 space-y-3">
                <div className="font-semibold text-purple-300 flex items-center gap-2">
                  <span>Scenario 1: You know the HR Person’s Name (From LinkedIn)</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                    Highest Success
                  </span>
                </div>
                <div className="bg-gray-900/90 p-3 rounded-lg border border-gray-700 text-gray-200 italic leading-relaxed text-[11px]">
                  "Good morning! This is [Your Name] from our university placement office. Could you please connect my call to <strong className="text-purple-300 not-italic">{targetHRName || '[HR Recruiter Name]'}</strong> in the Talent Acquisition team? It is regarding our upcoming engineering batch placement drive."
                </div>
                <p className="text-[11px] text-gray-400">
                  💡 <em>Receptionists almost always transfer the call directly when you ask for someone by their exact name and title.</em>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-800/70 border border-gray-700 space-y-3">
                <div className="font-semibold text-purple-300">Scenario 2: You don’t have a specific name yet</div>
                <div className="bg-gray-900/90 p-3 rounded-lg border border-gray-700 text-gray-200 italic leading-relaxed text-[11px]">
                  "Hello, good morning! I am reaching out on behalf of our campus placement and corporate recruitment team. Could you please connect me to the Lead Recruiter or HR Manager handling fresher tech hiring?"
                </div>
                <div className="bg-gray-900/90 p-3 rounded-lg border border-gray-700 text-gray-300 text-[11px] space-y-1">
                  <p className="font-semibold text-amber-300">If they ask you to email instead:</p>
                  <p className="italic">
                    "Certainly, I can send an email proposal right away. Could you please share the direct desk phone or email ID of the person handling campus relations so I address it to the right person?"
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-400" />
                Recommended Free Recruitment Extensions
              </h3>
              <p className="text-xs text-gray-400">
                These tools allow recruiters to find phone numbers and email addresses directly on LinkedIn profiles legally and accurately.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-gray-800/70 border border-gray-700 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Apollo.io</span>
                    <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                      50 Free Credits/Mo
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300">
                    Industry standard for finding verified direct mobile numbers and corporate email addresses.
                  </p>
                  <a
                    href="https://www.apollo.io"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:underline pt-1"
                  >
                    Visit Apollo.io <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="p-3.5 bg-gray-800/70 border border-gray-700 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Hunter.io</span>
                    <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                      Email Pattern Finder
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300">
                    Reveals corporate email syntax (e.g. name.surname@company.com) and verifies deliverability.
                  </p>
                  <a
                    href="https://hunter.io"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline pt-1"
                  >
                    Visit Hunter.io <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="p-3.5 bg-gray-800/70 border border-gray-700 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">SignalHire</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                      Direct Phone Numbers
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300">
                    Chrome extension that displays real-time mobile numbers and personal email addresses for HR professionals.
                  </p>
                  <a
                    href="https://www.signalhire.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline pt-1"
                  >
                    Visit SignalHire <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="p-3.5 bg-gray-800/70 border border-gray-700 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Zauba Corp & Tofler</span>
                    <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                      Indian Companies
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300">
                    Public registry for Indian registered companies. Contains registered office addresses, contact phone, and official ROC emails.
                  </p>
                  <a
                    href="https://www.zaubacorp.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline pt-1"
                  >
                    Visit ZaubaCorp <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-800 bg-gray-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Manual phone numbers ensure 100% CRM accuracy and delivery</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
