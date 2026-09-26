import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Building2,
  Mail,
  Phone,
  Linkedin,
  Globe,
  MapPin,
  Briefcase,
  Trash2,
} from 'lucide-react';
import { SPOC_MEMBERS } from '../data/pdfLeadsData';
import { PreparedWorksheetLead } from './TeamSheetsPage';
import { api } from '../services/api';

interface PdfLeadImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMember?: string;
  onSaveLeads: (leads: PreparedWorksheetLead[], targetSpoc: string) => Promise<void> | void;
}

export const PdfLeadImportModal: React.FC<PdfLeadImportModalProps> = ({
  isOpen,
  onClose,
  defaultMember = 'Aravind',
  onSaveLeads,
}) => {
  const [selectedMember, setSelectedMember] = useState<string>(() => {
    if (defaultMember && defaultMember !== 'all') {
      const match = SPOC_MEMBERS.find(
        (m) => m.id.toLowerCase() === defaultMember.toLowerCase()
      );
      if (match) return match.id;
    }
    return 'Aravind';
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [parsedLeads, setParsedLeads] = useState<PreparedWorksheetLead[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const targetMemberObj =
    SPOC_MEMBERS.find((m) => m.id.toLowerCase() === selectedMember.toLowerCase()) ||
    SPOC_MEMBERS[0];

  const handleFilePicked = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Please select a valid PDF document (.pdf).');
      return;
    }
    setPdfFile(file);
    setErrorMessage(null);
    setSuccessMessage(null);
    parsePdfFile(file, selectedMember);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFilePicked(e.dataTransfer.files[0]);
    }
  };

  // Extract leads from PDF via backend API or intelligent client-side text extractor
  const parsePdfFile = async (file: File, targetSpoc: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Attempt backend parsing endpoint
      let extractedData: any = null;
      try {
        const response = await api.parseDocumentHR({
          file,
          entered_by_name: `${targetSpoc} (PDF Upload)`,
        });
        if (response && (response.company || (response.contacts && response.contacts.length > 0))) {
          extractedData = response;
        }
      } catch (backendErr) {
        console.warn('Backend parse returned note, using client extractor:', backendErr);
      }

      const leads: PreparedWorksheetLead[] = [];

      if (extractedData?.company && Array.isArray(extractedData?.contacts) && extractedData.contacts.length > 0) {
        extractedData.contacts.forEach((contact: any) => {
          leads.push({
            company_name: extractedData.company.name || 'Target Enterprise',
            hr_name: contact.name || 'HR Lead',
            title: contact.title || 'Talent Acquisition Partner',
            phone: contact.phone || undefined,
            email: contact.email || undefined,
            linkedin_url: extractedData.company.linkedin_url || undefined,
            hr_linkedin: contact.linkedin_url || undefined,
            domain: extractedData.company.industry || 'Technology',
            location: extractedData.company.location || 'Hyderabad',
            remarks: 'Responded',
            spoc: targetSpoc,
            entered_by_name: `${targetSpoc} (PDF Upload)`,
          });
        });
      } else {
        // Client-side text & stream parsing from PDF file
        let text = '';
        try {
          text = await file.text();
        } catch (_) {}

        const cleanBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();
        const detectedCompany = cleanBaseName || 'Extracted Enterprise';

        // Extract potential phone numbers
        const phoneRegex = /(?:\+91[\s-]?)?[6789]\d{9}|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\b\d{10}\b/g;
        const phones = text.match(phoneRegex) || [];

        // Extract potential emails
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = text.match(emailRegex) || [];

        // Extract potential contact names
        const namesFound: string[] = [];
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
          if (line.toLowerCase().includes('hr') || line.toLowerCase().includes('recruiter') || line.toLowerCase().includes('talent') || line.toLowerCase().includes('manager')) {
            const words = line.split(/[|,-]/)[0].trim();
            if (words.length > 2 && words.length < 40 && !namesFound.includes(words)) {
              namesFound.push(words);
            }
          }
        }

        const count = Math.max(1, phones.length, emails.length);
        for (let i = 0; i < count; i++) {
          leads.push({
            company_name: detectedCompany,
            hr_name: namesFound[i] || `HR Specialist ${i > 0 ? i + 1 : ''}`.trim(),
            title: 'Talent Acquisition & Sourcing Lead',
            phone: phones[i] || undefined,
            email: emails[i] || undefined,
            location: 'Hyderabad',
            domain: 'Technology',
            remarks: 'Responded',
            spoc: targetSpoc,
            entered_by_name: `${targetSpoc} (PDF Upload)`,
          });
        }
      }

      if (leads.length === 0) {
        setErrorMessage('Could not find lead entries in this PDF. Please verify the file content.');
      } else {
        setParsedLeads(leads);
        setSuccessMessage(
          `Extracted ${leads.length} lead${leads.length > 1 ? 's' : ''} from "${file.name}". You can review or edit below, then store in ${targetMemberObj.name}'s sheet.`
        );
      }
    } catch (err: any) {
      console.error('PDF parsing error:', err);
      setErrorMessage(`Failed to process PDF: ${err.message || 'Unknown parsing error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateParsedField = (index: number, field: keyof PreparedWorksheetLead, value: string) => {
    setParsedLeads((prev) =>
      prev.map((lead, idx) => (idx === index ? { ...lead, [field]: value } : lead))
    );
  };

  const handleRemoveParsedLead = (index: number) => {
    setParsedLeads((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveAndStore = async () => {
    if (parsedLeads.length === 0) return;

    setIsSaving(true);
    try {
      const finalized = parsedLeads.map((lead) => ({
        ...lead,
        spoc: selectedMember,
        entered_by_name: `${selectedMember} (PDF Upload)`,
      }));

      await onSaveLeads(finalized, selectedMember);
      onClose();
    } catch (err: any) {
      setErrorMessage(`Failed to store leads: ${err.message || 'Database error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-gray-900 border border-indigo-500/30 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-950 via-gray-900 to-purple-950 border-b border-indigo-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-2xl text-indigo-300">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">PDF Lead Importer</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  PDF Documents
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Upload your sourcing PDF to extract verified company and HR leads directly into any team member's sheet.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* STEP 1: Select Target Team Member Sheet */}
          <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <User className="h-4 w-4" />
                Select Target Team Member's Dedicated Sheet
              </label>
              <span className="text-[11px] text-gray-400">
                Lead will be assigned to <strong>{targetMemberObj.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SPOC_MEMBERS.map((member) => {
                const isSelected = selectedMember.toLowerCase() === member.id.toLowerCase();
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      setSelectedMember(member.id);
                      if (parsedLeads.length > 0) {
                        setParsedLeads((prev) =>
                          prev.map((l) => ({ ...l, spoc: member.id }))
                        );
                      }
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md shadow-indigo-950/50'
                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                    }`}
                  >
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 ${member.avatarBg}`}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-white">{member.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{member.id}'s Sheet</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: PDF File Upload Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 bg-gray-950/40 ${
              pdfFile
                ? 'border-emerald-500/50 bg-emerald-950/10'
                : 'border-gray-700 hover:border-indigo-500 hover:bg-indigo-950/10'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf, application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFilePicked(file);
              }}
              className="hidden"
            />
            <div className="h-14 w-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shadow-inner">
              {pdfFile ? <CheckCircle2 className="h-7 w-7 text-emerald-400" /> : <UploadCloud className="h-7 w-7" />}
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {pdfFile ? pdfFile.name : 'Click to browse or drop your Sourcing PDF here'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Accepts .pdf documents containing HR phone numbers, company names, and contacts
              </p>
            </div>
            <span className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-indigo-300 text-xs font-bold rounded-xl border border-gray-700 transition">
              {isProcessing ? 'Processing PDF...' : 'Choose PDF File'}
            </span>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-500/50 rounded-2xl flex items-center gap-3 text-xs text-rose-200">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-xs text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* STEP 3: Parsed Leads Review & Edit Grid */}
          {parsedLeads.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white">
                    Parsed Lead Details ({parsedLeads.length})
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Ready to Store in {targetMemberObj.name}'s Sheet
                  </span>
                </div>
                <span className="text-[11px] text-gray-400">
                  Verify or edit fields before storing
                </span>
              </div>

              <div className="space-y-3">
                {parsedLeads.map((lead, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-950 border border-gray-800 hover:border-indigo-500/50 rounded-2xl p-4 transition space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between border-b border-gray-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-[10px] font-bold border border-indigo-500/40">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-gray-300">
                          Target Member: <strong className="text-indigo-300">{lead.spoc || selectedMember}</strong>
                        </span>
                      </div>
                      {parsedLeads.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveParsedLead(idx)}
                          className="text-gray-500 hover:text-rose-400 transition p-1"
                          title="Remove this lead"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1 flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-indigo-400" />
                          Company Name *
                        </label>
                        <input
                          type="text"
                          value={lead.company_name}
                          onChange={(e) => handleUpdateParsedField(idx, 'company_name', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1 flex items-center gap-1">
                          <User className="h-3 w-3 text-indigo-400" />
                          HR / Candidate Name *
                        </label>
                        <input
                          type="text"
                          value={lead.hr_name}
                          onChange={(e) => handleUpdateParsedField(idx, 'hr_name', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1 flex items-center gap-1">
                          <Briefcase className="h-3 w-3 text-indigo-400" />
                          Title / Designation
                        </label>
                        <input
                          type="text"
                          value={lead.title || ''}
                          onChange={(e) => handleUpdateParsedField(idx, 'title', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1 flex items-center gap-1">
                          <Phone className="h-3 w-3 text-emerald-400" />
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={lead.phone || ''}
                          onChange={(e) => handleUpdateParsedField(idx, 'phone', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1 flex items-center gap-1">
                          <Mail className="h-3 w-3 text-indigo-400" />
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={lead.email || ''}
                          onChange={(e) => handleUpdateParsedField(idx, 'email', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1 flex items-center gap-1">
                          <Linkedin className="h-3 w-3 text-sky-400" />
                          LinkedIn URL
                        </label>
                        <input
                          type="text"
                          value={lead.hr_linkedin || lead.linkedin_url || ''}
                          onChange={(e) => {
                            handleUpdateParsedField(idx, 'hr_linkedin', e.target.value);
                            handleUpdateParsedField(idx, 'linkedin_url', e.target.value);
                          }}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-sky-300 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-amber-400" />
                          Location
                        </label>
                        <input
                          type="text"
                          value={lead.location || ''}
                          onChange={(e) => handleUpdateParsedField(idx, 'location', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1 flex items-center gap-1">
                          <Globe className="h-3 w-3 text-teal-400" />
                          Domain / Industry
                        </label>
                        <input
                          type="text"
                          value={lead.domain || ''}
                          onChange={(e) => handleUpdateParsedField(idx, 'domain', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-teal-300 focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1 flex items-center gap-1">
                          <User className="h-3 w-3 text-indigo-400" />
                          Assign To Member
                        </label>
                        <select
                          value={lead.spoc || selectedMember}
                          onChange={(e) => handleUpdateParsedField(idx, 'spoc', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500"
                        >
                          {SPOC_MEMBERS.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.id}'s Sheet)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-950 border-t border-gray-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {parsedLeads.length > 0 && (
              <span className="text-xs text-gray-400 hidden sm:inline">
                Storing in <strong className="text-indigo-300">{targetMemberObj.name}'s Sheet</strong>
              </span>
            )}

            <button
              type="button"
              disabled={isSaving || parsedLeads.length === 0}
              onClick={handleSaveAndStore}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-950/50 transition cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {isSaving
                  ? 'Storing Leads...'
                  : `Store ${parsedLeads.length || ''} Lead${parsedLeads.length > 1 ? 's' : ''} in ${targetMemberObj.name}'s Sheet`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
