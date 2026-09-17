import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Company, JD } from '../types';
import { formatIndianDate } from '../utils/formatters';
import { FileText, CheckCircle, Sparkles, Building2, ShieldCheck, AlertTriangle, Edit3, UploadCloud, Loader2, File, Search, ExternalLink } from 'lucide-react';

const extractHtmlJobMetadata = (parsedDocument: Document) => {
  let title = '';
  let company = '';

  const jsonLdScripts = Array.from(parsedDocument.querySelectorAll('script[type="application/ld+json"]'));
  for (const script of jsonLdScripts) {
    try {
      const parsed = JSON.parse(script.textContent || '');
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      const jobPosting = entries.find((entry) => {
        const types = Array.isArray(entry?.['@type']) ? entry['@type'] : [entry?.['@type']];
        return types.includes('JobPosting');
      });

      if (jobPosting) {
        title = jobPosting.title || jobPosting.name || '';
        company = jobPosting.hiringOrganization?.name || '';
        break;
      }
    } catch {
      // Ignore malformed JSON-LD and continue with visible page metadata.
    }
  }

  if (!title) {
    const pageTitle = parsedDocument.title.trim();
    const titleParts = pageTitle.split(/\s[_|\-]\s/).map((part) => part.trim()).filter(Boolean);
    title = titleParts[0] || parsedDocument.querySelector('h1')?.textContent?.trim() || '';
    company = company || titleParts[1] || '';
  }

  if (!title) {
    title = parsedDocument.querySelector('h1, h2')?.textContent?.replace(/\s+/g, ' ').trim() || '';
  }

  return { title, company };
};

export const JDIntakePage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [recentJDs, setRecentJDs] = useState<JD[]>([]);
  const [useExistingCompany, setUseExistingCompany] = useState<boolean>(false);
  const [companyInput, setCompanyInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');
  const [jdTitle, setJdTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [opportunityType, setOpportunityType] = useState<'existing_post' | 'cold_outreach'>('cold_outreach');
  const [intakeMethod, setIntakeMethod] = useState<'file_ai_extract' | 'manual_entry'>('file_ai_extract');
  const [isVerified, setIsVerified] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastLoggedCompany, setLastLoggedCompany] = useState<string | null>(null);

  // File Extraction state
  const [extracting, setExtracting] = useState(false);
  const [extractionConfidence, setExtractionConfidence] = useState<'high' | 'medium' | 'low' | null>(null);
  const [extractedFilename, setExtractedFilename] = useState<string>('');
  const [htmlVerification, setHtmlVerification] = useState<boolean | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<{ ai_active: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<{ company?: string; title?: string }>({});

  const handleQuickFillSample = () => {
    setCompanyInput('NStarX Technologies');
    setIndustryInput('Information Technology');
    setJdTitle('Data Engineer');
    setRawText(`Role: Data Engineer
Location: Bengaluru / Remote
Requirements:
- 2+ years experience building data pipelines with Python and SQL
- Familiarity with PostgreSQL, Apache Airflow, and Cloud Data Warehouses
- Passion for analytics and high-volume data engineering
- Good communication and collaboration skills`);
    setOpportunityType('existing_post');
    setIsVerified(true);
    setFormErrors({});
    setMessage({
      type: 'success',
      text: 'Sample opportunity filled! Click "Submit & Save Opportunity to CRM" below to test saving.',
    });
  };

  const loadJDs = async () => {
    try {
      const jds = await api.getJDs();
      setRecentJDs(jds);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    api.getCompanies().then(setCompanies).catch(console.error);
    loadJDs();
    api.getJDExtractionStatus().then(setExtractionStatus).catch(() => undefined);
  }, []);

  const handleMethodChange = (method: 'file_ai_extract' | 'manual_entry') => {
    setIntakeMethod(method);
    setExtractionConfidence(null);
    setHtmlVerification(null);
    setIsVerified(false);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setExtracting(true);
    setMessage(null);
    setExtractionConfidence(null);
    setHtmlVerification(null);

    try {
      if (file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm') || file.type === 'text/html') {
        const html = await file.text();
        const parsedDocument = new DOMParser().parseFromString(html, 'text/html');
        const visibleText = parsedDocument.body?.textContent?.replace(/\s+/g, ' ').trim() || '';
        const jobSignals = ['job', 'role', 'position', 'responsibilities', 'requirements', 'qualifications', 'apply'];
        const signalCount = jobSignals.filter((signal) => visibleText.toLowerCase().includes(signal)).length;
        const verified = Boolean(parsedDocument.documentElement && parsedDocument.title.trim() && visibleText.length >= 80 && signalCount >= 2);
        const metadata = extractHtmlJobMetadata(parsedDocument);

        setExtractedFilename(file.name);
        setRawText(`[Source HTML File: ${file.name}]\n\n${visibleText}`);
        if (metadata.company) {
          const matched = companies.find(
            (company) => company.name.toLowerCase().trim() === metadata.company.toLowerCase().trim()
          );
          setCompanyInput(matched?.name || metadata.company);
          if (matched?.industry) setIndustryInput(matched.industry);
        }
        if (metadata.title) setJdTitle(metadata.title);
        setHtmlVerification(verified);
        setIsVerified(verified);
        setMessage({
          type: verified ? 'success' : 'error',
          text: verified
            ? `'${file.name}' is Verified: valid HTML with recognizable job posting content.`
            : `'${file.name}' is Not Verified: the file does not look like a complete job posting HTML document.`,
        });
        return;
      }

      const res = await api.extractJDFromFile(file);
      setExtractedFilename(res.filename);
      setExtractionConfidence(res.confidence);
      setExtractionStatus({ ai_active: !!res.ai_active, message: res.ai_active ? 'AI-powered extraction active' : 'Basic extraction — review fields carefully' });

      // Auto-fill fields if extracted
      if (res.company_name) {
        // Match existing company case-insensitive
        const matched = companies.find(
          (c) => c.name.toLowerCase().trim() === res.company_name.toLowerCase().trim()
        );
        if (matched) {
          setCompanyInput(matched.name);
          if (matched.industry) setIndustryInput(matched.industry);
        } else {
          setCompanyInput(res.company_name);
        }
      }

      if (res.role_title) {
        setJdTitle(res.role_title);
      }

      const formattedRaw = `[Source File: ${res.filename}]\n\n${res.raw_text}`;
      setRawText(formattedRaw);

      setMessage({
        type: 'success',
        text: `Extracted text from '${res.filename}' with ${res.confidence.toUpperCase()} confidence. Review auto-filled fields below before saving.${res.ocr_warning ? ` ${res.ocr_warning}` : ''}`,
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: `Document extraction error: ${err.message || 'Could not parse document'}. You can still enter details manually.`,
      });
    } finally {
      setExtracting(false);
    }
  };

  const handleMultipleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    if (files.length === 1) {
      handleFileUpload(files[0]);
      return;
    }

    setExtracting(true);
    setMessage(null);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        let compName = '';
        let titleName = '';
        let textContent = '';
        let verified = false;

        if (file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm') || file.type === 'text/html') {
          const html = await file.text();
          const parsedDocument = new DOMParser().parseFromString(html, 'text/html');
          const visibleText = parsedDocument.body?.textContent?.replace(/\s+/g, ' ').trim() || '';
          const jobSignals = ['job', 'role', 'position', 'responsibilities', 'requirements', 'qualifications', 'apply'];
          const signalCount = jobSignals.filter((signal) => visibleText.toLowerCase().includes(signal)).length;
          verified = Boolean(parsedDocument.documentElement && parsedDocument.title.trim() && visibleText.length >= 80 && signalCount >= 2);
          const metadata = extractHtmlJobMetadata(parsedDocument);
          compName = metadata.company || file.name.replace(/\.[^/.]+$/, '');
          titleName = metadata.title || 'Software Engineer';
          textContent = `[Source HTML File: ${file.name}]\n\n${visibleText}`;
        } else {
          const res = await api.extractJDFromFile(file);
          compName = res.company_name || file.name.replace(/\.[^/.]+$/, '');
          titleName = res.role_title || 'Position';
          textContent = `[Source File: ${res.filename}]\n\n${res.raw_text}`;
          verified = res.confidence === 'high';
        }

        // Check or create company
        let compId: string;
        const matched = companies.find((c) => c.name.toLowerCase().trim() === compName.toLowerCase().trim());
        if (matched) {
          compId = matched.id;
        } else {
          const created = await api.createCompany({ name: compName, source: 'manual' });
          compId = created.id;
          setCompanies((prev) => [...prev, created]);
        }

        await api.createJD({
          company_id: compId,
          title: titleName,
          raw_text: textContent,
          opportunity_type: 'existing_post',
          is_verified: verified,
          verification_source: 'file_ai_extract',
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    setExtracting(false);
    loadJDs();
    setMessage({
      type: successCount > 0 ? 'success' : 'error',
      text: `Bulk upload complete: Successfully processed ${successCount} JD${successCount === 1 ? '' : 's'}${
        failCount > 0 ? ` (${failCount} failed)` : ''
      }. Verified opportunities are now ready in HR Sourcing!`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const errors: { company?: string; title?: string } = {};
    if (!companyInput.trim()) {
      errors.company = 'Please enter or select a Company Name.';
    }
    if (!jdTitle.trim()) {
      errors.title = 'Please enter a Job Title (e.g. Senior Fullstack Engineer).';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setMessage({
        type: 'error',
        text: 'Please fill in Company Name and Job Title before saving the opportunity.',
      });
      return;
    }

    setFormErrors({});
    setSubmitting(true);

    try {
      let companyId: string | undefined;

      const existingComp = companies.find(
        (c) => c.name.toLowerCase().trim() === companyInput.toLowerCase().trim()
      );

      if (existingComp) {
        companyId = existingComp.id;
      } else {
        const createdComp = await api.createCompany({
          name: companyInput.trim(),
          industry: industryInput.trim() || undefined,
          source: 'manual',
        });
        companyId = createdComp.id;
        setCompanies((prev) => [...prev, createdComp]);
      }

      const textToSave = rawText.trim() || `Job opportunity for ${jdTitle.trim()} at ${companyInput.trim()}. Verified by CRA.`;

      const createdJD = await api.createJD({
        company_id: companyId,
        title: jdTitle.trim(),
        raw_text: textToSave,
        opportunity_type: opportunityType,
        is_verified: isVerified,
        verification_source: intakeMethod,
      });

      localStorage.setItem('placemein:hr-sourcing-prefill', JSON.stringify({
        company: companyInput.trim(),
        title: jdTitle.trim(),
      }));

      const savedCompName = companyInput.trim();
      setLastLoggedCompany(savedCompName);

      setMessage({
        type: 'success',
        text: `Opportunity '${createdJD.title}' for '${savedCompName}' logged & saved to CRM successfully!`,
      });

      setCompanyInput('');
      setIndustryInput('');
      setJdTitle('');
      setRawText('');
      setIsVerified(false);
      setExtractionConfidence(null);
      setExtractedFilename('');
      setHtmlVerification(null);
      loadJDs();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit JD intake.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="h-6 w-6 text-indigo-400" />
          JD & Opportunity Intake
        </h1>
        <p className="text-gray-400 text-sm">Log opportunities via File Auto-Extraction (PDF/DOCX/Image), URL Parser, or Manual Entry</p>
      </div>

      {extractionStatus && <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${extractionStatus.ai_active ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-amber-500/10 border-amber-500/30 text-amber-100'}`}><Sparkles className="h-4 w-4 shrink-0" />{extractionStatus.message}{!extractionStatus.ai_active && ' — confidence is capped at Medium.'}</div>}

      {message && (
        <div
          className={`p-4 rounded-xl space-y-2 border ${
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {message.type === 'success' && <CheckCircle className="h-5 w-5 shrink-0" />}
            <span>{message.text}</span>
          </div>
          {message.type === 'success' && lastLoggedCompany && (
            <div className="pt-2 border-t border-emerald-500/20 text-xs text-emerald-300/80">
              Opportunity recorded. Next step: Head to <strong>HR Sourcing</strong> to find recruiters and source contacts for this company.
            </div>
          )}
        </div>
      )}

      {/* Intake Mode Selection Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tab 1: File Upload */}
        <button
          type="button"
          onClick={() => handleMethodChange('file_ai_extract')}
          className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition ${
            intakeMethod === 'file_ai_extract'
              ? 'bg-indigo-900/30 border-indigo-500 text-white shadow-lg'
              : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600'
          }`}
        >
          <UploadCloud className={`h-6 w-6 mt-0.5 ${intakeMethod === 'file_ai_extract' ? 'text-indigo-400' : 'text-gray-400'}`} />
          <div>
            <div className="flex items-center gap-2 font-semibold text-sm">
              <span>File Upload (HTML / PDF / DOCX / Image)</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Reads HTML, PDF, Word doc, or screenshot and pre-fills company and job title automatically.</p>
          </div>
        </button>

        {/* Tab 2: Manual Entry */}
        <button
          type="button"
          onClick={() => handleMethodChange('manual_entry')}
          className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition ${
            intakeMethod === 'manual_entry'
              ? 'bg-indigo-900/30 border-indigo-500 text-white shadow-lg'
              : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600'
          }`}
        >
          <Edit3 className={`h-6 w-6 mt-0.5 ${intakeMethod === 'manual_entry' ? 'text-amber-400' : 'text-gray-400'}`} />
          <div>
            <div className="flex items-center gap-2 font-semibold text-sm">
              <span>Manual Text Paste</span>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Needs Review</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Direct text copy-paste. Flagged for review until confirmed.</p>
          </div>
        </button>
      </div>

      <form noValidate onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-6 shadow-sm">
        {/* File Upload Zone if File AI Extract mode */}
        {intakeMethod === 'file_ai_extract' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Upload Job Description File (HTML, PDF, DOCX, JPG, PNG)
            </label>
            <div className="border-2 border-dashed border-gray-700 hover:border-indigo-500 rounded-xl p-6 text-center transition bg-gray-900/40 relative">
              <input
                type="file"
                multiple
                accept=".html,.htm,.pdf,.docx,.doc,.jpg,.jpeg,.png,.webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleMultipleFiles(e.target.files);
                    e.target.value = '';
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {extracting ? (
                <div className="flex flex-col items-center space-y-2 text-indigo-400 py-4">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm font-semibold">Reading document & extracting metadata...</p>
                  <p className="text-xs text-gray-400">Extracting text, company name, and job title</p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2 py-4">
                  <UploadCloud className="h-10 w-10 text-indigo-400" />
                  <p className="text-sm font-medium text-white">
                    Drop one or more JD files here (Bulk upload supported), or <span className="text-indigo-400 underline">browse</span>
                  </p>
                  <p className="text-xs text-gray-400">Supports single or batch upload of HTML, PDF, Word (.docx), or screenshot images (.png, .jpg)</p>
                </div>
              )}
            </div>

            {/* Confidence & Auto-fill Status Banner */}
            {extractionConfidence && (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-900/60 border-gray-700">
                <div className="flex items-center space-x-2 text-xs">
                  <File className="h-4 w-4 text-indigo-400" />
                  <span className="text-gray-300">Source: <strong>{extractedFilename}</strong></span>
                </div>
                {extractionConfidence === 'high' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Sparkles className="h-3.5 w-3.5" />
                    Auto-filled — High Confidence
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Auto-filled — Please Verify ({extractionConfidence.toUpperCase()} confidence)
                  </span>
                )}
              </div>
            )}
            {rawText && extractedFilename && <details className="rounded-lg border border-gray-700 bg-gray-950/50 p-3 text-xs"><summary className="cursor-pointer font-semibold text-gray-200">View raw extracted text</summary><pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-gray-400 font-sans">{rawText}</pre></details>}
            {htmlVerification !== null && (
              <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${htmlVerification ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                {htmlVerification ? <ShieldCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                <strong>{htmlVerification ? 'Verified' : 'Not Verified'}</strong>
                <span className="text-gray-300">HTML file check</span>
              </div>
            )}
          </div>
        )}

        {/* Company Selection Mode Toggle & Inputs */}
        <div className="space-y-3 bg-gray-900/40 p-4 rounded-xl border border-gray-700/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-semibold text-gray-200 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-indigo-400" />
              Company Details *
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleQuickFillSample}
                className="text-xs px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg flex items-center gap-1 transition"
                title="Click to populate demo company & job details"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Fill Demo Sample</span>
              </button>
              <label className="inline-flex items-center cursor-pointer text-xs text-indigo-300 font-medium space-x-2">
                <input
                  type="checkbox"
                  checked={useExistingCompany}
                  onChange={(e) => {
                    setUseExistingCompany(e.target.checked);
                    if (e.target.checked && companies.length > 0) {
                      setCompanyInput(companies[0].name);
                      setIndustryInput(companies[0].industry || '');
                      setFormErrors((prev) => ({ ...prev, company: undefined }));
                    }
                  }}
                  className="rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span>Select Existing Company</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="md:col-span-2">
              {useExistingCompany ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Choose Existing Company</label>
                  <select
                    value={companyInput}
                    onChange={(e) => {
                      setCompanyInput(e.target.value);
                      const selectedComp = companies.find((c) => c.name === e.target.value);
                      if (selectedComp) {
                        setIndustryInput(selectedComp.industry || '');
                      }
                      if (e.target.value) {
                        setFormErrors((prev) => ({ ...prev, company: undefined }));
                      }
                    }}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm font-semibold"
                  >
                    {companies.length === 0 ? (
                      <option value="">No existing companies found</option>
                    ) : (
                      companies.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} {c.industry ? `(${c.industry})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Company Name *</label>
                  <input
                    type="text"
                    list="existing-companies-list"
                    placeholder="e.g. Google, Stripe, Acme Corp..."
                    value={companyInput}
                    onChange={(e) => {
                      setCompanyInput(e.target.value);
                      if (e.target.value.trim()) {
                        setFormErrors((prev) => ({ ...prev, company: undefined }));
                      }
                    }}
                    className={`w-full bg-gray-900 border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none text-sm ${
                      formErrors.company
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/50'
                        : 'border-gray-700 focus:border-indigo-500'
                    }`}
                  />
                  {formErrors.company && (
                    <p className="text-xs text-rose-400 mt-1">{formErrors.company}</p>
                  )}
                  <datalist id="existing-companies-list">
                    {companies.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Industry (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Software, FinTech"
                value={industryInput}
                onChange={(e) => setIndustryInput(e.target.value)}
                disabled={useExistingCompany && !!industryInput}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Job Title & Opportunity Type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">Job / Opportunity Title *</label>
            <input
              type="text"
              placeholder="e.g. Senior Fullstack Engineer"
              value={jdTitle}
              onChange={(e) => {
                setJdTitle(e.target.value);
                if (e.target.value.trim()) {
                  setFormErrors((prev) => ({ ...prev, title: undefined }));
                }
              }}
              className={`w-full bg-gray-900 border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none text-sm ${
                formErrors.title
                  ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/50'
                  : 'border-gray-700 focus:border-indigo-500'
              }`}
            />
            {formErrors.title && (
              <p className="text-xs text-rose-400 mt-1">{formErrors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Opportunity Type</label>
            <select
              value={opportunityType}
              onChange={(e: any) => setOpportunityType(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
            >
              <option value="cold_outreach">Cold Outreach Target</option>
              <option value="existing_post">Existing Job Post</option>
            </select>
          </div>
        </div>

        {/* Raw Text */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-300">Job Description Text (Optional)</label>
            <span className="text-xs text-gray-500">Auto-generated summary used if left empty</span>
          </div>
          <textarea
            rows={5}
            placeholder="Paste full job specification, responsibilities, requirements, or tech stack (optional)..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm font-mono"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg flex items-center justify-center space-x-2 transition shadow-md cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Saving Opportunity to CRM...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              <span>Submit & Save Opportunity to CRM</span>
            </>
          )}
        </button>
      </form>

      {/* Logged JDs & Verification Badges */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-400" />
          Logged Opportunities & Verification Badges
        </h2>
        {recentJDs.length === 0 ? (
          <p className="text-sm text-gray-400">No opportunities logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-900/60 text-xs uppercase text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Verification Badge</th>
                  <th className="px-4 py-3">Logged Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {recentJDs.map((jd) => {
                  const autoVerified = jd.verification_source === 'html_url_parser' || jd.is_verified;
                  return (
                    <tr key={jd.id} className="hover:bg-gray-700/30">
                      <td className="px-4 py-3 font-medium text-white">{jd.title}</td>
                      <td className="px-4 py-3 text-gray-300">{jd.company?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 capitalize">{jd.verification_source || 'manual'}</td>
                      <td className="px-4 py-3">
                        {autoVerified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Auto-Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Needs Review
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {formatIndianDate(jd.created_at || jd.date_found)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

