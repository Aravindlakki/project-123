import React, { useState } from 'react';
import {
  Code2,
  UploadCloud,
  FileCode,
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
  ChevronRight,
  ClipboardPaste,
  Plus,
  Trash2,
  ArrowLeftRight,
} from 'lucide-react';
import { SPOC_MEMBERS } from '../data/pdfLeadsData';
import { PreparedWorksheetLead } from './TeamSheetsPage';

/**
 * Intelligently separates and validates Company Name and Job Role / Title.
 * Guarantees Company name -> company field and Job role/title -> role field.
 * Detects and automatically corrects inverted or swapped company/role mappings.
 */
export const sanitizeCompanyAndRole = (
  rawComp: string,
  rawRole: string
): { company: string; role: string; wasSwapped: boolean } => {
  let company = (rawComp || '').trim();
  let role = (rawRole || '').trim();

  const roleKeywords = [
    'developer', 'engineer', 'recruiter', 'manager', 'lead', 'analyst', 'specialist',
    'officer', 'executive', 'consultant', 'coordinator', 'director', 'associate',
    'architect', 'talent acquisition', 'sourcing', 'intern', 'head of', 'vp',
    'president', 'administrator', 'trainee', 'programmer', 'designer', 'scientist',
    'devops', 'tester', 'qa', 'scrum master', 'product manager', 'hr partner',
    'hr generalist', 'hr specialist', 'recruitment', 'advisor', 'staff'
  ];

  const companyKeywords = [
    'technologies', 'technology', 'services', 'solutions', 'inc', 'ltd', 'limited',
    'pvt', 'corp', 'corporation', 'enterprises', 'systems', 'consulting', 'group',
    'holdings', 'labs', 'software', 'bank', 'infotech', 'networks', 'global',
    'industries', 'studio', 'agency', 'company', 'ventures', 'analytics', 'tcs',
    'infosys', 'wipro', 'google', 'microsoft', 'amazon', 'cisco', 'accenture',
    'cognizant', 'hcl', 'capgemini', 'oracle', 'salesforce', 'autoliv', 'zs'
  ];

  const lowerComp = company.toLowerCase();
  const lowerRole = role.toLowerCase();

  const compHasRoleSignal = roleKeywords.some((kw) => lowerComp.includes(kw));
  const roleHasCompSignal = companyKeywords.some((kw) => lowerRole.includes(kw));
  const compHasCompSignal = companyKeywords.some((kw) => lowerComp.includes(kw));
  const roleHasRoleSignal = roleKeywords.some((kw) => lowerRole.includes(kw));

  let wasSwapped = false;
  // If company field contains strong role keywords and lacks company keywords,
  // or role field contains company keywords and lacks role keywords:
  if ((compHasRoleSignal && !compHasCompSignal) || (roleHasCompSignal && !roleHasRoleSignal)) {
    const temp = company;
    company = role;
    role = temp;
    wasSwapped = true;
  }

  // Strip prefixes like "Company: " or "Role: "
  company = company.replace(/^(company|org|employer|client)\s*[:\-]\s*/i, '').trim();
  role = role.replace(/^(role|title|designation|position|job)\s*[:\-]\s*/i, '').trim();

  return { company, role, wasSwapped };
};

interface HtmlLeadImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMember?: string;
  onSaveLeads: (leads: PreparedWorksheetLead[], targetSpoc: string) => Promise<void> | void;
}

export const HtmlLeadImportModal: React.FC<HtmlLeadImportModalProps> = ({
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

  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
  const [rawHtml, setRawHtml] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [parsedLeads, setParsedLeads] = useState<PreparedWorksheetLead[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Realistic sample HTML snippet for 1-click testing
  const SAMPLE_HTML_SNIPPET = `<div class="linkedin-candidate-card" data-entity="profile">
  <div class="header">
    <h1 class="candidate-name">Sowmya Katta</h1>
    <p class="candidate-title">Senior Technical Recruiter & Talent Acquisition Partner</p>
    <span class="company-name">Tata Consultancy Services</span>
    <span class="location">Hyderabad, Telangana, India</span>
  </div>
  <div class="contact-info">
    <a href="mailto:sowmya.katta@tcs.com" class="email">sowmya.katta@tcs.com</a>
    <a href="tel:+919849012345" class="phone">+91 98490 12345</a>
    <a href="https://www.linkedin.com/in/sowmya-katta-talent" class="linkedin">LinkedIn Profile</a>
    <a href="https://www.tcs.com" class="website">https://www.tcs.com</a>
  </div>
  <div class="experience">
    <p>Domain: Information Technology & Cloud Infrastructure</p>
    <p>Status: Active Candidate / HR Lead</p>
  </div>
</div>`;

  const handlePasteSample = () => {
    setRawHtml(SAMPLE_HTML_SNIPPET);
    setParseError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawHtml(content);
        executeHtmlParse(content, selectedMember);
      }
    };
    reader.onerror = () => {
      setParseError('Failed to read selected HTML file.');
    };
    reader.readAsText(file);
  };

  // =========================================================================
  // INTELLIGENT HTML PARSER ENGINE
  // Extracts leads from Microdata, JSON-LD, Tables, Profiles, and Regex
  // =========================================================================
  const executeHtmlParse = (htmlInput: string, targetSpoc: string) => {
    if (!htmlInput || !htmlInput.trim()) {
      setParseError('Please paste or upload HTML content to parse.');
      return;
    }

    setIsParsing(true);
    setParseError(null);
    setParseSuccessMsg(null);

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlInput, 'text/html');
      const leadsExtracted: PreparedWorksheetLead[] = [];

      // 1. Check for JSON-LD structured data (Common on LinkedIn, Job Boards, Schema.org)
      const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
      jsonLdScripts.forEach((script) => {
        try {
          const data = JSON.parse(script.textContent || '{}');
          const items = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];

          items.forEach((item: any) => {
            if (!item) return;
            const type = item['@type'];
            if (
              type === 'Person' ||
              type === 'Profile' ||
              type === 'JobPosting' ||
              type === 'Organization'
            ) {
              let name = item.name || `${item.givenName || ''} ${item.familyName || ''}`.trim();
              let company =
                typeof item.worksFor === 'object'
                  ? item.worksFor?.name
                  : item.hiringOrganization?.name || item.name || '';
              let title = item.jobTitle || item.title || item.roleName || '';
              const email = item.email || '';
              const phone = item.telephone || '';
              const location =
                typeof item.address === 'object'
                  ? item.address?.addressLocality || item.address?.addressRegion || ''
                  : item.jobLocation?.address?.addressLocality || '';

              if (type === 'JobPosting') {
                if (!title) title = item.title || item.name || '';
                if (!company) company = item.hiringOrganization?.name || '';
                name = 'Talent Acquisition Team';
              } else if (type === 'Organization') {
                company = item.name || company;
                title = 'Talent Acquisition Partner';
                name = 'Hiring Manager';
              }

              // Apply clean field mapping to strictly ensure Company -> company and Role -> role
              const { company: cleanComp, role: cleanRole } = sanitizeCompanyAndRole(company, title);

              if (name || cleanComp) {
                leadsExtracted.push({
                  company_name: cleanComp || 'Extracted Organization',
                  hr_name: name || 'Lead Contact',
                  title: cleanRole || 'HR / Sourcing Lead',
                  email: email || undefined,
                  phone: phone || undefined,
                  location: location || 'Hyderabad',
                  domain: 'Technology',
                  remarks: 'Responded',
                  spoc: targetSpoc,
                  entered_by_name: `${targetSpoc} (HTML Import)`,
                });
              }
            }
          });
        } catch {
          // Skip invalid JSON-LD
        }
      });

      // 2. Check for HTML Table Rows (<table>...<tr>...<td>)
      const tables = doc.querySelectorAll('table');
      if (tables.length > 0) {
        tables.forEach((table) => {
          const rows = Array.from(table.querySelectorAll('tr'));
          if (rows.length < 2) return;

          // Header inspection with strict separation
          const headers = Array.from(rows[0].querySelectorAll('th, td')).map((c) =>
            c.textContent?.toLowerCase().trim() || ''
          );

          let compIdx = headers.findIndex((h) => h.includes('company') || h.includes('organisation') || h.includes('organization') || h.includes('org') || h.includes('client') || h.includes('employer'));
          let roleIdx = headers.findIndex((h) => h.includes('role') || h.includes('job') || h.includes('title') || h.includes('designation') || h.includes('position'));
          let nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('hr') || h.includes('contact') || h.includes('candidate') || h.includes('recruiter'));
          let phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile') || h.includes('contact') || h.includes('number'));
          let emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
          let locIdx = headers.findIndex((h) => h.includes('location') || h.includes('city'));
          let domainIdx = headers.findIndex((h) => h.includes('domain') || h.includes('industry'));

          for (let i = 1; i < rows.length; i++) {
            const cells = Array.from(rows[i].querySelectorAll('td')).map((c) =>
              c.textContent?.trim() || ''
            );
            if (cells.every((c) => !c)) continue;

            const rawCompany = compIdx >= 0 ? cells[compIdx] : cells[0] || 'Extracted Company';
            const hrName = nameIdx >= 0 ? cells[nameIdx] : cells[1] || 'Lead Contact';
            const phone = phoneIdx >= 0 ? cells[phoneIdx] : '';
            const email = emailIdx >= 0 ? cells[emailIdx] : '';
            const rawRole = roleIdx >= 0 ? cells[roleIdx] : (cells[2] || 'Talent Acquisition');
            const location = locIdx >= 0 ? cells[locIdx] : 'Hyderabad';
            const domain = domainIdx >= 0 ? cells[domainIdx] : 'Technology';

            // Sanitize Company and Role to guarantee NO SWAP
            const { company: cleanComp, role: cleanRole } = sanitizeCompanyAndRole(rawCompany, rawRole);

            if (cleanComp || hrName) {
              leadsExtracted.push({
                company_name: cleanComp,
                hr_name: hrName,
                title: cleanRole,
                phone: phone || undefined,
                email: email || undefined,
                location: location || 'Hyderabad',
                domain: domain || 'Technology',
                remarks: 'Responded',
                spoc: targetSpoc,
                entered_by_name: `${targetSpoc} (HTML Import)`,
              });
            }
          }
        });
      }

      // 3. Document-Level DOM Elements & Text Extraction (Profile card, LinkedIn snippets, general web snippets)
      if (leadsExtracted.length === 0) {
        // Find Email via mailto link or regex
        let email = '';
        const mailtoLink = doc.querySelector('a[href^="mailto:"]');
        if (mailtoLink) {
          email = mailtoLink.getAttribute('href')?.replace(/^mailto:/i, '').split('?')[0].trim() || '';
        }
        if (!email) {
          const emailMatch = htmlInput.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
          if (emailMatch) email = emailMatch[0];
        }

        // Find Phone via tel link or regex
        let phone = '';
        const telLink = doc.querySelector('a[href^="tel:"]');
        if (telLink) {
          phone = telLink.getAttribute('href')?.replace(/^tel:/i, '').trim() || '';
        }
        if (!phone) {
          const phoneMatch = htmlInput.match(/(?:(?:\+|0{0,2})91[\s.-]?)?[6-9]\d{9}|(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/);
          if (phoneMatch) phone = phoneMatch[0].trim();
        }

        // Find LinkedIn URLs
        let hrLinkedin = '';
        let companyLinkedin = '';
        const linkedinLinks = Array.from(doc.querySelectorAll('a[href*="linkedin.com"]'));
        linkedinLinks.forEach((a) => {
          const href = a.getAttribute('href') || '';
          if (href.includes('/in/') && !hrLinkedin) {
            hrLinkedin = href;
          } else if (href.includes('/company/') && !companyLinkedin) {
            companyLinkedin = href;
          }
        });

        // Find Website URL
        let website = '';
        const regularLinks = Array.from(doc.querySelectorAll('a[href^="http"]'));
        for (const a of regularLinks) {
          const href = a.getAttribute('href') || '';
          if (!href.includes('linkedin.com') && !href.includes('google.com') && !href.includes('facebook.com')) {
            website = href;
            break;
          }
        }

        // Candidate / HR Name Detection
        let hrName = '';
        const nameSelectors = [
          '.candidate-name',
          '.profile-name',
          '.name',
          '[data-field="name"]',
          '[data-anonymize="person-name"]',
          '.pv-top-card--list li',
          'h1:not(.role):not(.title):not(.job-title):not(.top-card-layout__title)',
        ];
        for (const sel of nameSelectors) {
          const el = doc.querySelector(sel);
          if (el && el.textContent?.trim()) {
            const clean = el.textContent.trim().split('\n')[0].trim();
            if (clean.length > 2 && clean.length < 60) {
              hrName = clean;
              break;
            }
          }
        }

        // Title / Designation / Role Detection
        let title = '';
        const titleSelectors = [
          '[data-field="role"]',
          '[data-field="title"]',
          '.role',
          '.job-title',
          '.job_title',
          '.candidate-title',
          '.designation',
          '.position',
          '.headline',
          '.top-card-layout__title',
          '.text-body-medium',
        ];
        for (const sel of titleSelectors) {
          const el = doc.querySelector(sel);
          if (el && el.textContent?.trim()) {
            const clean = el.textContent.trim().split('\n')[0].trim();
            if (clean.length > 3 && clean.length < 100) {
              title = clean;
              break;
            }
          }
        }

        // Company Name Detection
        let companyName = '';
        const companySelectors = [
          '[data-field="company"]',
          '.company-name',
          '.company',
          '.employer',
          '.org',
          '.organization',
          '.top-card-layout__first-subline',
          '.top-card-layout__headline',
          '[data-anonymize="company-name"]',
          '.pv-entity__secondary-title',
        ];
        for (const sel of companySelectors) {
          const el = doc.querySelector(sel);
          if (el && el.textContent?.trim()) {
            const clean = el.textContent.trim().split('\n')[0].trim();
            if (clean.length > 2 && clean.length < 80) {
              companyName = clean;
              break;
            }
          }
        }

        // Location Detection
        let location = '';
        const locSelectors = ['.location', '.city', '.address', '.geo', '.top-card__subline-item'];
        for (const sel of locSelectors) {
          const el = doc.querySelector(sel);
          if (el && el.textContent?.trim()) {
            location = el.textContent.trim().split('\n')[0].trim();
            break;
          }
        }

        // Fallback name if none found: derive from title tag or email prefix
        if (!hrName && email) {
          const userPart = email.split('@')[0].replace(/[._-]/g, ' ');
          hrName = userPart.charAt(0).toUpperCase() + userPart.slice(1);
        }

        // Page title parsing: "Company - Job Role" or "Role - Company"
        const titleTag = doc.querySelector('title')?.textContent?.trim() || '';
        if ((!companyName || !title) && titleTag) {
          const parts = titleTag.split(/\s*[_|\-–—]\s*/).map((p) => p.trim()).filter((p) => p && !p.toLowerCase().includes('linkedin') && !p.toLowerCase().includes('http'));
          if (parts.length >= 2) {
            const { company: cPart, role: rPart } = sanitizeCompanyAndRole(parts[0], parts[1]);
            if (!companyName && cPart) companyName = cPart;
            if (!title && rPart) title = rPart;
          }
        }

        if (!companyName && email) {
          const domainPart = email.split('@')[1]?.split('.')[0] || '';
          if (domainPart && !['gmail', 'yahoo', 'outlook', 'hotmail'].includes(domainPart.toLowerCase())) {
            companyName = domainPart.charAt(0).toUpperCase() + domainPart.slice(1);
          }
        }

        if (!companyName) {
          companyName = hrName ? `${hrName}'s Organization` : 'Imported Web Lead';
        }

        if (!hrName) {
          hrName = 'Talent Lead';
        }

        if (!title) {
          title = 'Talent Acquisition & HR Sourcing';
        }

        // Guarantees Company name -> company field and Job role/title -> role field
        const { company: finalComp, role: finalRole } = sanitizeCompanyAndRole(companyName, title);

        leadsExtracted.push({
          company_name: finalComp || 'Imported Web Lead',
          hr_name: hrName,
          title: finalRole || 'Talent Acquisition Specialist',
          phone: phone || undefined,
          email: email || undefined,
          hr_linkedin: hrLinkedin || undefined,
          linkedin_url: companyLinkedin || undefined,
          website: website || undefined,
          location: location || 'Hyderabad',
          domain: 'Technology',
          remarks: 'Responded',
          spoc: targetSpoc,
          entered_by_name: `${targetSpoc} (HTML Import)`,
        });
      }

      if (leadsExtracted.length === 0) {
        setParseError('Could not automatically identify lead fields in the provided HTML. Try pasting a more complete HTML block with contact info or table.');
      } else {
        setParsedLeads(leadsExtracted);
        setParseSuccessMsg(
          `Sanity Check Passed: Extracted and validated ${leadsExtracted.length} lead${leadsExtracted.length > 1 ? 's' : ''} from HTML! Review field mappings below before committing.`
        );
      }
    } catch (err: any) {
      console.error('HTML parsing error:', err);
      setParseError(`HTML parsing failed: ${err.message || 'Malformed HTML format'}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSwapCompanyAndRole = (index: number) => {
    setParsedLeads((prev) =>
      prev.map((lead, idx) => {
        if (idx !== index) return lead;
        return {
          ...lead,
          company_name: lead.title || 'Organization',
          title: lead.company_name || 'Role',
        };
      })
    );
  };

  const handleSwapAllCompanyAndRole = () => {
    setParsedLeads((prev) =>
      prev.map((lead) => ({
        ...lead,
        company_name: lead.title || 'Organization',
        title: lead.company_name || 'Role',
      }))
    );
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
      // Ensure all leads carry the selected target SPOC
      const finalized = parsedLeads.map((lead) => ({
        ...lead,
        spoc: selectedMember,
        entered_by_name: `${selectedMember} (HTML Import)`,
      }));

      await onSaveLeads(finalized, selectedMember);
      onClose();
    } catch (err: any) {
      setParseError(`Failed to save leads to database: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const targetMemberObj = SPOC_MEMBERS.find((m) => m.id.toLowerCase() === selectedMember.toLowerCase()) || SPOC_MEMBERS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-gray-900 border border-purple-500/30 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-950 via-gray-900 to-indigo-950 border-b border-purple-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/30 border border-purple-500/40 rounded-2xl text-purple-300">
              <Code2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">HTML Lead Importer</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Web & Profile Snippets
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Paste or upload HTML from LinkedIn, job boards, emails, or web tables to parse and store leads directly in any team member's sheet.
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
              <label className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
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
                        ? 'bg-purple-600/30 border-purple-500 text-white shadow-md shadow-purple-950/50'
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

          {/* STEP 2: Ingestion Mode Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'paste'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  Paste HTML / Web Snippet
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'file'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  Upload .html File
                </button>
              </div>

              {activeTab === 'paste' && (
                <button
                  type="button"
                  onClick={handlePasteSample}
                  className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Paste Sample Snippet
                </button>
              )}
            </div>

            {activeTab === 'paste' ? (
              <div className="space-y-2">
                <div className="relative">
                  <textarea
                    rows={8}
                    value={rawHtml}
                    onChange={(e) => setRawHtml(e.target.value)}
                    placeholder="Paste raw HTML code from a LinkedIn profile, candidate card, email, or table (e.g. <div class='profile'>...</div> or <table>...</table>)..."
                    className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-4 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                  />
                  {rawHtml && (
                    <div className="absolute bottom-3 right-3 text-[10px] text-gray-500">
                      {rawHtml.length} characters
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">
                    Supports DOM microdata, JSON-LD, anchor mailto/tel tags, tables, and profile cards.
                  </p>
                  <button
                    type="button"
                    onClick={() => executeHtmlParse(rawHtml, selectedMember)}
                    disabled={isParsing || !rawHtml.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{isParsing ? 'Parsing HTML...' : 'Parse HTML Content'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-700 hover:border-purple-500 rounded-2xl p-8 text-center transition bg-gray-950/40">
                <input
                  type="file"
                  id="html-file-upload"
                  accept=".html, .htm, text/html"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="html-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                  <div className="p-3 bg-purple-600/20 text-purple-400 rounded-2xl border border-purple-500/40">
                    <FileCode className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {uploadedFileName ? uploadedFileName : 'Click to select or drop an HTML file'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Accepts .html, .htm web files</p>
                  </div>
                  <span className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-purple-300 text-xs font-bold rounded-xl border border-gray-700 transition">
                    Browse File
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Feedback Messages */}
          {parseError && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-500/50 rounded-2xl flex items-center gap-3 text-xs text-rose-200">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {parseSuccessMsg && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-xs text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{parseSuccessMsg}</span>
            </div>
          )}

          {/* STEP 3: Parsed Leads Review & Edit Grid */}
          {parsedLeads.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-purple-950/40 border border-purple-800/40 rounded-2xl p-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white">
                      Field Mapping Validation Preview ({parsedLeads.length} Lead{parsedLeads.length > 1 ? 's' : ''})
                    </h3>
                    <p className="text-[11px] text-gray-300">
                      <strong className="text-purple-300">Company Name</strong> → Company field &bull; <strong className="text-indigo-300">Job Title/Role</strong> → Role field
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSwapAllCompanyAndRole}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-700/50 hover:bg-amber-900/60 transition"
                    title="Swap Company and Role for all parsed leads if they were inverted"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    <span>Swap All Company ⇄ Role</span>
                  </button>
                  <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Ready for {targetMemberObj.name}'s Sheet
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {parsedLeads.map((lead, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-950 border border-gray-800 hover:border-purple-500/50 rounded-2xl p-4 transition space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between border-b border-gray-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center text-[10px] font-bold border border-purple-500/40">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-gray-300">
                          Target Member: <strong className="text-purple-300">{lead.spoc || selectedMember}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSwapCompanyAndRole(idx)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-amber-300 bg-amber-950/40 border border-amber-700/40 hover:bg-amber-900/50 transition cursor-pointer"
                          title="Swap Company name and Role for this lead"
                        >
                          <ArrowLeftRight className="h-3 w-3" />
                          <span>Swap Company ⇄ Role</span>
                        </button>
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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="p-2 rounded-xl bg-purple-950/20 border border-purple-900/40">
                        <label className="text-[10px] font-black uppercase text-purple-300 block mb-1 flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-purple-400" />
                          Company Name * (Company field)
                        </label>
                        <input
                          type="text"
                          value={lead.company_name}
                          onChange={(e) => handleUpdateParsedField(idx, 'company_name', e.target.value)}
                          className="w-full bg-gray-900 border border-purple-700/60 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400 font-semibold"
                          placeholder="e.g. Google, TCS"
                        />
                      </div>

                      <div className="p-2 rounded-xl bg-indigo-950/20 border border-indigo-900/40">
                        <label className="text-[10px] font-black uppercase text-indigo-300 block mb-1 flex items-center gap-1">
                          <Briefcase className="h-3 w-3 text-indigo-400" />
                          Job Role / Title * (Role field)
                        </label>
                        <input
                          type="text"
                          value={lead.title || ''}
                          onChange={(e) => handleUpdateParsedField(idx, 'title', e.target.value)}
                          className="w-full bg-gray-900 border border-indigo-700/60 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400 font-semibold"
                          placeholder="e.g. Technical Recruiter / Software Engineer"
                        />
                      </div>

                      <div className="p-2 rounded-xl bg-gray-900/40 border border-gray-800">
                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1 flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-400" />
                          HR / Candidate Name *
                        </label>
                        <input
                          type="text"
                          value={lead.hr_name}
                          onChange={(e) => handleUpdateParsedField(idx, 'hr_name', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                          placeholder="e.g. John Doe"
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
                          placeholder="+91 98490 12345"
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
                          placeholder="hr@company.com"
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
                          placeholder="https://linkedin.com/in/..."
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
                          placeholder="e.g. Hyderabad / Bengaluru"
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
                          placeholder="e.g. Gen AI, Cyber Security"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1 flex items-center gap-1">
                          <User className="h-3 w-3 text-purple-400" />
                          Assign To Member
                        </label>
                        <select
                          value={lead.spoc || selectedMember}
                          onChange={(e) => handleUpdateParsedField(idx, 'spoc', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-purple-300 focus:outline-none focus:border-purple-500"
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
                Storing in <strong className="text-purple-300">{targetMemberObj.name}'s Sheet</strong>
              </span>
            )}

            <button
              type="button"
              disabled={isSaving || parsedLeads.length === 0}
              onClick={handleSaveAndStore}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-950/50 transition cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {isSaving
                  ? 'Storing Lead...'
                  : `Store ${parsedLeads.length || ''} Lead${parsedLeads.length > 1 ? 's' : ''} in ${targetMemberObj.name}'s Sheet`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
