import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Lock,
  Mail,
  UserCheck,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  Copy,
  Search,
  Users,
  Key,
  LogIn,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  ALL_EMPLOYEE_CREDENTIALS,
  DEFAULT_EMPLOYEE_PASSWORD,
  EmployeeCredential
} from '../data/employeeCredentials';
import { CRA } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: CRA) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'cra'>('cra');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCredsList, setShowCredsList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<'all' | 'cra' | 'admin'>('all');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectEmployee = (cred: EmployeeCredential) => {
    setEmail(cred.email);
    setPassword(cred.passwordDefault || DEFAULT_EMPLOYEE_PASSWORD);
    setError(null);
    if (cred.role === 'cra') {
      setActiveTab('cra');
    } else {
      setActiveTab('admin');
    }
  };

  const performLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const normalizedInput = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      // Find in pre-provisioned credentials
      const matchedCred = ALL_EMPLOYEE_CREDENTIALS.find(
        (c) =>
          c.email.toLowerCase() === normalizedInput ||
          c.name.toLowerCase() === normalizedInput ||
          c.empId.toLowerCase() === normalizedInput
      );

      const isCeo = normalizedInput === 'aravindaravind3953@gmail.com';

      if (
        (matchedCred || isCeo) &&
        (cleanPassword === 'Password123!' ||
          cleanPassword === 'admin123' ||
          cleanPassword === (matchedCred?.passwordDefault || ''))
      ) {
        const craUser: CRA = matchedCred
          ? {
              id: matchedCred.id,
              email: matchedCred.email,
              name: matchedCred.name,
              role: matchedCred.role,
              monthly_jd_target: 20,
              is_active: true,
              phone: '+91 98765 43200',
              avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
            }
          : {
              id: 'usr_admin_ceo',
              email: 'aravindaravind3953@gmail.com',
              name: 'Aravind Reddy',
              role: 'admin',
              monthly_jd_target: 20,
              is_active: true,
              phone: '+91 98765 43200',
              avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
            };

        localStorage.setItem('cra_token', `token_${craUser.id}_${Date.now()}`);
        onLoginSuccess(craUser);
        setIsSubmitting(false);
        return;
      }

      // Try API fallback
      try {
        const data = await api.login(email, password);
        const fallbackUser: CRA = {
          id: 'usr_fallback',
          email: email,
          name: email.split('@')[0],
          role: activeTab === 'admin' ? 'admin' : 'cra',
          monthly_jd_target: 20,
          is_active: true,
        };
        onLoginSuccess(fallbackUser);
      } catch (err) {
        setError('Login failed — check email and password');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const craEmployees = ALL_EMPLOYEE_CREDENTIALS.filter((e) => e.role === 'cra');
  const adminEmployees = ALL_EMPLOYEE_CREDENTIALS.filter((e) => e.role === 'admin');

  const filteredCredentials = ALL_EMPLOYEE_CREDENTIALS.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.spocDomain && c.spocDomain.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      filterRole === 'all'
        ? true
        : filterRole === 'cra'
        ? c.role === 'cra'
        : c.role !== 'cra';

    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-[#0d0714] flex flex-col items-center justify-center p-4 selection:bg-purple-500 selection:text-white relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-4xl z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shadow-xl shadow-purple-600/30">
            <div className="w-full h-full bg-[#130d1d] rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase">
            PLACEMEIN
          </h1>
          <p className="text-sm font-medium text-slate-400">
            Recruitment Automation & CRA Sourcing CRM
          </p>
        </div>

        <div className="bg-[#170e24]/90 backdrop-blur-xl border border-purple-900/30 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#0e0717] rounded-xl border border-purple-900/40">
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'admin'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Leadership Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('cra');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'cra'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              CRA Employee Portal
            </button>
          </div>

          <div className="bg-[#0e0717]/80 rounded-xl p-3 border border-purple-900/20">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Quick Select {activeTab === 'cra' ? 'CRA Employee' : 'Admin Leadership'}:
              </span>
              <span className="text-amber-400 font-mono">
                Password: <strong>Password123!</strong>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(activeTab === 'cra' ? craEmployees : adminEmployees).map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => handleSelectEmployee(emp)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 font-medium transition-all ${
                    email.toLowerCase() === emp.email.toLowerCase()
                      ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                      : 'bg-white/5 text-slate-300 border-white/5 hover:border-purple-500/50 hover:bg-white/10'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  {emp.name} <span className="text-[10px] opacity-70">({emp.empId})</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={performLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>{activeTab === 'admin' ? 'Admin Email / ID' : 'Employee Email / ID'}</span>
                <span className="text-slate-500 lowercase font-normal">e.g. harish.r@placemein.com or PM-101</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeTab === 'admin' ? 'aravindreddy.l@placemein.com' : 'harish.r@placemein.com'}
                  className="w-full pl-10 pr-4 py-3 bg-[#0e0717] border border-purple-900/40 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setPassword('Password123!')}
                  className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors font-medium flex items-center gap-1"
                >
                  <Key className="w-3 h-3" /> Autofill "Password123!"
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-[#0e0717] border border-purple-900/40 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-600/30 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Login to {activeTab === 'admin' ? 'Admin Leadership Portal' : 'CRA Employee Portal'}
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-[#170e24]/90 border border-purple-900/30 rounded-2xl shadow-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowCredsList(!showCredsList)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-bold text-white">All Employee & Admin Login Credentials</h3>
                <p className="text-xs text-slate-400">Pre-provisioned accounts with password: Password123!</p>
              </div>
            </div>
            {showCredsList ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showCredsList && (
            <div className="p-4 border-t border-purple-900/30 space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or employee ID..."
                    className="w-full pl-9 pr-3 py-2 bg-[#0e0717] border border-purple-900/40 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setFilterRole('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterRole === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({ALL_EMPLOYEE_CREDENTIALS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterRole('cra')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterRole === 'cra'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    CRA
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterRole('admin')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterRole === 'admin'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {filteredCredentials.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-3 bg-[#0e0717] rounded-xl border border-purple-900/30 flex items-center justify-between gap-2 hover:border-purple-600/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white truncate">{emp.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300 font-mono">
                          {emp.empId}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{emp.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(emp.email, emp.id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                        title="Copy Email"
                      >
                        {copiedId === emp.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectEmployee(emp)}
                        className="px-2.5 py-1 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-[11px] font-semibold transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
