import React, { useEffect, useState } from 'react';
import { CRA, JD, Company } from '../types';
import { api } from '../services/api';
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
} from 'lucide-react';

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
  const [newUserTarget, setNewUserTarget] = useState<number>(10);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Edit user inline
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<number>(10);
  const [editRole, setEditRole] = useState<'admin' | 'cra'>('cra');
  const [editActive, setEditActive] = useState<boolean>(true);

  // Company merge tool
  const [sourceCompanyId, setSourceCompanyId] = useState('');
  const [targetCompanyId, setTargetCompanyId] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  // Settings update
  const [defaultTarget, setDefaultTarget] = useState<number>(10);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

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
        const userList = await api.getAdminUsers();
        setUsers(userList);
      } else if (activeTab === 'companies') {
        const [jdList, compList] = await Promise.all([
          api.getUnverifiedJDs().catch(() => []),
          api.getCompanies().catch(() => []),
        ]);
        setUnverifiedJDs(jdList);
        setCompanies(compList);
      } else if (activeTab === 'settings') {
        const settings = await api.getAdminSystemSettings();
        setSettingsData(settings);
        setDefaultTarget(settings.default_monthly_jd_target || 10);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
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
        monthly_jd_target: newUserTarget,
      });
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserEmpId('');
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
      await api.updateAdminUser(userId, {
        monthly_jd_target: editTarget,
        role: editRole,
        is_active: editActive,
      });
      setEditingUserId(null);
      showNotification('success', 'User profile updated successfully.');
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update user');
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
      <div className="bg-gradient-to-r from-amber-900/80 via-amber-950/90 to-gray-950 border border-amber-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              Administrative Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Placemein System Administration
          </h1>
          <p className="text-amber-200/70 text-sm max-w-2xl">
            Configure recruitment employee accounts, oversee verified job openings, merge duplicate company records, and manage target benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'users' && (
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Team Member</span>
            </button>
          )}

          <button
            onClick={loadData}
            title="Refresh"
            className="p-2.5 rounded-xl bg-amber-900/40 hover:bg-amber-800/50 border border-amber-700/60 text-amber-200 hover:text-white transition"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-amber-800/40 pb-3">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-amber-200/80 hover:bg-amber-900/30'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Management</span>
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'companies'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-amber-200/80 hover:bg-amber-900/30'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Company & JD Oversight</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-amber-200/80 hover:bg-amber-900/30'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>System Settings</span>
        </button>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="h-4 w-4 text-amber-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or employee ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-transparent border-none text-white placeholder-amber-200/40 focus:outline-none text-xs"
              />
            </div>
            <div className="text-amber-200/70">
              Total Users: <span className="font-bold text-white">{users.length}</span>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-amber-300/60 flex flex-col items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
              <p>Loading users...</p>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-amber-950/30 border border-amber-800/40 shadow-xl overflow-x-auto">
              <table className="w-full text-left text-xs text-amber-100">
                <thead className="bg-amber-900/30 text-amber-300 font-semibold border-b border-amber-800/50">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Emp ID</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Monthly Target</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-800/30">
                  {filteredUsers.map((user) => {
                    const isEditing = editingUserId === user.id;

                    return (
                      <tr key={user.id} className="hover:bg-amber-900/20 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{user.name}</div>
                          <div className="text-[11px] text-amber-300/60">{user.email}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-amber-300/80">
                          {user.emp_id || '—'}
                        </td>
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value as any)}
                              className="bg-amber-950 border border-amber-600 rounded px-2 py-1 text-xs text-white"
                            >
                              <option value="cra">CRA</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                user.role === 'admin'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              }`}
                            >
                              {user.role}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              value={editTarget}
                              onChange={(e) => setEditTarget(parseInt(e.target.value) || 1)}
                              className="w-16 bg-amber-950 border border-amber-600 rounded px-2 py-1 text-xs text-white"
                            />
                          ) : (
                            <span className="font-bold text-white">
                              {user.monthly_jd_target || 10} JDs / mo
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <select
                              value={editActive ? 'active' : 'inactive'}
                              onChange={(e) => setEditActive(e.target.value === 'active')}
                              className="bg-amber-950 border border-amber-600 rounded px-2 py-1 text-xs text-white"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                user.is_active !== false
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {user.is_active !== false ? 'Active' : 'Disabled'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-amber-300/70">
                          {formatIndianDate(user.created_at)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSaveUserEdit(user.id)}
                                className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-white"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingUserId(user.id);
                                setEditTarget(user.monthly_jd_target || 10);
                                setEditRole(user.role);
                                setEditActive(user.is_active !== false);
                              }}
                              className="p-1.5 hover:bg-amber-900/50 rounded-lg text-amber-300 hover:text-white transition"
                              title="Edit user details"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPANY & JD OVERSIGHT */}
      {activeTab === 'companies' && (
        <div className="space-y-8">
          {/* Section A: Unverified JDs Queue */}
          <div className="p-6 rounded-3xl bg-amber-950/30 border border-amber-800/40 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-amber-400" />
                  Unverified Job Descriptions ({unverifiedJDs.length})
                </h3>
                <p className="text-xs text-amber-200/70">
                  Review raw JDs submitted through manual intake, URL parsing, or AI extraction before marking them as verified opportunities.
                </p>
              </div>
            </div>

            {unverifiedJDs.length === 0 ? (
              <div className="p-8 text-center text-xs text-amber-300/70 space-y-2 bg-amber-950/20 rounded-2xl border border-amber-800/30">
                <Check className="h-8 w-8 mx-auto text-emerald-400 opacity-60" />
                <p className="font-bold text-white">All JDs have been reviewed!</p>
                <p>No unverified job descriptions currently in queue.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unverifiedJDs.map((jd) => (
                  <div
                    key={jd.id}
                    className="p-4 rounded-2xl bg-amber-900/20 border border-amber-700/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{jd.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {jd.company?.name || 'Company'}
                        </span>
                        {(jd.verification_source === 'pdf_upload' || jd.raw_text?.toLowerCase().includes('.pdf')) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            PDF Upload · Manual Check Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-200/70 line-clamp-2 max-w-2xl">
                        {jd.raw_text}
                      </p>
                      <p className="text-[11px] text-amber-400/60">
                        Opportunity Type: <span className="capitalize">{jd.opportunity_type?.replace('_', ' ')}</span> • Date Found: {formatIndianDate(jd.date_found)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleVerifyJD(jd.id, true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Verify JD
                      </button>
                      <button
                        onClick={() => handleVerifyJD(jd.id, false)}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <X className="h-3.5 w-3.5" />
                        Discard
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Company Merge Tool */}
          <div className="p-6 rounded-3xl bg-amber-950/30 border border-amber-800/40 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-amber-400" />
                Company Duplicate Deduplication & Merge Tool
              </h3>
              <p className="text-xs text-amber-200/70">
                Consolidate duplicate records (e.g. &ldquo;TCS&rdquo; and &ldquo;Tata Consultancy Services&rdquo;). All contacts, outreaches, and JDs from the source company will be transferred to the target company.
              </p>
            </div>

            <form onSubmit={handleMergeCompanies} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs items-end">
              <div>
                <label className="block text-amber-200 font-semibold mb-1">
                  Source Company (Will be merged & removed) *
                </label>
                <select
                  value={sourceCompanyId}
                  onChange={(e) => setSourceCompanyId(e.target.value)}
                  className="w-full px-3 py-2 bg-amber-950/60 border border-amber-700/60 rounded-xl text-white focus:outline-none"
                >
                  <option value="">Select duplicate company...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.industry || 'Industry unspecified'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-amber-200 font-semibold mb-1">
                  Target Company (Primary record to keep) *
                </label>
                <select
                  value={targetCompanyId}
                  onChange={(e) => setTargetCompanyId(e.target.value)}
                  className="w-full px-3 py-2 bg-amber-950/60 border border-amber-700/60 rounded-xl text-white focus:outline-none"
                >
                  <option value="">Select primary company...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isMerging || !sourceCompanyId || !targetCompanyId}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  {isMerging ? 'Merging...' : 'Merge Companies'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-amber-950/30 border border-amber-800/40 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-amber-400" />
                Operational Quotas & Targets
              </h3>
              <p className="text-xs text-amber-200/70">
                Configure default performance parameters applied to newly registered CRAs.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-md text-xs">
              <div>
                <label className="block text-amber-200 font-semibold mb-1">
                  Default Monthly Verified JD Target (per CRA)
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={defaultTarget}
                  onChange={(e) => setDefaultTarget(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 bg-amber-950/60 border border-amber-700/60 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition"
              >
                {isSavingSettings ? 'Saving...' : 'Update Benchmark'}
              </button>
            </form>
          </div>

          <div className="p-6 rounded-3xl bg-amber-950/30 border border-amber-800/40 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                AI & Intelligence Engine Status
              </h3>
              <p className="text-xs text-amber-200/70">
                Status of connected models and Google Search Grounding for HR discovery.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-amber-900/20 border border-amber-700/30 space-y-1">
                <p className="text-amber-300 font-semibold">Tier & Licensing</p>
                <p className="text-white font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  100% Free & Open
                </p>
                <p className="text-[11px] text-amber-200/60">No paid API key or subscription needed</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-900/20 border border-amber-700/30 space-y-1">
                <p className="text-amber-300 font-semibold">Google Search Grounding</p>
                <p className="text-white font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active (Gemini 2.5 Flash)
                </p>
                <p className="text-[11px] text-amber-200/60">Real-time live recruiter discovery</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-900/20 border border-amber-700/30 space-y-1">
                <p className="text-amber-300 font-semibold">JD Extraction Engine</p>
                <p className="text-white font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Active (Gemini Multimodal)
                </p>
                <p className="text-[11px] text-amber-200/60">PDF / Docx / HTML parsing</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-900/20 border border-amber-700/30 space-y-1">
                <p className="text-amber-300 font-semibold">Phone Privacy Enforcer</p>
                <p className="text-white font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Enabled
                </p>
                <p className="text-[11px] text-amber-200/60">Phone strictly empty for manual verification</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MERGE CONFIRMATION MODAL */}
      {showMergeConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-gray-950 border border-amber-800/70 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-300">
              <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0" />
              <h3 className="text-base font-bold text-white">Confirm Company Merge</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to merge these companies? All contacts, JDs, and outreach history from the duplicate company will be safely reassigned to the primary company.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-800/40">
              <button
                type="button"
                onClick={() => setShowMergeConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeMerge}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                Confirm Merge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-gray-950 border border-amber-800/70 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-amber-800/40 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-400" />
                Add New Placemein Team Member
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-amber-200 font-semibold mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Aravind Reddy"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-amber-950/50 border border-amber-700/60 rounded-xl text-white placeholder-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-amber-200 font-semibold mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., PMI-004"
                    value={newUserEmpId}
                    onChange={(e) => setNewUserEmpId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-amber-950/50 border border-amber-700/60 rounded-xl text-white placeholder-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-amber-200 font-semibold mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@placemein.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-amber-950/50 border border-amber-700/60 rounded-xl text-white placeholder-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-amber-200 font-semibold mb-1">
                  Temporary Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-amber-950/50 border border-amber-700/60 rounded-xl text-white placeholder-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-amber-200 font-semibold mb-1">
                    System Role *
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-amber-950/50 border border-amber-700/60 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="cra">CRA (Recruitment Specialist)</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-amber-200 font-semibold mb-1">
                    Monthly JD Target
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newUserTarget}
                    onChange={(e) => setNewUserTarget(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-amber-950/50 border border-amber-700/60 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-800/40">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg transition"
                >
                  {isSubmittingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
