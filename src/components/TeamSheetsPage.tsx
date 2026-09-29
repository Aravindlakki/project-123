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
  Edit2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  ArrowRight,
  Calendar,
  Globe,
  MessageSquare,
  CheckSquare,
  HelpCircle,
  Layers,
  Award,
  UserCheck,
  AtSign,
  AlertTriangle,
} from 'lucide-react';
import { getShortCompanyName } from './HowToFindHRRowHelper';
import { HRContact, Company, CRA } from '../types';
import { api } from '../services/api';
import { clientFallbackStore } from '../services/clientFallbackStore';
import { CompanyDetailsModal } from './CompanyDetailsModal';
import { ExcelWorksheetImportModal } from './ExcelWorksheetImportModal';
import { SystemReportModal } from './SystemReportModal';
import { HtmlLeadImportModal } from './HtmlLeadImportModal';
import { PdfLeadImportModal } from './PdfLeadImportModal';
import { validateIndianMobile } from '../utils/phoneValidator';
import {
  getISTDateKey,
  formatISTDateHeading,
  formatIndianDateTime,
  formatIndianPhone,
} from '../utils/formatters';

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
  role_title?: string;
  notes?: string;
}

// Standard company size dropdown ranges for new leads & editing (existing values are preserved as-is)
export const COMPANY_SIZE_OPTIONS = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1,000 employees',
  '1,001-5,000 employees',
  '5,001-10,000 employees',
  '10,000+ employees',
];

export const PIPELINE_STAGES = [
  { id: 'all', label: 'All Leads' },
  { id: 'hr_sourcing', label: 'HR Sourcing' },
  { id: 'hr_found', label: 'HR Found' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'connected', label: 'Connected' },
  { id: 'follow_up', label: 'Follow-up' },
  { id: 'jd_submitted', label: 'JD Submitted' },
];

export const TeamSheetsPage: React.FC<TeamSheetsPageProps> = ({
  currentUser,
  adminMode = false,
}) => {
  const [leads, setLeads] = useState<HRContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [allUsersList, setAllUsersList] = useState<CRA[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [uploaderFilterMode, setUploaderFilterMode] = useState<'all' | 'me'>('all');
  const [selectedUploader, setSelectedUploader] = useState('all');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [activeDateKey, setActiveDateKey] = useState<string>(() => getISTDateKey(new Date()));
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);
  const [pipelineTab, setPipelineTab] = useState<string>('all');

  // Post-upload notification banner
  const [postUploadBanner, setPostUploadBanner] = useState<{
    totalAdded: number;
    needHR: number;
  } | null>(null);

  // In-Place Drawer / Modal for "HR Sourcing"
  const [sourcingDrawerLead, setSourcingDrawerLead] = useState<HRContact | null>(null);
  const [sourcingHRName, setSourcingHRName] = useState('');
  const [sourcingHRTitle, setSourcingHRTitle] = useState('');
  const [sourcingHRLinkedin, setSourcingHRLinkedin] = useState('');
  const [sourcingHREmail, setSourcingHREmail] = useState('');
  const [sourcingHRPhone, setSourcingHRPhone] = useState('');
  const [sourcingNotes, setSourcingNotes] = useState('');
  const [sourcingStatus, setSourcingStatus] = useState('HR Sourcing');
  const [sourcingPhoneError, setSourcingPhoneError] = useState<string | null>(null);
  const [isSavingSourcing, setIsSavingSourcing] = useState(false);
  const [copiedHelperKey, setCopiedHelperKey] = useState<string | null>(null);

  // Full Lead Edit Modal (for Admin or Creator to edit general fields)
  const [editingLead, setEditingLead] = useState<HRContact | null>(null);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editCompanySize, setEditCompanySize] = useState('');
  const [editRoleTitle, setEditRoleTitle] = useState('');
  const [editDomain, setEditDomain] = useState('');
  const [editHRName, setEditHRName] = useState('');
  const [editHRTitle, setEditHRTitle] = useState('');
  const [editHRLinkedin, setEditHRLinkedin] = useState('');
  const [editHREmail, setEditHREmail] = useState('');
  const [editHRPhone, setEditHRPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('HR Sourcing');
  const [editPhoneError, setEditPhoneError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Modals
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

  // Add Lead Form State
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newCompanySize, setNewCompanySize] = useState('51-200 employees');
  const [newDomain, setNewDomain] = useState('Technology');
  const [newLocation, setNewLocation] = useState('Hyderabad');
  const [newLeadSource, setNewLeadSource] = useState('LinkedIn');
  const [newNotes, setNewNotes] = useState('');
  const [newHRName, setNewHRName] = useState('');
  const [newHRTitle, setNewHRTitle] = useState('Talent Acquisition Lead');
  const [newHREmail, setNewHREmail] = useState('');
  const [newHRPhone, setNewHRPhone] = useState('');
  const [newHRLinkedin, setNewHRLinkedin] = useState('');
  const [newAddPhoneError, setNewAddPhoneError] = useState<string | null>(null);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [addLeadError, setAddLeadError] = useState<string | null>(null);

  // Toast notification
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ type, message });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Load leads and user profiles for name resolution
  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const [fetchedLeads, fetchedUsers] = await Promise.all([
        api.getWorksheetLeads(),
        api.getCRAs().catch(() => []),
      ]);

      setLeads(fetchedLeads);
      setAllUsersList(fetchedUsers);

      const mapping: Record<string, string> = {};
      fetchedUsers.forEach((u: CRA) => {
        if (u.id) mapping[u.id] = u.name;
      });
      setUsersMap(mapping);
    } catch (err) {
      console.error('Failed to fetch worksheet leads', err);
      const fallback = clientFallbackStore.getContacts();
      setLeads(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Resolve human-readable uploader name for any contact
  const resolveUploaderName = (lead: HRContact): string => {
    if (lead.entered_by_name && lead.entered_by_name.trim()) {
      return lead.entered_by_name.replace(/\s*\((HTML|PDF|Excel).*?\)/i, '').trim();
    }
    if (lead.created_by && usersMap[lead.created_by]) {
      return usersMap[lead.created_by];
    }
    if (lead.spoc && lead.spoc.trim()) {
      return lead.spoc.trim();
    }
    return 'CRA Employee';
  };

  // Incomplete detection: Missing HR Name, LinkedIn, or Phone
  const isLeadIncomplete = (lead: HRContact): boolean => {
    const hasName = Boolean(lead.name && lead.name.trim() && lead.name !== 'Unknown Contact' && lead.name !== 'Talent Acquisition Team');
    const hasLinkedin = Boolean(lead.linkedin_url && lead.linkedin_url.trim());
    const hasPhone = Boolean(lead.phone && lead.phone.trim());
    return !hasName || !hasLinkedin || !hasPhone;
  };

  const getMissingFields = (lead: HRContact): string[] => {
    const missing: string[] = [];
    const hasName = Boolean(lead.name && lead.name.trim() && lead.name !== 'Unknown Contact' && lead.name !== 'Talent Acquisition Team');
    if (!hasName) missing.push('HR Name');
    if (!lead.linkedin_url || !lead.linkedin_url.trim()) missing.push('LinkedIn');
    if (!lead.phone || !lead.phone.trim()) missing.push('Phone');
    return missing;
  };

  // Edit Permissions: Admin edits everything; CRAs edit HR fields on leads they added
  const canUserEditLead = (lead: HRContact): boolean => {
    if (adminMode || currentUser?.role === 'admin') return true;
    if (!currentUser) return false;
    if (lead.created_by && lead.created_by === currentUser.id) return true;
    if (lead.entered_by_name && currentUser.name && lead.entered_by_name.toLowerCase().includes(currentUser.name.toLowerCase())) return true;
    if (lead.spoc && currentUser.name && lead.spoc.toLowerCase() === currentUser.name.split(' ')[0].toLowerCase()) return true;
    return false;
  };

  // Uploaded-By Filter helper: checks if lead belongs to the logged-in user
  const isLeadUploadedByMe = (lead: HRContact): boolean => {
    if (!currentUser) return false;
    if (lead.created_by && lead.created_by === currentUser.id) return true;
    if (lead.entered_by_name && currentUser.name && lead.entered_by_name.toLowerCase().includes(currentUser.name.toLowerCase())) return true;
    if (lead.spoc && currentUser.name && lead.spoc.toLowerCase() === currentUser.name.split(' ')[0].toLowerCase()) return true;
    const uploader = resolveUploaderName(lead).toLowerCase();
    if (currentUser.name && uploader.includes(currentUser.name.toLowerCase())) return true;
    return false;
  };

  // Open "HR Sourcing" drawer in place
  const handleOpenSourcingDrawer = (lead: HRContact) => {
    setSourcingDrawerLead(lead);
    setSourcingHRName(lead.name && lead.name !== 'Unknown Contact' && lead.name !== 'Talent Acquisition Team' ? lead.name : '');
    setSourcingHRTitle(lead.title || 'Talent Acquisition Lead');
    setSourcingHRLinkedin(lead.linkedin_url || '');
    setSourcingHREmail(lead.email || '');
    setSourcingHRPhone(lead.phone || '');
    setSourcingNotes(lead.notes || '');
    setSourcingStatus(lead.status || lead.remarks || 'HR Sourcing');
    setSourcingPhoneError(null);
  };

  // Save Sourcing Details and optionally advance to next incomplete lead
  const handleSaveSourcing = async (advanceToNext: boolean) => {
    if (!sourcingDrawerLead) return;

    // Validate phone only if user typed something
    if (sourcingHRPhone.trim()) {
      const validation = validateIndianMobile(sourcingHRPhone);
      if (!validation.valid) {
        setSourcingPhoneError(validation.error || 'Invalid 10-digit Indian phone');
        return;
      }
    }

    setIsSavingSourcing(true);
    setSourcingPhoneError(null);

    try {
      const cleanedPhone = sourcingHRPhone.trim() ? validateIndianMobile(sourcingHRPhone).normalized : undefined;
      const updates: Partial<HRContact> = {
        name: sourcingHRName.trim() || 'HR Lead',
        title: sourcingHRTitle.trim(),
        linkedin_url: sourcingHRLinkedin.trim() || undefined,
        email: sourcingHREmail.trim() || undefined,
        phone: cleanedPhone,
        notes: sourcingNotes.trim() || undefined,
        status: sourcingStatus,
        remarks: sourcingStatus,
      };

      await api.updateContact(sourcingDrawerLead.id, updates);

      // Update local state
      setLeads((prev) =>
        prev.map((l) => (l.id === sourcingDrawerLead.id ? { ...l, ...updates } : l))
      );

      showToast(`Saved HR details for ${sourcingDrawerLead.company?.name || 'Company'}`);

      if (advanceToNext) {
        // Find next incomplete lead in the current list
        const currentIndex = filteredLeads.findIndex((l) => l.id === sourcingDrawerLead.id);
        const remainingIncomplete = filteredLeads.slice(currentIndex + 1).concat(filteredLeads.slice(0, currentIndex)).filter((l) => l.id !== sourcingDrawerLead.id && isLeadIncomplete(l));

        if (remainingIncomplete.length > 0) {
          handleOpenSourcingDrawer(remainingIncomplete[0]);
        } else {
          setSourcingDrawerLead(null);
          showToast('🎉 All leads in this view now have complete HR details!', 'success');
        }
      } else {
        setSourcingDrawerLead(null);
      }
    } catch (err: any) {
      console.error('Failed to save HR sourcing details:', err);
      setSourcingPhoneError(err.message || 'Failed to update contact details');
    } finally {
      setIsSavingSourcing(false);
    }
  };

  // Open Full Edit Modal (general fields)
  const handleOpenEditModal = (lead: HRContact) => {
    setEditingLead(lead);
    setEditCompanyName(lead.company?.name || '');
    setEditCompanySize(lead.company?.employee_count || '51-200 employees');
    setEditRoleTitle(lead.role_title || lead.title || '');
    setEditDomain(lead.domain || 'Technology');
    setEditHRName(lead.name || '');
    setEditHRTitle(lead.title || '');
    setEditHRLinkedin(lead.linkedin_url || '');
    setEditHREmail(lead.email || '');
    setEditHRPhone(lead.phone || '');
    setEditNotes(lead.notes || '');
    setEditStatus(lead.status || lead.remarks || 'HR Sourcing');
    setEditPhoneError(null);
  };

  const handleSaveEditModal = async () => {
    if (!editingLead) return;

    if (editHRPhone.trim()) {
      const validation = validateIndianMobile(editHRPhone);
      if (!validation.valid) {
        setEditPhoneError(validation.error || 'Invalid Indian phone');
        return;
      }
    }

    setIsSavingEdit(true);
    setEditPhoneError(null);

    try {
      const cleanedPhone = editHRPhone.trim() ? validateIndianMobile(editHRPhone).normalized : undefined;
      const updates: Partial<HRContact> = {
        name: editHRName.trim(),
        title: editHRTitle.trim(),
        linkedin_url: editHRLinkedin.trim() || undefined,
        email: editHREmail.trim() || undefined,
        phone: cleanedPhone,
        domain: editDomain,
        role_title: editRoleTitle.trim(),
        notes: editNotes.trim() || undefined,
        status: editStatus,
        remarks: editStatus,
      };

      await api.updateContact(editingLead.id, updates);

      // If admin and company size changed
      if (adminMode && editingLead.company_id && editCompanySize) {
        try {
          await api.updateCompany(editingLead.company_id, {
            name: editCompanyName.trim(),
            employee_count: editCompanySize,
          });
        } catch (_) {}
      }

      setLeads((prev) =>
        prev.map((l) =>
          l.id === editingLead.id
            ? {
                ...l,
                ...updates,
                company: l.company ? { ...l.company, name: editCompanyName.trim(), employee_count: editCompanySize } : undefined,
              }
            : l
        )
      );

      setEditingLead(null);
      showToast('Updated lead details successfully');
    } catch (err: any) {
      setEditPhoneError(err.message || 'Failed to update lead');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete lead (Admin only)
  const handleDeleteLead = async (id: string) => {
    try {
      await api.deleteContact(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setLeadToDelete(null);
      showToast('Lead deleted successfully');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete lead', 'error');
    }
  };

  // Add Lead Submit
  const handleCreateLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) {
      setAddLeadError('Company Name is required.');
      return;
    }
    if (!newRoleTitle.trim()) {
      setAddLeadError('Role / Job Title is required.');
      return;
    }

    if (newHRPhone.trim()) {
      const validation = validateIndianMobile(newHRPhone);
      if (!validation.valid) {
        setNewAddPhoneError(validation.error || 'Invalid 10-digit Indian phone');
        return;
      }
    }

    setIsSubmittingLead(true);
    setAddLeadError(null);
    setNewAddPhoneError(null);

    try {
      const uploaderName = currentUser?.name || 'Aravind Reddy';
      const cleanedPhone = newHRPhone.trim() ? validateIndianMobile(newHRPhone).normalized : undefined;

      const created = await api.createWorksheetLead({
        company_name: newCompanyName.trim(),
        employee_count: newCompanySize,
        domain: newDomain,
        location: newLocation,
        role_title: newRoleTitle.trim(),
        lead_source: newLeadSource,
        notes: newNotes.trim() || undefined,
        hr_name: newHRName.trim() || '',
        title: newHRTitle.trim() || 'Talent Acquisition',
        email: newHREmail.trim() || undefined,
        phone: cleanedPhone,
        hr_linkedin: newHRLinkedin.trim() || undefined,
        status: 'HR Sourcing',
        remarks: 'HR Sourcing',
        spoc: currentUser?.name?.split(' ')[0] || 'Aravind',
        entered_by_name: uploaderName,
      });

      setLeads((prev) => [created, ...prev]);
      setActiveDateKey(getISTDateKey(new Date()));
      setShowAddLeadModal(false);

      // Reset form
      setNewCompanyName('');
      setNewRoleTitle('');
      setNewHRName('');
      setNewHREmail('');
      setNewHRPhone('');
      setNewHRLinkedin('');
      setNewNotes('');

      showToast(`Lead added: ${created.company?.name || newCompanyName}`);

      // If the lead was added with missing HR info, prompt the user with banner
      if (isLeadIncomplete(created)) {
        setPostUploadBanner({
          totalAdded: 1,
          needHR: 1,
        });
      }
    } catch (err: any) {
      setAddLeadError(err.message || 'Failed to add lead');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Per-Day CSV Export
  const handleExportDayCSV = (dateKey: string, dayLeads: HRContact[]) => {
    const csvRows = dayLeads.map((l) => ({
      'Company Name': l.company?.name || l.name,
      'Date Uploaded': l.created_at ? formatIndianDateTime(l.created_at) : '—',
      'Company Size': l.company?.employee_count || '—',
      'Role / JD': l.role_title || l.title || '—',
      'HR Name': l.name || '—',
      'HR Role': l.title || '—',
      'Domain': l.domain || 'Technology',
      'Email': l.email || '—',
      'Contact Number': l.phone || '—',
      'LinkedIn': l.linkedin_url || '—',
      'Uploaded By': resolveUploaderName(l),
      'Status': l.status || l.remarks || 'HR Sourcing',
    }));

    const worksheet = XLSX.utils.json_to_sheet(csvRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Day Leads');
    XLSX.writeFile(workbook, `Placemein_Worksheet_${dateKey}.xlsx`);
    showToast(`Exported ${dayLeads.length} leads for ${dateKey}`);
  };

  const todayKey = useMemo(() => getISTDateKey(new Date()), []);
  const isViewingToday = activeDateKey === todayKey;

  const headingInfo = useMemo(() => {
    return formatISTDateHeading(activeDateKey);
  }, [activeDateKey]);

  // Day navigation arrows
  const handlePrevDay = () => {
    try {
      const [y, m, d] = activeDateKey.split('-').map(Number);
      const prev = new Date(Date.UTC(y, m - 1, d - 1, 12, 0, 0));
      setActiveDateKey(prev.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
    } catch {
      setActiveDateKey(todayKey);
    }
  };

  const handleNextDay = () => {
    if (isViewingToday) return;
    try {
      const [y, m, d] = activeDateKey.split('-').map(Number);
      const next = new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0));
      const nextKey = next.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      if (nextKey <= todayKey) {
        setActiveDateKey(nextKey);
      }
    } catch {
      setActiveDateKey(todayKey);
    }
  };

  // All leads belonging to the currently open date sheet
  const dayTotalLeads = useMemo(() => {
    return leads.filter((lead) => getISTDateKey(lead.created_at) === activeDateKey);
  }, [leads, activeDateKey]);

  // Leads for the active open sheet filtered by search, uploader, domain, incomplete only, and pipeline stage
  const filteredLeads = useMemo(() => {
    return dayTotalLeads.filter((lead) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const comp = (lead.company?.name || lead.name || '').toLowerCase();
        const hr = (lead.name || '').toLowerCase();
        const role = (lead.role_title || lead.title || '').toLowerCase();
        const phone = (lead.phone || '').toLowerCase();
        const email = (lead.email || '').toLowerCase();
        const uploader = resolveUploaderName(lead).toLowerCase();
        if (
          !comp.includes(q) &&
          !hr.includes(q) &&
          !role.includes(q) &&
          !phone.includes(q) &&
          !email.includes(q) &&
          !uploader.includes(q)
        ) {
          return false;
        }
      }

      // "All team | Only me" filter & specific uploader dropdown
      if (uploaderFilterMode === 'me') {
        if (!isLeadUploadedByMe(lead)) return false;
      } else if (selectedUploader !== 'all') {
        const uploader = resolveUploaderName(lead);
        if (uploader.toLowerCase() !== selectedUploader.toLowerCase()) {
          return false;
        }
      }

      // Domain Filter
      if (selectedDomain !== 'all') {
        if ((lead.domain || '').toLowerCase() !== selectedDomain.toLowerCase()) {
          return false;
        }
      }

      // Incomplete Only Filter
      if (onlyIncomplete) {
        if (!isLeadIncomplete(lead)) return false;
      }

      // Pipeline Stage Filter
      if (pipelineTab !== 'all') {
        const s = (lead.status || lead.remarks || '').toLowerCase().replace(/[\s-_]/g, '');
        const target = pipelineTab.toLowerCase().replace(/[\s-_]/g, '');
        if (target === 'hrsourcing' && (s !== 'hrsourcing' && s !== 'pending')) return false;
        else if (target === 'hrfound' && s !== 'hrfound') return false;
        else if (target === 'contacted' && (s !== 'contacted' && s !== 'mailsent')) return false;
        else if (target === 'connected' && s !== 'connected') return false;
        else if (target === 'followup' && (s !== 'followup' && s !== 'hold')) return false;
        else if (target === 'jdsubmitted' && (s !== 'jdsubmitted' && s !== 'responded')) return false;
      }

      return true;
    });
  }, [dayTotalLeads, searchQuery, uploaderFilterMode, selectedUploader, selectedDomain, onlyIncomplete, pipelineTab, currentUser, usersMap]);

  // Incomplete count in the currently open sheet
  const dayIncompleteCount = useMemo(() => {
    return filteredLeads.filter((l) => isLeadIncomplete(l)).length;
  }, [filteredLeads]);

  // Unique uploaders for filter dropdown
  const uniqueUploaders = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      const name = resolveUploaderName(l);
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [leads, usersMap]);

  // Unique domains for filter dropdown
  const uniqueDomains = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.domain) set.add(l.domain);
    });
    return Array.from(set).sort();
  }, [leads]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = filteredLeads.length;
    const incomplete = filteredLeads.filter((l) => isLeadIncomplete(l)).length;
    const complete = total - incomplete;
    const withPhone = filteredLeads.filter((l) => Boolean(l.phone && l.phone.trim())).length;
    const withEmail = filteredLeads.filter((l) => Boolean(l.email && l.email.trim())).length;
    return { total, incomplete, complete, withPhone, withEmail };
  }, [filteredLeads]);

  // Helper copy function for outreach templates
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHelperKey(key);
    setTimeout(() => setCopiedHelperKey(null), 2500);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold border transition-all animate-bounce ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/95 border-rose-500/50 text-rose-200'
          }`}
        >
          {toastMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4 text-rose-400" />}
          <span>{toastMsg.message}</span>
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
                {adminMode ? 'Admin Portal · Master Outreach Sheets' : 'Collaborative Team Worksheet · All Leads'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {adminMode ? 'All Worksheets & Team Activity' : 'Team Worksheet & HR Sourcing'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl leading-relaxed">
              Shared team visibility of company leads grouped into daily sheets. Discover verified HR contacts, update pipeline stages, and enter direct recruiter phone numbers manually.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* HTML Upload Button */}
            <button
              onClick={() => setShowHtmlModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer border border-purple-500/30"
              title="Upload HTML file or paste web snippet to import leads"
            >
              <Code2 className="h-4 w-4 text-pink-200" />
              <span>HTML Upload</span>
            </button>

            {/* PDF Upload Button */}
            <button
              onClick={() => setShowPdfModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer border border-indigo-500/30"
              title="Upload PDF document to extract and store leads"
            >
              <FileText className="h-4 w-4 text-indigo-200" />
              <span>PDF Upload</span>
            </button>

            {/* Excel / CSV Import */}
            <button
              onClick={() => setShowExcelModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 transition cursor-pointer"
              title="Import spreadsheet leads"
            >
              <UploadCloud className="h-4 w-4 text-purple-400" />
              <span>Excel/CSV</span>
            </button>

            {/* Manual Quick Add Lead */}
            <button
              onClick={() => setShowAddLeadModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer border border-emerald-500/30"
            >
              <Plus className="h-4 w-4" />
              <span>Add Lead</span>
            </button>
          </div>
        </div>
      </div>

      {/* Post-Upload Banner */}
      {postUploadBanner && (
        <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-900/90 border border-purple-500/50 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 border border-purple-400/40 rounded-xl">
              <Sparkles className="h-5 w-5 text-purple-300 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold">
                🎉 {postUploadBanner.totalAdded} leads added to today's worksheet!
              </div>
              <div className="text-xs text-purple-200/90">
                {postUploadBanner.needHR > 0
                  ? `${postUploadBanner.needHR} leads need HR contact details (name, LinkedIn, or phone).`
                  : 'All newly added leads have contact details.'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {postUploadBanner.needHR > 0 && (
              <button
                onClick={() => {
                  const firstIncomplete = filteredLeads.find((l) => isLeadIncomplete(l));
                  if (firstIncomplete) handleOpenSourcingDrawer(firstIncomplete);
                }}
                className="px-4 py-2 bg-white text-purple-950 hover:bg-purple-100 text-xs font-black rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Start Finding HR</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => setPostUploadBanner(null)}
              className="p-1.5 text-purple-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Total Leads</span>
            <Building2 className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5">{stats.total}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Across all team daily sheets</div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Needs HR Details</span>
            <AlertCircle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1.5">{stats.incomplete}</div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">Missing Name/LinkedIn/Phone</div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>HR Complete</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 mt-1.5">{stats.complete}</div>
          <div className="text-[11px] text-emerald-500/80 mt-0.5">
            {stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0}% Fully sourced
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Direct Phone Numbers</span>
            <Phone className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1.5">{stats.withPhone}</div>
          <div className="text-[11px] text-emerald-500/80 mt-0.5">Verified recruiter numbers</div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Emails Sourced</span>
            <Mail className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-1.5">{stats.withEmail}</div>
          <div className="text-[11px] text-blue-400/80 mt-0.5">Direct HR mailboxes</div>
        </div>
      </div>

      {/* Filter and Controls Toolbar */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 shadow-lg backdrop-blur-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company, HR name, phone, email, uploader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Uploaded By Toggle: All team | Only me */}
            <div className="flex items-center bg-gray-950 border border-gray-700 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setUploaderFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  uploaderFilterMode === 'all'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                All team
              </button>
              <button
                type="button"
                onClick={() => setUploaderFilterMode('me')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  uploaderFilterMode === 'me'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Only me
              </button>
            </div>

            {/* Specific Member Filter (when All team is selected) */}
            {uploaderFilterMode === 'all' && (
              <div className="flex items-center gap-1.5 bg-gray-950 border border-gray-700 rounded-xl px-2.5 py-1.5">
                <User className="h-3.5 w-3.5 text-gray-400" />
                <select
                  value={selectedUploader}
                  onChange={(e) => setSelectedUploader(e.target.value)}
                  className="bg-transparent text-xs text-gray-200 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-gray-900 text-white">All Members</option>
                  {uniqueUploaders.map((u) => (
                    <option key={u} value={u} className="bg-gray-900 text-white">
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Domain Filter */}
            <div className="flex items-center gap-1.5 bg-gray-950 border border-gray-700 rounded-xl px-2.5 py-1.5">
              <Tag className="h-3.5 w-3.5 text-gray-400" />
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="bg-transparent text-xs text-gray-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-gray-900 text-white">All Domains</option>
                {uniqueDomains.map((d) => (
                  <option key={d} value={d} className="bg-gray-900 text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker with Navigation Arrows */}
            <div className="flex items-center gap-1 bg-gray-950 border border-gray-700 rounded-xl px-2 py-1">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                title="Previous day sheet"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1.5 px-1">
                <Calendar className="h-3.5 w-3.5 text-purple-400" />
                <input
                  type="date"
                  max={todayKey}
                  value={activeDateKey}
                  onChange={(e) => {
                    if (e.target.value && e.target.value <= todayKey) {
                      setActiveDateKey(e.target.value);
                    }
                  }}
                  className="bg-transparent text-xs text-gray-200 focus:outline-none cursor-pointer font-medium"
                  title="Select date sheet"
                />
              </div>
              <button
                type="button"
                onClick={handleNextDay}
                disabled={isViewingToday}
                className={`p-1 rounded-lg transition ${
                  isViewingToday
                    ? 'text-gray-600 cursor-not-allowed opacity-40'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer'
                }`}
                title={isViewingToday ? 'Already at today' : 'Next day sheet'}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Back to Today button in toolbar when viewing a previous date */}
            {!isViewingToday && (
              <button
                type="button"
                onClick={() => setActiveDateKey(todayKey)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow transition cursor-pointer"
                title="Return to today's sheet"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Back to Today</span>
              </button>
            )}

            {/* Incomplete Only Toggle */}
            <button
              onClick={() => setOnlyIncomplete(!onlyIncomplete)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                onlyIncomplete
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-gray-950 text-gray-300 border-gray-700 hover:bg-gray-800'
              }`}
            >
              <AlertCircle className={`h-3.5 w-3.5 ${onlyIncomplete ? 'text-amber-400' : 'text-gray-400'}`} />
              <span>Incomplete Only</span>
            </button>
          </div>
        </div>

        {/* Pipeline Stages Sub-Nav */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-gray-800/80">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1 shrink-0">
            Pipeline:
          </span>
          {PIPELINE_STAGES.map((st) => {
            const isActive = pipelineTab === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setPipelineTab(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/50'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SINGLE ACTIVE DAILY SHEET CONTAINER */}
      <div
        className={`border rounded-2xl overflow-hidden shadow-lg transition-all ${
          isViewingToday
            ? 'bg-gray-900/90 border-purple-500/40 shadow-purple-950/20'
            : 'bg-gray-900/90 border-indigo-500/40 shadow-indigo-950/20'
        }`}
      >
        {/* Daily Sheet Header Bar */}
        <div
          className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 ${
            isViewingToday ? 'bg-purple-950/40 border-b border-purple-500/30' : 'bg-indigo-950/40 border-b border-indigo-500/30'
          }`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className={`h-4 w-4 ${isViewingToday ? 'text-purple-400' : 'text-indigo-400'}`} />
              <h2 className="text-sm font-black text-white tracking-wide">
                {isViewingToday
                  ? `Today's Sheet: ${headingInfo.label} (${filteredLeads.length} leads)`
                  : `Sheet: ${headingInfo.label} (${filteredLeads.length} leads)`}
              </h2>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  isViewingToday
                    ? 'bg-purple-900/60 text-purple-300 border-purple-500/40'
                    : 'bg-indigo-900/60 text-indigo-300 border-indigo-500/40'
                }`}
              >
                {isViewingToday ? "Today's Sheet" : headingInfo.subLabel}
              </span>
            </div>

            {/* Count Badges */}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-200 font-bold border border-gray-700 text-[11px]">
                {filteredLeads.length} {filteredLeads.length === 1 ? 'Lead' : 'Leads'}
              </span>
              {dayIncompleteCount > 0 ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-600/40 text-[11px] font-bold flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-amber-400" />
                  {dayIncompleteCount} Need HR Details
                </span>
              ) : (
                filteredLeads.length > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    Complete
                  </span>
                )
              )}
            </div>

            {!isViewingToday && (
              <button
                type="button"
                onClick={() => setActiveDateKey(todayKey)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shadow-sm transition cursor-pointer"
                title="Switch back to today's sheet"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Back to Today</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {filteredLeads.length > 0 && (
              <button
                type="button"
                onClick={() => handleExportDayCSV(activeDateKey, filteredLeads)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold border border-gray-700 transition cursor-pointer"
                title="Export this sheet to Excel/CSV"
              >
                <Download className="h-3.5 w-3.5 text-gray-300" />
                <span>Export Sheet CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs space-y-3">
              {dayTotalLeads.length === 0 ? (
                <>
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-gray-800/80 flex items-center justify-center text-gray-500">
                    <Calendar className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-300">No leads on this date.</p>
                  {isViewingToday && (
                    <button
                      type="button"
                      onClick={() => setShowAddLeadModal(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add First Lead for Today</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-300">No leads match your current search/filter criteria.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setUploaderFilterMode('all');
                      setSelectedUploader('all');
                      setSelectedDomain('all');
                      setOnlyIncomplete(false);
                      setPipelineTab('all');
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer underline"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-950/80 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-800 tracking-wider">
                  <th className="py-3 px-3.5">#</th>
                  <th className="py-3 px-3.5">Company Name</th>
                  <th className="py-3 px-3">Date Uploaded (IST)</th>
                  <th className="py-3 px-3">Company Size</th>
                  <th className="py-3 px-3.5">Role / JD</th>
                  <th className="py-3 px-3">HR Name</th>
                  <th className="py-3 px-3">HR Role</th>
                  <th className="py-3 px-3">Domain</th>
                  <th className="py-3 px-3">Email Address</th>
                  <th className="py-3 px-3">Contact Number</th>
                  <th className="py-3 px-3">LinkedIn URL</th>
                  <th className="py-3 px-3">Uploaded By</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredLeads.map((lead, idx) => {
                          const isIncomplete = isLeadIncomplete(lead);
                          const missingFields = getMissingFields(lead);
                          const canEdit = canUserEditLead(lead);
                          const uploader = resolveUploaderName(lead);

                          return (
                            <tr
                              key={lead.id}
                              className={`hover:bg-gray-800/40 transition-colors ${
                                isIncomplete ? 'bg-amber-950/10' : ''
                              }`}
                            >
                              {/* Index */}
                              <td className="py-3 px-3.5 text-gray-500 font-mono text-[11px]">
                                {idx + 1}
                              </td>

                              {/* 1. Company Name */}
                              <td className="py-3 px-3.5">
                                <div className="font-bold text-white text-xs hover:text-purple-300 transition cursor-pointer"
                                  onClick={() => {
                                    if (lead.company) {
                                      setSelectedCompany(lead.company);
                                      setShowCompanyModal(true);
                                    }
                                  }}
                                >
                                  {lead.company?.name || lead.name}
                                </div>
                                {lead.company?.website && (
                                  <a
                                    href={lead.company.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-gray-400 hover:text-purple-400 flex items-center gap-1 mt-0.5 truncate max-w-[150px]"
                                  >
                                    <Globe className="h-2.5 w-2.5 shrink-0" />
                                    <span className="truncate">{lead.company.website.replace(/^https?:\/\//, '')}</span>
                                  </a>
                                )}
                              </td>

                              {/* 2. Date Uploaded (IST) */}
                              <td className="py-3 px-3 text-gray-400 whitespace-nowrap text-[11px]">
                                {lead.created_at ? formatIndianDateTime(lead.created_at) : '—'}
                              </td>

                              {/* 3. Company Size */}
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-300 border border-gray-700 whitespace-nowrap">
                                  {lead.company?.employee_count || '100-250 employees'}
                                </span>
                              </td>

                              {/* 4. Role / JD */}
                              <td className="py-3 px-3.5 font-semibold text-gray-200 max-w-[160px] truncate" title={lead.role_title || lead.title || 'Sourced Lead'}>
                                {lead.role_title || lead.title || 'Sourced Lead'}
                              </td>

                              {/* 5. HR Name */}
                              <td className="py-3 px-3">
                                {lead.name && lead.name !== 'Unknown Contact' && lead.name !== 'Talent Acquisition Team' ? (
                                  <span className="font-bold text-gray-100">{lead.name}</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-[10px] bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/50">
                                    Need HR Name
                                  </span>
                                )}
                              </td>

                              {/* 6. HR Role */}
                              <td className="py-3 px-3 text-gray-300 text-[11px] truncate max-w-[130px]">
                                {lead.title || 'Talent Lead'}
                              </td>

                              {/* 7. Domain */}
                              <td className="py-3 px-3 text-gray-400 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950/60 text-purple-300 border border-purple-800/40">
                                  {lead.domain || 'Technology'}
                                </span>
                              </td>

                              {/* 8. Email */}
                              <td className="py-3 px-3">
                                {lead.email ? (
                                  <a
                                    href={`mailto:${lead.email}`}
                                    className="text-indigo-300 hover:text-indigo-200 underline text-[11px] truncate max-w-[140px] block"
                                    title={lead.email}
                                  >
                                    {lead.email}
                                  </a>
                                ) : (
                                  <span className="text-gray-500 italic text-[11px]">—</span>
                                )}
                              </td>

                              {/* 9. Contact Number (Phone) */}
                              <td className="py-3 px-3">
                                {lead.phone ? (
                                  <div className="flex items-center gap-1 font-mono text-[11px] text-emerald-400 whitespace-nowrap">
                                    <Phone className="h-3 w-3 shrink-0" />
                                    <span>{formatIndianPhone(lead.phone)}</span>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-[10px] bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/50 whitespace-nowrap">
                                    Need Phone
                                  </span>
                                )}
                              </td>

                              {/* 10. LinkedIn URL */}
                              <td className="py-3 px-3">
                                {lead.linkedin_url ? (
                                  <a
                                    href={lead.linkedin_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-[11px]"
                                    title={lead.linkedin_url}
                                  >
                                    <Linkedin className="h-3.5 w-3.5 shrink-0" />
                                    <span>Profile</span>
                                    <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                  </a>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-[10px] bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/50 whitespace-nowrap">
                                    Need LinkedIn
                                  </span>
                                )}
                              </td>

                              {/* 11. Uploaded By */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-full bg-purple-900/80 text-purple-300 border border-purple-700/60 flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {uploader[0]}
                                  </div>
                                  <span className="font-semibold text-gray-200 text-[11px]">
                                    {uploader}
                                  </span>
                                </div>
                              </td>

                              {/* 12. Actions */}
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* "HR Sourcing" / "Find HR" button on incomplete leads */}
                                  {isIncomplete && (
                                    <button
                                      onClick={() => handleOpenSourcingDrawer(lead)}
                                      className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[10px] font-bold rounded-lg shadow transition flex items-center gap-1 cursor-pointer border border-purple-400/30"
                                      title="Open HR Sourcing toolkit & enter verified contacts"
                                    >
                                      <Sparkles className="h-3 w-3 text-yellow-300" />
                                      <span>HR Sourcing</span>
                                    </button>
                                  )}

                                  {/* General Edit button for Admin or Creator */}
                                  {canEdit ? (
                                    <button
                                      onClick={() => handleOpenEditModal(lead)}
                                      className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                                      title="Edit lead details"
                                    >
                                      <Edit2 className="h-3.5 w-3.5 text-purple-400" />
                                    </button>
                                  ) : (
                                    <span
                                      className="p-1 text-gray-600 cursor-not-allowed opacity-40"
                                      title={`Read-only: Uploaded by ${uploader}`}
                                    >
                                      <Lock className="h-3.5 w-3.5" />
                                    </span>
                                  )}

                                  {/* Delete (Admin only) */}
                                  {(adminMode || currentUser?.role === 'admin') && (
                                    <button
                                      onClick={() => setLeadToDelete(lead.id)}
                                      className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-gray-800 transition cursor-pointer"
                                      title="Delete lead (Admin only)"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

      {/* ========================================================================= */}
      {/* IN-PLACE DRAWER: "HR SOURCING" (Approved in Adjustment 1)                  */}
      {/* Labeled strictly "HR Sourcing" in UI                                     */}
      {/* ========================================================================= */}
      {sourcingDrawerLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-900 border border-purple-700/60 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Drawer Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-purple-950 via-gray-900 to-indigo-950 border-b border-purple-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/20 border border-purple-400/40 rounded-xl text-purple-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-wide">
                    HR Sourcing · Talent Discovery
                  </h3>
                  <p className="text-xs text-purple-300">
                    {sourcingDrawerLead.company?.name || 'Company'} — {sourcingDrawerLead.role_title || sourcingDrawerLead.title || 'Role'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSourcingDrawerLead(null)}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* "How to Find HR" Quick Toolkit (Uses company.name) */}
              {(() => {
                const leadCompName = (sourcingDrawerLead.company?.name || '').trim();
                const shortComp = getShortCompanyName(leadCompName);
                const showShortName = Boolean(
                  shortComp &&
                  leadCompName &&
                  shortComp.toLowerCase() !== leadCompName.toLowerCase() &&
                  shortComp.length >= 2
                );

                const linkedinPeopleUrl = leadCompName
                  ? `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(leadCompName)}%20HR%20OR%20"talent%20acquisition"%20OR%20recruiter`
                  : '';
                const googleXRayQuery = leadCompName
                  ? `site:linkedin.com/in "${leadCompName}" ("HR" OR "Talent Acquisition" OR "Recruiter" OR "HR Manager")`
                  : '';
                const shortXRayQuery = showShortName
                  ? `site:linkedin.com/in "${shortComp}" ("HR" OR "Talent Acquisition" OR "Recruiter" OR "HR Manager")`
                  : '';
                const careersQuery = leadCompName
                  ? `"${leadCompName}" careers contact HR email`
                  : '';
                const emailPatternQuery = leadCompName
                  ? `"${leadCompName}" email format OR "email pattern" site:rocketreach.co OR site:hunter.io`
                  : '';

                return (
                  <div className="bg-gray-950 border border-purple-900/50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Search className="h-4 w-4 text-purple-400" />
                        How to Find HR for {leadCompName || 'this Lead'}
                      </span>
                      <span className="text-[10px] text-purple-300/80">Direct search links · Opens in new tab</span>
                    </div>

                    {!leadCompName ? (
                      <div className="p-3 bg-amber-950/70 border border-amber-600/60 rounded-xl text-amber-200 text-xs flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        <span>Add company name to generate search links</span>
                      </div>
                    ) : (
                      <div className="space-y-2.5 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Query a: LinkedIn People Search */}
                          <a
                            href={linkedinPeopleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-950/60 border border-blue-700/50 text-blue-200 hover:bg-blue-900/60 transition cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 font-bold truncate">
                              <UserCheck className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                              <span className="truncate">LinkedIn People Search</span>
                            </span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>

                          {/* Query d: Careers & Contact Google Search */}
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(careersQuery)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-950/60 border border-indigo-700/50 text-indigo-200 hover:bg-indigo-900/60 transition cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 font-bold truncate">
                              <Globe className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                              <span className="truncate">Careers / Contact Email</span>
                            </span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        </div>

                        {/* Query b: Google X-Ray Search */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
                          <div className="truncate font-mono text-[11px] text-gray-300">
                            {googleXRayQuery}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(googleXRayQuery, 'xray');
                              }}
                              className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-[10px] font-bold border border-gray-700 flex items-center gap-1 cursor-pointer"
                            >
                              {copiedHelperKey === 'xray' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              <span>{copiedHelperKey === 'xray' ? 'Copied' : 'Copy'}</span>
                            </button>
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(googleXRayQuery)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span>Open Google</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        {/* Query c: Short Name X-Ray Search (if cleaned name differs) */}
                        {showShortName && (
                          <div className="bg-gray-900 border border-purple-800/40 rounded-xl p-2.5 flex items-center justify-between gap-2">
                            <div className="truncate font-mono text-[11px] text-gray-300">
                              <span className="text-pink-300 font-bold mr-1.5">[Short Name Search]</span>
                              {shortXRayQuery}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(shortXRayQuery, 'short-xray');
                                }}
                                className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-[10px] font-bold border border-gray-700 flex items-center gap-1 cursor-pointer"
                              >
                                {copiedHelperKey === 'short-xray' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                <span>{copiedHelperKey === 'short-xray' ? 'Copied' : 'Copy'}</span>
                              </button>
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(shortXRayQuery)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-2 py-1 bg-pink-700 hover:bg-pink-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <span>Open Google</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Query e: Email Pattern Search */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
                          <div className="truncate font-mono text-[11px] text-gray-300">
                            <span className="text-teal-300 font-bold mr-1.5">[Email Pattern]</span>
                            {emailPatternQuery}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(emailPatternQuery, 'email-pattern');
                              }}
                              className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-[10px] font-bold border border-gray-700 flex items-center gap-1 cursor-pointer"
                            >
                              {copiedHelperKey === 'email-pattern' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              <span>{copiedHelperKey === 'email-pattern' ? 'Copied' : 'Copy'}</span>
                            </button>
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(emailPatternQuery)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-1 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span>Open Google</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Outreach Note Template */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-800">
                      <span className="text-[11px] text-gray-400 truncate">
                        Outreach note: <i>"Hi {sourcingHRName || 'Hiring Lead'}, I noticed {leadCompName || 'your company'} is hiring..."</i>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(
                            `Hi ${sourcingHRName || 'Hiring Lead'},\n\nI noticed ${leadCompName || 'Company'} is actively hiring for ${sourcingDrawerLead.role_title || 'open roles'}. I specialize in placing pre-assessed talent and would love to connect to see if we can support your hiring pipeline.\n\nBest regards,\n${currentUser?.name || 'Campus Placement Team'}`,
                            'note'
                          );
                        }}
                        className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-purple-300 rounded-lg text-[10px] font-bold shrink-0 border border-gray-700 cursor-pointer"
                      >
                        {copiedHelperKey === 'note' ? 'Copied Note' : 'Copy Note'}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Manual Input Form */}
              <div className="space-y-4">
                <div className="font-bold text-white text-xs uppercase tracking-wider text-purple-300 border-b border-gray-800 pb-1">
                  Verified HR Contact Information (Manual Entry Only)
                </div>

                {sourcingPhoneError && (
                  <div className="p-3 bg-rose-950/80 border border-rose-600/50 rounded-xl text-rose-200 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>{sourcingPhoneError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">HR Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Kavya Sharma"
                      value={sourcingHRName}
                      onChange={(e) => setSourcingHRName(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">HR Designation / Role</label>
                    <input
                      type="text"
                      placeholder="e.g. Lead Technical Recruiter"
                      value={sourcingHRTitle}
                      onChange={(e) => setSourcingHRTitle(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">HR LinkedIn URL</label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      value={sourcingHRLinkedin}
                      onChange={(e) => setSourcingHRLinkedin(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">HR Email Address</label>
                    <input
                      type="email"
                      placeholder="kavya.sharma@company.com"
                      value={sourcingHREmail}
                      onChange={(e) => setSourcingHREmail(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">
                      Direct Phone Number (Manual Entry)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter 10-digit mobile (optional)"
                      value={sourcingHRPhone}
                      onChange={(e) => {
                        setSourcingHRPhone(e.target.value);
                        setSourcingPhoneError(null);
                      }}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-[10px] text-gray-500 mt-0.5 block">
                      No random numbers. Validates 10-digit Indian mobile only if typed.
                    </span>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Pipeline Status</label>
                    <select
                      value={sourcingStatus}
                      onChange={(e) => setSourcingStatus(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="HR Sourcing">HR Sourcing</option>
                      <option value="HR Found">HR Found</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Connected">Connected</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="JD Submitted">JD Submitted</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Notes / Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Sourced from LinkedIn People search. Follow-up scheduled."
                    value={sourcingNotes}
                    onChange={(e) => setSourcingNotes(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="px-6 py-4 bg-gray-950 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSourcingDrawerLead(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSavingSourcing}
                  onClick={() => handleSaveSourcing(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl border border-gray-700 transition cursor-pointer disabled:opacity-50"
                >
                  Save Details
                </button>

                <button
                  type="button"
                  disabled={isSavingSourcing}
                  onClick={() => handleSaveSourcing(true)}
                  className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50 border border-purple-400/30"
                >
                  <span>Save & Next Incomplete Lead</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL EDIT MODAL (FOR ADMIN OR LEAD CREATOR)                               */}
      {/* ========================================================================= */}
      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Edit Lead Details</h3>
                <p className="text-xs text-gray-400">
                  {adminMode ? 'Admin edit mode: All fields editable' : 'CRA edit mode: HR contact fields editable'}
                </p>
              </div>
              <button
                onClick={() => setEditingLead(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {editPhoneError && (
                <div className="p-3 bg-rose-950/80 border border-rose-600/50 rounded-xl text-rose-200 text-xs font-semibold">
                  {editPhoneError}
                </div>
              )}

              {/* Company & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Company Name</label>
                  <input
                    type="text"
                    disabled={!adminMode}
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none disabled:opacity-50"
                  />
                  {!adminMode && <span className="text-[10px] text-gray-500">Company edits are Admin-only</span>}
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Company Size</label>
                  <select
                    disabled={!adminMode}
                    value={editCompanySize}
                    onChange={(e) => setEditCompanySize(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none disabled:opacity-50 cursor-pointer"
                  >
                    {COMPANY_SIZE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Role / JD Title</label>
                  <input
                    type="text"
                    value={editRoleTitle}
                    onChange={(e) => setEditRoleTitle(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Domain</label>
                  <input
                    type="text"
                    value={editDomain}
                    onChange={(e) => setEditDomain(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* HR Contact Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-800">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">HR Name</label>
                  <input
                    type="text"
                    value={editHRName}
                    onChange={(e) => setEditHRName(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">HR Role / Title</label>
                  <input
                    type="text"
                    value={editHRTitle}
                    onChange={(e) => setEditHRTitle(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">HR LinkedIn URL</label>
                  <input
                    type="url"
                    value={editHRLinkedin}
                    onChange={(e) => setEditHRLinkedin(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">HR Email</label>
                  <input
                    type="email"
                    value={editHREmail}
                    onChange={(e) => setEditHREmail(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">HR Phone Number (Manual)</label>
                  <input
                    type="text"
                    placeholder="Enter phone manually (optional)"
                    value={editHRPhone}
                    onChange={(e) => {
                      setEditHRPhone(e.target.value);
                      setEditPhoneError(null);
                    }}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Pipeline Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="HR Sourcing">HR Sourcing</option>
                    <option value="HR Found">HR Found</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Connected">Connected</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="JD Submitted">JD Submitted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-950 border-t border-gray-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingLead(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={handleSaveEditModal}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer disabled:opacity-50"
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD LEAD MODAL                                                            */}
      {/* ========================================================================= */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-900 border border-purple-700/60 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="h-4 w-4 text-emerald-400" />
                  Add New Lead to Today's Worksheet
                </h3>
                <p className="text-xs text-gray-400">
                  Adds lead directly to today's sheet under status "HR Sourcing".
                </p>
              </div>
              <button
                onClick={() => setShowAddLeadModal(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeadSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {addLeadError && (
                <div className="p-3 bg-rose-950/80 border border-rose-600/50 rounded-xl text-rose-200 text-xs font-semibold">
                  {addLeadError}
                </div>
              )}
              {newAddPhoneError && (
                <div className="p-3 bg-rose-950/80 border border-rose-600/50 rounded-xl text-rose-200 text-xs font-semibold">
                  {newAddPhoneError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Swiggy, Razorpay, Palo Alto..."
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Role / Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Security Engineer, DevOps..."
                    value={newRoleTitle}
                    onChange={(e) => setNewRoleTitle(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Company Size</label>
                  <select
                    value={newCompanySize}
                    onChange={(e) => setNewCompanySize(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-2.5 py-2 text-white focus:outline-none cursor-pointer"
                  >
                    {COMPANY_SIZE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Domain</label>
                  <input
                    type="text"
                    placeholder="e.g. Cyber Security"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Lead Source</label>
                  <select
                    value={newLeadSource}
                    onChange={(e) => setNewLeadSource(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-2.5 py-2 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Naukri">Naukri</option>
                    <option value="Company Careers">Company Careers</option>
                    <option value="Foundit">Foundit</option>
                    <option value="Direct Outreach">Direct Outreach</option>
                  </select>
                </div>
              </div>

              {/* Optional HR details right now (can be left blank for HR Sourcing stage) */}
              <div className="pt-2 border-t border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-bold">HR Contact Details (Optional)</span>
                  <span className="text-[10px] text-purple-300">Leave blank if unknown; source later</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 text-[11px] mb-1">HR Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Radhika Sharma"
                      value={newHRName}
                      onChange={(e) => setNewHRName(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-[11px] mb-1">HR Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Talent Acquisition"
                      value={newHRTitle}
                      onChange={(e) => setNewHRTitle(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-400 text-[11px] mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      value={newHRLinkedin}
                      onChange={(e) => setNewHRLinkedin(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-[11px] mb-1">HR Email</label>
                    <input
                      type="email"
                      placeholder="hr@company.com"
                      value={newHREmail}
                      onChange={(e) => setNewHREmail(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-[11px] mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="Enter phone manually"
                      value={newHRPhone}
                      onChange={(e) => setNewHRPhone(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-[11px] mb-1">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Key observations or hiring context..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="px-0 py-3 flex justify-end gap-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingLead ? 'Adding Lead...' : 'Add Lead to Today\'s Sheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-900 border border-rose-800/60 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 bg-rose-950/80 rounded-xl border border-rose-700/50">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Delete Lead</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to permanently delete this lead from the worksheet? This action is admin-only and cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setLeadToDelete(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteLead(leadToDelete)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showHtmlModal && (
        <HtmlLeadImportModal
          isOpen={showHtmlModal}
          onClose={() => setShowHtmlModal(false)}
          defaultMember={currentUser?.name?.split(' ')[0] || 'Aravind'}
          onSaveLeads={async (newLeads) => {
            try {
              await api.bulkImportWorksheetLeads(newLeads);
              await fetchLeads();
              setActiveDateKey(todayKey);
              setShowHtmlModal(false);
              setPostUploadBanner({
                totalAdded: newLeads.length,
                needHR: newLeads.filter((l) => !l.hr_name || !l.phone || !l.hr_linkedin).length,
              });
              showToast(`Imported ${newLeads.length} leads successfully!`);
            } catch (err: any) {
              showToast(err.message || 'Failed to import leads', 'error');
            }
          }}
        />
      )}

      {showPdfModal && (
        <PdfLeadImportModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          defaultMember={currentUser?.name?.split(' ')[0] || 'Aravind'}
          onSaveLeads={async (newLeads) => {
            try {
              await api.bulkImportWorksheetLeads(newLeads);
              await fetchLeads();
              setActiveDateKey(todayKey);
              setShowPdfModal(false);
              setPostUploadBanner({
                totalAdded: newLeads.length,
                needHR: newLeads.filter((l) => !l.hr_name || !l.phone || !l.hr_linkedin).length,
              });
              showToast(`Imported ${newLeads.length} leads from PDF!`);
            } catch (err: any) {
              showToast(err.message || 'Failed to import leads', 'error');
            }
          }}
        />
      )}

      {showExcelModal && (
        <ExcelWorksheetImportModal
          isOpen={showExcelModal}
          onClose={() => setShowExcelModal(false)}
          onImportSuccess={(count) => {
            fetchLeads();
            setActiveDateKey(todayKey);
            setPostUploadBanner({ totalAdded: count, needHR: count });
          }}
        />
      )}

      {showCompanyModal && selectedCompany && (
        <CompanyDetailsModal
          isOpen={showCompanyModal}
          onClose={() => {
            setShowCompanyModal(false);
            setSelectedCompany(null);
          }}
          company={selectedCompany}
          onUpdateCompany={async () => fetchLeads()}
        />
      )}

      {showReportModal && (
        <SystemReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};
export default TeamSheetsPage;
