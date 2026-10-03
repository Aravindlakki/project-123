import React, { useEffect, useState } from 'react';
import { CRA, JD, Company } from '../types';
import { api } from '../services/api';
import { clientFallbackStore } from '../services/clientFallbackStore';
import { formatIndianDate } from '../utils/formatters';
import {
  ShieldCheck,
  Users,
  Building2,
  Settings,
  Plus,
  Edit2,
  Check,
  X,
  RefreshCw,
  Search,
  ArrowRight,
  Sparkles,
  FileCheck,
  AlertTriangle,
  Key,
  Database,
  Sliders,
  Trash2,
  Power,
  UserCheck,
  UserX,
  Clock,
  FileText,
  Calendar,
  Mail,
  Phone,
  User,
  Copy,
  CheckCircle2,
  XCircle,
  MessageSquare,
  HelpCircle,
  Filter,
  Tag,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminCard,
  AdminButton,
  AdminIconButton,
  AdminLabel,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  AdminModal,
  AdminBadge,
  AdminStatCard,
  AdminTable,
  AdminEmptyState,
} from '../components/admin';

interface AdminPortalPageProps {
  initialTab?: 'users' | 'companies' | 'settings';
}

export const AdminPortalPage: React.FC<AdminPortalPageProps> = ({
  initialTab = 'users',
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'companies' | 'settings'>(initialTab);
  const [users, setUsers] = useState<CRA[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [unverifiedJDs, setUnverifiedJDs] = useState<JD[]>([]);
  const [settingsData, setSettingsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // User creation modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'cra'>('cra');
  const [newUserEmpId, setNewUserEmpId] = useState('');
  const [newUserDomain, setNewUserDomain] = useState('Cyber Security & IT Services');
  const [newUserDesignation, setNewUserDesignation] = useState('CRA Specialist');
  const [newUserTarget, setNewUserTarget] = useState<number>(20);
  const [newUserStatus, setNewUserStatus] = useState<'active' | 'inactive'>('active');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Edit user inline
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editEmpId, setEditEmpId] = useState<string>('');
  const [editDomain, setEditDomain] = useState<string>('');
  const [editDesignation, setEditDesignation] = useState<string>('');
  const [editTarget, setEditTarget] = useState<number>(20);
  const [editRole, setEditRole] = useState<'admin' | 'cra'>('cra');
  const [editActive, setEditActive] = useState<boolean>(true);

  // Delete user (soft-delete)
  const [userToDelete, setUserToDelete] = useState<CRA | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Filter in users
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Company merge tool
  const [sourceCompanyId, setSourceCompanyId] = useState('');
  const [targetCompanyId, setTargetCompanyId] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  // JD Oversight state
  const [allJDs, setAllJDs] = useState<JD[]>([]);
  const [jdSearch, setJdSearch] = useState('');
  const [jdEligibilityFilter, setJdEligibilityFilter] = useState<'all' | 'pending' | 'eligible' | 'not_eligible'>('pending');
  const [selectedJdForReview, setSelectedJdForReview] = useState<JD | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewEligibilityStatus, setReviewEligibilityStatus] = useState<'eligible' | 'not_eligible' | 'pending_admin_review'>('pending_admin_review');
  const [reviewEligibilityNotes, setReviewEligibilityNotes] = useState('');
  const [reviewInterviewScheduled, setReviewInterviewScheduled] = useState<'yes' | 'no' | 'pending' | 'completed'>('pending');
  const [reviewInterviewDate, setReviewInterviewDate] = useState('');
  const [reviewInterviewRound, setReviewInterviewRound] = useState('Technical Round 1');
  const [reviewInterviewNotes, setReviewInterviewNotes] = useState('');
  const [reviewHRFeedbackStatus, setReviewHRFeedbackStatus] = useState<'awaiting' | 'received'>('awaiting');
  const [reviewHRFeedbackNotes, setReviewHRFeedbackNotes] = useState('');
  const [reviewHRFeedbackDate, setReviewHRFeedbackDate] = useState('');
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [copiedJdId, setCopiedJdId] = useState<string | null>(null);

  // Settings update
  const [defaultTarget, setDefaultTarget] = useState<number>(10);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [snoozeDuration, setSnoozeDuration] = useState<number>(() => {
    try {
      return api.getTaskSnoozeDuration() || 60;
    } catch {
      return 60;
    }
  });
  const [isSavingSnooze, setIsSavingSnooze] = useState(false);

  // Search in users
  const [userSearch, setUserSearch] = useState('');

  // Inline feedback state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showMergeConfirmModal, setShowMergeConfirmModal] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback((current) => (current?.text === text ? null : current));
    }, 4500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const userList = await api.getAdminUsers().catch(() => clientFallbackStore.getUsers(true));
        setUsers(userList || []);
      } else if (activeTab === 'companies') {
        const [allJdList, compList] = await Promise.all([
          api.getJDs().catch(() => clientFallbackStore.getJDs()),
          api.getCompanies().catch(() => clientFallbackStore.getCompanies()),
        ]);
        const list = allJdList || [];
        setAllJDs(list);
        setUnverifiedJDs(list.filter((j) => !j.is_verified || j.eligibility_status === 'pending_admin_review'));
        setCompanies(compList || []);
      } else if (activeTab === 'settings') {
        const settings = await api.getAdminSystemSettings().catch(() => clientFallbackStore.getSystemSettings());
        setSettingsData(settings);
        setDefaultTarget(settings?.default_monthly_jd_target || 10);
      }
    } catch (err: any) {
      console.warn('Admin data load notice, using cached store:', err?.message || err);
      // Ensure state is populated even in failure
      if (activeTab === 'users') {
        setUsers(clientFallbackStore.getUsers(true));
      } else if (activeTab === 'companies') {
        const list = clientFallbackStore.getJDs();
        setAllJDs(list);
        setUnverifiedJDs(list.filter((j) => !j.is_verified || j.eligibility_status === 'pending_admin_review'));
        setCompanies(clientFallbackStore.getCompanies());
      } else if (activeTab === 'settings') {
        const fallbackSettings = clientFallbackStore.getSystemSettings();
        setSettingsData(fallbackSettings);
        setDefaultTarget(fallbackSettings.default_monthly_jd_target || 10);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) return;

    setIsSubmittingUser(true);
    try {
      await api.createAdminUser({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        role: newUserRole,
        emp_id: newUserEmpId.trim() || undefined,
        domain: newUserDomain.trim() || undefined,
        designation: newUserDesignation.trim() || undefined,
        monthly_jd_target: newUserTarget,
        is_active: newUserStatus === 'active',
      });
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserEmpId('');
      setNewUserDomain('Cyber Security & IT Services');
      setNewUserDesignation('CRA Specialist');
      setNewUserStatus('active');
      showNotification('success', `User account created successfully for ${newUserName.trim()}`);
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create user');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleSaveUserEdit = async (userId: string) => {
    try {
      const updated = await api.updateAdminUser(userId, {
        name: editName.trim() || undefined,
        email: editEmail.trim() || undefined,
        emp_id: editEmpId.trim() || undefined,
        domain: editDomain.trim() || undefined,
        designation: editDesignation.trim() || undefined,
        monthly_jd_target: editTarget,
        role: editRole,
        is_active: editActive,
      });
      // Directly update local state so changes take effect immediately
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)));
      setEditingUserId(null);
      showNotification('success', 'User profile updated successfully.');
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update user');
    }
  };

  const handleToggleUserStatus = async (user: CRA) => {
    try {
      const nextStatus = user.is_active === false;
      const updated = await api.toggleUserStatus(user.id, nextStatus);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated, is_active: nextStatus } : u)));
      showNotification(
        'success',
        `User ${user.name} is now ${nextStatus ? 'Activated' : 'Deactivated'}. ${!nextStatus ? 'Excluded from new task assignments.' : ''}`
      );
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to toggle user status');
    }
  };

  const handleResetToCanonicalRoster = async () => {
    try {
      const canonical = clientFallbackStore.resetToCanonicalRoster();
      setUsers(canonical);
      showNotification(
        'success',
        'Team roster synchronized to canonical 8 members with complete Emp IDs, Domains, and zero duplicates.'
      );
      await loadData();
    } catch (err: any) {
      showNotification('error', 'Failed to synchronize roster.');
    }
  };

  const handleSoftDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      await api.deleteAdminUser(userToDelete.id, true);
      showNotification(
        'success',
        `Team member ID ${userToDelete.name} (${userToDelete.emp_id || 'ID'}) has been soft-deleted. Historical company & JD attribution is preserved.`
      );
      setUserToDelete(null);
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete user');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleSaveSnoozeDuration = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSnooze(true);
    try {
      api.setTaskSnoozeDuration(snoozeDuration);
      showNotification('success', `Task notification snooze duration updated to ${snoozeDuration} minutes.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update snooze duration');
    } finally {
      setIsSavingSnooze(false);
    }
  };

  const handleVerifyJD = async (jdId: string, isVerified: boolean) => {
    try {
      await api.verifyJD(jdId, isVerified);
      setUnverifiedJDs((prev) => prev.filter((j) => j.id !== jdId));
      showNotification('success', isVerified ? 'JD marked as verified.' : 'JD unverified.');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to verify JD');
    }
  };

  const handleOpenJdReview = (jd: JD) => {
    setSelectedJdForReview(jd);
    setReviewEligibilityStatus(jd.eligibility_status || (jd.is_verified ? 'eligible' : 'pending_admin_review'));
    setReviewEligibilityNotes(jd.admin_review_notes || '');
    setReviewInterviewScheduled(jd.interview_scheduled || 'pending');
    setReviewInterviewDate(jd.interview_date || '');
    setReviewInterviewRound(jd.interview_round || 'Technical Round 1');
    setReviewInterviewNotes(jd.interview_notes || '');
    setReviewHRFeedbackStatus(jd.hr_feedback_status || 'awaiting');
    setReviewHRFeedbackNotes(jd.hr_feedback || '');
    setReviewHRFeedbackDate(jd.hr_feedback_date || '');
    setIsReviewModalOpen(true);
  };

  const handleSaveJdReview = async () => {
    if (!selectedJdForReview) return;
    setIsSavingReview(true);
    try {
      const updated = await api.updateJD(selectedJdForReview.id, {
        eligibility_status: reviewEligibilityStatus,
        admin_review_notes: reviewEligibilityNotes,
        is_verified: reviewEligibilityStatus === 'eligible',
        reviewed_at: new Date().toISOString(),
        interview_scheduled: reviewInterviewScheduled,
        interview_date: reviewInterviewDate || undefined,
        interview_round: reviewInterviewRound || undefined,
        interview_notes: reviewInterviewNotes || undefined,
        hr_feedback_status: reviewHRFeedbackStatus,
        hr_feedback: reviewHRFeedbackNotes || undefined,
        hr_feedback_date: reviewHRFeedbackDate || undefined,
      });

      setAllJDs((prev) => prev.map((j) => (j.id === selectedJdForReview.id ? updated : j)));
      setUnverifiedJDs((prev) =>
        reviewEligibilityStatus === 'eligible'
          ? prev.filter((j) => j.id !== selectedJdForReview.id)
          : prev.map((j) => (j.id === selectedJdForReview.id ? updated : j))
      );

      setIsReviewModalOpen(false);
      showNotification(
        'success',
        `JD ${selectedJdForReview.jd_id || ''} saved: Marked as ${reviewEligibilityStatus.replace('_', ' ').toUpperCase()}, Interview: ${reviewInterviewScheduled.toUpperCase()}.`
      );
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update JD review');
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleQuickEligibility = async (jd: JD, status: 'eligible' | 'not_eligible') => {
    try {
      const updated = await api.reviewJDEligibility(jd.id, status);
      setAllJDs((prev) => prev.map((j) => (j.id === jd.id ? updated : j)));
      setUnverifiedJDs((prev) => prev.filter((j) => j.id !== jd.id));
      showNotification('success', `JD ${jd.jd_id || jd.title} marked as ${status.replace('_', ' ').toUpperCase()}.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update eligibility');
    }
  };

  const handleDeleteJD = async (jd: JD) => {
    if (!window.confirm(`Delete JD record "${jd.title}" (${jd.jd_id || 'ID'})? Only Administrator can delete records.`)) return;
    try {
      await api.deleteJD(jd.id);
      setAllJDs((prev) => prev.filter((j) => j.id !== jd.id));
      setUnverifiedJDs((prev) => prev.filter((j) => j.id !== jd.id));
      if (selectedJdForReview?.id === jd.id) {
        setIsReviewModalOpen(false);
      }
      showNotification('success', `JD ${jd.jd_id || jd.title} permanently deleted by Admin.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete JD');
    }
  };

  const handleCopyJdId = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedJdId(id);
    setTimeout(() => setCopiedJdId(null), 2000);
  };

  const handleMergeCompanies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceCompanyId || !targetCompanyId) {
      showNotification('error', 'Please select both source and target companies.');
      return;
    }
    if (sourceCompanyId === targetCompanyId) {
      showNotification('error', 'Source and target companies cannot be the same.');
      return;
    }

    setShowMergeConfirmModal(true);
  };

  const executeMerge = async () => {
    setShowMergeConfirmModal(false);
    setIsMerging(true);
    try {
      const res = await api.mergeCompanies(sourceCompanyId, targetCompanyId);
      showNotification('success', res.message || 'Companies merged successfully!');
      setSourceCompanyId('');
      setTargetCompanyId('');
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to merge companies');
    } finally {
      setIsMerging(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await api.updateAdminSystemSettings(defaultTarget);
      showNotification('success', 'System settings benchmark updated successfully!');
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (userStatusFilter === 'active' && (u.is_active === false || u.deleted_at)) return false;
    if (userStatusFilter === 'inactive' && u.is_active !== false && !u.deleted_at) return false;
    const q = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.emp_id && u.emp_id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      {/* Dynamic Feedback Notification Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200 shadow-lg'
              : 'bg-red-950/80 border-red-500/50 text-red-200 shadow-lg'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {feedback.type === 'success' ? (
              <Check className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <AdminPageHeader
        title="CRM System Administration"
        badge="Administrative Governance"
        badgeIcon={ShieldCheck}
        subtitle="Configure recruitment employee accounts, oversee verified job openings, merge duplicate company records, and manage target benchmarks."
        actions={
          <>
            {activeTab === 'users' && (
              <AdminButton
                variant="primary"
                size="md"
                icon={Plus}
                onClick={() => setShowAddUserModal(true)}
              >
                Add Team Member
              </AdminButton>
            )}
            <AdminIconButton
              icon={RefreshCw}
              tooltip="Refresh Data"
              onClick={loadData}
            />
          </>
        }
      />

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          onClick={() => setActiveTab('users')}
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
        >
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>User Management</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          className={`admin-tab ${activeTab === 'companies' ? 'active' : ''}`}
        >
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>Company & JD Oversight</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
        >
          <span className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>System Settings</span>
          </span>
        </button>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Canonical Roster Integrity Header Banner */}
          <AdminCard className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#e8b339]/15 text-[#e8b339] border border-[#e8b339]/30">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-black text-white tracking-tight">
                    Official Team Roster (8 Canonical Members)
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  3 Administrators (including Dual Access) • 5 CRA Specialists • 0 Duplicates • Complete Employee IDs & Specialization Domains
                </p>
              </div>

              <div className="flex items-center gap-2">
                <AdminButton
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  onClick={handleResetToCanonicalRoster}
                  title="Resets any corrupt cached local state back to the exact 8 canonical members"
                >
                  Sync / Reset 8 Roster
                </AdminButton>
              </div>
            </div>

            {/* Quick Metrics Badges using AdminStatCard */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <AdminStatCard label="Total Members" value={`${users.length} Unique`} />
              <AdminStatCard label="Dual Access" value="1" subtext="Aravind (Admin & Emp)" gold />
              <AdminStatCard label="Admins" value="2" subtext="Mansi, Vineela" />
              <AdminStatCard label="CRA Specialists" value="5" subtext="Employees" />
              <AdminStatCard label="Duplicates" value="0" subtext="Deduped" />
            </div>
          </AdminCard>

          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="h-4 w-4 text-amber-400 shrink-0" />
              <input
                type="text"
                placeholder="Search users by name, email, or employee ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-transparent border-none text-white placeholder-amber-200/40 focus:outline-none text-xs"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Filter active / inactive */}
              <div className="flex items-center gap-1.5 text-xs text-amber-200/80">
                <span className="hidden sm:inline">Status:</span>
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value as any)}
                  className="bg-amber-950/80 border border-amber-700/60 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="all">All Members ({users.length})</option>
                  <option value="active">Active Only ({users.filter(u => u.is_active !== false && !u.deleted_at).length})</option>
                  <option value="inactive">Inactive / Soft-Deleted ({users.filter(u => u.is_active === false || u.deleted_at).length})</option>
                </select>
              </div>

              {/* Add Team Member CTA */}
              <AdminButton
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setNewUserName('');
                  setNewUserEmail('');
                  setNewUserPassword('');
                  setNewUserEmpId('');
                  setNewUserRole('cra');
                  setNewUserTarget(10);
                  setNewUserStatus('active');
                  setShowAddUserModal(true);
                }}
              >
                Add Team Member
              </AdminButton>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-amber-300/60 flex flex-col items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-[#e8b339]" />
              <p className="text-slate-400 text-xs">Loading users...</p>
            </div>
          ) : (
            <AdminTable
              headers={[
                'Employee Name',
                'Emp ID',
                'Mail ID',
                'Specialization Domain',
                'Role',
                'Monthly Target',
                'Status & Access',
                'Created Date',
                'Actions',
              ]}
            >
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No team members match the search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isEditing = editingUserId === user.id;
                  const isDeleted = !!user.deleted_at;
                  const isActive = user.is_active !== false && !isDeleted;
                  const isDual = user.isDualRole || user.id === 'usr_admin_aravind';

                      return (
                        <tr key={user.id} className={`hover:bg-amber-900/20 transition ${!isActive ? 'opacity-70 bg-amber-950/10' : ''}`}>
                          {/* 1. Employee Name */}
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <div className="space-y-1 max-w-[170px]">
                                <label className="text-[10px] text-amber-300/70 block">Name</label>
                                <input
                                  type="text"
                                  placeholder="Full Name"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full bg-amber-950 border border-amber-600 rounded px-2 py-1 text-xs text-white"
                                />
                                <label className="text-[10px] text-amber-300/70 block mt-1">Designation</label>
                                <input
                                  type="text"
                                  placeholder="Designation"
                                  value={editDesignation}
                                  onChange={(e) => setEditDesignation(e.target.value)}
                                  className="w-full bg-amber-950 border border-amber-600 rounded px-2 py-1 text-xs text-white"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm ${
                                    isDual
                                      ? 'bg-amber-600 border border-amber-400'
                                      : user.role === 'admin'
                                      ? 'bg-purple-700 border border-purple-400'
                                      : 'bg-indigo-600 border border-indigo-400'
                                  }`}
                                >
                                  {user.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    <span>{user.name}</span>
                                    {isDeleted && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase">
                                        Soft-Deleted
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-amber-300/70 font-medium">
                                    {user.designation || (isDual ? 'CRA Specialist (Admin & Emp Access)' : user.role === 'admin' ? 'Administrator' : 'CRA Specialist')}
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* 2. Emp ID */}
                          <td className="py-3 px-3">
                            {isEditing ? (
                              <input
                                type="text"
                                placeholder="Emp ID"
                                value={editEmpId}
                                onChange={(e) => setEditEmpId(e.target.value)}
                                className="w-20 bg-amber-950 border border-amber-600 rounded px-2 py-1 text-xs text-white font-mono"
                              />
                            ) : (
                              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-amber-900/50 text-amber-300 border border-amber-700/60 font-bold whitespace-nowrap">
                                {user.emp_id || 'PM-100'}
                              </span>
                            )}
                          </td>

                          {/* 3. Mail ID */}
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="email"
                                placeholder="Email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="w-full min-w-[170px] bg-amber-950 border border-amber-600 rounded px-2 py-1 text-xs text-white"
                              />
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={`mailto:${user.email}`}
                                  className="font-mono text-xs text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1"
                                >
                                  <Mail className="h-3 w-3 text-sky-400/80 shrink-0" />
                                  <span>{user.email}</span>
                                </a>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(user.email);
                                    showNotification('success', `Copied ${user.email} to clipboard!`);
                                  }}
                                  className="p-1 hover:bg-amber-800/40 text-amber-300/60 hover:text-amber-200 rounded transition"
                                  title="Copy Email Address"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </td>

                          {/* 4. Specialization Domain */}
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="text"
                                placeholder="Specialization Domain"
                                value={editDomain}
                                onChange={(e) => setEditDomain(e.target.value)}
                                className="w-full min-w-[180px] bg-amber-950 border border-amber-600 rounded px-2 py-1 text-xs text-white"
                              />
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gray-900/80 text-amber-200/90 border border-amber-800/50 max-w-[220px] truncate"
                                title={user.domain || 'Recruitment Sourcing & IT Outreach'}
                              >
                                <Tag className="h-3 w-3 text-amber-400/80 shrink-0" />
                                <span className="truncate">{user.domain || 'Recruitment Sourcing & IT Outreach'}</span>
                              </span>
                            )}
                          </td>

                          {/* 5. Role */}
                          <td className="py-3 px-3">
                            {isEditing ? (
                              <select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value as any)}
                                className="admin-select admin-select-sm"
                              >
                                <option value="cra">CRA Employee</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <AdminBadge variant={isDual ? 'gold' : user.role === 'admin' ? 'info' : 'neutral'}>
                                {isDual ? 'Admin & Emp' : user.role === 'admin' ? 'Admin' : 'CRA Employee'}
                              </AdminBadge>
                            )}
                          </td>

                          {/* 6. Monthly Target */}
                          <td className="py-3 px-3">
                            {isEditing ? (
                              <input
                                type="number"
                                min="1"
                                value={editTarget}
                                onChange={(e) => setEditTarget(parseInt(e.target.value) || 1)}
                                className="admin-input admin-input-sm w-20"
                              />
                            ) : (
                              <span className="font-bold text-white whitespace-nowrap">
                                {user.monthly_jd_target || 20} JDs / mo
                              </span>
                            )}
                          </td>

                          {/* 7. Status & Access */}
                          <td className="py-3 px-3">
                            {isEditing ? (
                              <select
                                value={editActive ? 'active' : 'inactive'}
                                onChange={(e) => setEditActive(e.target.value === 'active')}
                                className="admin-select admin-select-sm"
                              >
                                <option value="active">Active (Assignable)</option>
                                <option value="inactive">Inactive (Excluded)</option>
                              </select>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(user)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition flex items-center gap-1 ${
                                    isActive
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                                  }`}
                                  title="Click to toggle active status (inactive members are excluded from task assignment)"
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                  <span>{isActive ? 'Active' : 'Inactive'}</span>
                                </button>
                              </div>
                            )}
                          </td>

                          {/* 8. Created Date */}
                          <td className="py-3 px-3 text-amber-300/70 whitespace-nowrap">
                            {formatIndianDate(user.created_at)}
                          </td>

                          {/* 9. Actions */}
                          <td className="py-3 px-3 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleSaveUserEdit(user.id)}
                                  className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white shadow-sm"
                                  title="Save user details"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingUserId(null)}
                                  className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-white"
                                  title="Cancel editing"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingUserId(user.id);
                                    setEditName(user.name);
                                    setEditEmail(user.email);
                                    setEditEmpId(user.emp_id || '');
                                    setEditDomain(user.domain || '');
                                    setEditDesignation(user.designation || '');
                                    setEditTarget(user.monthly_jd_target || 20);
                                    setEditRole(user.role);
                                    setEditActive(user.is_active !== false);
                                  }}
                                  className="p-1.5 hover:bg-amber-900/50 rounded-lg text-amber-300 hover:text-white transition"
                                  title="Edit full team member details"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  onClick={() => handleToggleUserStatus(user)}
                                  className={`p-1.5 rounded-lg transition ${
                                    isActive
                                      ? 'text-emerald-400 hover:bg-emerald-950/60'
                                      : 'text-amber-400 hover:bg-amber-950/60'
                                  }`}
                                  title={isActive ? 'Deactivate team member' : 'Activate team member'}
                                >
                                  <Power className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  onClick={() => setUserToDelete(user)}
                                  className="p-1.5 hover:bg-rose-950/60 rounded-lg text-rose-400 hover:text-rose-200 transition"
                                  title="Soft-delete team member (preserves historical attribution)"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
            </AdminTable>
          )}
        </div>
      )}

      {/* TAB 2: COMPANY & JD OVERSIGHT */}
      {activeTab === 'companies' && (
        <div className="space-y-8">
          {/* Section A: Job Descriptions & Admin Eligibility Oversight (JD-ID) */}
          <AdminCard className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2.5">
                  <FileText className="h-5 w-5 text-amber-400" />
                  <span>Job Descriptions & Eligibility Oversight (JD-ID)</span>
                </h3>
                <p className="text-xs text-amber-200/70 mt-1 max-w-2xl leading-relaxed">
                  Every uploaded opportunity is assigned a permanent <strong>JD-ID</strong>. As Administrator, review intake eligibility for placement drives, oversee interview scheduling, and record feedback from HR.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-mono font-bold">
                  {allJDs.length} Tracked JDs
                </span>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-amber-900/20 border border-amber-700/40 rounded-2xl flex flex-col">
                <span className="text-[11px] font-bold text-amber-300/80">Pending Review</span>
                <span className="text-2xl font-black text-amber-400 mt-1">
                  {allJDs.filter((j) => j.eligibility_status === 'pending_admin_review' || (!j.is_verified && j.eligibility_status !== 'not_eligible')).length}
                </span>
                <span className="text-[10px] text-amber-200/60 mt-0.5">Awaiting Admin decision</span>
              </div>

              <div className="p-3.5 bg-emerald-950/40 border border-emerald-700/40 rounded-2xl flex flex-col">
                <span className="text-[11px] font-bold text-emerald-300/80">Eligible for Drives</span>
                <span className="text-2xl font-black text-emerald-400 mt-1">
                  {allJDs.filter((j) => j.eligibility_status === 'eligible').length}
                </span>
                <span className="text-[10px] text-emerald-200/60 mt-0.5">Approved opportunities</span>
              </div>

              <div className="p-3.5 bg-indigo-950/40 border border-indigo-700/40 rounded-2xl flex flex-col">
                <span className="text-[11px] font-bold text-indigo-300/80">Interview Scheduled</span>
                <span className="text-2xl font-black text-indigo-400 mt-1">
                  {allJDs.filter((j) => j.interview_scheduled === 'yes').length}
                </span>
                <span className="text-[10px] text-indigo-200/60 mt-0.5">Active candidates in drive</span>
              </div>

              <div className="p-3.5 bg-rose-950/40 border border-rose-700/40 rounded-2xl flex flex-col">
                <span className="text-[11px] font-bold text-rose-300/80">Not Eligible</span>
                <span className="text-2xl font-black text-rose-400 mt-1">
                  {allJDs.filter((j) => j.eligibility_status === 'not_eligible').length}
                </span>
                <span className="text-[10px] text-rose-200/60 mt-0.5">Unqualified / Rejected</span>
              </div>
            </div>

            {/* Filter and Search Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-amber-400/60" />
                <input
                  type="text"
                  value={jdSearch}
                  onChange={(e) => setJdSearch(e.target.value)}
                  placeholder="Search by JD-ID, role, company, or HR name..."
                  className="w-full bg-amber-950/60 border border-amber-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-amber-300/40 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-amber-950/60 p-1 rounded-xl border border-amber-800/40 text-xs">
                <button
                  type="button"
                  onClick={() => setJdEligibilityFilter('pending')}
                  className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    jdEligibilityFilter === 'pending'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-amber-200/70 hover:text-white'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Pending ({allJDs.filter((j) => j.eligibility_status === 'pending_admin_review' || (!j.is_verified && j.eligibility_status !== 'not_eligible')).length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setJdEligibilityFilter('eligible')}
                  className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    jdEligibilityFilter === 'eligible'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-amber-200/70 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Eligible ({allJDs.filter((j) => j.eligibility_status === 'eligible').length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setJdEligibilityFilter('not_eligible')}
                  className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    jdEligibilityFilter === 'not_eligible'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-amber-200/70 hover:text-white'
                  }`}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Not Eligible ({allJDs.filter((j) => j.eligibility_status === 'not_eligible').length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setJdEligibilityFilter('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    jdEligibilityFilter === 'all'
                      ? 'bg-amber-700 text-white shadow'
                      : 'text-amber-200/70 hover:text-white'
                  }`}
                >
                  All ({allJDs.length})
                </button>
              </div>
            </div>

            {/* List of JDs */}
            {allJDs.length === 0 ? (
              <AdminEmptyState
                icon={FileCheck}
                title="No job descriptions found"
                description="JDs uploaded through the JD Intake page will be recorded here with official JD-IDs."
              />
            ) : (
              <div className="space-y-3.5">
                {allJDs
                  .filter((jd) => {
                    if (jdSearch.trim()) {
                      const q = jdSearch.toLowerCase();
                      const matchJdId = jd.jd_id?.toLowerCase().includes(q);
                      const matchTitle = jd.title?.toLowerCase().includes(q);
                      const matchComp = jd.company?.name?.toLowerCase().includes(q);
                      const matchHrName = jd.hr_name?.toLowerCase().includes(q);
                      const matchHrEmail = jd.hr_email?.toLowerCase().includes(q);
                      if (!matchJdId && !matchTitle && !matchComp && !matchHrName && !matchHrEmail) {
                        return false;
                      }
                    }
                    if (jdEligibilityFilter === 'pending') {
                      return jd.eligibility_status === 'pending_admin_review' || (!jd.is_verified && jd.eligibility_status !== 'not_eligible');
                    }
                    if (jdEligibilityFilter === 'eligible') {
                      return jd.eligibility_status === 'eligible';
                    }
                    if (jdEligibilityFilter === 'not_eligible') {
                      return jd.eligibility_status === 'not_eligible';
                    }
                    return true;
                  })
                  .map((jd) => {
                    const isEligible = jd.eligibility_status === 'eligible';
                    const isRejected = jd.eligibility_status === 'not_eligible';
                    const isPending = !isEligible && !isRejected;

                    return (
                      <div
                        key={jd.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isEligible
                            ? 'bg-emerald-950/20 border-emerald-700/40 hover:border-emerald-600/60'
                            : isRejected
                            ? 'bg-rose-950/20 border-rose-800/40 hover:border-rose-700/60'
                            : 'bg-amber-900/20 border-amber-700/40 hover:border-amber-600/60'
                        } flex flex-col lg:flex-row lg:items-center justify-between gap-4`}
                      >
                        {/* Left & Middle Info */}
                        <div className="space-y-2.5 min-w-0 flex-1">
                          {/* Top Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Permanent JD-ID */}
                            <button
                              type="button"
                              onClick={(e) => handleCopyJdId(jd.jd_id || jd.id, e)}
                              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg text-xs font-mono font-black flex items-center gap-1.5 transition"
                              title="Click to copy official JD-ID"
                            >
                              <Tag className="h-3 w-3 text-amber-400" />
                              <span>{jd.jd_id || 'JD-RECORD'}</span>
                              {copiedJdId === (jd.jd_id || jd.id) ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3 opacity-60" />
                              )}
                            </button>

                            {/* Role Title */}
                            <span className="font-extrabold text-white text-sm">{jd.title}</span>

                            {/* Company Name */}
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {jd.company?.name || 'Company Registered'}
                            </span>

                            {/* Eligibility Badge */}
                            {isEligible ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Eligible for Drives
                              </span>
                            ) : isRejected ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                                <XCircle className="h-3 w-3" />
                                Not Eligible
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Pending Admin Review
                              </span>
                            )}

                            {/* Interview Status Badge */}
                            {jd.interview_scheduled === 'yes' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Interview Scheduled {jd.interview_date ? `· ${jd.interview_date}` : ''}
                              </span>
                            ) : jd.interview_scheduled === 'completed' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Interview Completed
                              </span>
                            ) : isEligible ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300/80 border border-amber-500/20 flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-amber-400" />
                                Interview Pending
                              </span>
                            ) : null}
                          </div>

                          {/* Raw text preview */}
                          <p className="text-xs text-gray-300/80 line-clamp-1 max-w-3xl">
                            {jd.raw_text}
                          </p>

                          {/* Mandatory HR Contact Details Card */}
                          <div className="bg-black/40 border border-amber-800/40 rounded-xl p-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                            <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                              <UserCheck className="h-3.5 w-3.5 text-amber-400" />
                              Mandatory HR Contact:
                            </span>

                            <span className="font-bold text-white flex items-center gap-1">
                              {jd.hr_name || 'HR Representative'}
                              {jd.hr_designation && (
                                <span className="text-[11px] text-gray-400 font-normal">({jd.hr_designation})</span>
                              )}
                            </span>

                            {jd.hr_email && (
                              <a
                                href={`mailto:${jd.hr_email}`}
                                className="text-sky-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                              >
                                <Mail className="h-3 w-3 opacity-70" />
                                {jd.hr_email}
                              </a>
                            )}

                            {jd.hr_phone && (
                              <a
                                href={`tel:${jd.hr_phone}`}
                                className="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                              >
                                <Phone className="h-3 w-3 opacity-70" />
                                {jd.hr_phone}
                              </a>
                            )}

                            {/* HR Feedback status */}
                            <span className="ml-auto text-[10px] font-semibold text-gray-300 flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 text-amber-400" />
                              HR Feedback: <strong className={jd.hr_feedback_status === 'received' ? 'text-emerald-300' : 'text-amber-300'}>
                                {jd.hr_feedback_status === 'received' ? 'Received' : 'Awaiting HR Feedback'}
                              </strong>
                              {jd.hr_feedback && (
                                <span className="text-gray-400 italic max-w-xs truncate">
                                  — &ldquo;{jd.hr_feedback}&rdquo;
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex flex-wrap lg:flex-col items-center lg:items-end justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-amber-800/30">
                          <button
                            type="button"
                            onClick={() => handleOpenJdReview(jd)}
                            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-950/40"
                          >
                            <Sliders className="h-3.5 w-3.5" />
                            <span>Admin Review & Decision</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            {!isEligible && (
                              <button
                                type="button"
                                onClick={() => handleQuickEligibility(jd, 'eligible')}
                                className="px-2.5 py-1.5 bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-600/50 text-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                title="Mark as Eligible for placement drives"
                              >
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Eligible</span>
                              </button>
                            )}

                            {!isRejected && (
                              <button
                                type="button"
                                onClick={() => handleQuickEligibility(jd, 'not_eligible')}
                                className="px-2.5 py-1.5 bg-rose-900/40 hover:bg-rose-800/60 border border-rose-600/50 text-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                title="Mark as Not Eligible"
                              >
                                <X className="h-3.5 w-3.5 text-rose-400" />
                                <span>Reject</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteJD(jd)}
                              className="p-1.5 hover:bg-rose-950/60 text-rose-400 hover:text-rose-200 border border-transparent hover:border-rose-700/50 rounded-lg transition"
                              title="Delete JD (Administrator privilege only)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </AdminCard>

          {/* Section B: Company Merge Tool */}
          <AdminCard className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-[#e8b339]" />
                Company Duplicate Deduplication & Merge Tool
              </h3>
              <p className="text-xs text-slate-400">
                Consolidate duplicate records (e.g. &ldquo;TCS&rdquo; and &ldquo;Tata Consultancy Services&rdquo;). All contacts, outreaches, and JDs from the source company will be transferred to the target company.
              </p>
            </div>

            <form onSubmit={handleMergeCompanies} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs items-end">
              <div>
                <AdminLabel required>Source Company (Will be merged & removed)</AdminLabel>
                <AdminSelect
                  value={sourceCompanyId}
                  onChange={(e) => setSourceCompanyId(e.target.value)}
                >
                  <option value="">Select duplicate company...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.industry || 'Industry unspecified'})
                    </option>
                  ))}
                </AdminSelect>
              </div>

              <div>
                <AdminLabel required>Target Company (Primary record to keep)</AdminLabel>
                <AdminSelect
                  value={targetCompanyId}
                  onChange={(e) => setTargetCompanyId(e.target.value)}
                >
                  <option value="">Select primary company...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </AdminSelect>
              </div>

              <div>
                <AdminButton
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isMerging || !sourceCompanyId || !targetCompanyId}
                  loading={isMerging}
                  icon={ArrowRight}
                >
                  Merge Companies
                </AdminButton>
              </div>
            </form>
          </AdminCard>
        </div>
      )}

      {/* TAB 3: SYSTEM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <AdminCard className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-[#e8b339]" />
                Operational Quotas & Targets
              </h3>
              <p className="text-xs text-slate-400">
                Configure default performance parameters applied to newly registered CRAs.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-md text-xs">
              <div>
                <AdminLabel>Default Monthly Verified JD Target (per CRA)</AdminLabel>
                <AdminInput
                  type="number"
                  min="1"
                  max="200"
                  value={defaultTarget}
                  onChange={(e) => setDefaultTarget(parseInt(e.target.value) || 1)}
                />
              </div>

              <AdminButton
                type="submit"
                variant="primary"
                disabled={isSavingSettings}
                loading={isSavingSettings}
              >
                Update Benchmark
              </AdminButton>
            </form>
          </AdminCard>

          {/* TASK SNOOZE DURATION CONFIGURATION */}
          <AdminCard className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#e8b339]" />
                Task Notification Snooze Settings
              </h3>
              <p className="text-xs text-slate-400">
                Configure how long popup notifications are suppressed when an employee clicks "Remind Later" on their dashboard.
              </p>
            </div>

            <form onSubmit={handleSaveSnoozeDuration} className="space-y-4 max-w-md text-xs">
              <div>
                <AdminLabel>Default Snooze Interval (Minutes)</AdminLabel>
                <div className="flex items-center gap-2">
                  <AdminInput
                    type="number"
                    min="5"
                    max="1440"
                    value={snoozeDuration}
                    onChange={(e) => setSnoozeDuration(parseInt(e.target.value) || 60)}
                  />
                  <span className="text-slate-400 whitespace-nowrap font-medium text-xs">
                    ({Math.round(snoozeDuration / 60 * 10) / 10} hours)
                  </span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 text-[11px]">Presets:</span>
                {[15, 30, 60, 120, 240].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSnoozeDuration(mins)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                      snoozeDuration === mins
                        ? 'bg-[#e8b339] text-[#070c16] border-[#e8b339] shadow-sm font-black'
                        : 'bg-[#141d31] text-slate-300 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                  </button>
                ))}
              </div>

              <AdminButton
                type="submit"
                variant="primary"
                disabled={isSavingSnooze}
                loading={isSavingSnooze}
                icon={Clock}
              >
                Update Snooze Duration
              </AdminButton>
            </form>
          </AdminCard>

          <AdminCard className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#e8b339]" />
                AI & Intelligence Engine Status
              </h3>
              <p className="text-xs text-slate-400">
                Status of connected models and Google Search Grounding for HR discovery.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#141d31] border border-slate-700/40 space-y-1">
                <p className="text-[#e8b339] font-semibold">Tier & Licensing</p>
                <p className="text-white font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  100% Free & Open
                </p>
                <p className="text-[11px] text-slate-400">No paid API key or subscription needed</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#141d31] border border-slate-700/40 space-y-1">
                <p className="text-[#e8b339] font-semibold">Google Search Grounding</p>
                <p className="text-white font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active (Gemini 2.5 Flash)
                </p>
                <p className="text-[11px] text-slate-400">Real-time live recruiter discovery</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#141d31] border border-slate-700/40 space-y-1">
                <p className="text-[#e8b339] font-semibold">JD Extraction Engine</p>
                <p className="text-white font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Active (Gemini Multimodal)
                </p>
                <p className="text-[11px] text-slate-400">PDF / Docx / HTML parsing</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#141d31] border border-slate-700/40 space-y-1">
                <p className="text-[#e8b339] font-semibold">Phone Privacy Enforcer</p>
                <p className="text-white font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Enabled
                </p>
                <p className="text-[11px] text-slate-400">Phone strictly empty for manual verification</p>
              </div>
            </div>
          </AdminCard>
        </div>
      )}

      {/* MERGE CONFIRMATION MODAL */}
      {showMergeConfirmModal && (
        <AdminModal
          isOpen={showMergeConfirmModal}
          onClose={() => setShowMergeConfirmModal(false)}
          title="Confirm Company Merge"
          icon={AlertTriangle}
          footer={
            <>
              <AdminButton
                type="button"
                variant="ghost"
                onClick={() => setShowMergeConfirmModal(false)}
              >
                Cancel
              </AdminButton>
              <AdminButton
                type="button"
                variant="primary"
                onClick={executeMerge}
              >
                Confirm Merge
              </AdminButton>
            </>
          }
        >
          <p className="text-xs text-slate-300 leading-relaxed">
            Are you sure you want to merge these companies? All contacts, JDs, and outreach history from the duplicate company will be safely reassigned to the primary company.
          </p>
        </AdminModal>
      )}

      {/* CREATE USER MODAL */}
      {showAddUserModal && (
        <AdminModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          title="Add New CRM Team Member"
          icon={Users}
          footer={
            <>
              <AdminButton
                type="button"
                variant="ghost"
                onClick={() => setShowAddUserModal(false)}
              >
                Cancel
              </AdminButton>
              <AdminButton
                type="submit"
                form="create-user-form"
                variant="primary"
                disabled={isSubmittingUser}
                loading={isSubmittingUser}
              >
                Create Account
              </AdminButton>
            </>
          }
        >
          <form id="create-user-form" onSubmit={handleCreateUser} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <AdminLabel required>Full Name</AdminLabel>
                <AdminInput
                  type="text"
                  required
                  placeholder="e.g., Aravind Reddy"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>

              <div>
                <AdminLabel>Employee ID</AdminLabel>
                <AdminInput
                  type="text"
                  placeholder="e.g., PMI-004"
                  value={newUserEmpId}
                  onChange={(e) => setNewUserEmpId(e.target.value)}
                />
              </div>
            </div>

            <div>
              <AdminLabel required>Email Address</AdminLabel>
              <AdminInput
                type="email"
                required
                placeholder="name@placemein.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <AdminLabel required>Specialization Domain</AdminLabel>
                <AdminInput
                  type="text"
                  required
                  placeholder="e.g. Cyber Security & IT Services"
                  value={newUserDomain}
                  onChange={(e) => setNewUserDomain(e.target.value)}
                />
              </div>

              <div>
                <AdminLabel>Designation</AdminLabel>
                <AdminInput
                  type="text"
                  placeholder="e.g. CRA Specialist"
                  value={newUserDesignation}
                  onChange={(e) => setNewUserDesignation(e.target.value)}
                />
              </div>
            </div>

            <div>
              <AdminLabel required>Temporary Password</AdminLabel>
              <AdminInput
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <AdminLabel required>System Role</AdminLabel>
                <AdminSelect
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                >
                  <option value="cra">CRA (Recruitment Specialist)</option>
                  <option value="admin">System Administrator</option>
                </AdminSelect>
              </div>

              <div>
                <AdminLabel>Monthly JD Target</AdminLabel>
                <AdminInput
                  type="number"
                  min="1"
                  value={newUserTarget}
                  onChange={(e) => setNewUserTarget(parseInt(e.target.value) || 1)}
                />
              </div>

              <div>
                <AdminLabel required>Initial Status</AdminLabel>
                <AdminSelect
                  value={newUserStatus}
                  onChange={(e) => setNewUserStatus(e.target.value as any)}
                >
                  <option value="active">Active (Assignable)</option>
                  <option value="inactive">Inactive (Excluded)</option>
                </AdminSelect>
              </div>
            </div>
          </form>
        </AdminModal>
      )}

      {/* SOFT-DELETE USER CONFIRMATION MODAL */}
      {userToDelete && (
        <AdminModal
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          title="Soft-Delete Team Member"
          icon={AlertTriangle}
          footer={
            <>
              <AdminButton
                type="button"
                variant="ghost"
                onClick={() => setUserToDelete(null)}
              >
                Cancel
              </AdminButton>
              <AdminButton
                type="button"
                variant="danger"
                disabled={isDeletingUser}
                loading={isDeletingUser}
                icon={Trash2}
                onClick={handleSoftDeleteUser}
              >
                Confirm Soft-Delete
              </AdminButton>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/50 space-y-1 text-xs">
              <div className="font-bold text-white text-sm">{userToDelete.name}</div>
              <div className="text-rose-300/80">{userToDelete.email}</div>
              <div className="text-rose-300/60 font-mono">Employee ID: {userToDelete.emp_id || 'Not Assigned'}</div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Soft-deleting this team member deactivates their ID and excludes them from new task assignment dropdowns across the CRM. All historical contributions, created companies, verified JDs, and notes remain preserved for auditing.
            </p>
          </div>
        </AdminModal>
      )}

      {/* ADMIN JD REVIEW, ELIGIBILITY & INTERVIEW OVERSIGHT MODAL */}
      {isReviewModalOpen && selectedJdForReview && (
        <AdminModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title={
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#e8b339]/20 text-[#e8b339] border border-[#e8b339]/30">
                  {selectedJdForReview.jd_id || 'JD-RECORD'}
                </span>
                <span className="text-xs text-slate-400 font-semibold">Admin Eligibility Oversight</span>
              </div>
              <div className="text-base font-black text-white">{selectedJdForReview.title}</div>
            </div>
          }
          icon={FileText}
          maxWidth="lg"
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
              <AdminButton
                type="button"
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => handleDeleteJD(selectedJdForReview)}
                title="Permanently remove JD as Administrator"
              >
                Delete JD Record
              </AdminButton>

              <div className="flex items-center gap-2">
                <AdminButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReviewModalOpen(false)}
                >
                  Cancel
                </AdminButton>

                <AdminButton
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={isSavingReview}
                  loading={isSavingReview}
                  icon={Check}
                  onClick={handleSaveJdReview}
                >
                  Save Decision & Schedule
                </AdminButton>
              </div>
            </div>
          }
        >
          <div className="space-y-6">

            {/* Section 1: Mandatory HR Details (Required when JD is received) */}
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-700/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-amber-400" />
                  <span>Mandatory HR Contact Details</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Required on Receipt
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block text-[11px]">HR Representative Name:</span>
                  <strong className="text-white text-sm">
                    {selectedJdForReview.hr_name || 'Not Specified'}
                  </strong>
                  {selectedJdForReview.hr_designation && (
                    <span className="text-amber-300/80 block text-[11px]">
                      {selectedJdForReview.hr_designation}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">Contact Email & Phone:</span>
                  <div className="space-y-0.5">
                    {selectedJdForReview.hr_email ? (
                      <a
                        href={`mailto:${selectedJdForReview.hr_email}`}
                        className="text-sky-400 hover:underline flex items-center gap-1 font-mono text-xs"
                      >
                        <Mail className="h-3 w-3 text-sky-400" />
                        <span>{selectedJdForReview.hr_email}</span>
                      </a>
                    ) : (
                      <span className="text-gray-500 italic">No email provided</span>
                    )}

                    {selectedJdForReview.hr_phone ? (
                      <a
                        href={`tel:${selectedJdForReview.hr_phone}`}
                        className="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-xs"
                      >
                        <Phone className="h-3 w-3 text-emerald-400" />
                        <span>{selectedJdForReview.hr_phone}</span>
                      </a>
                    ) : (
                      <span className="text-gray-500 italic">No phone provided</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Raw JD Preview */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-300">
                Job Description Summary / Raw Text
              </label>
              <div className="p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-300 max-h-32 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed">
                {selectedJdForReview.raw_text || 'No description body logged.'}
              </div>
            </div>

            {/* Section 3: Admin Eligibility Decision */}
            <div className="p-4 rounded-2xl bg-gray-800/50 border border-gray-700/60 space-y-3">
              <label className="block text-xs font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Admin Eligibility Determination (Placement Drives)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setReviewEligibilityStatus('eligible')}
                  className={`p-3 rounded-xl border font-bold text-left transition flex items-center gap-2.5 ${
                    reviewEligibilityStatus === 'eligible'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                      : 'bg-gray-800/80 text-emerald-300 border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <div>
                    <div className="text-xs">Eligible</div>
                    <div className="text-[10px] opacity-80 font-normal">Ready for drives</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewEligibilityStatus('not_eligible')}
                  className={`p-3 rounded-xl border font-bold text-left transition flex items-center gap-2.5 ${
                    reviewEligibilityStatus === 'not_eligible'
                      ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                      : 'bg-gray-800/80 text-rose-300 border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  <XCircle className="h-4 w-4 shrink-0" />
                  <div>
                    <div className="text-xs">Not Eligible</div>
                    <div className="text-[10px] opacity-80 font-normal">Reject opportunity</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewEligibilityStatus('pending_admin_review')}
                  className={`p-3 rounded-xl border font-bold text-left transition flex items-center gap-2.5 ${
                    reviewEligibilityStatus === 'pending_admin_review'
                      ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                      : 'bg-gray-800/80 text-amber-300 border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  <Clock className="h-4 w-4 shrink-0" />
                  <div>
                    <div className="text-xs">Pending Review</div>
                    <div className="text-[10px] opacity-80 font-normal">Awaiting evaluation</div>
                  </div>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  Eligibility Notes / Decision Justification
                </label>
                <input
                  type="text"
                  value={reviewEligibilityNotes}
                  onChange={(e) => setReviewEligibilityNotes(e.target.value)}
                  placeholder="e.g. Approved: Matches 2026 Batch criteria, package meets benchmark..."
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Section 4: Interview Scheduling (Ensure if interview scheduled or not) */}
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-700/40 space-y-3">
              <label className="block text-xs font-bold text-indigo-200 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-400" />
                <span>Interview Scheduling Oversight</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-indigo-300/80 mb-1">
                    Interview Status *
                  </label>
                  <select
                    value={reviewInterviewScheduled}
                    onChange={(e: any) => setReviewInterviewScheduled(e.target.value)}
                    className="w-full bg-gray-950 border border-indigo-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                  >
                    <option value="pending">Pending HR Confirmation</option>
                    <option value="yes">Yes — Interview Scheduled</option>
                    <option value="no">No — Not Scheduled</option>
                    <option value="completed">Completed — Interview Finished</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-indigo-300/80 mb-1">
                    Scheduled Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={reviewInterviewDate}
                    onChange={(e) => setReviewInterviewDate(e.target.value)}
                    className="w-full bg-gray-950 border border-indigo-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-indigo-300/80 mb-1">
                    Interview Round / Panel
                  </label>
                  <input
                    type="text"
                    value={reviewInterviewRound}
                    onChange={(e) => setReviewInterviewRound(e.target.value)}
                    placeholder="e.g. Technical Round 1, Managerial Round, HR Round"
                    className="w-full bg-gray-950 border border-indigo-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-indigo-300/80 mb-1">
                    Interview Link / Mode / Location
                  </label>
                  <input
                    type="text"
                    value={reviewInterviewNotes}
                    onChange={(e) => setReviewInterviewNotes(e.target.value)}
                    placeholder="e.g. Google Meet link, Bangalore Office, Zoom"
                    className="w-full bg-gray-950 border border-indigo-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Feedback from HR */}
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 space-y-3">
              <label className="block text-xs font-bold text-amber-200 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-amber-400" />
                <span>Feedback from the HR</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-amber-300/80 mb-1">
                    HR Feedback Status
                  </label>
                  <select
                    value={reviewHRFeedbackStatus}
                    onChange={(e: any) => setReviewHRFeedbackStatus(e.target.value)}
                    className="w-full bg-gray-950 border border-amber-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="awaiting">Awaiting Feedback from HR</option>
                    <option value="received">Feedback Received</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-300/80 mb-1">
                    Feedback Received Date
                  </label>
                  <input
                    type="date"
                    value={reviewHRFeedbackDate}
                    onChange={(e) => setReviewHRFeedbackDate(e.target.value)}
                    className="w-full bg-gray-950 border border-amber-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-300/80 mb-1">
                  HR Feedback Notes / Discussion Details
                </label>
                <textarea
                  rows={2}
                  value={reviewHRFeedbackNotes}
                  onChange={(e) => setReviewHRFeedbackNotes(e.target.value)}
                  placeholder="e.g. HR verified JD and requested candidate resumes for 1st round shortlisting..."
                  className="w-full bg-gray-950 border border-amber-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
};
