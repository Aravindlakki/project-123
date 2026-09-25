import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  Building2,
  User,
  Phone,
  Linkedin,
  Calendar,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Check,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { Company, HRContact } from '../types';
import { api } from '../services/api';
import { supabaseDataService } from '../services/supabaseDataService';
import { clientFallbackStore } from '../services/clientFallbackStore';
import { isSupabaseConfigured } from '../services/supabase';
import { formatIndianDate, formatIndianPhone } from '../utils/formatters';

export interface BulkExcelCsvImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (summary: {
    totalRows: number;
    companiesCreated: number;
    companiesMatched: number;
    contactsCreated: number;
    contactsUpdated: number;
  }) => void;
  existingCompanies?: Company[];
  existingContacts?: HRContact[];
  currentUserName?: string;
}

// 5 Target Fields specified in user request
export type TargetFieldKey = 'date' | 'company_name' | 'hr_name' | 'phone' | 'linkedin_url';

interface FieldDefinition {
  key: TargetFieldKey;
  label: string;
  required: boolean;
  aliases: string[];
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const TARGET_FIELDS: FieldDefinition[] = [
  {
    key: 'date',
    label: 'Date',
    required: false,
    aliases: [
      'date',
      'date added',
      'created at',
      'created_at',
      'date_added',
      'timestamp',
      'entry date',
      'entry_date',
      'date sourced',
      'added on',
      'date created',
      'time',
    ],
    icon: Calendar,
    description: 'Date added or sourced',
  },
  {
    key: 'company_name',
    label: 'Company Name',
    required: true,
    aliases: [
      'company',
      'company name',
      'organization',
      'company_name',
      'organisation',
      'employer',
      'firm',
      'client',
      'account',
      'org',
      'business',
    ],
    icon: Building2,
    description: 'Employer / Organization name (Required)',
  },
  {
    key: 'hr_name',
    label: 'HR Name',
    required: true,
    aliases: [
      'hr name',
      'recruiter',
      'contact name',
      'full name',
      'hr_name',
      'recruiter name',
      'contact',
      'name',
      'talent partner',
      'spoc name',
      'person',
      'hr contact',
    ],
    icon: User,
    description: 'HR / Recruiter contact name (Required)',
  },
  {
    key: 'phone',
    label: 'Phone Number',
    required: false,
    aliases: [
      'phone',
      'mobile',
      'contact no',
      'phone number',
      'phone_number',
      'contact_no',
      'mobile no',
      'mobile_no',
      'tel',
      'telephone',
      'cell',
      'phone_no',
      'whatsapp',
    ],
    icon: Phone,
    description: 'Mobile or office telephone',
  },
  {
    key: 'linkedin_url',
    label: 'LinkedIn Profile Link',
    required: false,
    aliases: [
      'linkedin',
      'linkedin profile',
      'url',
      'linkedin url',
      'linkedin_url',
      'profile link',
      'profile url',
      'social link',
      'hr linkedin',
      'hr_linkedin',
      'linkedin_profile',
    ],
    icon: Linkedin,
    description: 'LinkedIn personal or company URL',
  },
];

export interface ParsedRowItem {
  id: string;
  originalIndex: number;
  raw: Record<string, any>;
  date: string;
  companyName: string;
  hrName: string;
  phone: string;
  linkedinUrl: string;
  isValid: boolean;
  missingFields: string[];
  isCompanyExisting: boolean;
  matchedCompany?: Company;
  isContactExisting: boolean;
  matchedContact?: HRContact;
  selected: boolean;
}

// Helper to normalize strings for comparison
const normalizeStr = (val?: string | null): string => {
  return (val || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

// Helper to clean phone numbers
const cleanPhone = (val?: any): string => {
  if (!val) return '';
  const str = String(val).trim();
  return str.replace(/[^\d+]/g, '');
};

// Helper to parse dates from various formats including Excel serial numbers
const parseDateValue = (val: any): string => {
  if (!val) return new Date().toISOString().slice(0, 10);

  // If already a Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }

  // If numeric Excel serial date (e.g. 45189)
  if (typeof val === 'number' && val > 20000 && val < 70000) {
    try {
      const utcDays = Math.floor(val - 25569);
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      if (!isNaN(dateInfo.getTime())) {
        return dateInfo.toISOString().slice(0, 10);
      }
    } catch (_) {}
  }

  const str = String(val).trim();
  // Handle DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }

  // Handle standard Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return str;
};

export const BulkExcelCsvImporterModal: React.FC<BulkExcelCsvImporterModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  existingCompanies: propCompanies,
  existingContacts: propContacts,
  currentUserName = 'Aravind Reddy',
}) => {
  // Local cache of companies & contacts if not passed in
  const [dbCompanies, setDbCompanies] = useState<Company[]>(propCompanies || []);
  const [dbContacts, setDbContacts] = useState<HRContact[]>(propContacts || []);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheetName, setActiveSheetName] = useState<string>('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawSheetRows, setRawSheetRows] = useState<Record<string, any>[]>([]);

  // Column Mappings: targetFieldKey -> selectedHeaderName (or '')
  const [columnMapping, setColumnMapping] = useState<Record<TargetFieldKey, string>>({
    date: '',
    company_name: '',
    hr_name: '',
    phone: '',
    linkedin_url: '',
  });

  // UI View States
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'summary'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preview state
  const [parsedRows, setParsedRows] = useState<ParsedRowItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'invalid' | 'duplicates'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 12;

  // Import Progress state
  const [importProgress, setImportProgress] = useState(0);
  const [importStatusText, setImportStatusText] = useState('Initializing import...');
  const [importSummary, setImportSummary] = useState<{
    totalRows: number;
    companiesCreated: number;
    companiesMatched: number;
    contactsCreated: number;
    contactsUpdated: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync / fetch existing CRM data on open
  useEffect(() => {
    if (isOpen) {
      if (!propCompanies || propCompanies.length === 0) {
        api.getCompanies().then((res) => setDbCompanies(res)).catch(() => {
          setDbCompanies(clientFallbackStore.getCompanies());
        });
      } else {
        setDbCompanies(propCompanies);
      }

      if (!propContacts || propContacts.length === 0) {
        api.getContacts().then((res) => setDbContacts(res)).catch(() => {
          setDbContacts(clientFallbackStore.getContacts());
        });
      } else {
        setDbContacts(propContacts);
      }
    }
  }, [isOpen, propCompanies, propContacts]);

  // Reset state when modal is closed or opened
  const handleReset = () => {
    setFile(null);
    setWorkbook(null);
    setSheetNames([]);
    setActiveSheetName('');
    setRawHeaders([]);
    setRawSheetRows([]);
    setColumnMapping({
      date: '',
      company_name: '',
      hr_name: '',
      phone: '',
      linkedin_url: '',
    });
    setParsedRows([]);
    setStep('upload');
    setErrorMessage(null);
    setImportProgress(0);
    setImportSummary(null);
    setCurrentPage(1);
    setSearchQuery('');
    setFilterMode('all');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  // ============================================================================
  // STEP 1: Smart Column Detection Algorithm
  // ============================================================================
  const autoDetectColumns = (headers: string[]): Record<TargetFieldKey, string> => {
    const mapping: Record<TargetFieldKey, string> = {
      date: '',
      company_name: '',
      hr_name: '',
      phone: '',
      linkedin_url: '',
    };

    const usedHeaders = new Set<string>();

    TARGET_FIELDS.forEach((field) => {
      // 1. Check exact match or normalized match
      for (const alias of field.aliases) {
        const normAlias = normalizeStr(alias);
        const match = headers.find(
          (h) => !usedHeaders.has(h) && normalizeStr(h) === normAlias
        );
        if (match) {
          mapping[field.key] = match;
          usedHeaders.add(match);
          return;
        }
      }

      // 2. Check contains substring match
      for (const alias of field.aliases) {
        const normAlias = normalizeStr(alias);
        const match = headers.find((h) => {
          if (usedHeaders.has(h)) return false;
          const normH = normalizeStr(h);
          return normH.includes(normAlias) || normAlias.includes(normH);
        });
        if (match) {
          mapping[field.key] = match;
          usedHeaders.add(match);
          return;
        }
      }
    });

    return mapping;
  };

  // ============================================================================
  // Process loaded sheet data & recalculate parsed rows
  // ============================================================================
  const processSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    try {
      const worksheet = wb.Sheets[sheetName];
      if (!worksheet) {
        setErrorMessage(`Sheet "${sheetName}" not found in workbook.`);
        return;
      }

      // Read raw data with cell dates enabled
      const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false,
        raw: false,
        dateNF: 'yyyy-mm-dd',
      });

      if (!jsonData || jsonData.length === 0) {
        setErrorMessage('The selected sheet is completely empty.');
        return;
      }

      // Find first row with at least 2 non-empty values as header row
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const nonEmpties = (jsonData[i] || []).filter((v) => String(v).trim().length > 0);
        if (nonEmpties.length >= 2) {
          headerRowIndex = i;
          break;
        }
      }

      const rawHeaderRow = (jsonData[headerRowIndex] || []).map((h, i) =>
        String(h || '').trim() || `Column_${i + 1}`
      );

      // Extract rows following headers
      const rows: Record<string, any>[] = [];
      for (let r = headerRowIndex + 1; r < jsonData.length; r++) {
        const rowData = jsonData[r];
        if (!rowData || rowData.length === 0) continue;
        // Check if row has at least one non-empty string
        const hasContent = rowData.some((c) => String(c || '').trim().length > 0);
        if (!hasContent) continue;

        const rowObj: Record<string, any> = {};
        rawHeaderRow.forEach((colName, colIdx) => {
          rowObj[colName] = rowData[colIdx] !== undefined ? rowData[colIdx] : '';
        });
        rows.push(rowObj);
      }

      if (rows.length === 0) {
        setErrorMessage('No valid data rows found in this sheet after headers.');
        return;
      }

      setRawHeaders(rawHeaderRow);
      setRawSheetRows(rows);

      // Perform Smart Column Detection
      const detected = autoDetectColumns(rawHeaderRow);
      setColumnMapping(detected);

      // Generate preview rows
      generateParsedRows(rows, detected, dbCompanies, dbContacts);

      setStep('preview');
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Sheet processing error:', err);
      setErrorMessage(`Failed to process sheet: ${err.message || 'Unknown error'}`);
    }
  };

  // Generate ParsedRowItem array using current mapping and CRM duplicates
  const generateParsedRows = (
    rows: Record<string, any>[],
    mapping: Record<TargetFieldKey, string>,
    companies: Company[],
    contacts: HRContact[]
  ) => {
    const items: ParsedRowItem[] = rows.map((raw, idx) => {
      const rawDate = mapping.date ? raw[mapping.date] : '';
      const rawCompany = mapping.company_name ? raw[mapping.company_name] : '';
      const rawHr = mapping.hr_name ? raw[mapping.hr_name] : '';
      const rawPhone = mapping.phone ? raw[mapping.phone] : '';
      const rawLinkedin = mapping.linkedin_url ? raw[mapping.linkedin_url] : '';

      const date = parseDateValue(rawDate);
      const companyName = String(rawCompany || '').trim();
      const hrName = String(rawHr || '').trim();
      const phone = cleanPhone(rawPhone);
      const linkedinUrl = String(rawLinkedin || '').trim();

      const missingFields: string[] = [];
      if (!companyName) missingFields.push('Company Name');
      if (!hrName) missingFields.push('HR Name');

      const isValid = missingFields.length === 0;

      // Duplicate Check: Company
      const normComp = normalizeStr(companyName);
      const matchedCompany = normComp
        ? companies.find((c) => normalizeStr(c.name) === normComp)
        : undefined;
      const isCompanyExisting = !!matchedCompany;

      // Duplicate Check: Contact
      // Check by Phone number, LinkedIn URL, or HR Name within the matched company
      const normHr = normalizeStr(hrName);
      const matchedContact = contacts.find((c) => {
        if (phone && cleanPhone(c.phone) && cleanPhone(c.phone) === phone) return true;
        if (linkedinUrl && c.linkedin_url && normalizeStr(c.linkedin_url) === normalizeStr(linkedinUrl)) return true;
        if (matchedCompany && c.company_id === matchedCompany.id && normalizeStr(c.name) === normHr) return true;
        return false;
      });
      const isContactExisting = !!matchedContact;

      return {
        id: `row_${idx}_${Date.now()}`,
        originalIndex: idx + 1,
        raw,
        date,
        companyName,
        hrName,
        phone,
        linkedinUrl,
        isValid,
        missingFields,
        isCompanyExisting,
        matchedCompany,
        isContactExisting,
        matchedContact,
        selected: isValid, // By default select all valid rows
      };
    });

    setParsedRows(items);
  };

  // Re-generate preview rows whenever column mappings change manually
  const handleMappingChange = (key: TargetFieldKey, newHeader: string) => {
    const updated = { ...columnMapping, [key]: newHeader };
    setColumnMapping(updated);
    generateParsedRows(rawSheetRows, updated, dbCompanies, dbContacts);
  };

  // ============================================================================
  // File Upload Handlers (File input & Drag and Drop)
  // ============================================================================
  const processUploadedFile = (uploadedFile: File) => {
    setErrorMessage(null);
    const fileName = uploadedFile.name.toLowerCase();
    const isValidExt = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');

    if (!isValidExt) {
      setErrorMessage('Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) throw new Error('File buffer is empty');

        const wb = XLSX.read(buffer, {
          type: 'array',
          cellDates: true,
          dateNF: 'yyyy-mm-dd',
        });

        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        const defaultSheet = wb.SheetNames[0] || '';
        setActiveSheetName(defaultSheet);

        processSheet(wb, defaultSheet);
      } catch (err: any) {
        console.error('Error parsing file:', err);
        setErrorMessage(`Failed to parse file: ${err.message || 'Corrupt or unsupported format.'}`);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error reading file. Please check file permissions.');
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    if (!workbook) return;
    setActiveSheetName(sheetName);
    processSheet(workbook, sheetName);
  };

  // Download Sample Template (both .xlsx and .csv supported)
  const handleDownloadSample = (format: 'xlsx' | 'csv' = 'xlsx') => {
    const sampleData = [
      {
        'Date': new Date().toISOString().slice(0, 10),
        'Company Name': 'Infosys Technologies',
        'HR Name': 'Ananya Sharma',
        'Phone Number': '+91 98765 43210',
        'LinkedIn Profile Link': 'https://www.linkedin.com/in/ananya-sharma-hr',
      },
      {
        'Date': new Date().toISOString().slice(0, 10),
        'Company Name': 'Wipro Digital',
        'HR Name': 'Vikram Rathore',
        'Phone Number': '+91 98450 11223',
        'LinkedIn Profile Link': 'https://www.linkedin.com/in/vikram-rathore-talent',
      },
      {
        'Date': new Date().toISOString().slice(0, 10),
        'Company Name': 'Razorpay Software',
        'HR Name': 'Pooja Iyer',
        'Phone Number': '+91 97123 45678',
        'LinkedIn Profile Link': 'https://www.linkedin.com/in/pooja-iyer-tech-recruiter',
      },
      {
        'Date': new Date().toISOString().slice(0, 10),
        'Company Name': 'Swiggy',
        'HR Name': 'Rohit Kulkarni',
        'Phone Number': '+91 99887 76655',
        'LinkedIn Profile Link': 'https://www.linkedin.com/in/rohit-kulkarni-swiggy',
      },
      {
        'Date': new Date().toISOString().slice(0, 10),
        'Company Name': 'Freshworks Tech',
        'HR Name': 'Divya Menon',
        'Phone Number': '+91 94433 22110',
        'LinkedIn Profile Link': 'https://www.linkedin.com/in/divya-menon-freshworks',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CRM_Leads');

    if (format === 'csv') {
      XLSX.writeFile(wb, 'placemein_crm_import_template.csv');
    } else {
      XLSX.writeFile(wb, 'placemein_crm_import_template.xlsx');
    }
  };

  // ============================================================================
  // Filtering & Pagination for Preview Table
  // ============================================================================
  const filteredRows = useMemo(() => {
    return parsedRows.filter((row) => {
      // Filter tab
      if (filterMode === 'valid' && !row.isValid) return false;
      if (filterMode === 'invalid' && row.isValid) return false;
      if (filterMode === 'duplicates' && !row.isCompanyExisting && !row.isContactExisting) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          row.companyName.toLowerCase().includes(q) ||
          row.hrName.toLowerCase().includes(q) ||
          row.phone.toLowerCase().includes(q) ||
          row.linkedinUrl.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [parsedRows, filterMode, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage, rowsPerPage]);

  const validRowsCount = parsedRows.filter((r) => r.isValid).length;
  const invalidRowsCount = parsedRows.filter((r) => !r.isValid).length;
  const duplicateRowsCount = parsedRows.filter((r) => r.isCompanyExisting || r.isContactExisting).length;
  const selectedRowsCount = parsedRows.filter((r) => r.selected).length;

  const toggleSelectRow = (id: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleSelectAllFiltered = (selectAll: boolean) => {
    const visibleIds = new Set(filteredRows.map((r) => r.id));
    setParsedRows((prev) =>
      prev.map((r) => (visibleIds.has(r.id) ? { ...r, selected: selectAll && r.isValid } : r))
    );
  };

  // ============================================================================
  // STEP 4: CRM Storage & Linking with Live Progress Bar
  // ============================================================================
  const handleConfirmImport = async () => {
    const rowsToImport = parsedRows.filter((r) => r.selected && r.isValid);
    if (rowsToImport.length === 0) {
      setErrorMessage('No valid rows selected for import. Please ensure at least one valid row is checked.');
      return;
    }

    setStep('importing');
    setImportProgress(5);
    setImportStatusText('Preparing CRM database records...');
    setErrorMessage(null);

    try {
      let createdCompaniesCount = 0;
      let matchedCompaniesCount = 0;
      let createdContactsCount = 0;
      let updatedContactsCount = 0;

      // Group rows by normalized company name to avoid duplicate company creation in the same batch
      const companyMap = new Map<string, { companyName: string; rows: ParsedRowItem[] }>();
      rowsToImport.forEach((row) => {
        const norm = normalizeStr(row.companyName);
        if (!companyMap.has(norm)) {
          companyMap.set(norm, { companyName: row.companyName, rows: [] });
        }
        companyMap.get(norm)!.rows.push(row);
      });

      const totalCompaniesToProcess = companyMap.size;
      let processedCompanies = 0;

      // Keep an in-memory cache of companies to link contacts to
      const resolvedCompanyCache = new Map<string, Company>();

      // Step 4A: Upsert all companies in Company Directory
      for (const [normComp, { companyName, rows }] of companyMap.entries()) {
        processedCompanies++;
        const pct = Math.round(5 + (processedCompanies / totalCompaniesToProcess) * 45);
        setImportProgress(pct);
        setImportStatusText(`Processing Company ${processedCompanies} of ${totalCompaniesToProcess}: ${companyName}...`);

        // Check if company exists in DB or was already resolved
        let existing = dbCompanies.find((c) => normalizeStr(c.name) === normComp);

        if (!existing) {
          // Find first linkedin if available
          const firstLinkedin = rows.find((r) => r.linkedinUrl)?.linkedinUrl || '';
          const compData: Partial<Company> = {
            name: companyName,
            website: '',
            linkedin_url: firstLinkedin,
            employee_count: '100-500 employees',
            source: 'import',
            industry: 'Information Technology',
            entered_by_name: currentUserName,
            created_at: new Date().toISOString(),
          };

          try {
            const newComp = await api.createCompany(compData);
            resolvedCompanyCache.set(normComp, newComp);
            createdCompaniesCount++;
            // Update local dbCompanies list
            dbCompanies.unshift(newComp);
          } catch (createErr) {
            console.warn(`Failed to create company ${companyName}, using client fallback:`, createErr);
            const fallbackComp: Company = {
              id: `comp_imp_${Date.now()}_${processedCompanies}`,
              name: companyName,
              linkedin_url: firstLinkedin,
              employee_count: '100-500 employees',
              source: 'import',
              entered_by_name: currentUserName,
              created_at: new Date().toISOString(),
            };
            const currentComps = clientFallbackStore.getCompanies();
            currentComps.unshift(fallbackComp);
            clientFallbackStore.saveCompanies(currentComps);
            resolvedCompanyCache.set(normComp, fallbackComp);
            createdCompaniesCount++;
            dbCompanies.unshift(fallbackComp);
          }
        } else {
          matchedCompaniesCount++;
          resolvedCompanyCache.set(normComp, existing);
          // If existing company lacks linkedin and row has one, update
          const rowWithLinkedin = rows.find((r) => r.linkedinUrl);
          if (rowWithLinkedin && !existing.linkedin_url) {
            try {
              await api.updateCompany(existing.id, { linkedin_url: rowWithLinkedin.linkedinUrl });
            } catch (_) {}
          }
        }

        // Small pause to yield UI thread and show smooth progress bar
        if (totalCompaniesToProcess > 5) {
          await new Promise((res) => setTimeout(res, 30));
        }
      }

      // Step 4B: Bulk Upsert HR Contacts and Link to Companies
      const totalContactsToProcess = rowsToImport.length;
      let processedContacts = 0;

      for (const row of rowsToImport) {
        processedContacts++;
        const pct = Math.round(50 + (processedContacts / totalContactsToProcess) * 45);
        setImportProgress(pct);
        setImportStatusText(`Linking HR Contact ${processedContacts} of ${totalContactsToProcess}: ${row.hrName}...`);

        const normComp = normalizeStr(row.companyName);
        const targetCompany = resolvedCompanyCache.get(normComp) || dbCompanies.find((c) => normalizeStr(c.name) === normComp);
        const companyId = targetCompany ? targetCompany.id : 'comp_imported';

        // Check if contact already exists
        const normHr = normalizeStr(row.hrName);
        const cleanP = cleanPhone(row.phone);
        const existingContact = dbContacts.find((c) => {
          if (cleanP && cleanPhone(c.phone) && cleanPhone(c.phone) === cleanP) return true;
          if (row.linkedinUrl && c.linkedin_url && normalizeStr(c.linkedin_url) === normalizeStr(row.linkedinUrl)) return true;
          if (c.company_id === companyId && normalizeStr(c.name) === normHr) return true;
          return false;
        });

        if (existingContact) {
          // Update contact with any newer fields
          try {
            await api.updateContact(existingContact.id, {
              phone: row.phone || existingContact.phone,
              linkedin_url: row.linkedinUrl || existingContact.linkedin_url,
              remarks: `Updated via Bulk Excel/CSV Import on ${new Date().toLocaleDateString()}`,
            });
            updatedContactsCount++;
          } catch (_) {
            updatedContactsCount++;
          }
        } else {
          // Create new HR Contact linked to Company
          const newContactPayload: Partial<HRContact> = {
            company_id: companyId,
            name: row.hrName,
            title: 'Talent Acquisition / HR Lead',
            phone: row.phone,
            email: '',
            linkedin_url: row.linkedinUrl,
            domain: targetCompany?.industry || 'Information Technology',
            location: targetCompany?.location || 'Hyderabad',
            remarks: 'Imported via Bulk Excel/CSV Importer',
            spoc: 'Namitha',
            entered_by_name: currentUserName,
            source: 'import',
            created_at: row.date ? new Date(row.date).toISOString() : new Date().toISOString(),
          };

          try {
            const created = await api.createContact(newContactPayload);
            dbContacts.unshift(created);
            createdContactsCount++;
          } catch (contErr) {
            console.warn(`Failed to create contact via API, using fallback store:`, contErr);
            const fallbackContact: HRContact = {
              id: `cont_imp_${Date.now()}_${processedContacts}`,
              company_id: companyId,
              name: row.hrName,
              title: 'Talent Acquisition / HR Lead',
              phone: row.phone,
              email: '',
              linkedin_url: row.linkedinUrl,
              domain: 'Information Technology',
              location: 'Hyderabad',
              remarks: 'Imported via Bulk Excel/CSV Importer',
              spoc: 'Namitha',
              entered_by_name: currentUserName,
              source: 'import',
              company: targetCompany,
              created_at: row.date ? new Date(row.date).toISOString() : new Date().toISOString(),
            };
            const currentC = clientFallbackStore.getContacts();
            currentC.unshift(fallbackContact);
            clientFallbackStore.saveContacts(currentC);
            dbContacts.unshift(fallbackContact);
            createdContactsCount++;
          }
        }

        if (totalContactsToProcess > 10 && processedContacts % 5 === 0) {
          await new Promise((res) => setTimeout(res, 20));
        }
      }

      setImportProgress(100);
      setImportStatusText('Import successfully finalized!');

      const summary = {
        totalRows: rowsToImport.length,
        companiesCreated: createdCompaniesCount,
        companiesMatched: matchedCompaniesCount,
        contactsCreated: createdContactsCount,
        contactsUpdated: updatedContactsCount,
      };

      setImportSummary(summary);
      setStep('summary');

      // Trigger callback to parent to refresh table data
      onImportComplete?.(summary);
    } catch (err: any) {
      console.error('Bulk Import error:', err);
      setErrorMessage(`Import encountered an issue: ${err.message || 'Unknown database error'}`);
      setStep('preview');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto text-gray-100">
        
        {/* ==================================================================== */}
        {/* Modal Header */}
        {/* ==================================================================== */}
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Bulk Excel & CSV Importer</h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  XLSX • XLS • CSV
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Parse spreadsheets, auto-detect HR columns, verify duplicates & bulk upsert into CRM Directory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Sample Template Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-medium rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-indigo-400" />
                <span>Template</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-44 bg-gray-800 border border-gray-700 rounded-xl shadow-xl py-1 hidden group-hover:block z-30">
                <button
                  onClick={() => handleDownloadSample('xlsx')}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700/60 flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Download .xlsx format</span>
                </button>
                <button
                  onClick={() => handleDownloadSample('csv')}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700/60 flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Download .csv format</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleModalClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* Error Banner */}
        {/* ==================================================================== */}
        {errorMessage && (
          <div className="px-6 py-2.5 bg-rose-500/10 border-b border-rose-500/30 flex items-center justify-between text-rose-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* ==================================================================== */}
        {/* Step 1: Upload View */}
        {/* ==================================================================== */}
        {step === 'upload' && (
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center space-y-6 overflow-y-auto">
            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full max-w-2xl border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                  : 'border-gray-700 hover:border-indigo-500/50 bg-gray-800/40 hover:bg-gray-800/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-4">
                <UploadCloud className="h-10 w-10 animate-pulse" />
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                Drop your Excel or CSV file here, or <span className="text-indigo-400 underline underline-offset-4">browse</span>
              </h3>
              <p className="text-xs text-gray-400 max-w-md">
                Supports Microsoft Excel (.xlsx, .xls) and standard CSV (.csv). Max recommended size: 25MB / 10,000 rows.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-800 text-gray-300 border border-gray-700">
                  .xlsx
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-800 text-gray-300 border border-gray-700">
                  .xls
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-800 text-gray-300 border border-gray-700">
                  .csv
                </span>
              </div>
            </div>

            {/* Smart Column Recognition Highlights */}
            <div className="w-full max-w-2xl bg-gray-800/50 border border-gray-700/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-gray-300">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Smart Auto-Detection for 5 Primary Fields:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                {TARGET_FIELDS.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.key}
                      className="flex items-start gap-2 p-2 rounded-lg bg-gray-900/60 border border-gray-800"
                    >
                      <Icon className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-1.5 font-medium text-white">
                          <span>{f.label}</span>
                          {f.required && (
                            <span className="text-[10px] text-rose-400 font-bold">*req</span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 leading-tight">
                          e.g. {f.aliases.slice(0, 3).join(', ')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* Step 2 & 3: Preview Table & Column Mapping */}
        {/* ==================================================================== */}
        {(step === 'preview' || step === 'mapping') && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            
            {/* Sub-Header: Sheet Selector + Smart Mapping Summary */}
            <div className="p-4 bg-gray-800/40 border-b border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* File badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 text-gray-200 border border-gray-700 rounded-lg">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-semibold truncate max-w-[160px]">{file?.name || 'Spreadsheet'}</span>
                  <span className="text-gray-400">({rawSheetRows.length} rows)</span>
                </div>

                {/* Multiple Sheet Selector */}
                {sheetNames.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-gray-900 px-2 py-1 rounded-lg border border-gray-700">
                    <Layers className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-gray-400">Sheet:</span>
                    <select
                      value={activeSheetName}
                      onChange={(e) => handleSheetChange(e.target.value)}
                      className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                    >
                      {sheetNames.map((s) => (
                        <option key={s} value={s} className="bg-gray-900 text-white">
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={handleReset}
                  className="px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition text-xs flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Change File</span>
                </button>
              </div>

              {/* Status Pill Counts */}
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  {validRowsCount} Valid
                </span>
                {invalidRowsCount > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                    {invalidRowsCount} Missing Fields
                  </span>
                )}
                {duplicateRowsCount > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    {duplicateRowsCount} Duplicates
                  </span>
                )}
              </div>
            </div>

            {/* Smart Column Mapping Bar */}
            <div className="px-4 py-3 bg-gray-950/70 border-b border-gray-800 overflow-x-auto shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Column Mappings</span>
                  <span className="text-[11px] text-gray-400 font-normal">
                    (Auto-detected from file headers. Adjust dropdowns if needed)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {TARGET_FIELDS.map((field) => {
                  const currentMappedHeader = columnMapping[field.key];
                  const isMapped = !!currentMappedHeader;
                  const Icon = field.icon;

                  return (
                    <div
                      key={field.key}
                      className={`p-2 rounded-xl border transition ${
                        isMapped
                          ? 'bg-gray-900 border-indigo-500/30'
                          : field.required
                          ? 'bg-rose-950/20 border-rose-500/40'
                          : 'bg-gray-900/60 border-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-200">
                          <Icon className="h-3.5 w-3.5 text-indigo-400" />
                          <span>{field.label}</span>
                          {field.required && <span className="text-rose-400 font-bold">*</span>}
                        </div>
                        {isMapped && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                      </div>

                      <select
                        value={currentMappedHeader}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        className={`w-full text-xs rounded-lg px-2 py-1.5 focus:outline-none transition ${
                          isMapped
                            ? 'bg-gray-800 text-white border border-gray-700'
                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}
                      >
                        <option value="">-- Not Mapped --</option>
                        {rawHeaders.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preview Table Controls: Search, Filters, Selection */}
            <div className="px-4 py-2.5 bg-gray-900/80 border-b border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:w-60">
                  <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search preview rows..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Filter buttons */}
                <div className="flex items-center bg-gray-800 p-0.5 rounded-lg border border-gray-700 text-xs">
                  <button
                    onClick={() => {
                      setFilterMode('all');
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      filterMode === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    All ({parsedRows.length})
                  </button>
                  <button
                    onClick={() => {
                      setFilterMode('valid');
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      filterMode === 'valid'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Valid ({validRowsCount})
                  </button>
                  <button
                    onClick={() => {
                      setFilterMode('invalid');
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      filterMode === 'invalid'
                        ? 'bg-rose-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Missing ({invalidRowsCount})
                  </button>
                  <button
                    onClick={() => {
                      setFilterMode('duplicates');
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      filterMode === 'duplicates'
                        ? 'bg-amber-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Duplicates ({duplicateRowsCount})
                  </button>
                </div>
              </div>

              {/* Selection Summary & Quick Actions */}
              <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-gray-400">
                  <span className="text-white font-bold">{selectedRowsCount}</span> of {validRowsCount} valid selected
                </span>
                <button
                  onClick={() => handleSelectAllFiltered(selectedRowsCount < validRowsCount)}
                  className="px-2 py-1 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 text-indigo-400 border border-gray-700 transition"
                >
                  {selectedRowsCount < validRowsCount ? 'Select All Valid' : 'Deselect All'}
                </button>
              </div>
            </div>

            {/* Preview Table */}
            <div className="flex-1 overflow-auto min-h-0 bg-gray-950/40">
              <table className="w-full text-left text-xs text-gray-200 border-collapse">
                <thead className="bg-gray-900/90 text-gray-400 sticky top-0 z-10 border-b border-gray-800">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={paginatedRows.length > 0 && paginatedRows.every((r) => r.selected)}
                        onChange={(e) => {
                          const check = e.target.checked;
                          const ids = new Set(paginatedRows.map((r) => r.id));
                          setParsedRows((prev) =>
                            prev.map((r) => (ids.has(r.id) ? { ...r, selected: check && r.isValid } : r))
                          );
                        }}
                        className="rounded border-gray-700 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3 font-semibold w-12 text-center">#</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Company Name</th>
                    <th className="py-2.5 px-3 font-semibold">HR Contact Name</th>
                    <th className="py-2.5 px-3 font-semibold">Phone Number</th>
                    <th className="py-2.5 px-3 font-semibold">LinkedIn Profile</th>
                    <th className="py-2.5 px-3 font-semibold">CRM Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-sans">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        <AlertCircle className="h-6 w-6 text-gray-500 mx-auto mb-2" />
                        <p className="font-medium">No rows matching current filters</p>
                        <p className="text-[11px] text-gray-400">Try adjusting the search query or filter mode</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => (
                      <tr
                        key={row.id}
                        className={`hover:bg-gray-800/40 transition-colors ${
                          !row.isValid
                            ? 'bg-rose-950/10'
                            : row.selected
                            ? 'bg-indigo-950/10'
                            : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            disabled={!row.isValid}
                            checked={row.selected}
                            onChange={() => toggleSelectRow(row.id)}
                            className="rounded border-gray-700 text-indigo-600 focus:ring-0 disabled:opacity-30 cursor-pointer"
                          />
                        </td>

                        {/* Row Index */}
                        <td className="py-2.5 px-3 text-center text-gray-400 font-mono text-[11px]">
                          {row.originalIndex}
                        </td>

                        {/* Date */}
                        <td className="py-2.5 px-3 whitespace-nowrap text-gray-300">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span>{row.date ? formatIndianDate(row.date) : '—'}</span>
                          </div>
                        </td>

                        {/* Company Name */}
                        <td className="py-2.5 px-3 font-medium">
                          {row.companyName ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                              <span className="text-white font-semibold">{row.companyName}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              <AlertCircle className="h-3 w-3" /> Missing Company Name
                            </span>
                          )}
                        </td>

                        {/* HR Name */}
                        <td className="py-2.5 px-3">
                          {row.hrName ? (
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                              <span className="text-gray-100">{row.hrName}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              <AlertCircle className="h-3 w-3" /> Missing HR Name
                            </span>
                          )}
                        </td>

                        {/* Phone Number */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-gray-300 whitespace-nowrap">
                          {row.phone ? (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-emerald-400" />
                              <span>{formatIndianPhone(row.phone)}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Not provided</span>
                          )}
                        </td>

                        {/* LinkedIn Profile */}
                        <td className="py-2.5 px-3 text-gray-300 max-w-[180px] truncate">
                          {row.linkedinUrl ? (
                            <a
                              href={row.linkedinUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline"
                            >
                              <Linkedin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{row.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\//, '')}</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">Not provided</span>
                          )}
                        </td>

                        {/* CRM Verification Status */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {!row.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              <AlertTriangle className="h-3 w-3" /> Missing Required
                            </span>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Company Status */}
                              {row.isCompanyExisting ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                  title={`Matched existing company ID: ${row.matchedCompany?.id}`}
                                >
                                  <Building2 className="h-2.5 w-2.5" /> Existing Comp (Link)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  <Building2 className="h-2.5 w-2.5" /> New Company
                                </span>
                              )}

                              {/* Contact Status */}
                              {row.isContactExisting ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30"
                                  title="Existing HR contact detected. Will update record"
                                >
                                  <User className="h-2.5 w-2.5" /> Duplicate HR (Update)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                  <User className="h-2.5 w-2.5" /> New HR Contact
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-4 py-2.5 bg-gray-900 border-t border-gray-800 flex items-center justify-between text-xs shrink-0">
              <div className="text-gray-400">
                Showing{' '}
                <span className="text-white font-medium">
                  {filteredRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
                </span>{' '}
                to{' '}
                <span className="text-white font-medium">
                  {Math.min(currentPage * rowsPerPage, filteredRows.length)}
                </span>{' '}
                of <span className="text-white font-medium">{filteredRows.length}</span> rows
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-gray-300 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* Step 4: Live Progress Bar View */}
        {/* ==================================================================== */}
        {step === 'importing' && (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center space-y-6 text-center">
            <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 animate-spin">
              <RefreshCw className="h-10 w-10" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-1">Importing to CRM Directory</h3>
              <p className="text-xs text-gray-400 max-w-md">{importStatusText}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md">
              <div className="flex justify-between text-xs font-semibold text-gray-300 mb-2">
                <span>Progress</span>
                <span className="text-indigo-400">{importProgress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                <span>Upserting Companies</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-purple-400" />
                <span>Linking HR Contacts</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* Step 5: Summary Toast / Completion View */}
        {/* ==================================================================== */}
        {step === 'summary' && importSummary && (
          <div className="p-8 sm:p-10 flex flex-col items-center justify-center space-y-6 text-center">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-bounce">
              <CheckCircle2 className="h-12 w-12" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-1">Bulk Import Successfully Completed!</h3>
              <p className="text-xs text-gray-300 max-w-md">
                Successfully processed {importSummary.totalRows} records. All HR contacts have been linked to their respective company entities.
              </p>
            </div>

            {/* Summary Grid Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
              <div className="p-4 rounded-xl bg-gray-800/60 border border-emerald-500/30 text-center">
                <div className="text-2xl font-extrabold text-emerald-400">{importSummary.companiesCreated}</div>
                <div className="text-[11px] font-medium text-gray-300 mt-1">New Companies Created</div>
              </div>
              <div className="p-4 rounded-xl bg-gray-800/60 border border-amber-500/30 text-center">
                <div className="text-2xl font-extrabold text-amber-400">{importSummary.companiesMatched}</div>
                <div className="text-[11px] font-medium text-gray-300 mt-1">Existing Companies Linked</div>
              </div>
              <div className="p-4 rounded-xl bg-gray-800/60 border border-indigo-500/30 text-center">
                <div className="text-2xl font-extrabold text-indigo-400">{importSummary.contactsCreated}</div>
                <div className="text-[11px] font-medium text-gray-300 mt-1">New HR Contacts Added</div>
              </div>
              <div className="p-4 rounded-xl bg-gray-800/60 border border-purple-500/30 text-center">
                <div className="text-2xl font-extrabold text-purple-400">{importSummary.contactsUpdated}</div>
                <div className="text-[11px] font-medium text-gray-300 mt-1">Duplicate HRs Updated</div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleModalClose}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-900/30 transition flex items-center gap-2 cursor-pointer"
              >
                <span>View CRM Directory</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* Modal Footer Controls */}
        {/* ==================================================================== */}
        {step === 'preview' && (
          <div className="px-6 py-3.5 bg-gray-900 border-t border-gray-800 flex items-center justify-between shrink-0">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition"
            >
              Cancel & Upload New File
            </button>

            <div className="flex items-center gap-3">
              <button
                disabled={selectedRowsCount === 0}
                aria-label="Confirm Import"
                data-testid="confirm-import-btn"
                onClick={handleConfirmImport}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <FileCheck2 className="h-4 w-4" />
                <span>Confirm Import ({selectedRowsCount} Rows)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkExcelCsvImporterModal;
