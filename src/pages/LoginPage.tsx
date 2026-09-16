import React, { useState } from 'react';
import { api, clearAuthToken } from '../services/api';
import {
  Lock,
  Mail,
  UserCheck,
  AlertCircle,
  Info,
  ShieldCheck,
  User,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle,
  Copy,
  Check,
  Search,
  Users,
  Key,
  LogIn,
  ChevronDown,
  ChevronUp,
  Briefcase
} from 'lucide-react';
import {
  ALL_EMPLOYEE_CREDENTIALS,
  DEFAULT_EMPLOYEE_PASSWORD,
  EmployeeCredential,
  getFormattedCredentialsText
} from '../data/employeeCredentials';

interface Props {
  onLoginSuccess: (role?: 'admin' | 'cra') => void;
}

export const LoginPage: React.FC<Props> = ({ onLoginSuccess }) => {
  const [loginRole, setLoginRole] = useState<'CRA' | 'ADMIN'>(() =>
    window.location.pathname.startsWith('/admin') ? 'ADMIN' : 'CRA'
  );
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() =>
    window.location.pathname.startsWith('/admin') ? 'aravindreddy.l@placemein.com' : 'charankumar.n@placemein.com'
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Employee Credentials Directory state
  const [searchEmployee, setSearchEmployee] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'cra' | 'admin'>('all');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [copiedPass, setCopiedPass] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleRoleTabChange = (role: 'CRA' | 'ADMIN') => {
    setLoginRole(role);
    setError(null);
    setSuccessMessage(null);
    setPassword(DEFAULT_EMPLOYEE_PASSWORD);
    if (role === 'ADMIN') {
      setEmail('aravindreddy.l@placemein.com');
    } else {
      setEmail('charankumar.n@placemein.com');
    }
  };

  const performLogin = async (targetEmail: string, targetPass: string, expectedRole?: 'CRA' | 'ADMIN') => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (!targetEmail.trim() || !targetPass) {
        throw new Error('Please enter both your email address and password to log in.');
      }

      await api.login(targetEmail.trim(), targetPass);
      localStorage.setItem('placemein:login_timestamp', new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));

      const currentUser = await api.getCurrentCRA();
      const roleToCheck = expectedRole || loginRole;

      if (roleToCheck === 'ADMIN' && currentUser.role !== 'admin') {
        clearAuthToken();
        sessionStorage.removeItem('placemein:admin_verified');
        setError(`Access denied: "${currentUser.name}" has a CRA Employee account, which cannot access the Admin Portal. Please use an authorized Admin account.`);
        return;
      }

      if (currentUser.role === 'admin' && roleToCheck === 'ADMIN') {
        sessionStorage.setItem('placemein:admin_verified', 'true');
        localStorage.setItem('placemein:preferred_portal', 'admin');
        onLoginSuccess('admin');
      } else {
        sessionStorage.removeItem('placemein:admin_verified');
        localStorage.setItem('placemein:preferred_portal', 'employee');
        onLoginSuccess('cra');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployee = (emp: EmployeeCredential, autoLogin: boolean = false) => {
    setError(null);
    setSuccessMessage(null);
    const targetRole = emp.role === 'admin' ? 'ADMIN' : 'CRA';
    setLoginRole(targetRole);
    setEmail(emp.email);
    setPassword(emp.passwordDefault);

    if (autoLogin) {
      performLogin(emp.email, emp.passwordDefault, targetRole);
    } else {
      setSuccessMessage(`Loaded credentials for ${emp.name} (${emp.designation}). Click Login or Sign In.`);
    }
  };

  const handleCopy = (text: string, type: 'email' | 'pass' | 'all') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    if (type === 'email') {
      setCopiedEmail(text);
      setTimeout(() => setCopiedEmail(null), 1800);
    } else if (type === 'pass') {
      setCopiedPass(text);
      setTimeout(() => setCopiedPass(null), 1800);
    } else if (type === 'all') {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2200);
    }
  };

  const filteredEmployees = ALL_EMPLOYEE_CREDENTIALS.filter((emp) => {
    const matchesRole = filterRole === 'all' || emp.role === filterRole;
    const query = searchEmployee.trim().toLowerCase();
    const matchesSearch =
      !query ||
      emp.name.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      emp.empId.toLowerCase().includes(query) ||
      emp.designation.toLowerCase().includes(query) ||
      emp.spocDomain.toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  const activePortalEmployees = ALL_EMPLOYEE_CREDENTIALS.filter((emp) =>
    loginRole === 'ADMIN' ? emp.role === 'admin' : emp.role === 'cra'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isForgotMode) {
        if (resetToken.trim()) {
          await api.resetPassword(resetToken.trim(), password);
          setIsForgotMode(false);
          setResetToken('');
          setSuccessMessage('Password reset successfully. You can now log in.');
        } else {
          const result = await api.forgotPassword(email);
          setSuccessMessage(result.message);
        }
      } else if (isRegisterMode) {
        await api.register(
          name || email.split('@')[0],
          email.trim(),
          password,
          loginRole === 'ADMIN' ? 'admin' : 'cra'
        );
        setSuccessMessage(`Account registered as ${loginRole === 'ADMIN' ? 'Admin' : 'CRA Employee'}. Logging in...`);
        await performLogin(email.trim(), password, loginRole);
      } else {
        await performLogin(email.trim(), password, loginRole);
      }
    } catch (err: any) {
      setError(err.message || (isRegisterMode ? 'Registration failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-gray-950 to-amber-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full bg-gray-900/90 border border-purple-800/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl shadow-black/80">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="bg-white p-3 rounded-2xl w-fit mx-auto shadow-xl shadow-purple-600/30 border border-purple-200 flex items-center justify-center">
            <img
              src="/placemein-logo.png"
              alt="Placemein Logo"
              className="h-12 w-12 object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('placemein-symbol.svg')) {
                  target.src = '/placemein-symbol.svg';
                }
              }}
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">PLACEMEIN</h1>
            <p className="text-xs sm:text-sm text-purple-200/80 font-medium">Recruitment Automation & CRA Sourcing CRM</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              100% Free & Open Access • No Subscriptions
            </div>
          </div>
        </div>

        {/* Dual Portal Selection Tabs */}
        {!isForgotMode && (
          <div className="grid grid-cols-2 gap-2 bg-purple-900/30 p-1.5 rounded-2xl border border-purple-800/50">
            <button
              type="button"
              onClick={() => handleRoleTabChange('ADMIN')}
              className={`flex items-center justify-center gap-2 py-3 px-4 text-xs sm:text-sm font-extrabold rounded-xl transition-all ${
                loginRole === 'ADMIN'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/40 border border-amber-400/30'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/40'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Leadership Portal</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleTabChange('CRA')}
              className={`flex items-center justify-center gap-2 py-3 px-4 text-xs sm:text-sm font-extrabold rounded-xl transition-all ${
                loginRole === 'CRA'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 border border-purple-400/30'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/40'
              }`}
            >
              <User className="h-4 w-4" />
              <span>CRA Employee Portal</span>
            </button>
          </div>
        )}

        {/* Quick Role Member Selector Bar */}
        {!isForgotMode && !isRegisterMode && (
          <div className="p-4 rounded-2xl bg-gray-950/70 border border-purple-800/40 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-purple-400" />
                <span>
                  Quick Select {loginRole === 'ADMIN' ? 'Administrator' : 'CRA Employee'} ({activePortalEmployees.length} available):
                </span>
              </span>
              <span className="text-[11px] text-gray-400">
                Default Password: <code className="text-amber-300 font-mono font-bold">{DEFAULT_EMPLOYEE_PASSWORD}</code>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {activePortalEmployees.map((emp) => {
                const isSelected = email.toLowerCase() === emp.email.toLowerCase();
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => handleSelectEmployee(emp, false)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? loginRole === 'ADMIN'
                          ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/30 ring-1 ring-amber-300'
                          : 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30 ring-1 ring-purple-300'
                        : 'bg-gray-900/80 text-gray-300 border-gray-700/70 hover:border-purple-500 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${emp.avatarBg || 'bg-purple-500'}`} />
                    <span>{emp.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">({emp.empId})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Header Indicator Notice */}
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
          loginRole === 'ADMIN' 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
            : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
        }`}>
          <span className="flex items-center gap-2 font-medium">
            {loginRole === 'ADMIN' ? <ShieldCheck className="h-4 w-4 text-amber-400" /> : <User className="h-4 w-4 text-purple-400" />}
            {loginRole === 'ADMIN' ? 'Admin Leadership Portal (User Mgmt, Settings, JDs Oversight)' : 'CRA Employee Portal (Outreach, Sourcing CRM, Task Board)'}
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-950 border border-purple-700/50">
            {loginRole}
          </span>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-semibold text-rose-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300 flex items-start gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && !isForgotMode && (
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">Full Name *</label>
              <div className="relative">
                <UserCheck className="h-4 w-4 absolute left-3 top-3 text-purple-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Aravind Reddy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-950/80 border border-purple-700/60 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400 placeholder-purple-400/50"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-purple-200">
                {loginRole === 'ADMIN' ? 'Admin Email *' : 'Employee Email *'}
              </label>
              <span className="text-[11px] text-gray-400">
                Default Password: <code className="text-amber-300 font-mono font-bold">Password123!</code>
              </span>
            </div>
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-3 top-3 text-purple-400" />
              <input
                type="email"
                required
                placeholder={loginRole === 'ADMIN' ? 'aravindreddy.l@placemein.com' : 'charankumar.n@placemein.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-950/80 border border-purple-700/60 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400 placeholder-purple-400/50 font-mono"
              />
            </div>
          </div>

          {!isForgotMode && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-purple-200">Password *</label>
                <button
                  type="button"
                  onClick={() => setPassword(DEFAULT_EMPLOYEE_PASSWORD)}
                  className="text-[11px] text-amber-300 hover:text-amber-200 hover:underline flex items-center gap-1 font-medium"
                >
                  <Key className="h-3 w-3" />
                  <span>Autofill "Password123!"</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-3 text-purple-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-950/80 border border-purple-700/60 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400 placeholder-purple-400/50 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {isForgotMode && (
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">Reset Token (optional)</label>
              <input
                type="text"
                placeholder="Leave empty to request a reset link"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="w-full bg-gray-950/80 border border-purple-700/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400 placeholder-purple-400/50 font-mono"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-extrabold py-3.5 rounded-xl transition shadow-xl disabled:opacity-50 mt-2 text-sm flex items-center justify-center gap-2 ${
              loginRole === 'ADMIN' 
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30' 
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
            }`}
          >
            <LogIn className="h-4 w-4" />
            <span>
              {loading 
                ? 'Authenticating...' 
                : isForgotMode 
                ? (resetToken ? 'Reset Password' : 'Send Recovery Email') 
                : isRegisterMode 
                ? `Register as ${loginRole === 'ADMIN' ? 'Admin' : 'CRA Employee'}` 
                : `Login to ${loginRole === 'ADMIN' ? 'Admin Leadership Portal' : 'CRA Employee Portal'}`
              }
            </span>
          </button>
        </form>

        {/* Comprehensive Employee Credentials Directory */}
        <div className="bg-gray-950/80 border border-purple-800/50 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-800/40">
            <div>
              <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" />
                <span>All Employee & Admin Login Credentials</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-700/40">
                  {ALL_EMPLOYEE_CREDENTIALS.length} Accounts Active
                </span>
              </h3>
              <p className="text-xs text-purple-300/80 mt-0.5">
                Every employee account is pre-provisioned with password: <code className="text-amber-300 font-bold font-mono">Password123!</code>
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(getFormattedCredentialsText(), 'all')}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-purple-900/40 hover:bg-purple-800/50 text-purple-200 hover:text-white border border-purple-700/50 rounded-xl text-xs font-bold transition shrink-0"
              title="Copy entire list to clipboard"
            >
              {copiedAll ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedAll ? 'Credentials Copied!' : 'Copy All Credentials'}</span>
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:flex-1">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                placeholder="Search by name, email, employee ID (PM-101), or domain..."
                className="w-full bg-gray-900/90 border border-purple-800/50 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
              />
            </div>
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setFilterRole('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition whitespace-nowrap ${
                  filterRole === 'all'
                    ? 'bg-purple-600 text-white border-purple-400'
                    : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
                }`}
              >
                All ({ALL_EMPLOYEE_CREDENTIALS.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterRole('cra')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition whitespace-nowrap ${
                  filterRole === 'cra'
                    ? 'bg-purple-600 text-white border-purple-400'
                    : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
                }`}
              >
                CRA Specialists (7)
              </button>
              <button
                type="button"
                onClick={() => setFilterRole('admin')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition whitespace-nowrap ${
                  filterRole === 'admin'
                    ? 'bg-amber-600 text-white border-amber-400'
                    : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
                }`}
              >
                Leadership & Admins (5)
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {filteredEmployees.map((emp) => {
              const isSelected = email.toLowerCase() === emp.email.toLowerCase();
              return (
                <div
                  key={emp.id}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                    isSelected
                      ? emp.role === 'admin'
                        ? 'bg-amber-950/40 border-amber-500/70 shadow-lg shadow-amber-950/40 ring-1 ring-amber-400'
                        : 'bg-purple-950/40 border-purple-500/70 shadow-lg shadow-purple-950/40 ring-1 ring-purple-400'
                      : 'bg-gray-900/70 border-gray-800 hover:border-purple-700/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0 ${emp.avatarBg}`}>
                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-white text-xs truncate flex items-center gap-1.5">
                          <span>{emp.name}</span>
                          <span className="font-mono text-[10px] text-gray-400 font-normal">({emp.empId})</span>
                        </h4>
                        <p className="text-[11px] text-gray-400 truncate">{emp.designation}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                      emp.role === 'admin'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}>
                      {emp.role === 'admin' ? 'Admin' : 'CRA'}
                    </span>
                  </div>

                  {/* Sourcing / Domain Note */}
                  <div className="text-[11px] text-gray-300/90 flex items-center gap-1.5 bg-gray-950/50 p-2 rounded-xl border border-gray-800/60">
                    <Briefcase className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">{emp.spocDomain}</span>
                  </div>

                  {/* Credentials rows */}
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between gap-2 bg-gray-950/60 px-2.5 py-1.5 rounded-xl border border-gray-800">
                      <span className="text-[11px] text-gray-400 truncate select-all">{emp.email}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(emp.email, 'email')}
                        className="text-gray-400 hover:text-white transition shrink-0 p-1"
                        title="Copy Email"
                      >
                        {copiedEmail === emp.email ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 bg-gray-950/60 px-2.5 py-1.5 rounded-xl border border-gray-800">
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-gray-400 font-sans font-medium">Pass:</span>
                        <span className="text-amber-300 font-bold select-all">{emp.passwordDefault}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(emp.passwordDefault, 'pass')}
                        className="text-gray-400 hover:text-white transition shrink-0 p-1"
                        title="Copy Password"
                      >
                        {copiedPass === emp.passwordDefault ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSelectEmployee(emp, false)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white text-xs font-bold border border-gray-700 transition text-center"
                    >
                      Autofill Form
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectEmployee(emp, true)}
                      className={`flex-1 py-1.5 px-2.5 rounded-xl text-white text-xs font-extrabold shadow transition flex items-center justify-center gap-1.5 ${
                        emp.role === 'admin'
                          ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                          : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                      }`}
                    >
                      <LogIn className="h-3 w-3" />
                      <span>1-Click Sign In</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!isRegisterMode && !isForgotMode && (
          <button
            type="button"
            onClick={() => { setIsForgotMode(true); setError(null); setSuccessMessage(null); }}
            className="w-full text-xs text-purple-300 hover:text-white hover:underline font-semibold text-center block"
          >
            Forgot password? Reset password
          </button>
        )}

        <div className="text-center pt-2 border-t border-purple-800/40">
          <button
            type="button"
            onClick={() => {
              if (isForgotMode) {
                setIsForgotMode(false);
                setResetToken('');
                setError(null);
                setSuccessMessage(null);
                return;
              }
              setIsRegisterMode(!isRegisterMode);
              setError(null);
              setSuccessMessage(null);
            }}
            className="text-xs text-purple-300 hover:text-white hover:underline font-semibold"
          >
            {isForgotMode ? 'Back to login' : isRegisterMode ? 'Already registered? Login here' : 'Need a new account? Register here'}
          </button>
        </div>
      </div>
    </div>
  );
};
