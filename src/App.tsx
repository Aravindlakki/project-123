import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { JDIntakePage } from './pages/JDIntakePage';
import { HRSourcingPage } from './pages/HRSourcingPage';
import { CRMListPage } from './pages/CRMListPage';
import { OutreachTrackerPage } from './pages/OutreachTrackerPage';
import { PerformancePage } from './pages/PerformancePage';
import { TaskManagementPage } from './pages/TaskManagementPage';
import { AdminPortalPage } from './pages/AdminPortalPage';
import { TeamSheetsPage } from './pages/TeamSheetsPage';
import { TeamLeadDashboardPage } from './pages/TeamLeadDashboardPage';
import { AdminLoginModal } from './components/AdminLoginModal';
import { SystemReportModal } from './components/SystemReportModal';
import { api, getAuthToken, clearAuthToken } from './services/api';
import { isSupabaseConfigured } from './services/supabase';
import { CRA } from './types';
import { ShieldCheck, User, Lock, LogIn, Menu, FileText, Database } from 'lucide-react';

const getRouteFromUrl = (): string => {
  const hash = window.location.hash.replace(/^#\/?/, '/');
  if (hash && hash !== '/') {
    return hash;
  }
  let path = window.location.pathname;
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.replace(/\/$/, '');
  if (cleanBase && path.startsWith(cleanBase)) {
    path = path.slice(cleanBase.length);
  }
  return path || '/dashboard';
};

const routeToTab = (rawPath: string) => {
  const clean = rawPath.replace(/\/$/, '');
  const routes: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/team-lead-dashboard': 'team-lead-dashboard',
    '/team-sheets': 'team-sheets',
    '/hr-sourcing': 'hr-sourcing',
    '/jd-intake': 'jd-intake',
    '/crm': 'crm',
    '/outreach': 'outreach',
    '/tasks': 'tasks',
    '/performance': 'performance',
    '/admin/users': 'admin-users',
    '/admin/tasks': 'admin-tasks',
    '/admin/companies': 'admin-companies',
    '/admin/performance': 'admin-performance',
    '/admin/settings': 'admin-settings',
  };

  if (routes[clean]) return routes[clean];

  for (const [route, tab] of Object.entries(routes)) {
    if (clean.endsWith(route)) {
      return tab;
    }
  }

  if (clean.includes('/admin')) return 'admin-users';
  return 'dashboard';
};

const tabToRoute: Record<string, string> = {
  dashboard: '/dashboard',
  'team-lead-dashboard': '/team-lead-dashboard',
  'team-sheets': '/team-sheets',
  'hr-sourcing': '/hr-sourcing',
  'jd-intake': '/jd-intake',
  crm: '/crm',
  outreach: '/outreach',
  tasks: '/tasks',
  performance: '/performance',
  'admin-users': '/admin/users',
  'admin-tasks': '/admin/tasks',
  'admin-companies': '/admin/companies',
  'admin-performance': '/admin/performance',
  'admin-settings': '/admin/settings',
};

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());
  const [currentUser, setCurrentUser] = useState<CRA | null>(null);
  const [isAdminVerified, setIsAdminVerified] = useState(() => sessionStorage.getItem('placemein:admin_verified') === 'true');
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showSystemReportModal, setShowSystemReportModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => routeToTab(getRouteFromUrl()));

  useEffect(() => {
    const listener = () => setActiveTab(routeToTab(getRouteFromUrl()));
    window.addEventListener('popstate', listener);
    window.addEventListener('hashchange', listener);
    return () => {
      window.removeEventListener('popstate', listener);
      window.removeEventListener('hashchange', listener);
    };
  }, []);

  useEffect(() => {
    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
      window.location.hash = tabToRoute[activeTab] || '/dashboard';
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentUser(null);
      return;
    }
    api.getCurrentCRA()
      .then((user) => {
        setCurrentUser(user);
        const adminVerified = sessionStorage.getItem('placemein:admin_verified') === 'true';
        if (user.role === 'admin' && adminVerified) {
          setIsAdminVerified(true);
        } else {
          setIsAdminVerified(false);
        }
      })
      .catch(() => {
        clearAuthToken();
        setIsAuthenticated(false);
      });
  }, [isAuthenticated]);

  const navigate = (tab: string) => {
    // If user attempts to navigate to admin tab but is not verified as admin, intercept and prompt for login
    if (tab.startsWith('admin-') && (!isAdminVerified || currentUser?.role !== 'admin')) {
      setShowAdminLoginModal(true);
      return;
    }
    const targetRoute = tabToRoute[tab] || '/dashboard';
    window.location.hash = targetRoute;
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    await api.logout().catch(() => undefined);
    clearAuthToken();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsAdminVerified(false);
    sessionStorage.removeItem('placemein:admin_verified');
    localStorage.removeItem('placemein:preferred_portal');
    window.location.hash = '';
  };

  const handleExitAdmin = () => {
    setIsAdminVerified(false);
    sessionStorage.removeItem('placemein:admin_verified');
    localStorage.setItem('placemein:preferred_portal', 'employee');
    window.location.hash = '/dashboard';
    setActiveTab('dashboard');
  };

  const handleAdminLoginSuccess = (adminUser: CRA) => {
    setCurrentUser(adminUser);
    setIsAdminVerified(true);
    sessionStorage.setItem('placemein:admin_verified', 'true');
    localStorage.setItem('placemein:preferred_portal', 'admin');
    setShowAdminLoginModal(false);
    window.location.hash = '/admin/users';
    setActiveTab('admin-users');
  };

  const handleLoginSuccess = (role?: 'admin' | 'cra') => {
    setIsAuthenticated(true);
    const verified = sessionStorage.getItem('placemein:admin_verified') === 'true';
    if (role === 'admin' && verified) {
      setIsAdminVerified(true);
      window.location.hash = '/admin/users';
      setActiveTab('admin-users');
    } else {
      setIsAdminVerified(false);
      window.location.hash = '/dashboard';
      setActiveTab('dashboard');
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (!currentUser) {
    return <div className="min-h-screen bg-gray-950 text-white grid place-items-center">Loading your portal…</div>;
  }

  const adminMode = activeTab.startsWith('admin-') && isAdminVerified && currentUser.role === 'admin';
  const isAttemptingAdminDirectly = activeTab.startsWith('admin-') && (!isAdminVerified || currentUser.role !== 'admin');

  // If directly attempting to access admin route without logging in as admin, show inline Admin Login Gate!
  if (isAttemptingAdminDirectly) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-amber-950/20 to-gray-950 text-gray-100 flex font-sans">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={navigate}
          onLogout={handleLogout}
          currentUser={currentUser}
          mode="employee"
          onRequestAdminLogin={() => setShowAdminLoginModal(true)}
          onSwitchToEmployee={handleExitAdmin}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="backdrop-blur-md border-b px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40 bg-amber-950/60 border-amber-800/40">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border text-amber-200 bg-amber-900/50 border-amber-700/50 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                Admin Portal · Login Required
              </span>
            </div>
            <button
              onClick={handleExitAdmin}
              className="text-xs font-bold text-gray-300 hover:text-white px-3 py-1.5 rounded-xl border border-gray-700 hover:bg-gray-800 transition"
            >
              Back to Employee Dashboard
            </button>
          </header>
          <main className="flex-1 flex items-center justify-center p-4">
            <AdminLoginModal
              isOpen={true}
              isInlineGate={true}
              onClose={() => navigate('dashboard')}
              onSuccess={handleAdminLoginSuccess}
              initialEmail={currentUser.role === 'admin' ? currentUser.email : 'aravindreddy.l@placemein.com'}
              onCancelToEmployee={handleExitAdmin}
            />
          </main>
        </div>
      </div>
    );
  }

  const heading = adminMode ? activeTab.replace('admin-', '').replace(/\b\w/g, (c) => c.toUpperCase()) : activeTab.replace('-', ' ');

  return (
    <div className={`min-h-screen ${adminMode ? 'bg-gradient-to-br from-gray-950 via-amber-950/20 to-gray-950' : 'bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950'} text-gray-100 flex font-sans`}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={navigate}
        onLogout={handleLogout}
        currentUser={currentUser}
        mode={adminMode ? 'admin' : 'employee'}
        onRequestAdminLogin={() => setShowAdminLoginModal(true)}
        onSwitchToEmployee={handleExitAdmin}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <header className={`backdrop-blur-md border-b px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-40 ${adminMode ? 'bg-amber-950/70 border-amber-800/40' : 'bg-purple-950/70 border-purple-800/40'}`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger button for mobile & tablet toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-200 hover:text-white hover:bg-white/10 active:bg-white/20 transition shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Open Navigation Menu"
              title="Open Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Title Badge - Compact on Mobile, Full on Desktop */}
            <span className={`text-[11px] sm:text-xs font-black uppercase tracking-wider px-2.5 sm:px-3 py-1 rounded-full border truncate max-w-[140px] sm:max-w-none ${adminMode ? 'text-amber-200 bg-amber-900/50 border-amber-700/50' : 'text-purple-200 bg-purple-900/50 border-purple-700/50'}`}>
              <span className="sm:hidden">{adminMode ? 'Admin' : 'CRA'} · {heading}</span>
              <span className="hidden sm:inline">{adminMode ? `Admin · ${heading}` : `Employee portal · ${heading}`}</span>
            </span>

            {/* Persistent Live Database Connection Indicator - Always visible & noticeable on ALL screen sizes */}
            <div
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-semibold border shrink-0 transition-colors ${
                isSupabaseConfigured
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
              }`}
              title={
                isSupabaseConfigured
                  ? 'Supabase Cloud Database connected and operational.'
                  : 'Supabase credentials are not set. App is running in LocalStorage mode.'
              }
            >
              <Database className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline text-[11px]">
                {isSupabaseConfigured ? 'Supabase' : 'Local DB'}
              </span>
              <span
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                  isSupabaseConfigured
                    ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                    : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                }`}
                aria-label={isSupabaseConfigured ? 'Database Connected' : 'Database Offline/Local'}
              />
            </div>

            {/* Admin Portal Gateway Controls - Visible on tablet/desktop */}
            {adminMode ? (
              <button
                onClick={handleExitAdmin}
                className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all bg-purple-900/50 hover:bg-purple-800/70 text-purple-200 border border-purple-600/50 shadow-sm"
              >
                <User className="h-3.5 w-3.5 text-purple-300" />
                <span>Exit to Employee</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAdminLoginModal(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all bg-amber-900/50 hover:bg-amber-800/70 text-amber-200 border border-amber-600/50 shadow-sm"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                <span>Admin Login</span>
              </button>
            )}

            {/* Quick System Report PDF Generator */}
            <button
              onClick={() => setShowSystemReportModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-purple-800/60 to-indigo-800/60 hover:from-purple-700 hover:to-indigo-700 text-white border border-purple-500/40 shadow-sm cursor-pointer shrink-0"
              title="Open System Architecture Report & Export PDF"
            >
              <FileText className="h-3.5 w-3.5 text-purple-300" />
              <span className="hidden md:inline">System Report</span>
              <span className="text-[9px] bg-purple-500/30 px-1.5 py-0.5 rounded text-purple-200 font-extrabold uppercase">PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile PDF export shortcut button */}
            <button
              onClick={() => setShowSystemReportModal(true)}
              className="sm:hidden p-2 rounded-xl text-purple-200 hover:text-white bg-purple-900/40 border border-purple-700/50 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title="System Report PDF"
              aria-label="Export System Report PDF"
            >
              <FileText className="h-4 w-4 text-purple-300" />
            </button>

            {/* Profile Avatar Button */}
            <button
              onClick={() => navigate(adminMode ? 'admin-performance' : 'performance')}
              className="flex items-center gap-2 text-xs text-right min-h-[44px] p-1 rounded-xl hover:bg-white/5 transition"
              aria-label="User Profile"
            >
              <span className="hidden md:block">
                <b>{currentUser.email?.toLowerCase().includes('aravind') || currentUser.name?.toLowerCase().includes('aravind') ? 'Aravind Reddy' : currentUser.name}</b>
                <br />
                <span className={adminMode ? 'text-amber-300 font-medium' : 'text-purple-300 font-medium'}>
                  {currentUser.email?.toLowerCase().includes('aravind') || currentUser.name?.toLowerCase().includes('aravind')
                    ? 'CRA for Placemein'
                    : (adminMode ? 'Admin Portal' : 'Employee Portal')}
                </span>
              </span>
              <span className={`p-2 rounded-xl shrink-0 ${adminMode ? 'bg-amber-700 text-white' : 'bg-purple-700 text-white'}`}>
                {adminMode ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 min-w-0">
          {activeTab === 'dashboard' && <DashboardPage setActiveTab={navigate} />}
          {activeTab === 'team-lead-dashboard' && <TeamLeadDashboardPage setActiveTab={navigate} />}
          {activeTab === 'team-sheets' && <TeamSheetsPage currentUser={currentUser} />}
          {activeTab === 'tasks' && <TaskManagementPage employeeMode />}
          {activeTab === 'performance' && <PerformancePage employeeMode />}
          {activeTab === 'jd-intake' && <JDIntakePage />}
          {activeTab === 'hr-sourcing' && <HRSourcingPage onNavigateToJDIntake={() => navigate('jd-intake')} />}
          {activeTab === 'crm' && (
            <CRMListPage
              onAddRole={(companyName) => {
                localStorage.setItem('placemein:hr-sourcing-prefill', JSON.stringify({ company: companyName, title: '' }));
                navigate('jd-intake');
              }}
            />
          )}
          {activeTab === 'outreach' && <OutreachTrackerPage />}
          {activeTab === 'admin-users' && <AdminPortalPage initialTab="users" />}
          {activeTab === 'admin-companies' && <AdminPortalPage initialTab="companies" />}
          {activeTab === 'admin-settings' && <AdminPortalPage initialTab="settings" />}
          {activeTab === 'admin-tasks' && <TaskManagementPage />}
          {activeTab === 'admin-performance' && <PerformancePage />}
        </main>
        <footer className={`border-t py-4 text-center text-xs ${adminMode ? 'bg-amber-950/50 border-amber-800/40 text-amber-200/70' : 'bg-purple-950/50 border-purple-800/40 text-purple-200/70'}`}>
          PLACEMEIN © {new Date().getFullYear()} — Internal Recruitment Automation CRM
        </footer>
      </div>

      {/* Admin Login Verification Modal */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={handleAdminLoginSuccess}
        initialEmail={currentUser.role === 'admin' ? currentUser.email : 'aravindreddy.l@placemein.com'}
        onCancelToEmployee={handleExitAdmin}
      />

      {/* End-to-End System Report & PDF Modal */}
      <SystemReportModal
        isOpen={showSystemReportModal}
        onClose={() => setShowSystemReportModal(false)}
      />
    </div>
  );
};

export default App;
