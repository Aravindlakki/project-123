import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Search,
  Plus,
  UploadCloud,
  Download,
  Building2,
  Phone,
  Mail,
  Linkedin,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ArrowUpDown,
  ShieldCheck,
  Briefcase,
  MapPin,
  Tag,
  User,
  FileText,
  Sparkles,
  X,
  Lock,
  Code2,
} from 'lucide-react';
import { HRContact, Company } from '../types';
import { api } from '../services/api';
import { clientFallbackStore } from '../services/clientFallbackStore';
import { supabaseDataService } from '../services/supabaseDataService';
import { isSupabaseConfigured } from '../services/supabase';
import { SPOC_MEMBERS } from '../data/pdfLeadsData';
import { CompanyDetailsModal } from './CompanyDetailsModal';
import { DocumentIntakeModal } from './DocumentIntakeModal';
import { ExcelWorksheetImportModal } from './ExcelWorksheetImportModal';
import { SystemReportModal } from './SystemReportModal';
import { HtmlLeadImportModal } from './HtmlLeadImportModal';

export interface TeamSheetsPageProps {
  initialSpoc?: string;
  currentUser?: any;
  adminMode?: boolean;
}

export interface PreparedWorksheetLead {
  company_name: string;
  website?: string;
  linkedin_url?: string;
  employee_count?: string;
  industry?: string;
  hr_name: string;
  title?: string;
  phone?: string;
  email?: string;
  hr_linkedin?: string;
  domain?: string;
  location?: string;
  remarks?: string;
  spoc?: string;
  entered_by_name?: string;
}

export const TeamSheetsPage: React.FC<TeamSheetsPageProps> = ({
  initialSpoc,
  currentUser,
  adminMode = false,
}) => {
  const [activeSheet, setActiveSheet] = useState<string>(() => {
    if (initialSpoc) return initialSpoc;
    if (adminMode) return 'all';
    if (currentUser?.name) {
      const matched = SPOC_MEMBERS.find((m) =>
        currentUser.name.toLowerCase().includes(m.id.toLowerCase())
      );
      if (matched) return matched.id;
    }
    return 'all';
  });

  const [leads, setLeads] = useState<HRContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedRemarks, setSelectedRemarks] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Modals
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [excelFileToImport, setExcelFileToImport] = useState<File | null>(null);
  const excelFileInputRef = useRef<HTMLInputElement | null>(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Direct Inline Spreadsheet Import State & Drag-and-Drop
  const [isDragOverPage, setIsDragOverPage] = useState(false);
  const [isParsingDirectFile, setIsParsingDirectFile] = useState(false);
  const [directParsedLeads, setDirectParsedLeads] = useState<PreparedWorksheetLead[]>([]);
  const [directFileName, setDirectFileName] = useState<string | null>(null);
  const [importNotification, setImportNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isConfirmingDirectImport, setIsConfirmingDirectImport] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

  // Form state for adding lead
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyWebsite, setNewCompanyWebsite] = useState('');
  const [newCompanyLinkedin, setNewCompanyLinkedin] = useState('');
  const [newEmployeeCount, setNewEmployeeCount] = useState('100-500 employees');
  const [newHRName, setNewHRName] = useState('');
  const [newHRTitle, setNewHRTitle] = useState('Talent Acquisition Specialist');
  const [newHRPhone, setNewHRPhone] = useState('');
  const [newHREmail, setNewHREmail] = useState('');
  const [newHRLinkedin, setNewHRLinkedin] = useState('');
  const [newDomain, setNewDomain] = useState('Cyber Security');
  const [newLocation, setNewLocation] = useState('Hyderabad');
  const [newRemarks, setNewRemarks] = useState('Pending');
  const [newSpoc, setNewSpoc] = useState('Namitha');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const data = await api.getWorksheetLeads();
      setLeads(data);
    } catch (err) {
      console.error('Failed to fetch worksheet leads', err);
      // Fallback to client storage
      const fallbackContacts = clientFallbackStore.getContacts();
      setLeads(fallbackContacts);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // ============================================================================
  // DIRECT FILE PARSING LOGIC USING THE 'xlsx' LIBRARY
  // Parses .xlsx, .xls, and .csv files, detects columns and prepares leads
  // ============================================================================
  const parseSpreadsheetFile = async (file: File): Promise<PreparedWorksheetLead[]> => {
    setIsParsingDirectFile(true);
    setImportNotification(null);

    try {
      let workbook: XLSX.WorkBook;
      try {
        const buffer = await file.arrayBuffer();
        workbook = XLSX.read(buffer, {
          type: 'array',
          cellDates: true,
          dateNF: 'yyyy-mm-dd',
        });
      } catch (bufErr) {
        const text = await file.text();
        workbook = XLSX.read(text, {
          type: 'string',
          cellDates: true,
          dateNF: 'yyyy-mm-dd',
        });
      }

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('No worksheets found in this spreadsheet.');
      }

      const allExtractedLeads: PreparedWorksheetLead[] = [];
      const defaultSpoc = activeSheet !== 'all' ? activeSheet : 'Namitha';
      const enteredBy = currentUser?.name || 'Aravind Reddy';

      const HEADER_KEYWORDS = [
        'company', 'organisation', 'organization', 'client', 'firm', 'employer',
        'hr', 'recruiter', 'contact', 'name', 'phone', 'mobile', 'cell', 'tel',
        'email', 'mail', 'title', 'designation', 'role', 'position', 'domain',
        'industry', 'sector', 'location', 'city', 'state', 'website', 'url',
        'linkedin', 'spoc', 'remarks', 'status', 'headcount', 'size', 'employees',
        'date', 'notes', 'cra', 'talent'
      ];

      workbook.SheetNames.forEach((sheetName) => {
        const ws = workbook.Sheets[sheetName];
        if (!ws) return;

        const jsonData: any[][] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: '',
          blankrows: false,
          raw: false,
          dateNF: 'yyyy-mm-dd',
        });

        if (!jsonData || jsonData.length === 0) return;

        // Smart keyword-weighted header detection across the first 15 rows
        let bestHeaderIdx = -1;
        let maxMatches = 0;
        for (let i = 0; i < Math.min(15, jsonData.length); i++) {
          const row = jsonData[i] || [];
          let matches = 0;
          for (const cell of row) {
            const str = String(cell ?? '').toLowerCase().trim();
            if (HEADER_KEYWORDS.some((kw) => str.includes(kw))) {
              matches++;
            }
          }
          if (matches > maxMatches) {
            maxMatches = matches;
            bestHeaderIdx = i;
          }
        }

        let headerRowIndex = 0;
        if (bestHeaderIdx >= 0 && maxMatches >= 1) {
          headerRowIndex = bestHeaderIdx;
        } else {
          for (let i = 0; i < Math.min(10, jsonData.length); i++) {
            const nonEmpties = (jsonData[i] || []).filter((v) => String(v ?? '').trim().length > 0);
            if (nonEmpties.length >= 2) {
              headerRowIndex = i;
              break;
            }
          }
        }

        const rawHeaders = (jsonData[headerRowIndex] || []).map((h, i) =>
          String(h ?? '').trim() || `Column_${i + 1}`
        );

        // Map column indices
        const norm = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        let compColIdx = -1;
        let hrColIdx = -1;
        let phoneColIdx = -1;
        let emailColIdx = -1;
        let titleColIdx = -1;
        let linkedinColIdx = -1;
        let domainColIdx = -1;
        let locationColIdx = -1;
        let spocColIdx = -1;

        rawHeaders.forEach((h, idx) => {
          const n = norm(h);
          if (compColIdx === -1 && (n.includes('company') || n.includes('org') || n.includes('client') || n.includes('employer') || n.includes('firm'))) {
            compColIdx = idx;
          }
          if (hrColIdx === -1 && (n.includes('hr') || n.includes('recruiter') || n.includes('contact') || n.includes('talent') || n.includes('person') || n.includes('name')) && !n.includes('company')) {
            hrColIdx = idx;
          }
          if (phoneColIdx === -1 && (n.includes('phone') || n.includes('mobile') || n.includes('contactno') || n.includes('tel') || n.includes('cell') || n.includes('whatsapp'))) {
            phoneColIdx = idx;
          }
          if (emailColIdx === -1 && (n.includes('email') || n.includes('mail'))) {
            emailColIdx = idx;
          }
          if (titleColIdx === -1 && (n.includes('designation') || n.includes('title') || n.includes('role') || n.includes('position'))) {
            titleColIdx = idx;
          }
          if (linkedinColIdx === -1 && (n.includes('linkedin') || n.includes('profile') || n.includes('social'))) {
            linkedinColIdx = idx;
          }
          if (domainColIdx === -1 && (n.includes('domain') || n.includes('industry') || n.includes('sector') || n.includes('tech'))) {
            domainColIdx = idx;
          }
          if (locationColIdx === -1 && (n.includes('location') || n.includes('city') || n.includes('place') || n.includes('address'))) {
            locationColIdx = idx;
          }
          if (spocColIdx === -1 && (n.includes('spoc') || n.includes('assigned') || n.includes('owner') || n.includes('cra'))) {
            spocColIdx = idx;
          }
        });

        // Default fallbacks if not explicitly found
        if (compColIdx === -1 && rawHeaders.length > 0) compColIdx = 0;
        if (hrColIdx === -1 && rawHeaders.length > 1) hrColIdx = 1;
        else if (hrColIdx === -1 && rawHeaders.length > 0) hrColIdx = 0;

        // Process data rows
        for (let r = headerRowIndex + 1; r < jsonData.length; r++) {
          const row = jsonData[r];
          if (!row || row.length === 0) continue;

          let compName = compColIdx !== -1 && row[compColIdx] !== undefined ? String(row[compColIdx]).trim() : '';
          let hrName = hrColIdx !== -1 && row[hrColIdx] !== undefined ? String(row[hrColIdx]).trim() : '';

          // If both are empty, look for any non-empty cell in the row
          if (!compName && !hrName) {
            const cells = row.map((c) => String(c ?? '').trim()).filter((c) => c.length > 0);
            if (cells.length >= 2) {
              compName = cells[0];
              hrName = cells[1];
            } else if (cells.length === 1) {
              compName = cells[0];
              hrName = 'Talent Acquisition Team';
            } else {
              continue;
            }
          } else if (!compName && hrName) {
            compName = 'Imported Organization';
          } else if (compName && !hrName) {
            hrName = 'Talent Acquisition Team';
          }

          const phoneVal = phoneColIdx !== -1 && row[phoneColIdx] !== undefined ? String(row[phoneColIdx]).trim() : '';
          const emailVal = emailColIdx !== -1 && row[emailColIdx] !== undefined ? String(row[emailColIdx]).trim() : '';
          const titleVal = titleColIdx !== -1 && row[titleColIdx] !== undefined ? String(row[titleColIdx]).trim() : 'HR Lead';
          const linkedinVal = linkedinColIdx !== -1 && row[linkedinColIdx] !== undefined ? String(row[linkedinColIdx]).trim() : '';
          const domainVal = domainColIdx !== -1 && row[domainColIdx] !== undefined ? String(row[domainColIdx]).trim() : 'Technology';
          const locVal = locationColIdx !== -1 && row[locationColIdx] !== undefined ? String(row[locationColIdx]).trim() : 'Hyderabad';
          const spocVal = spocColIdx !== -1 && row[spocColIdx] !== undefined && String(row[spocColIdx]).trim() ? String(row[spocColIdx]).trim() : defaultSpoc;

          allExtractedLeads.push({
            company_name: compName,
            hr_name: hrName,
            phone: phoneVal || undefined,
            email: emailVal || undefined,
            title: titleVal || 'HR Lead',
            linkedin_url: linkedinVal.includes('/company/') ? linkedinVal : undefined,
            hr_linkedin: !linkedinVal.includes('/company/') && linkedinVal ? linkedinVal : undefined,
            domain: domainVal || 'Technology',
            location: locVal || 'Hyderabad',
            remarks: 'Imported via Worksheet Excel',
            spoc: spocVal,
            entered_by_name: enteredBy,
          });
        }
      });

      return allExtractedLeads;
    } finally {
      setIsParsingDirectFile(false);
    }
  };

  // Handle file picked via input or dropped onto page
  const handleSpreadsheetPicked = async (file: File) => {
    try {
      const extracted = await parseSpreadsheetFile(file);
      if (extracted.length === 0) {
        setImportNotification({
          type: 'error',
          message: 'No valid company or HR lead rows could be extracted from this spreadsheet.',
        });
        return;
      }
      setDirectParsedLeads(extracted);
      setDirectFileName(file.name);
      setExcelFileToImport(file);
      setImportNotification({
        type: 'success',
        message: `Parsed "${file.name}" successfully! Found ${extracted.length} valid lead records ready to import.`,
      });
    } catch (err: any) {
      console.error('File parsing error:', err);
      setImportNotification({
        type: 'error',
        message: err.message || 'Failed to parse spreadsheet file using xlsx library.',
      });
    }
  };

  // ============================================================================
  // 'CONFIRM IMPORT' EVENT HANDLER
  // Correctly maps extracted worksheet leads to CRM storage services
  // (api.bulkImportWorksheetLeads, supabaseDataService, clientFallbackStore)
  // ============================================================================
  const handleConfirmImport = async (leadsOverride?: PreparedWorksheetLead[]) => {
    const leadsToImport = leadsOverride || directParsedLeads;

    if (!leadsToImport || leadsToImport.length === 0) {
      setImportNotification({
        type: 'error',
        message: 'No valid leads prepared for import. Please select a spreadsheet first.',
      });
      return;
    }

    setIsConfirmingDirectImport(true);
    setImportNotification(null);

    try {
      // 1. Call primary CRM storage API
      const result = await api.bulkImportWorksheetLeads(leadsToImport);

      // 2. Also ensure local client fallback store is directly in sync
      clientFallbackStore.bulkImportWorksheetLeads(leadsToImport);

      // 3. Refresh live leads from CRM database
      await fetchLeads();

      setImportNotification({
        type: 'success',
        message: `Successfully imported ${result.count || leadsToImport.length} leads into the CRM worksheet! (${result.companies_created || 0} companies created).`,
      });

      // Reset direct import preview state
      setDirectParsedLeads([]);
      setDirectFileName(null);
      setExcelFileToImport(null);
    } catch (err: any) {
      console.error('Confirm Import failed:', err);
      // Ensure offline/local fallback store succeeds even if network fails
      try {
        const fallbackRes = clientFallbackStore.bulkImportWorksheetLeads(leadsToImport);
        await fetchLeads();
        setImportNotification({
          type: 'success',
          message: `Saved ${fallbackRes.count} leads to local CRM storage (Offline mode).`,
        });
        setDirectParsedLeads([]);
        setDirectFileName(null);
      } catch (fallbackErr: any) {
        setImportNotification({
          type: 'error',
          message: err.message || 'Failed to save leads to CRM storage services.',
        });
      }
    } finally {
      setIsConfirmingDirectImport(false);
    }
  };

  // Page-level drag and drop handlers
  const handlePageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverPage(true);
  };

  const handlePageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverPage(false);
    }
  };

  const handlePageDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverPage(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const name = file.name.toLowerCase();
      if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
        await handleSpreadsheetPicked(file);
      } else {
        setExcelFileToImport(file);
        setShowExcelModal(true);
      }
    }
  };

  // Filter leads based on active sheet tab and search filters
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Sheet tab filter
      if (activeSheet !== 'all') {
        const leadSpoc = (lead.spoc || '').toLowerCase();
        const enteredBy = (lead.entered_by_name || '').toLowerCase();
        const tabKey = activeSheet.toLowerCase();
        if (!leadSpoc.includes(tabKey) && !enteredBy.includes(tabKey)) {
          return false;
        }
      }

      // Domain filter
      if (selectedDomain !== 'all') {
        if (!lead.domain?.toLowerCase().includes(selectedDomain.toLowerCase())) {
          return false;
        }
      }

      // Remarks filter
      if (selectedRemarks !== 'all') {
        if (lead.remarks?.toLowerCase() !== selectedRemarks.toLowerCase()) {
          return false;
        }
      }

      // Location filter
      if (selectedLocation !== 'all') {
        if (!lead.location?.toLowerCase().includes(selectedLocation.toLowerCase())) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const comp = (lead.company?.name || '').toLowerCase();
        const hr = (lead.name || '').toLowerCase();
        const phone = (lead.phone || '').toLowerCase();
        const email = (lead.email || '').toLowerCase();
        const domain = (lead.domain || '').toLowerCase();
        const loc = (lead.location || '').toLowerCase();
        return (
          comp.includes(q) ||
          hr.includes(q) ||
          phone.includes(q) ||
          email.includes(q) ||
          domain.includes(q) ||
          loc.includes(q)
        );
      }

      return true;
    });
  }, [leads, activeSheet, selectedDomain, selectedRemarks, selectedLocation, searchQuery]);

  // Statistics for current sheet
  const stats = useMemo(() => {
    const sheetData = activeSheet === 'all'
      ? leads
      : leads.filter((l) =>
          (l.spoc || '').toLowerCase().includes(activeSheet.toLowerCase()) ||
          (l.entered_by_name || '').toLowerCase().includes(activeSheet.toLowerCase())
        );

    const total = sheetData.length;
    const withPhone = sheetData.filter((l) => l.phone && l.phone.trim().length > 5).length;
    const withEmail = sheetData.filter((l) => l.email && l.email.includes('@')).length;
    const responded = sheetData.filter((l) => (l.remarks || '').toLowerCase() === 'responded').length;
    const hold = sheetData.filter((l) => (l.remarks || '').toLowerCase() === 'hold').length;
    const pendingOrMail = sheetData.filter((l) => {
      const r = (l.remarks || '').toLowerCase();
      return r === 'mail sent' || r === 'pending' || r === 'not responded';
    }).length;

    return { total, withPhone, withEmail, responded, hold, pendingOrMail };
  }, [leads, activeSheet]);

  // Count per sheet for badges
  const sheetCounts = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length };
    SPOC_MEMBERS.forEach((m) => {
      counts[m.id] = leads.filter(
        (l) =>
          (l.spoc || '').toLowerCase().includes(m.id.toLowerCase()) ||
          (l.entered_by_name || '').toLowerCase().includes(m.id.toLowerCase())
      ).length;
    });
    return counts;
  }, [leads]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdateRemarks = async (contactId: string, newRemark: string) => {
    if (!adminMode && currentUser?.role !== 'admin') {
      setImportNotification({
        type: 'error',
        message: 'Permission Restricted: Employees cannot edit lead status. Only Administrator can edit remarks.',
      });
      return;
    }
    try {
      await api.updateContact(contactId, { remarks: newRemark });
      setLeads((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, remarks: newRemark } : c))
      );
    } catch (err) {
      console.error('Failed to update remarks', err);
    }
  };

  const executeDeleteLead = async () => {
    if (!leadToDelete) return;
    if (!adminMode && currentUser?.role !== 'admin') {
      setImportNotification({
        type: 'error',
        message: 'Permission Restricted: Employees cannot delete records. Only Administrator can remove rows.',
      });
      setLeadToDelete(null);
      return;
    }
    const contactId = leadToDelete;
    setLeadToDelete(null);
    try {
      await api.deleteContact(contactId);
      setLeads((prev) => prev.filter((c) => c.id !== contactId));
    } catch (err) {
      console.error('Failed to delete lead', err);
    }
  };

  const handleOpenCompanyModal = (lead: HRContact) => {
    if (lead.company) {
      setSelectedCompany(lead.company);
      setShowCompanyModal(true);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Company Name',
      'Employee Headcount',
      'Company LinkedIn',
      'Website',
      'HR Contact Name',
      'Designation / Title',
      'Phone Number',
      'Email',
      'HR LinkedIn',
      'Domain',
      'Location',
      'Remarks / Status',
      'SPOC',
      'Entered By',
    ];

    const exportData = filteredLeads.length > 0 ? filteredLeads : [
      {
        name: 'Monisha Kanduri',
        title: 'HR Manager',
        phone: '+91 98765 43210',
        email: 'monisha@autoliv.com',
        linkedin_url: 'https://linkedin.com/in/monisha-example',
        domain: 'Automotive & Safety Systems',
        location: 'Bangalore, India',
        remarks: 'Sample Lead Template',
        spoc: activeSheet === 'all' ? 'Aravind' : activeSheet,
        entered_by_name: `${activeSheet === 'all' ? 'Aravind' : activeSheet} Reddy`,
        company: {
          name: 'Autoliv India',
          employee_count: '1,000+ employees',
          linkedin_url: 'https://linkedin.com/company/autoliv',
          website: 'https://www.autoliv.com',
        },
      } as any,
    ];

    const rows = exportData.map((l) => [
      `"${l.company?.name || ''}"`,
      `"${l.company?.employee_count || '100-500 employees'}"`,
      `"${l.company?.linkedin_url || ''}"`,
      `"${l.company?.website || ''}"`,
      `"${l.name || ''}"`,
      `"${l.title || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${l.linkedin_url || ''}"`,
      `"${l.domain || ''}"`,
      `"${l.location || ''}"`,
      `"${l.remarks || 'Pending'}"`,
      `"${l.spoc || ''}"`,
      `"${l.entered_by_name || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const sheetName = activeSheet === 'all' ? 'Master_All_Leads' : `${activeSheet}_Sheet`;
    link.setAttribute('download', `PLACEMEIN_${sheetName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim() || !newHRName.trim()) {
      setFormError('Company name and HR name are required.');
      return;
    }

    setIsSubmittingLead(true);
    setFormError(null);

    try {
      const created = await api.createWorksheetLead({
        company_name: newCompanyName.trim(),
        website: newCompanyWebsite.trim() || undefined,
        linkedin_url: newCompanyLinkedin.trim() || undefined,
        employee_count: newEmployeeCount.trim() || undefined,
        hr_name: newHRName.trim(),
        title: newHRTitle.trim() || undefined,
        phone: newHRPhone.trim() || undefined,
        email: newHREmail.trim() || undefined,
        hr_linkedin: newHRLinkedin.trim() || undefined,
        domain: newDomain.trim() || undefined,
        location: newLocation.trim() || undefined,
        remarks: newRemarks.trim() || 'Pending',
        spoc: newSpoc,
        entered_by_name: currentUser?.name || `${newSpoc} (Assigned)`,
      });

      setLeads((prev) => [created, ...prev]);
      setShowAddLeadModal(false);
      // Reset form
      setNewCompanyName('');
      setNewCompanyWebsite('');
      setNewCompanyLinkedin('');
      setNewHRName('');
      setNewHRPhone('');
      setNewHREmail('');
      setNewHRLinkedin('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to add lead to sheet');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const getRemarksBadgeClass = (remarks?: string) => {
    switch (remarks?.toLowerCase()) {
      case 'responded':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'hold':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'mail sent':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/60';
      case 'no hirings':
      case 'no openings':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/60';
      case 'not responded':
        return 'bg-gray-800 text-gray-400 border-gray-700';
      default:
        return 'bg-purple-950/80 text-purple-300 border-purple-700/60';
    }
  };

  return (
    <div
      onDragOver={handlePageDragOver}
      onDragLeave={handlePageDragLeave}
      onDrop={handlePageDrop}
      className="space-y-6 relative"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragOverPage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm border-4 border-dashed border-emerald-500 rounded-3xl flex flex-col items-center justify-center p-6 text-center pointer-events-none animate-fade-in">
          <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-2xl mb-4 border border-emerald-500/40">
            <UploadCloud className="h-16 w-16 animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-white">Drop Excel or CSV File Here</h2>
          <p className="text-sm text-gray-300 mt-2 max-w-md">
            Release your spreadsheet to instantly parse with SheetJS ('xlsx') and import into Team Worksheets.
          </p>
        </div>
      )}

      {/* Global Notification Banner */}
      {importNotification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold animate-fade-in ${
            importNotification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {importNotification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            )}
            <span>{importNotification.message}</span>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="p-1 rounded hover:bg-white/10 transition text-gray-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Direct Parsed Preview & 'Confirm Import' Action Bar */}
      {directParsedLeads.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-950/90 via-gray-900 to-teal-950/90 border border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-4 animate-scale-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Parsed Spreadsheet: {directFileName}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {directParsedLeads.length} Leads Ready
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-0.5">
                  Parsed via <strong>'xlsx'</strong> engine. Click <strong>Confirm Import</strong> to save to CRM storage services.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setDirectParsedLeads([]);
                  setDirectFileName(null);
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl transition"
              >
                Discard
              </button>

              <button
                type="button"
                aria-label="Confirm Import"
                data-testid="confirm-import-btn"
                disabled={isConfirmingDirectImport}
                onClick={() => handleConfirmImport()}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition cursor-pointer border border-emerald-400/30 disabled:opacity-50"
              >
                {isConfirmingDirectImport ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>Confirming Import...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                    <span>Confirm Import ({directParsedLeads.length} Leads)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Preview Table of Parsed Rows */}
          <div className="border border-gray-800 rounded-xl overflow-x-auto bg-gray-950/70 max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-800/90 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-700 sticky top-0">
                <tr>
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">HR Contact</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">SPOC</th>
                  <th className="px-3 py-2">Domain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {directParsedLeads.slice(0, 10).map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/40">
                    <td className="px-3 py-2 font-bold text-white whitespace-nowrap">{item.company_name}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.hr_name}</td>
                    <td className="px-3 py-2 text-emerald-400 font-mono whitespace-nowrap">{item.phone || '—'}</td>
                    <td className="px-3 py-2 text-indigo-300 whitespace-nowrap">{item.email || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {item.spoc}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{item.domain || 'Technology'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className={`bg-gradient-to-r ${adminMode ? 'from-amber-950/80 via-gray-900 to-amber-950/80 border-amber-800/40' : 'from-purple-950/80 via-gray-900 to-indigo-950/80 border-purple-800/40'} border rounded-3xl p-6 shadow-xl relative overflow-hidden`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`p-1.5 ${adminMode ? 'bg-amber-600/30 border-amber-500/40 text-amber-300' : 'bg-purple-600/30 border-purple-500/40 text-purple-300'} border rounded-lg`}>
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider ${adminMode ? 'text-amber-300' : 'text-purple-300'}`}>
                {adminMode ? 'Admin Portal · Master Worksheets & PDF Database' : 'Data Management & Sourcing Worksheets'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {adminMode ? 'All Worksheets & PDF Database' : 'Team Worksheets & PDF Database'}
            </h1>
            <p className="text-sm text-gray-300 mt-1 max-w-2xl">
              {adminMode
                ? 'Centralized admin oversight of all parsed company numbers, employee headcounts, and verified HR contacts from uploaded PDFs. Filter across all SPOC sheets or export master records.'
                : 'All parsed company numbers, employee headcounts, and verified HR contacts from the uploaded PDF. Each team member has their dedicated separate sheet with full contact details.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Direct XLSX File Input */}
            <input
              type="file"
              ref={excelFileInputRef}
              accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
              className="hidden"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) {
                  handleSpreadsheetPicked(picked);
                  e.target.value = '';
                }
              }}
            />

            {/* HTML Lead Importer Button */}
            <button
              onClick={() => setShowHtmlModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-950/40 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer border border-purple-500/30"
              title="Import lead from raw HTML, web snippet, or HTML file into selected member sheet"
              aria-label="Import HTML Lead"
            >
              <Code2 className="h-4 w-4 text-pink-300" />
              <span>Import HTML Lead</span>
            </button>

            {/* Quick Upload Button */}
            <button
              onClick={() => excelFileInputRef.current?.click()}
              disabled={isParsingDirectFile}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-950/40 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer border border-emerald-500/30"
              title="Upload and parse an Excel (.xlsx, .xls) or CSV file directly"
              aria-label="Upload Excel File"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>{isParsingDirectFile ? 'Parsing...' : 'Upload Excel Sheet'}</span>
            </button>

            {/* Advanced Import Modal Button */}
            <button
              onClick={() => {
                setExcelFileToImport(null);
                setShowExcelModal(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-800 hover:bg-gray-700 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all cursor-pointer shadow-sm"
              title="Open full Excel & CSV Import Wizard with column mapping and duplicate check"
              aria-label="Import Excel Wizard"
            >
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Import Wizard</span>
            </button>

            <button
              onClick={() => setShowDocumentModal(true)}
              className={`flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r ${adminMode ? 'from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-900/30' : 'from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-900/30'} text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer`}
            >
              <UploadCloud className="h-4 w-4" />
              <span>Import New PDF / Doc</span>
            </button>

            <button
              onClick={() => {
                setNewSpoc(activeSheet !== 'all' ? activeSheet : 'Namitha');
                setShowAddLeadModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl border border-gray-700 transition-all cursor-pointer"
            >
              <Plus className={`h-4 w-4 ${adminMode ? 'text-amber-400' : 'text-purple-400'}`} />
              <span>Add Row to Sheet</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-900/80 hover:bg-gray-800 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 transition-all cursor-pointer"
              title="Download active sheet as CSV"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-200 text-xs font-bold rounded-xl border border-indigo-700/60 transition-all cursor-pointer shadow-sm"
              title="View End-to-End System Report & Print as PDF"
            >
              <FileText className="h-4 w-4 text-indigo-400" />
              <span className="hidden sm:inline">System Report</span>
              <span className="text-[9px] bg-indigo-500/30 px-1 py-0.2 rounded text-indigo-200 font-extrabold uppercase">PDF</span>
            </button>

            <button
              onClick={fetchLeads}
              className="p-2.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl border border-gray-700 transition-all cursor-pointer"
              title="Refresh sheet data"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? `animate-spin ${adminMode ? 'text-amber-400' : 'text-purple-400'}` : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Team Member Tabs ("everyone have their separate sheet") */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-2 shadow-lg backdrop-blur-md">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1 flex items-center justify-between">
          <span>{adminMode ? 'Filter by Team Member Sheet:' : 'Select Dedicated Team Sheet:'}</span>
          <span className="text-gray-500 text-[10px]">Click any tab to switch individual view</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
          {/* Master View */}
          <button
            onClick={() => setActiveSheet('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSheet === 'all'
                ? adminMode
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                  : 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'bg-gray-800/60 hover:bg-gray-800 text-gray-300 border border-gray-700/50'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Master View (All Sheets)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              activeSheet === 'all'
                ? adminMode ? 'bg-amber-800 text-amber-100' : 'bg-purple-800 text-purple-200'
                : 'bg-gray-700 text-gray-300'
            }`}>
              {sheetCounts.all || 0}
            </span>
          </button>

          {/* Individual SPOC Sheet Tabs */}
          {SPOC_MEMBERS.map((member) => {
            const isActive = activeSheet.toLowerCase() === member.id.toLowerCase();
            const count = sheetCounts[member.id] || 0;
            return (
              <button
                key={member.id}
                onClick={() => setActiveSheet(member.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? adminMode
                      ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-md shadow-amber-950 border border-amber-400/40'
                      : 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md shadow-purple-950 border border-purple-400/40'
                    : 'bg-gray-800/60 hover:bg-gray-800 text-gray-300 border border-gray-700/50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${member.avatarBg}`} />
                <span>{member.name}'s Sheet</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isActive
                    ? adminMode ? 'bg-amber-900 text-amber-200' : 'bg-purple-900 text-purple-200'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards for the active sheet */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Total Records</span>
            <Building2 className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5">{stats.total}</div>
          <div className="text-[11px] text-gray-400 mt-0.5 truncate">
            {activeSheet === 'all' ? 'All CRA sheets' : `${activeSheet}'s allocated leads`}
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Verified Phone</span>
            <Phone className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1.5">{stats.withPhone}</div>
          <div className="text-[11px] text-emerald-500/80 mt-0.5">
            {stats.total > 0 ? Math.round((stats.withPhone / stats.total) * 100) : 0}% Phone coverage
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Emails Available</span>
            <Mail className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-1.5">{stats.withEmail}</div>
          <div className="text-[11px] text-blue-400/80 mt-0.5">Direct HR mailboxes</div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Responded</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 mt-1.5">{stats.responded}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Positive discussions</div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>On Hold</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1.5">{stats.hold}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Follow-up needed</div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Pending / Out</span>
            <AlertCircle className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 mt-1.5">{stats.pendingOrMail}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Awaiting response</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search company, HR name, phone, email, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/80 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Domain Filter */}
          <div className="flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300">
            <Briefcase className="h-3.5 w-3.5 text-purple-400" />
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-transparent border-none text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-gray-900">All Domains</option>
              <option value="Cyber Security" className="bg-gray-900">Cyber Security</option>
              <option value="Gen AI" className="bg-gray-900">Gen AI</option>
              <option value="Full Stack" className="bg-gray-900">Full Stack</option>
              <option value="Data Science" className="bg-gray-900">Data Science</option>
              <option value="SAP" className="bg-gray-900">SAP / ERP</option>
            </select>
          </div>

          {/* Remarks Filter */}
          <div className="flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300">
            <Filter className="h-3.5 w-3.5 text-amber-400" />
            <select
              value={selectedRemarks}
              onChange={(e) => setSelectedRemarks(e.target.value)}
              className="bg-transparent border-none text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-gray-900">All Statuses</option>
              <option value="Responded" className="bg-gray-900">Responded</option>
              <option value="Hold" className="bg-gray-900">Hold</option>
              <option value="Mail Sent" className="bg-gray-900">Mail Sent</option>
              <option value="Pending" className="bg-gray-900">Pending</option>
              <option value="Not Responded" className="bg-gray-900">Not Responded</option>
              <option value="No Hirings" className="bg-gray-900">No Openings</option>
            </select>
          </div>

          {(selectedDomain !== 'all' || selectedRemarks !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedDomain('all');
                setSelectedRemarks('all');
                setSearchQuery('');
              }}
              className="text-xs text-purple-400 hover:text-purple-300 underline font-medium px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Spreadsheet Table View */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Mobile Swipe Hint */}
        <div className="md:hidden px-3.5 py-2.5 bg-purple-950/50 border-b border-gray-800 flex items-center justify-between text-xs text-purple-200">
          <span className="flex items-center gap-1.5 font-medium">
            <span>👉 Swipe sideways to view all sheet columns & contact details</span>
          </span>
          <span className="text-[10px] text-purple-300 font-semibold px-2 py-0.5 rounded bg-purple-900/60 border border-purple-700/50">
            Scrollable
          </span>
        </div>
        <div className="overflow-x-auto w-full touch-pan-x scrollbar-thin scrollbar-thumb-gray-700">
          <table className="w-full min-w-[1100px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-4 min-w-[200px]">Company Name & Details</th>
                <th className="py-3 px-4 min-w-[180px]">HR Contact & Role</th>
                <th className="py-3 px-4 min-w-[140px]">Phone Number</th>
                <th className="py-3 px-4 min-w-[170px]">Email Address</th>
                <th className="py-3 px-3 min-w-[120px]">Domain</th>
                <th className="py-3 px-3 min-w-[110px]">Location</th>
                <th className="py-3 px-4 min-w-[140px]">Remarks / Status</th>
                <th className="py-3 px-4 min-w-[120px]">Sheet SPOC</th>
                <th className="py-3 px-3 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-400" />
                    <span>Loading worksheet records...</span>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm font-semibold text-gray-300">No records found for this sheet.</p>
                    <p className="text-xs text-gray-500 mt-1">Try resetting filters, upload an Excel file, or click "+ Add Row to Sheet".</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead, idx) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-purple-950/20 transition-colors group"
                  >
                    {/* Index */}
                    <td className="py-3 px-3 text-center text-gray-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Company Name & Headcount */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <button
                          onClick={() => handleOpenCompanyModal(lead)}
                          className="font-bold text-white group-hover:text-purple-300 text-left transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Click to view company headcount, LinkedIn & all HR details"
                        >
                          <Building2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                          <span className="underline decoration-purple-500/40 underline-offset-2">
                            {lead.company?.name || 'Unnamed Company'}
                          </span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 text-purple-400 transition-opacity" />
                        </button>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-400 bg-gray-800/80 px-1.5 py-0.5 rounded border border-gray-700/50 flex items-center gap-1">
                            <Users className="h-2.5 w-2.5 text-purple-400" />
                            {lead.company?.employee_count || '100-500 employees'}
                          </span>
                          {lead.company?.linkedin_url && (
                            <a
                              href={lead.company.linkedin_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-400 hover:text-blue-300"
                              title="Company LinkedIn"
                            >
                              <Linkedin className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* HR Contact & Role */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-200 flex items-center gap-1.5">
                        <span>{lead.name}</span>
                        {lead.linkedin_url && (
                          <a
                            href={lead.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                            title="HR LinkedIn Profile"
                          >
                            <Linkedin className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 truncate max-w-[160px]" title={lead.title}>
                        {lead.title || 'Talent Acquisition'}
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td className="py-3 px-4">
                      {lead.phone ? (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${lead.phone}`}
                            className="font-mono text-[11px] font-semibold text-emerald-400 hover:underline bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-lg flex items-center gap-1"
                          >
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </a>
                          <button
                            onClick={() => handleCopyText(lead.phone!, `p_${lead.id}`)}
                            className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-800"
                            title="Copy Phone"
                          >
                            {copiedId === `p_${lead.id}` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic text-[11px]">—</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4">
                      {lead.email ? (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-[11px] text-blue-300 hover:underline truncate max-w-[140px] block"
                            title={lead.email}
                          >
                            {lead.email}
                          </a>
                          <button
                            onClick={() => handleCopyText(lead.email!, `e_${lead.id}`)}
                            className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-800 shrink-0"
                            title="Copy Email"
                          >
                            {copiedId === `e_${lead.id}` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic text-[11px]">—</span>
                      )}
                    </td>

                    {/* Domain */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded-md text-[11px] text-purple-300 whitespace-nowrap">
                        {lead.domain || 'IT Services'}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3">
                      <span className="text-[11px] text-gray-300 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-500 shrink-0" />
                        <span className="truncate max-w-[90px]">{lead.location || 'Hyderabad'}</span>
                      </span>
                    </td>

                    {/* Remarks / Status - Editable only by Admin */}
                    <td className="py-3 px-4">
                      {adminMode || currentUser?.role === 'admin' ? (
                        <select
                          value={lead.remarks || 'Pending'}
                          onChange={(e) => handleUpdateRemarks(lead.id, e.target.value)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${getRemarksBadgeClass(
                            lead.remarks
                          )}`}
                        >
                          <option value="Responded" className="bg-gray-900 text-emerald-300">Responded</option>
                          <option value="Hold" className="bg-gray-900 text-amber-300">Hold</option>
                          <option value="Mail Sent" className="bg-gray-900 text-blue-300">Mail Sent</option>
                          <option value="Pending" className="bg-gray-900 text-purple-300">Pending</option>
                          <option value="Not Responded" className="bg-gray-900 text-gray-300">Not Responded</option>
                          <option value="No Hirings" className="bg-gray-900 text-rose-300">No Openings</option>
                        </select>
                      ) : (
                        <div
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 cursor-not-allowed ${getRemarksBadgeClass(
                            lead.remarks
                          )}`}
                          title="View-Only: Only Administrator can modify lead remarks and status."
                        >
                          <Lock className="h-3 w-3 opacity-70" />
                          <span>{lead.remarks || 'Pending'}</span>
                        </div>
                      )}
                    </td>

                    {/* Sheet SPOC / Entered By */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-purple-900 text-purple-300 border border-purple-700 flex items-center justify-center text-[10px] font-bold">
                          {(lead.spoc || lead.entered_by_name || 'A')[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-gray-200">
                            {lead.spoc || 'Assigned'}
                          </span>
                          <span className="text-[9px] text-gray-400 truncate max-w-[80px]">
                            {lead.entered_by_name || 'Placemein'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Quick Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenCompanyModal(lead)}
                          className="p-1.5 text-gray-400 hover:text-purple-300 hover:bg-gray-800 rounded transition-colors"
                          title="View Company Details"
                        >
                          <Building2 className="h-3.5 w-3.5" />
                        </button>
                        {adminMode || currentUser?.role === 'admin' ? (
                          <button
                            onClick={() => setLeadToDelete(lead.id)}
                            className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-gray-800 rounded transition-colors"
                            title="Remove row from sheet (Admin Only)"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setImportNotification({
                                type: 'error',
                                message: 'Permission Denied: Employees cannot delete records. Only Administrator can remove rows.',
                              })
                            }
                            className="p-1.5 text-gray-600 hover:text-gray-400 rounded transition-colors cursor-not-allowed opacity-50"
                            title="Employees cannot delete records. Admin only."
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Row Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Add Row to {newSpoc}'s Sheet</h3>
              </div>
              <button
                onClick={() => setShowAddLeadModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLeadSubmit} className="space-y-4 mt-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
                  {formError}
                </div>
              )}

              {/* Target Sheet Selection */}
              <div>
                <label className="block text-gray-400 font-bold mb-1">Target Team Sheet (SPOC)</label>
                <select
                  value={newSpoc}
                  onChange={(e) => setNewSpoc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white font-semibold"
                >
                  {SPOC_MEMBERS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}'s Dedicated Sheet
                    </option>
                  ))}
                </select>
              </div>

              {/* Company Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CrowdStrike India"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Employee Headcount</label>
                  <input
                    type="text"
                    placeholder="e.g. 1,000-5,000 employees"
                    value={newEmployeeCount}
                    onChange={(e) => setNewEmployeeCount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Company Website</label>
                  <input
                    type="text"
                    placeholder="https://example.com"
                    value={newCompanyWebsite}
                    onChange={(e) => setNewCompanyWebsite(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Company LinkedIn Page</label>
                  <input
                    type="text"
                    placeholder="https://linkedin.com/company/example"
                    value={newCompanyLinkedin}
                    onChange={(e) => setNewCompanyLinkedin(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500"
                  />
                </div>
              </div>

              {/* HR Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-800">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">HR Contact Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={newHRName}
                    onChange={(e) => setNewHRName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">HR Designation</label>
                  <input
                    type="text"
                    placeholder="Talent Acquisition Lead"
                    value={newHRTitle}
                    onChange={(e) => setNewHRTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">HR Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newHRPhone}
                    onChange={(e) => setNewHRPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">HR Email</label>
                  <input
                    type="email"
                    placeholder="priya.s@example.com"
                    value={newHREmail}
                    onChange={(e) => setNewHREmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Domain</label>
                  <select
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white"
                  >
                    <option value="Cyber Security">Cyber Security</option>
                    <option value="Gen AI">Gen AI</option>
                    <option value="Full Stack">Full Stack</option>
                    <option value="Data Science">Data Science</option>
                    <option value="SAP / ERP">SAP / ERP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Hyderabad"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Remarks</label>
                  <select
                    value={newRemarks}
                    onChange={(e) => setNewRemarks(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white"
                  >
                    <option value="Responded">Responded</option>
                    <option value="Hold">Hold</option>
                    <option value="Mail Sent">Mail Sent</option>
                    <option value="Pending">Pending</option>
                    <option value="Not Responded">Not Responded</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {isSubmittingLead ? 'Adding to Sheet...' : 'Add Lead to Sheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Company Details Modal */}
      <CompanyDetailsModal
        company={selectedCompany}
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        onUpdateCompany={(updated) => {
          setSelectedCompany(updated);
          setLeads((prev) =>
            prev.map((c) =>
              c.company_id === updated.id
                ? { ...c, company: { ...c.company, ...updated } }
                : c
            )
          );
        }}
      />

      {/* Lead Deletion Confirmation Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-gray-950 border border-purple-800/70 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Remove Row from Sheet</h3>
            </div>
            <p className="text-xs text-gray-300">
              Are you sure you want to remove this lead row from the active worksheet?
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-800/40">
              <button
                type="button"
                onClick={() => setLeadToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteLead}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document & PDF Intake Modal */}
      <DocumentIntakeModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        currentUser={currentUser}
        onDataStored={(comp, contacts) => {
          fetchLeads();
        }}
        onViewCompany={(comp) => {
          setSelectedCompany(comp);
          setShowCompanyModal(true);
        }}
      />

      {/* Excel & Spreadsheet Import Modal */}
      <ExcelWorksheetImportModal
        isOpen={showExcelModal}
        onClose={() => {
          setShowExcelModal(false);
          setExcelFileToImport(null);
        }}
        currentUser={currentUser}
        defaultSpoc={activeSheet}
        adminMode={adminMode}
        initialFile={excelFileToImport}
        onImportSuccess={() => {
          fetchLeads();
        }}
      />

      {/* End-to-End System Report & PDF Modal */}
      <SystemReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

      {/* HTML Lead Import Modal */}
      <HtmlLeadImportModal
        isOpen={showHtmlModal}
        onClose={() => setShowHtmlModal(false)}
        defaultMember={activeSheet !== 'all' ? activeSheet : 'Aravind'}
        onSaveLeads={async (leadsToSave, targetSpoc) => {
          await handleConfirmImport(leadsToSave);
          setActiveSheet(targetSpoc);
          setImportNotification({
            type: 'success',
            message: `Successfully imported ${leadsToSave.length} lead${leadsToSave.length > 1 ? 's' : ''} from HTML into ${targetSpoc}'s sheet!`,
          });
        }}
      />
    </div>
  );
};

export default TeamSheetsPage;
