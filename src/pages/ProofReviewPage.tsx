import React, { useState, useEffect, useMemo } from 'react';
import { HRContact, CRA, Company, LeadResponseStatus } from '../types';
import { api } from '../services/api';
import { clientFallbackStore } from '../services/supabaseDataService';
import { proofStore } from '../services/proofStore';
import { formatIndianDateTime } from '../utils/formatters';
import { cleanUploaderName } from '../utils/leadOwnership';
import { responseLabel, responseShortLabel } from '../constants/worksheet';
import { ProofReviewModal } from '../components/ProofReviewModal';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  User,
  Phone,
  MessageSquare,
  Mail,
  ExternalLink,
  Maximize2,
  RotateCw,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  ArrowUpDown,
  Eye,
  Check,
  X,
  FileSpreadsheet,
  Layers,
  ZoomIn,
  Download,
} from 'lucide-react';

interface ProofReviewPageProps {
  currentUser: CRA | null;
  setActiveTab?: (tab: string) => void;
}

export const ProofReviewPage: React.FC<ProofReviewPageProps> = ({
  currentUser,
  setActiveTab,
}) => {
  const [leads, setLeads] = useState<HRContact[]>([]);
  const [users, setUsers] = useState<CRA[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'company' | 'name'>('newest');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals
  const [reviewModalLead, setReviewModalLead] = useState<HRContact | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [quickRejectLead, setQuickRejectLead] = useState<HRContact | null>(null);
  const [quickRejectReason, setQuickRejectReason] = useState<string>('Details do not match the lead');
  const [quickRejectNotes, setQuickRejectNotes] = useState<string>('');
  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);

  // Toast notification
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch all leads (admin view fetches all leads from all team members)
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fetchedLeads, fetchedUsers] = await Promise.all([
        api.getWorksheetLeads(),
        api.getCRAs().catch(() => []),
      ]);

      const mergedLeads = proofStore.mergeContacts(fetchedLeads);
      setLeads(mergedLeads);
      setUsers(fetchedUsers);

      const mapping: Record<string, string> = {};
      fetchedUsers.forEach((u: CRA) => {
        if (u.id) mapping[u.id] = u.name;
      });
      setUsersMap(mapping);
    } catch (err) {
      console.error('Failed to fetch leads for proof review', err);
      const fallback = clientFallbackStore.getContacts();
      const mergedFallback = proofStore.mergeContacts(fallback);
      setLeads(mergedFallback);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for custom events triggered elsewhere when proofs are updated or uploaded
    const handleProofUpdate = (e: any) => {
      const detail = e?.detail;
      if (detail?.leadId && detail?.status) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === detail.leadId
              ? {
                  ...l,
                  proof_verified_status: detail.status,
                  ...(detail.status === 'rejected'
                    ? { response_status: 'no_response_yet' as LeadResponseStatus, responded_at: null as any }
                    : {}),
                }
              : l
          )
        );
      } else {
        fetchData();
      }
    };
    window.addEventListener('proof_verification_updated', handleProofUpdate);
    window.addEventListener('worksheet_proof_updated', handleProofUpdate);

    return () => {
      window.removeEventListener('proof_verification_updated', handleProofUpdate);
      window.removeEventListener('worksheet_proof_updated', handleProofUpdate);
    };
  }, []);

  // Filter leads that actually have a proof uploaded
  const proofLeads = useMemo(() => {
    return leads.filter((l) => Boolean(l.proof_screenshot_url));
  }, [leads]);

  // Statistics counts
  const stats = useMemo(() => {
    const total = proofLeads.length;
    const pending = proofLeads.filter((l) => (l.proof_verified_status || 'pending') === 'pending').length;
    const verified = proofLeads.filter((l) => l.proof_verified_status === 'verified' || l.proof_verified_status === 'approved').length;
    const rejected = proofLeads.filter((l) => l.proof_verified_status === 'rejected').length;
    return { total, pending, verified, rejected };
  }, [proofLeads]);

  // Resolve human-readable uploader name
  const resolveUploaderName = (lead: HRContact): string => {
    if (lead.entered_by_name && lead.entered_by_name.trim()) {
      return cleanUploaderName(lead.entered_by_name);
    }
    if (lead.created_by && usersMap[lead.created_by]) {
      return usersMap[lead.created_by];
    }
    if (lead.spoc && lead.spoc.trim()) {
      return lead.spoc.trim();
    }
    return 'Team Member';
  };

  // Filter and sort proofs
  const filteredProofs = useMemo(() => {
    return proofLeads.filter((lead) => {
      // Status filter
      const curStatus = (lead.proof_verified_status === 'approved' || lead.proof_verified_status === 'verified')
        ? 'verified'
        : (lead.proof_verified_status || 'pending');
      if (statusFilter !== 'all' && curStatus !== statusFilter) {
        return false;
      }

      // Member filter
      if (memberFilter !== 'all') {
        const uploader = resolveUploaderName(lead).toLowerCase();
        if (!uploader.includes(memberFilter.toLowerCase())) {
          return false;
        }
      }

      // Channel filter
      if (channelFilter !== 'all') {
        const ch = lead.proof_channel || 'mailed';
        if (ch !== channelFilter) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const companyName = (lead.company?.name || '').toLowerCase();
        const contactName = (lead.name || '').toLowerCase();
        const title = (lead.role_title || lead.title || '').toLowerCase();
        const email = (lead.email || '').toLowerCase();
        const phone = (lead.phone || '').toLowerCase();
        const uploader = resolveUploaderName(lead).toLowerCase();

        return (
          companyName.includes(q) ||
          contactName.includes(q) ||
          title.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          uploader.includes(q)
        );
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        const timeA = new Date(a.proof_screenshot_uploaded_at || a.responded_at || a.created_at || 0).getTime();
        const timeB = new Date(b.proof_screenshot_uploaded_at || b.responded_at || b.created_at || 0).getTime();
        return timeB - timeA;
      }
      if (sortBy === 'oldest') {
        const timeA = new Date(a.proof_screenshot_uploaded_at || a.responded_at || a.created_at || 0).getTime();
        const timeB = new Date(b.proof_screenshot_uploaded_at || b.responded_at || b.created_at || 0).getTime();
        return timeA - timeB;
      }
      if (sortBy === 'company') {
        const nameA = a.company?.name || '';
        const nameB = b.company?.name || '';
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'name') {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
      }
      return 0;
    });
  }, [proofLeads, statusFilter, memberFilter, channelFilter, searchTerm, sortBy, usersMap]);

  // Dedicated Approval / Rejection Toggle Handler
  const handleToggleStatus = async (lead: HRContact, targetStatus: 'approved' | 'rejected') => {
    const adminName = currentUser?.name || 'Admin Leadership';
    setIsProcessingAction(lead.id);

    const updates: Partial<HRContact> = {
      name: lead.name,
      company_id: lead.company_id,
      proof_verified_status: targetStatus,
      proof_verified_by: adminName,
      proof_verified_at: new Date().toISOString(),
      proof_admin_notes: targetStatus === 'approved'
        ? 'Approved via Proof Review toggle'
        : (lead.proof_admin_notes || 'Rejected via Proof Review toggle'),
      ...(targetStatus === 'rejected'
        ? { response_status: 'no_response_yet' as LeadResponseStatus, responded_at: null as any }
        : {}),
    };

    // Store immediately into persistent proof registry so it stays as it is permanently
    proofStore.saveDecision(lead.id, targetStatus, {
      by: adminName,
      at: updates.proof_verified_at,
      notes: updates.proof_admin_notes,
      channel: lead.proof_channel as any,
      screenshotUrl: lead.proof_screenshot_url,
      response_status: updates.response_status || lead.response_status,
      responded_at: updates.responded_at || lead.responded_at,
    });

    try {
      await api.updateContact(lead.id, updates);

      // Local state update
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, ...updates } : l)));

      // Sync fallback store
      try {
        const contacts = clientFallbackStore.getContacts();
        const idx = contacts.findIndex((c) => c.id === lead.id);
        if (idx >= 0) {
          contacts[idx] = { ...contacts[idx], ...updates };
          clientFallbackStore.saveContacts(contacts);
        }
      } catch (_) {}

      // Notify employee Proof of Response view immediately via broadcast events
      window.dispatchEvent(new CustomEvent('proof_verification_updated', { detail: { leadId: lead.id, status: targetStatus } }));
      window.dispatchEvent(new CustomEvent('worksheet_proof_updated', { detail: { leadId: lead.id, status: targetStatus } }));

      showToast(
        targetStatus === 'approved'
          ? `Status updated: Approved lead for ${lead.company?.name || lead.name}!`
          : `Status updated: Rejected proof for ${lead.company?.name || lead.name}. Response reset.`,
        targetStatus === 'approved' ? 'success' : 'error'
      );
    } catch (err: any) {
      console.error('Failed to toggle proof status', err);
      // Optimistic fallback
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, ...updates } : l)));
      window.dispatchEvent(new CustomEvent('proof_verification_updated', { detail: { leadId: lead.id, status: targetStatus } }));
      window.dispatchEvent(new CustomEvent('worksheet_proof_updated', { detail: { leadId: lead.id, status: targetStatus } }));
      showToast(`Status toggled to ${targetStatus} (synced locally)`, 'success');
    } finally {
      setIsProcessingAction(null);
    }
  };

  // Quick 1-Click Approve Handler
  const handleQuickApprove = async (lead: HRContact) => {
    return handleToggleStatus(lead, 'approved');
  };

  // Quick Reject Handler
  const handleConfirmQuickReject = async () => {
    if (!quickRejectLead) return;
    const adminName = currentUser?.name || 'Admin Leadership';
    const lead = quickRejectLead;
    setIsProcessingAction(lead.id);

    const combinedNotes = quickRejectNotes.trim()
      ? `${quickRejectReason} — ${quickRejectNotes.trim()}`
      : quickRejectReason;

    const updates: Partial<HRContact> = {
      name: lead.name,
      company_id: lead.company_id,
      proof_verified_status: 'rejected',
      proof_verified_by: adminName,
      proof_verified_at: new Date().toISOString(),
      proof_admin_notes: combinedNotes,
      response_status: 'no_response_yet' as LeadResponseStatus,
      responded_at: null as any,
    };

    proofStore.saveDecision(lead.id, 'rejected', {
      by: adminName,
      at: updates.proof_verified_at,
      notes: combinedNotes,
      channel: lead.proof_channel as any,
      screenshotUrl: lead.proof_screenshot_url,
      response_status: 'no_response_yet',
    });

    try {
      await api.updateContact(lead.id, updates);

      // Local state update
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, ...updates } : l)));

      // Sync fallback store
      try {
        const contacts = clientFallbackStore.getContacts();
        const idx = contacts.findIndex((c) => c.id === lead.id);
        if (idx >= 0) {
          contacts[idx] = { ...contacts[idx], ...updates };
          clientFallbackStore.saveContacts(contacts);
        }
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('proof_verification_updated', { detail: { leadId: lead.id, status: 'rejected' } }));
      window.dispatchEvent(new CustomEvent('worksheet_proof_updated', { detail: { leadId: lead.id, status: 'rejected' } }));

      showToast(`Rejected proof for ${lead.company?.name || lead.name}. Response reset to "No response yet".`, 'error');
      setQuickRejectLead(null);
      setQuickRejectNotes('');
    } catch (err: any) {
      console.error('Failed to reject proof', err);
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, ...updates } : l)));
      showToast('Rejected proof (synced locally)', 'info');
      setQuickRejectLead(null);
    } finally {
      setIsProcessingAction(null);
    }
  };

  // Bulk Approve All Pending
  const handleBulkApprovePending = async () => {
    const pendingList = proofLeads.filter((l) => (l.proof_verified_status || 'pending') === 'pending');
    if (pendingList.length === 0) return;

    if (!window.confirm(`Are you sure you want to approve all ${pendingList.length} pending outreach proofs?`)) {
      return;
    }

    setIsProcessingAction('bulk_approve');
    const adminName = currentUser?.name || 'Admin Leadership';

    let successCount = 0;
    for (const lead of pendingList) {
      const updates: Partial<HRContact> = {
        name: lead.name,
        company_id: lead.company_id,
        proof_verified_status: 'approved',
        proof_verified_by: adminName,
        proof_verified_at: new Date().toISOString(),
        proof_admin_notes: 'Batch approved via Admin Proof Review Hub',
      };

      proofStore.saveDecision(lead.id, 'approved', {
        by: adminName,
        at: updates.proof_verified_at,
        notes: updates.proof_admin_notes,
        channel: lead.proof_channel as any,
        screenshotUrl: lead.proof_screenshot_url,
        response_status: lead.response_status,
        responded_at: lead.responded_at,
      });

      try {
        await api.updateContact(lead.id, updates);
        successCount++;
      } catch (_) {}
    }

    // Refresh data
    await fetchData();
    window.dispatchEvent(new CustomEvent('proof_verification_updated', { detail: { status: 'approved' } }));
    window.dispatchEvent(new CustomEvent('worksheet_proof_updated', { detail: { status: 'approved' } }));
    setIsProcessingAction(null);
    showToast(`Successfully verified & approved ${successCount} outreach proofs!`, 'success');
  };

  // Modal decision handler (from detailed ProofReviewModal)
  const handleModalDecision = async (decision: 'verified' | 'rejected', notes?: string) => {
    if (!reviewModalLead) return;
    const targetStatus = decision === 'verified' ? 'approved' : 'rejected';
    const adminName = currentUser?.name || 'Admin Leadership';

    const updates: Partial<HRContact> = {
      name: reviewModalLead.name,
      company_id: reviewModalLead.company_id,
      proof_verified_status: targetStatus,
      proof_verified_by: adminName,
      proof_verified_at: new Date().toISOString(),
      proof_admin_notes: notes,
      ...(targetStatus === 'rejected' ? { response_status: 'no_response_yet' as LeadResponseStatus, responded_at: null as any } : {}),
    };

    proofStore.saveDecision(reviewModalLead.id, targetStatus, {
      by: adminName,
      at: updates.proof_verified_at,
      notes,
      channel: reviewModalLead.proof_channel as any,
      screenshotUrl: reviewModalLead.proof_screenshot_url,
      response_status: updates.response_status || reviewModalLead.response_status,
      responded_at: updates.responded_at || reviewModalLead.responded_at,
    });

    try {
      await api.updateContact(reviewModalLead.id, updates);
      setLeads((prev) => prev.map((l) => (l.id === reviewModalLead.id ? { ...l, ...updates } : l)));
      window.dispatchEvent(new CustomEvent('proof_verification_updated', { detail: { leadId: reviewModalLead.id, status: targetStatus } }));
      window.dispatchEvent(new CustomEvent('worksheet_proof_updated', { detail: { leadId: reviewModalLead.id, status: targetStatus } }));

      if (targetStatus === 'approved') {
        showToast(`Proof approved for ${reviewModalLead.company?.name || reviewModalLead.name}! Marked as Approved Lead.`, 'success');
      } else {
        showToast(`Proof rejected for ${reviewModalLead.company?.name || reviewModalLead.name}. Response reset.`, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update review status', 'error');
    }
  };

  const getChannelBadge = (channel?: string) => {
    switch (channel) {
      case 'called':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Phone className="h-3 w-3" /> Phone Call
          </span>
        );
      case 'messaged':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <MessageSquare className="h-3 w-3" /> WhatsApp / Msg
          </span>
        );
      case 'mailed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Mail className="h-3 w-3" /> Email
          </span>
        );
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Approved Lead
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-950">
            <XCircle className="h-3.5 w-3.5 text-rose-400" /> Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-950 animate-pulse">
            <Clock className="h-3.5 w-3.5 text-amber-400" /> Pending
          </span>
        );
    }
  };

  // Interactive Approval / Rejection Toggle
  const renderStatusToggle = (lead: HRContact, compact = false) => {
    const rawStatus = lead.proof_verified_status || 'pending';
    const isApproved = rawStatus === 'approved' || rawStatus === 'verified';
    const isRejected = rawStatus === 'rejected';
    const isPending = !isApproved && !isRejected;
    const isProcessing = isProcessingAction === lead.id;

    return (
      <div className={`inline-flex items-center rounded-xl bg-slate-950/95 border border-slate-700/80 shadow-inner ${compact ? 'p-0.5 gap-0.5' : 'p-1 gap-1'}`}>
        {/* Approve Toggle Option */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={(e) => {
            e.stopPropagation();
            if (!isApproved) handleToggleStatus(lead, 'approved');
          }}
          className={`flex items-center gap-1 rounded-lg font-bold transition-all cursor-pointer ${
            compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
          } ${
            isApproved
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950 font-black ring-1 ring-emerald-400'
              : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/50'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isApproved ? 'Currently Approved Lead' : 'Click to approve this proof screenshot'}
        >
          <Check className={`stroke-[3] ${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} ${isApproved ? 'text-white' : 'text-slate-500'}`} />
          <span>Approved</span>
        </button>

        {/* Pending Badge Indicator */}
        {isPending && (
          <span className={`font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/20 rounded border border-amber-500/30 animate-pulse ${
            compact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[9px]'
          }`}>
            Pending
          </span>
        )}

        {/* Reject Toggle Option */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={(e) => {
            e.stopPropagation();
            if (!isRejected) handleToggleStatus(lead, 'rejected');
          }}
          className={`flex items-center gap-1 rounded-lg font-bold transition-all cursor-pointer ${
            compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
          } ${
            isRejected
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950 font-black ring-1 ring-rose-400'
              : 'text-slate-400 hover:text-rose-300 hover:bg-rose-950/50'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isRejected ? 'Currently Rejected' : 'Click to reject this proof screenshot'}
        >
          <X className={`stroke-[3] ${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} ${isRejected ? 'text-white' : 'text-slate-500'}`} />
          <span>Rejected</span>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-100 border-emerald-500/50'
              : toastMsg.type === 'error'
              ? 'bg-rose-950/95 text-rose-100 border-rose-500/50'
              : 'bg-amber-950/95 text-amber-100 border-amber-500/50'
          }`}
        >
          {toastMsg.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          {toastMsg.type === 'error' && <XCircle className="h-4 w-4 text-rose-400" />}
          {toastMsg.type === 'info' && <AlertTriangle className="h-4 w-4 text-amber-400" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0e1524] via-[#141d31] to-[#0a0f1b] p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-gray-950 shadow-lg shadow-amber-500/20 shrink-0">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-white tracking-tight">Proof Review & Verification Hub</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Admin Audit
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Review and verify outreach proof screenshots uploaded by employees. Approving marks the lead verified and unlocks it for CRM directory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-50"
            title="Refresh submissions"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {stats.pending > 0 && (
            <button
              type="button"
              onClick={handleBulkApprovePending}
              disabled={isProcessingAction !== null}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Approve All {stats.pending} Pending</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Pending Review Card */}
        <div
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/50'
              : 'bg-[#0e1524] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Pending Approval
            </span>
            {stats.pending > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-gray-950 animate-pulse">
                Action Required
              </span>
            )}
          </div>
          <div className="text-3xl font-black text-amber-300 mt-2">{stats.pending}</div>
          <p className="text-[11px] text-slate-400 mt-1">Uploaded proofs awaiting leadership approval</p>
        </div>

        {/* Verified Card */}
        <div
          onClick={() => setStatusFilter('verified')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'verified'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/50'
              : 'bg-[#0e1524] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Approved Leads
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-300 mt-2">{stats.verified}</div>
          <p className="text-[11px] text-slate-400 mt-1">Confirmed authentic & unlocked as Approved Leads</p>
        </div>

        {/* Rejected Card */}
        <div
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'rejected'
              ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/50'
              : 'bg-[#0e1524] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5" /> Rejected Proofs
            </span>
          </div>
          <div className="text-3xl font-black text-rose-300 mt-2">{stats.rejected}</div>
          <p className="text-[11px] text-slate-400 mt-1">Reset to &ldquo;No response yet&rdquo; for CRA</p>
        </div>

        {/* Total Submissions Card */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-sky-950/40 border-sky-500 shadow-lg shadow-sky-950/50'
              : 'bg-[#0e1524] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" /> Total Submissions
            </span>
          </div>
          <div className="text-3xl font-black text-sky-300 mt-2">{stats.total}</div>
          <p className="text-[11px] text-slate-400 mt-1">Lifetime outreach proofs uploaded</p>
        </div>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="bg-[#0e1524] p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#0a0f1b] p-1 rounded-xl border border-slate-800 shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-gray-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Pending Review</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                statusFilter === 'pending' ? 'bg-gray-950 text-amber-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {stats.pending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#141d31] text-white font-black border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>All Proofs</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                {stats.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('verified')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'verified'
                  ? 'bg-emerald-600 text-white font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Approved ({stats.verified})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'bg-rose-600 text-white font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Rejected ({stats.rejected})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company, candidate, employee, phone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[#0a0f1b] border border-slate-800 focus:border-amber-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Team Member Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <User className="h-3.5 w-3.5 text-slate-500" />
              <span>Employee:</span>
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="bg-[#0a0f1b] border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Team Members</option>
                {users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Channel Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <span>Channel:</span>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="bg-[#0a0f1b] border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Channels</option>
                <option value="called">Phone Call</option>
                <option value="messaged">WhatsApp / Message</option>
                <option value="mailed">Email</option>
              </select>
            </div>

            {/* Sort by */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#0a0f1b] border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500"
              >
                <option value="newest">Newest Upload</option>
                <option value="oldest">Oldest Upload</option>
                <option value="company">Company Name</option>
                <option value="name">Candidate Name</option>
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#0a0f1b] p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-amber-500 text-gray-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-gray-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-[#0e1524] rounded-3xl border border-slate-800">
          <RotateCw className="h-8 w-8 text-amber-500 animate-spin" />
          <p className="text-sm font-bold text-slate-300">Loading outreach proof submissions...</p>
        </div>
      ) : filteredProofs.length === 0 ? (
        <div className="py-20 text-center bg-[#0e1524] rounded-3xl border border-slate-800 p-8">
          <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-400 mb-4">
            <ShieldCheck className="h-8 w-8 text-amber-400" />
          </div>
          <h3 className="text-base font-bold text-white">No proof submissions found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            {statusFilter === 'pending'
              ? 'Great work! All employee outreach proofs have been reviewed and approved.'
              : 'No outreach proofs match the selected filters.'}
          </p>
          {(statusFilter !== 'all' || memberFilter !== 'all' || channelFilter !== 'all' || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setMemberFilter('all');
                setChannelFilter('all');
                setSearchTerm('');
              }}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-slate-700 transition"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProofs.map((lead) => {
            const uploader = resolveUploaderName(lead);
            const status = lead.proof_verified_status || 'pending';
            const isPending = status === 'pending';
            const isProcessing = isProcessingAction === lead.id;

            return (
              <div
                key={lead.id}
                className={`bg-[#0e1524] rounded-3xl border flex flex-col overflow-hidden transition-all duration-200 shadow-xl ${
                  isPending
                    ? 'border-amber-500/50 hover:border-amber-400 shadow-amber-950/30 ring-1 ring-amber-500/20'
                    : status === 'verified'
                    ? 'border-emerald-700/40 hover:border-emerald-600 shadow-emerald-950/20'
                    : 'border-rose-700/40 hover:border-rose-600 shadow-rose-950/20'
                }`}
              >
                {/* Card Top Banner */}
                <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-gray-950 font-black text-xs flex items-center justify-center shrink-0">
                      {uploader.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <span>{uploader}</span>
                        <span className="text-[10px] font-normal text-slate-400">(Employee)</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {lead.proof_screenshot_uploaded_at
                          ? formatIndianDateTime(lead.proof_screenshot_uploaded_at)
                          : 'Uploaded recently'}
                      </div>
                    </div>
                  </div>

                  {getStatusBadge(status)}
                </div>

                {/* Proof Screenshot Preview */}
                <div className="relative group bg-gray-950 border-b border-slate-800/80 overflow-hidden h-48 flex items-center justify-center cursor-pointer">
                  {lead.proof_screenshot_url ? (
                    <>
                      <img
                        src={lead.proof_screenshot_url}
                        alt="Proof screenshot"
                        onClick={() => setLightboxUrl(lead.proof_screenshot_url!)}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      <div
                        onClick={() => setLightboxUrl(lead.proof_screenshot_url!)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs backdrop-blur-[2px]"
                      >
                        <ZoomIn className="h-4 w-4 text-amber-400" />
                        <span>Click to view full screenshot</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <span>No screenshot image provided</span>
                    </div>
                  )}

                  {/* Channel Tag Overlay */}
                  <div className="absolute top-2.5 left-2.5">
                    {getChannelBadge(lead.proof_channel)}
                  </div>
                </div>

                {/* Lead Details Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    {/* Company & Contact */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <Building2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{lead.company?.name || 'Company Name'}</span>
                      </div>
                      <h4 className="text-sm font-black text-white mt-0.5 truncate">{lead.name}</h4>
                      <p className="text-xs text-slate-400 truncate">{lead.role_title || lead.title || 'HR Talent Lead'}</p>
                    </div>

                    {/* Claimed Response & Note */}
                    <div className="p-2.5 rounded-xl bg-[#0a0f1b] border border-slate-800/80 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-semibold text-slate-300">Claimed Response:</span>
                        <span className="font-bold text-emerald-400">
                          {responseShortLabel(lead.response_status)}
                        </span>
                      </div>
                      {lead.response_note ? (
                        <p className="text-[11px] text-slate-300 italic line-clamp-2">
                          &ldquo;{lead.response_note}&rdquo;
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">No response note attached.</p>
                      )}
                    </div>

                    {/* Audit Information if already reviewed */}
                    {status !== 'pending' && (
                      <div className={`p-2.5 rounded-xl border text-[11px] ${
                        status === 'verified'
                          ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                          : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                      }`}>
                        <div className="font-bold flex items-center justify-between">
                          <span>{status === 'verified' ? '✓ Verified by:' : '✕ Rejected by:'} {lead.proof_verified_by || 'Admin'}</span>
                          {lead.proof_verified_at && (
                            <span className="text-[10px] opacity-75">{formatIndianDateTime(lead.proof_verified_at)}</span>
                          )}
                        </div>
                        {lead.proof_admin_notes && (
                          <p className="mt-1 text-[11px] opacity-90 italic">
                            Note: {lead.proof_admin_notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: Instant Approval/Rejection Toggle + Audit Modal */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    {renderStatusToggle(lead, false)}

                    <button
                      type="button"
                      onClick={() => setReviewModalLead(lead)}
                      className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer flex items-center gap-1.5 shrink-0"
                      title="Open full 4-point review modal"
                    >
                      <Eye className="h-3.5 w-3.5 text-amber-400" />
                      <span>Audit</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-[#0e1524] rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0a0f1b] text-slate-400 uppercase tracking-wider text-[10px] font-black">
                  <th className="py-3 px-4">Proof Screenshot</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Company & Candidate</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Claimed Outcome</th>
                  <th className="py-3 px-4">Uploaded At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProofs.map((lead) => {
                  const uploader = resolveUploaderName(lead);
                  const status = lead.proof_verified_status || 'pending';
                  const isPending = status === 'pending';

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-800/30 transition ${
                        isPending ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Thumbnail */}
                      <td className="py-3 px-4">
                        {lead.proof_screenshot_url ? (
                          <div
                            onClick={() => setLightboxUrl(lead.proof_screenshot_url!)}
                            className="w-12 h-12 rounded-xl bg-gray-950 border border-amber-500/40 overflow-hidden cursor-pointer hover:scale-105 transition shadow-sm relative group shrink-0"
                          >
                            <img
                              src={lead.proof_screenshot_url}
                              alt="Proof"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <ZoomIn className="h-4 w-4 text-amber-300" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">No image</span>
                        )}
                      </td>

                      {/* Employee */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center">
                            {uploader.charAt(0).toUpperCase()}
                          </span>
                          <span>{uploader}</span>
                        </div>
                      </td>

                      {/* Company & Candidate */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-amber-300">{lead.company?.name || 'Company'}</div>
                        <div className="font-semibold text-white">{lead.name}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {lead.role_title || lead.title || 'HR Contact'}
                        </div>
                      </td>

                      {/* Channel */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getChannelBadge(lead.proof_channel)}
                      </td>

                      {/* Outcome */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <span className="font-bold text-emerald-400 block truncate">
                          {responseShortLabel(lead.response_status)}
                        </span>
                        {lead.response_note && (
                          <span className="text-[11px] text-slate-400 italic block truncate">
                            &ldquo;{lead.response_note}&rdquo;
                          </span>
                        )}
                      </td>

                      {/* Uploaded At */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                        {lead.proof_screenshot_uploaded_at
                          ? formatIndianDateTime(lead.proof_screenshot_uploaded_at)
                          : '—'}
                      </td>

                      {/* Status Toggle Column */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderStatusToggle(lead, true)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setReviewModalLead(lead)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1 border border-slate-700 shadow-sm"
                            title="Audit detailed 4-point verification checklist"
                          >
                            <Eye className="h-3.5 w-3.5 text-amber-400" />
                            <span>Audit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4-Point Audit & Review Modal */}
      {reviewModalLead && (
        <ProofReviewModal
          lead={reviewModalLead}
          reviewerName={currentUser?.name || 'Admin'}
          onClose={() => setReviewModalLead(null)}
          onDecision={handleModalDecision}
          onOpenFull={(url) => setLightboxUrl(url)}
        />
      )}

      {/* Quick Reject Prompt Modal */}
      {quickRejectLead && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-rose-700/60 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-900/40">
              <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
                <XCircle className="h-5 w-5" />
                <span>Reject Outreach Proof</span>
              </div>
              <button
                type="button"
                onClick={() => setQuickRejectLead(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Rejecting this proof for <span className="font-bold text-white">{quickRejectLead.name}</span> ({quickRejectLead.company?.name}) will reset their response to <span className="font-bold text-amber-300">&ldquo;No response yet&rdquo;</span>. The employee will be asked to re-upload authentic evidence.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Rejection Reason:
              </label>
              {[
                'Screenshot looks edited / photoshopped',
                'Details do not match the lead',
                'Timestamp does not add up',
                'Response looks staged',
                'Outreach evidence is illegible / blurry',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setQuickRejectReason(reason)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    quickRejectReason === reason
                      ? 'bg-rose-900/50 border-rose-500 text-white font-bold'
                      : 'bg-gray-900 border-gray-800 text-slate-400 hover:bg-gray-800'
                  }`}
                >
                  {quickRejectReason === reason ? '● ' : '○ '} {reason}
                </button>
              ))}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Additional Note for Employee (Optional):
              </label>
              <textarea
                value={quickRejectNotes}
                onChange={(e) => setQuickRejectNotes(e.target.value)}
                placeholder="Explain what was wrong so the employee can fix it..."
                rows={2}
                className="w-full px-3 py-2 bg-gray-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setQuickRejectLead(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmQuickReject}
                disabled={isProcessingAction !== null}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl transition shadow-lg shadow-rose-950 flex items-center gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screenshot Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          {/* Top Bar Controls */}
          <div
            className="w-full max-w-5xl flex items-center justify-between pb-3 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
              <span className="font-bold text-sm">Full Outreach Screenshot Evidence</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={lightboxUrl}
                download="proof-screenshot.png"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Open / Download</span>
              </a>
              <button
                type="button"
                onClick={() => setLightboxUrl(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Screenshot container */}
          <div
            className="max-w-5xl max-h-[85vh] overflow-auto rounded-2xl border border-slate-700 shadow-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxUrl}
              alt="Outreach Proof Full Evidence"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
