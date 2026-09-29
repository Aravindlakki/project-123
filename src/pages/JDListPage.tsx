import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { JD, Company, HRContact, CRA } from '../types';
import { CompanyDetailsModal } from '../components/CompanyDetailsModal';
import {
  Briefcase,
  Building2,
  User,
  Calendar,
  Search,
  Filter,
  Plus,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Mail,
  Phone,
  FileText,
  Copy,
  Check,
  AlertCircle,
  X,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface JDListPageProps {
  currentUser?: CRA | null;
  adminMode?: boolean;
}

export const JDListPage: React.FC<JDListPageProps> = ({ currentUser, adminMode = false }) => {
  const [jds, setJds] = useState<JD[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<HRContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [hrFilter, setHrFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in-progress' | 'closed' | 'filled'>('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedJdForView, setSelectedJdForView] = useState<JD | null>(null);
  const [selectedCompanyForModal, setSelectedCompanyForModal] = useState<Company | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add JD Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCompanyId, setNewCompanyId] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [newHrName, setNewHrName] = useState('');
  const [newHrEmail, setNewHrEmail] = useState('');
  const [newHrPhone, setNewHrPhone] = useState('');
  const [newHrDesignation, setNewHrDesignation] = useState('HR Manager');
  const [newDateReceived, setNewDateReceived] = useState(() => new Date().toISOString().slice(0, 10));
  const [newStatus, setNewStatus] = useState<'open' | 'in-progress' | 'closed' | 'filled'>('open');
  const [newRawText, setNewRawText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedJds, fetchedCompanies, fetchedContacts] = await Promise.all([
        api.getJDs(),
        api.getCompanies(),
        api.getContacts(),
      ]);
      setJds(fetchedJds);
      setCompanies(fetchedCompanies);
      setContacts(fetchedContacts);
    } catch (err: any) {
      console.error('Failed to load JD List data:', err);
      setError(err.message || 'Failed to load Job Descriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered and enriched JDs
  const filteredJds = useMemo(() => {
    return jds.filter((jd) => {
      // Company Filter
      if (companyFilter !== 'all') {
        const compId = jd.company_id || jd.company?.id;
        const compName = (jd.company?.name || jd.company_name || '').toLowerCase();
        if (compId !== companyFilter && !compName.includes(companyFilter.toLowerCase())) {
          return false;
        }
      }

      // HR Contact Filter
      if (hrFilter !== 'all') {
        const contactMatch =
          jd.hr_contact_id === hrFilter ||
          (jd.hr_name && jd.hr_name.toLowerCase().includes(hrFilter.toLowerCase())) ||
          (jd.hr_email && jd.hr_email.toLowerCase().includes(hrFilter.toLowerCase()));
        if (!contactMatch) return false;
      }

      // Status Filter
      if (statusFilter !== 'all') {
        const currentStatus = (jd.status || (jd.is_verified ? 'open' : 'in-progress')).toLowerCase();
        if (statusFilter === 'closed' || statusFilter === 'filled') {
          if (!currentStatus.includes('closed') && !currentStatus.includes('filled')) return false;
        } else if (currentStatus !== statusFilter) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const jdId = (jd.jd_id || jd.id).toLowerCase();
        const title = (jd.title || '').toLowerCase();
        const comp = (jd.company?.name || jd.company_name || '').toLowerCase();
        const hr = (jd.hr_name || jd.hr_contact?.name || '').toLowerCase();
        const email = (jd.hr_email || jd.hr_contact?.email || '').toLowerCase();
        const desc = (jd.raw_text || '').toLowerCase();
        return (
          jdId.includes(q) ||
          title.includes(q) ||
          comp.includes(q) ||
          hr.includes(q) ||
          email.includes(q) ||
          desc.includes(q)
        );
      }

      return true;
    });
  }, [jds, companyFilter, hrFilter, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = jds.length;
    const openCount = jds.filter(
      (j) => (j.status || (j.is_verified ? 'open' : 'in-progress')).toLowerCase() === 'open'
    ).length;
    const inProgressCount = jds.filter(
      (j) => (j.status || (j.is_verified ? 'open' : 'in-progress')).toLowerCase() === 'in-progress'
    ).length;
    const closedCount = jds.filter((j) => {
      const s = (j.status || '').toLowerCase();
      return s.includes('closed') || s.includes('filled');
    }).length;
    return { total, openCount, inProgressCount, closedCount };
  }, [jds]);

  // Unique companies and HR contacts for filters
  const uniqueCompanies = useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach((c) => map.set(c.id, c.name));
    jds.forEach((j) => {
      if (j.company_id && j.company?.name) map.set(j.company_id, j.company.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [companies, jds]);

  const uniqueHrContacts = useMemo(() => {
    const map = new Map<string, string>();
    contacts.forEach((c) => map.set(c.id, `${c.name} (${c.company?.name || 'CRM'})`));
    jds.forEach((j) => {
      if (j.hr_name && !map.has(j.hr_contact_id || j.hr_name)) {
        map.set(j.hr_contact_id || j.hr_name, `${j.hr_name} (${j.company?.name || 'Direct'})`);
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [contacts, jds]);

  const handleCopy = (text: string, idKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdateStatus = async (jdId: string, newStatusVal: 'open' | 'in-progress' | 'closed' | 'filled') => {
    try {
      await api.updateJD(jdId, { status: newStatusVal });
      setJds((prev) =>
        prev.map((item) => (item.id === jdId || item.jd_id === jdId ? { ...item, status: newStatusVal } : item))
      );
      setSuccessMsg(`Status updated to "${newStatusVal.toUpperCase()}" for JD.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update JD status');
    }
  };

  const handleAddJdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError('Job Title / Role is required.');
      return;
    }

    let finalCompanyId = newCompanyId;
    if (!finalCompanyId && newCompanyName.trim()) {
      // Find or create company
      const found = companies.find((c) => c.name.toLowerCase().trim() === newCompanyName.toLowerCase().trim());
      if (found) {
        finalCompanyId = found.id;
      } else {
        const createdComp = await api.createCompany({
          name: newCompanyName.trim(),
          industry: 'Information Technology',
          source: 'manual',
        });
        finalCompanyId = createdComp.id;
        setCompanies((prev) => [createdComp, ...prev]);
      }
    }

    if (!finalCompanyId) {
      setFormError('Please select or enter a Company Name.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const created = await api.createJD({
        company_id: finalCompanyId,
        title: newTitle.trim(),
        raw_text: newRawText.trim() || `Job Description for ${newTitle.trim()}.`,
        opportunity_type: 'existing_post',
        is_verified: true,
        verification_source: 'manual_entry',
        date_found: newDateReceived,
        status: newStatus,
        triggers_hr_sourcing: false, // Pure JD only; does not feed HR sourcing
        hr_name: newHrName.trim() || undefined,
        hr_email: newHrEmail.trim() || undefined,
        hr_phone: newHrPhone.trim() || undefined,
        hr_designation: newHrDesignation.trim() || 'HR Manager',
        hr_contact_id: selectedContactId || undefined,
      });

      setJds((prev) => [created, ...prev]);
      setShowAddModal(false);
      setSuccessMsg(`New Job Description '${created.title}' (ID: ${created.jd_id || created.id}) added successfully!`);
      setTimeout(() => setSuccessMsg(null), 4000);

      // Reset form
      setNewTitle('');
      setNewCompanyId('');
      setNewCompanyName('');
      setSelectedContactId('');
      setNewHrName('');
      setNewHrEmail('');
      setNewHrPhone('');
      setNewRawText('');
      setNewStatus('open');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create Job Description.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredJds.length === 0) return;

    const headers = [
      'JD ID',
      'Company Name',
      'Role / Title',
      'HR Contact Name',
      'HR Contact Email',
      'HR Contact Phone',
      'Date Received',
      'Status',
    ];

    const rows = filteredJds.map((j) => [
      `"${j.jd_id || j.id}"`,
      `"${j.company?.name || j.company_name || ''}"`,
      `"${j.title || ''}"`,
      `"${j.hr_name || j.hr_contact?.name || ''}"`,
      `"${j.hr_email || j.hr_contact?.email || ''}"`,
      `"${j.hr_phone || j.hr_contact?.phone || ''}"`,
      `"${j.date_received || j.date_found || ''}"`,
      `"${j.status || (j.is_verified ? 'open' : 'in-progress')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PLACEMEIN_JD_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status?: string, isVerified?: boolean) => {
    const s = (status || (isVerified ? 'open' : 'in-progress')).toLowerCase();
    if (s === 'open') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Open
        </span>
      );
    }
    if (s === 'in-progress' || s === 'in progress') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <Clock className="h-3 w-3" />
          In Progress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
        <CheckCircle2 className="h-3 w-3" />
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white p-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white p-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header and Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                JD List Module
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {adminMode ? 'Admin Oversight' : 'CRA Portal'}
                </span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Independent Job Description registry tracking client opportunities, assigned HR contacts, and live hiring statuses.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-800 bg-gray-900 text-gray-400 hover:text-white hover:border-gray-700 transition"
            title="Refresh JD List"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-800 bg-gray-900 text-gray-300 hover:text-white hover:border-gray-700 text-xs font-bold transition"
            title="Export filtered JDs to CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-950/40 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add New JD</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-purple-400" />
            Total JDs
          </span>
          <span className="text-2xl font-black text-white mt-2">{stats.total}</span>
        </div>
        <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Open JDs
          </span>
          <span className="text-2xl font-black text-emerald-300 mt-2">{stats.openCount}</span>
        </div>
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            In Progress
          </span>
          <span className="text-2xl font-black text-amber-300 mt-2">{stats.inProgressCount}</span>
        </div>
        <div className="bg-purple-950/20 border border-purple-800/30 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
            Closed / Filled
          </span>
          <span className="text-2xl font-black text-purple-300 mt-2">{stats.closedCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by JD ID, role title, company name, HR contact..."
              className="w-full pl-9 pr-4 py-2 bg-gray-950/80 border border-gray-700/80 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Company Filter */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full lg:w-48 bg-gray-950/80 border border-gray-700/80 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition"
            >
              <option value="all">All Companies</option>
              {uniqueCompanies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* HR Contact Filter */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <select
              value={hrFilter}
              onChange={(e) => setHrFilter(e.target.value)}
              className="w-full lg:w-48 bg-gray-950/80 border border-gray-700/80 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition"
            >
              <option value="all">All HR Contacts</option>
              {uniqueHrContacts.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Filter className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full lg:w-36 bg-gray-950/80 border border-gray-700/80 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="closed">Closed / Filled</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-800">
          <span>
            Showing <strong>{filteredJds.length}</strong> of <strong>{jds.length}</strong> Job Descriptions
          </span>
          {(companyFilter !== 'all' || hrFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setCompanyFilter('all');
                setHrFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="text-purple-400 hover:text-purple-300 font-bold transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* JD Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/80 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">JD ID</th>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Role / Title</th>
                <th className="py-3 px-4">HR Contact (Provider)</th>
                <th className="py-3 px-4">Date Received</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-purple-400" />
                      <span>Loading Job Descriptions...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredJds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Briefcase className="h-8 w-8 text-gray-600" />
                      <span className="font-bold text-gray-300">No Job Descriptions found</span>
                      <span className="text-[11px] text-gray-500">
                        Try adjusting your filters or click "+ Add New JD" to record an opportunity.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredJds.map((jd, idx) => {
                  const companyObj = jd.company || companies.find((c) => c.id === jd.company_id);
                  const linkedContact =
                    jd.hr_contact ||
                    contacts.find(
                      (c) =>
                        c.id === jd.hr_contact_id ||
                        (c.email && c.email.toLowerCase() === jd.hr_email?.toLowerCase())
                    );
                  const hrDisplayName = jd.hr_name || linkedContact?.name || 'Talent Acquisition';
                  const hrDisplayEmail = jd.hr_email || linkedContact?.email || '';

                  return (
                    <tr key={jd.id || idx} className="hover:bg-purple-950/20 transition-colors group">
                      {/* JD ID */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-purple-300 bg-purple-950/60 border border-purple-800/50 px-2 py-0.5 rounded-lg text-[11px]">
                            {jd.jd_id || `JD-2026-${String(idx + 1).padStart(4, '0')}`}
                          </span>
                          <button
                            onClick={() => handleCopy(jd.jd_id || jd.id, `jd_${jd.id}`)}
                            className="p-1 text-gray-500 hover:text-white rounded hover:bg-gray-800"
                            title="Copy JD ID"
                          >
                            {copiedId === `jd_${jd.id}` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Company Name */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (companyObj) setSelectedCompanyForModal(companyObj);
                          }}
                          className="font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                          title="Click to view full Company & Contact dossier"
                        >
                          <Building2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                          <span className="underline decoration-purple-500/40 underline-offset-2">
                            {companyObj?.name || jd.company_name || 'Hiring Enterprise'}
                          </span>
                        </button>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {companyObj?.industry || 'Technology'}
                        </span>
                      </td>

                      {/* Role / Title */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-200 block text-xs">{jd.title}</span>
                        <span className="text-[10px] text-gray-400 truncate max-w-[200px] block">
                          {jd.raw_text ? jd.raw_text.slice(0, 50) + '...' : 'Full job spec'}
                        </span>
                      </td>

                      {/* HR Contact Who Provided JD */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 font-medium text-gray-200">
                            <User className="h-3 w-3 text-indigo-400 shrink-0" />
                            <span>{hrDisplayName}</span>
                            {linkedContact && (
                              <span
                                className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30"
                                title="Linked to CRM Contact record"
                              >
                                CRM
                              </span>
                            )}
                          </div>
                          {hrDisplayEmail ? (
                            <a
                              href={`mailto:${hrDisplayEmail}`}
                              className="text-[10px] text-blue-300 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Mail className="h-2.5 w-2.5 text-blue-400" />
                              <span className="truncate max-w-[150px]">{hrDisplayEmail}</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-gray-500 italic mt-0.5">No email registered</span>
                          )}
                        </div>
                      </td>

                      {/* Date Received */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-300 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-gray-500 shrink-0" />
                          <span>{jd.date_received || jd.date_found || '2026-08-20'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {/* Live Status Selector */}
                          <select
                            value={(jd.status || (jd.is_verified ? 'open' : 'in-progress')).toLowerCase()}
                            onChange={(e) => handleUpdateStatus(jd.id, e.target.value as any)}
                            className="bg-gray-950 border border-gray-700/80 rounded-lg px-2 py-1 text-[11px] font-bold text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                          >
                            <option value="open" className="bg-gray-900 text-emerald-300">
                              Open
                            </option>
                            <option value="in-progress" className="bg-gray-900 text-amber-300">
                              In Progress
                            </option>
                            <option value="closed" className="bg-gray-900 text-purple-300">
                              Closed / Filled
                            </option>
                          </select>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedJdForView(jd)}
                            className="p-1.5 text-purple-400 hover:text-white hover:bg-purple-900/40 rounded-lg transition"
                            title="View Full Job Description & Scope"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New JD Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-gray-900 border border-purple-500/40 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-purple-950 via-gray-900 to-indigo-950 border-b border-purple-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-600/30 border border-purple-500/40 rounded-xl text-purple-300">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Record New Job Description</h3>
                  <p className="text-[11px] text-gray-300">
                    Add a client JD with unique ID, linked HR contact, and hiring status.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddJdSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-200 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Role Title */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300 block mb-1">
                  Role / Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Senior Software Engineer / Cybersecurity Specialist"
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Company Selection / Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Select Existing Company
                  </label>
                  <select
                    value={newCompanyId}
                    onChange={(e) => {
                      setNewCompanyId(e.target.value);
                      if (e.target.value) setNewCompanyName('');
                    }}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">-- Choose Existing --</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Or Enter New Company
                  </label>
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => {
                      setNewCompanyName(e.target.value);
                      if (e.target.value) setNewCompanyId('');
                    }}
                    placeholder="e.g. Acme Innovations"
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* HR Contact (Provider) */}
              <div className="p-3.5 bg-gray-950/60 border border-gray-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-indigo-400" />
                    HR Contact Who Provided the JD
                  </span>
                  <span className="text-[10px] text-gray-400">Links directly to CRM</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Select from CRM Contacts</label>
                    <select
                      value={selectedContactId}
                      onChange={(e) => {
                        setSelectedContactId(e.target.value);
                        const match = contacts.find((c) => c.id === e.target.value);
                        if (match) {
                          setNewHrName(match.name);
                          setNewHrEmail(match.email || '');
                          setNewHrPhone(match.phone || '');
                          setNewHrDesignation(match.title || 'HR Manager');
                          if (!newCompanyId) setNewCompanyId(match.company_id);
                        }
                      }}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Manual Entry / None --</option>
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.company?.name || 'CRM'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">HR Contact Name</label>
                    <input
                      type="text"
                      value={newHrName}
                      onChange={(e) => setNewHrName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">HR Work Email</label>
                    <input
                      type="email"
                      value={newHrEmail}
                      onChange={(e) => setNewHrEmail(e.target.value)}
                      placeholder="e.g. priya@company.com"
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">HR Phone / WhatsApp</label>
                    <input
                      type="text"
                      value={newHrPhone}
                      onChange={(e) => setNewHrPhone(e.target.value)}
                      placeholder="Enter phone manually"
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Date Received & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Date Received
                  </label>
                  <input
                    type="date"
                    value={newDateReceived}
                    onChange={(e) => setNewDateReceived(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="closed">Closed / Filled</option>
                  </select>
                </div>
              </div>

              {/* Raw JD Text */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-300 block mb-1">
                  Job Description / Requirements Details
                </label>
                <textarea
                  rows={4}
                  value={newRawText}
                  onChange={(e) => setNewRawText(e.target.value)}
                  placeholder="Paste qualifications, responsibilities, years of experience, tech stack..."
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>{isSubmitting ? 'Recording JD...' : 'Save Job Description'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JD Full Scope Details Modal */}
      {selectedJdForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-gray-900 border border-purple-500/40 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-purple-950 via-gray-900 to-indigo-950 border-b border-purple-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-600/30 border border-purple-500/40 rounded-xl text-purple-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{selectedJdForView.title}</h3>
                  <p className="text-[11px] text-gray-300">
                    JD ID: <strong className="text-purple-300">{selectedJdForView.jd_id || selectedJdForView.id}</strong> &bull; {selectedJdForView.company?.name || selectedJdForView.company_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedJdForView(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-gray-950/60 p-3 rounded-2xl border border-gray-800 text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedJdForView.status, selectedJdForView.is_verified)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Date Received</span>
                  <span className="text-gray-200 font-mono text-[11px] block mt-1">
                    {selectedJdForView.date_received || selectedJdForView.date_found || '2026-08-20'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">HR Provider</span>
                  <span className="text-gray-200 font-medium text-[11px] block mt-1">
                    {selectedJdForView.hr_name || 'Hiring Lead'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Verification</span>
                  <span className="text-gray-300 text-[11px] block mt-1">
                    {selectedJdForView.verification_source || 'manual'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1.5 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Full Job Description / Requirements
                </h4>
                <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 text-xs font-mono text-gray-300 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {selectedJdForView.raw_text || 'No detailed job description text provided.'}
                </div>
              </div>

              {selectedJdForView.hr_email && (
                <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-gray-300">
                    Contact HR: <strong>{selectedJdForView.hr_name}</strong> ({selectedJdForView.hr_email})
                  </span>
                  <a
                    href={`mailto:${selectedJdForView.hr_email}?subject=Regarding JD ${selectedJdForView.jd_id || selectedJdForView.id}: ${selectedJdForView.title}`}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Mail className="h-3 w-3" />
                    <span>Send Email</span>
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-950 border-t border-gray-800 flex justify-end">
              <button
                onClick={() => setSelectedJdForView(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Details Dossier Modal */}
      {selectedCompanyForModal && (
        <CompanyDetailsModal
          company={selectedCompanyForModal}
          isOpen={true}
          onClose={() => setSelectedCompanyForModal(null)}
        />
      )}
    </div>
  );
};

export default JDListPage;
