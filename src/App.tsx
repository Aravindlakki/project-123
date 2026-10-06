import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { JDIntakePage } from './pages/JDIntakePage';
import { HRSourcingPage } from './pages/HRSourcingPage';
import { PipelinePage } from './pages/PipelinePage';
import { OutreachDraftsPage } from './pages/OutreachDraftsPage';
import { ProofOfResponsePage } from './pages/ProofOfResponsePage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { JDBankPage } from './pages/JDBankPage';
import { CRMListPage } from './pages/CRMListPage';
import { JDListPage } from './pages/JDListPage';
import { PerformancePage } from './pages/PerformancePage';
import { TaskManagementPage } from './pages/TaskManagementPage';
import { AdminPortalPage } from './pages/AdminPortalPage';
import { TeamSheetsPage } from './pages/TeamSheetsPage';
import { MessageTemplatesPage } from './pages/MessageTemplatesPage';
import { ProofReviewPage } from './pages/ProofReviewPage';
import { TeamLeadDashboardPage } from './pages/TeamLeadDashboardPage';
import { AdminLoginModal } from './components/AdminLoginModal';
import { SystemReportModal } from './components/SystemReportModal';
import { AdminLayout } from './components/admin/AdminLayout';
import './styles/adminTheme.css';
import { api, getAuthToken, clearAuthToken } from './services/api';
import { isSupabaseConfigured } from './services/supabase';
import { CRA } from './types';
import { ShieldCheck, User, Lock, LogIn, Menu, FileText, Database } from 'lucide-react';

const getRouteFromUrl = (): string => {
  const hash = window.location.hash.replace(/^#\/?/, '/');
  if (hash && hash !== '/') {
    if (hash.includes('design-system') || hash.includes('design')) {
      window.location.hash = '/dashboard';
      return '/dashboard';
    }
    return hash;
  }
  let path = window.location.pathname;
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.replace(/\/$/, '');
  if (cleanBase && path.startsWith(cleanBase)) {
    path = path.slice(cleanBase.length);
  }
  if (path.includes('design-system') || path.includes('design')) {
    return '/dashboard';
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
    '/pipeline': 'pipeline',
    '/pipeline/drafts': 'outreach-drafts',
    '/pipeline/proofs': 'proof-of-response',
    '/pipeline/follow-ups': 'follow-ups',
    '/jd-intake': 'jd-intake',
    '/jd-list': 'jd-list',
    '/jd-bank/tech': 'jd-bank-tech',
    '/jd-bank/non-tech': 'jd-bank-non-tech',
    '/crm': 'crm',
    '/tasks': 'tasks',
    '/performance': 'performance',
    '/admin/users': 'admin-users',
    '/admin/crm': 'admin-crm',
    '/admin/crm-directory': 'admin-crm',
    '/admin/templates': 'admin-templates',
    '/admin/message-templates': 'admin-templates',
    '/admin/worksheets': 'admin-sheets',
    '/admin/team-sheets': 'admin-sheets',
    '/admin/sheets': 'admin-sheets',
    '/admin/jd-list': 'admin-jd-list',
    '/admin/pipeline/proofs': 'admin-proof-review',
    '/admin/team-lead-dashboard': 'admin-team-lead-dashboard',
    '/admin/tasks': 'admin-tasks',
    '/admin/companies': 'admin-companies',
    '/admin/performance': 'admin-performance',
    '/admin/settings': 'admin-settings',
    '/admin/jd-bank/tech': 'jd-bank-tech',
    '/admin/jd-bank-tech': 'jd-bank-tech',
    '/admin/jd-bank/non-tech': 'jd-bank-non-tech',
    '/admin/jd-bank-non-tech': 'jd-bank-non-tech',
    '/admin/proof-review': 'proof-review',
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
  'pipeline': '/pipeline',
  'outreach-drafts': '/pipeline/drafts',
  'proof-of-response': '/pipeline/proofs',
  'follow-ups': '/pipeline/follow-ups',
  'jd-intake': '/jd-intake',
  'jd-list': '/jd-list',
  crm: '/crm',
  tasks: '/tasks',
  performance: '/performance',
  'admin-users': '/admin/users',
  'admin-crm': '/admin/crm',
  'admin-templates': '/admin/templates',
  'admin-sheets': '/admin/worksheets',
  'admin-jd-list': '/admin/jd-list',
  'admin-jd-bank-tech': '/admin/jd-bank/tech',
  'admin-jd-bank-non-tech': '/admin/jd-bank/non-tech',
  'admin-proof-review': '/admin/pipeline/proofs',
  'admin-team-lead-dashboard': '/admin/team-lead-dashboard',
  'admin-tasks': '/admin/tasks',
  'admin-companies': '/admin/companies',
  'admin-performance': '/admin/performance',
  'admin-settings': '/admin/settings',
  'jd-bank-tech': '/admin/jd-bank/tech',
  'jd-bank-non-tech': '/admin/jd-bank/non-tech',
  'proof-review': '/admin/proof-review',
};

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());
  const [currentUser, setCurrentUser] = useState<CRA | null>(null);
  const [isAdminVerified, setIsAdminVerified] = useState(() => sessionStorage.getItem('placemein:admin_verified') === 'true');
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showSystemReportModal, setShowSystemReportModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => routeToTab(getRouteFromUrl()));

  const isAdminTab = activeTab.startsWith('admin-') || activeTab.startsWith('jd-bank') || activeTab === 'proof-review';
  const adminMode = Boolean(isAdminTab && isAdminVerified && currentUser?.role === 'admin');
  const isAttemptingAdminDirectly = Boolean(isAdminTab && (!isAdminVerified || currentUser?.role !== 'admin'));

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
        if (user.role === 'admin') {
          setIsAdminVerified(true);
          sessionStorage.setItem('placemein:admin_verified', 'true');
        } else {
          setIsAdminVerified(false);
          sessionStorage.removeItem('placemein:admin_verified');
        }
      })
      .catch(() => {
        clearAuthToken();
        setIsAuthenticated(false);
      });
  }, [isAuthenticated]);

  const navigate = (tab: string) => {
    let effectiveTab = tab;
    // If the user is currently verified in admin mode, keep them inside the Admin Portal!
    if (adminMode) {
      if (tab === 'team-sheets') effectiveTab = 'admin-sheets';
      else if (tab === 'team-lead-dashboard') effectiveTab = 'admin-team-lead-dashboard';
      else if (tab === 'tasks') effectiveTab = 'admin-tasks';
      else if (tab === 'performance') effectiveTab = 'admin-performance';
      else if (tab === 'crm') effectiveTab = 'admin-companies';
    }

    // If user attempts to navigate to admin tab but is not verified as admin, intercept and prompt for login
    const isTargetAdmin = effectiveTab.startsWith('admin-') || effectiveTab.startsWith('jd-bank') || effectiveTab === 'proof-review';
    if (isTargetAdmin && (!isAdminVerified || currentUser?.role !== 'admin')) {
      setShowAdminLoginModal(true);
      return;
    }
    const targetRoute = tabToRoute[effectiveTab] || '/dashboard';
    window.location.hash = targetRoute;
    setActiveTab(effectiveTab);
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

  const handleLoginSuccess = (role?: 'admin' | 'cra', user?: CRA) => {
    setIsAuthenticated(true);
    if (user) setCurrentUser(user);
    const isAdmin = role === 'admin' || user?.role === 'admin';
    if (isAdmin) {
      setIsAdminVerified(true);
      sessionStorage.setItem('placemein:admin_verified', 'true');
      localStorage.setItem('placemein:preferred_portal', 'admin');
      window.location.hash = '/admin/users';
      setActiveTab('admin-users');
    } else {
      setIsAdminVerified(false);
      sessionStorage.removeItem('placemein:admin_verified');
      localStorage.setItem('placemein:preferred_portal', 'employee');
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
              initialEmail={currentUser.role === 'admin' ? currentUser.email : ''}
              onCancelToEmployee={handleExitAdmin}
            />
          </main>
        </div>
      </div>
    );
  }

  // Early return: When in adminMode, render ALL admin tabs inside AdminLayout with the admin leadership theme
  if (adminMode && currentUser) {
    return (
      <AdminLayout
        activeTab={activeTab}
        setActiveTab={navigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchToEmployee={handleExitAdmin}
      >
        {activeTab === 'admin-users' && <AdminPortalPage initialTab="users" />}
        {activeTab === 'admin-companies' && <AdminPortalPage initialTab="companies" />}
        {activeTab === 'admin-crm' && (
          <CRMListPage
            currentUser={currentUser}
            adminMode={true}
            onAddRole={(companyName) => {
              localStorage.setItem('placemein:hr-sourcing-prefill', JSON.stringify({ company: companyName, title: '' }));
              navigate('jd-intake');
            }}
          />
        )}
        {activeTab === 'admin-templates' && (
          <MessageTemplatesPage currentUser={currentUser} />
        )}
        {activeTab === 'admin-settings' && <AdminPortalPage initialTab="settings" />}
        {activeTab === 'admin-jd-list' && <JDListPage currentUser={currentUser} adminMode={true} />}
        {activeTab === 'admin-team-lead-dashboard' && (
          <TeamLeadDashboardPage setActiveTab={navigate} adminMode={true} />
        )}
        {(activeTab === 'admin-sheets' || activeTab === 'admin-worksheets' || activeTab === 'sheets') && (
          <TeamSheetsPage currentUser={currentUser} adminMode={true} />
        )}
        {activeTab === 'admin-tasks' && <TaskManagementPage />}
        {activeTab === 'admin-performance' && <PerformancePage />}
        {activeTab === 'jd-bank-tech' && <JDListPage currentUser={currentUser} adminMode={true} />}
        {activeTab === 'jd-bank-non-tech' && <JDListPage currentUser={currentUser} adminMode={true} />}
        {activeTab === 'proof-review' && <ProofReviewPage currentUser={currentUser} setActiveTab={navigate} />}
        {activeTab === 'admin-jd-bank-tech' && <JDListPage currentUser={currentUser} adminMode={true} />}
        {activeTab === 'admin-jd-bank-non-tech' && <JDListPage currentUser={currentUser} adminMode={true} />}
        {activeTab === 'admin-proof-review' && <ProofOfResponsePage currentUser={currentUser} adminReviewMode />}

        {/* Fallback if an unmatched admin tab is encountered */}
        {!['admin-users', 'admin-companies', 'admin-crm', 'admin-templates', 'admin-settings', 'admin-jd-list', 'admin-team-lead-dashboard', 'admin-sheets', 'admin-worksheets', 'sheets', 'admin-tasks', 'admin-performance', 'jd-bank-tech', 'jd-bank-non-tech', 'proof-review', 'admin-jd-bank-tech', 'admin-jd-bank-non-tech', 'admin-proof-review'].includes(activeTab) && (
          <TeamSheetsPage currentUser={currentUser} adminMode={true} />
        )}

        {/* Modals rendered inside the admin tree */}
        <AdminLoginModal
          isOpen={showAdminLoginModal}
          onClose={() => setShowAdminLoginModal(false)}
          onSuccess={handleAdminLoginSuccess}
          initialEmail={currentUser.role === 'admin' ? currentUser.email : ''}
          onCancelToEmployee={handleExitAdmin}
        />
        <SystemReportModal
          isOpen={showSystemReportModal}
          onClose={() => setShowSystemReportModal(false)}
        />
      </AdminLayout>
    );
  }

  const getTabHeading = () => {
    switch (activeTab) {
      case 'admin-sheets':
        return 'All Worksheets & PDF';
      case 'admin-team-lead-dashboard':
        return 'Team Lead Dashboard';
      case 'admin-users':
        return 'User Management';
      case 'admin-tasks':
        return 'Task Management';
      case 'admin-companies':
        return 'Company & JD Oversight';
      case 'admin-performance':
        return 'Team Performance';
      case 'admin-settings':
        return 'System Settings';
      case 'team-lead-dashboard':
        return 'Team Lead Dashboard';
      case 'team-sheets':
        return 'Team Worksheet';
      case 'dashboard':
        return 'My Dashboard';
      case 'hr-sourcing':
        return 'HR Sourcing';
      case 'pipeline':
        return 'Recruitment Pipeline';
      case 'outreach-drafts':
        return 'Outreach Drafts';
      case 'proof-of-response':
        return 'Proof of Response';
      case 'follow-ups':
        return 'Follow-ups';
      case 'jd-bank-tech':
        return 'JD Bank — Tech';
      case 'jd-bank-non-tech':
        return 'JD Bank — Non-Tech';
      case 'jd-intake':
        return 'JD Intake';
      case 'jd-list':
        return 'JD List';
      case 'admin-jd-list':
        return 'JD List & Oversight';
      case 'admin-jd-bank-tech':
        return 'JD Bank — Tech';
      case 'admin-jd-bank-non-tech':
        return 'JD Bank — Non-Tech';
      case 'admin-proof-review':
        return 'Proof Review Queue';
      case 'crm':
        return 'CRM Directory';
      case 'admin-crm':
        return 'CRM Directory & Employer Oversight';
      case 'admin-templates':
        return 'Outreach Message Templates';
      case 'tasks':
        return 'My Tasks';
      case 'performance':
        return 'My Performance';
      default:
        return activeTab.replace(/^admin-/, '').replace(/-/g, ' ');
    }
  };

  const heading = getTabHeading();

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

            {/* Admin Portal Gateway Controls - Visible in adminMode to return to Employee */}
            {adminMode && (
              <button
                onClick={handleExitAdmin}
                className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all bg-purple-900/50 hover:bg-purple-800/70 text-purple-200 border border-purple-600/50 shadow-sm"
              >
                <User className="h-3.5 w-3.5 text-purple-300" />
                <span>Exit to Employee</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
                    ? 'Founder & CEO (CEO Admin)'
                    : (currentUser.designation || (adminMode ? 'Admin Portal' : 'CRA Employee'))}
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
          {activeTab === 'jd-list' && <JDListPage currentUser={currentUser} />}
          {activeTab === 'hr-sourcing' && <HRSourcingPage onNavigateToJDIntake={() => navigate('jd-intake')} />}
          {activeTab === 'pipeline' && <PipelinePage currentUser={currentUser} />}
          {activeTab === 'outreach-drafts' && <OutreachDraftsPage currentUser={currentUser} />}
          {activeTab === 'proof-of-response' && <ProofOfResponsePage currentUser={currentUser} />}
          {activeTab === 'follow-ups' && <FollowUpsPage currentUser={currentUser} />}
          {activeTab === 'jd-bank-tech' && <JDBankPage currentUser={currentUser} defaultCategory="tech" standalone />}
          {activeTab === 'jd-bank-non-tech' && <JDBankPage currentUser={currentUser} defaultCategory="non_tech" standalone />}
          {activeTab === 'crm' && (
            <CRMListPage
              currentUser={currentUser}
              adminMode={false}
              onAddRole={(companyName) => {
                localStorage.setItem('placemein:hr-sourcing-prefill', JSON.stringify({ company: companyName, title: '' }));
                navigate('jd-intake');
              }}
            />
          )}
          {activeTab === 'admin-crm' && (
            <CRMListPage
              currentUser={currentUser}
              adminMode={true}
              onAddRole={(companyName) => {
                localStorage.setItem('placemein:hr-sourcing-prefill', JSON.stringify({ company: companyName, title: '' }));
                navigate('jd-intake');
              }}
            />
          )}
          {activeTab === 'admin-templates' && (
            <MessageTemplatesPage currentUser={currentUser} />
          )}
          {activeTab === 'admin-jd-list' && (
            <JDListPage currentUser={currentUser} adminMode={true} />
          )}
          {activeTab === 'admin-jd-bank-tech' && <JDBankPage currentUser={currentUser} defaultCategory="tech" standalone />}
          {activeTab === 'admin-jd-bank-non-tech' && <JDBankPage currentUser={currentUser} defaultCategory="non_tech" standalone />}
          {activeTab === 'admin-proof-review' && <ProofOfResponsePage currentUser={currentUser} adminReviewMode />}
          {/* Admin Oversight Views - Kept strictly inside Admin Portal */}
          {activeTab === 'admin-team-lead-dashboard' && (
            <TeamLeadDashboardPage setActiveTab={navigate} adminMode={true} />
          )}
          {activeTab === 'admin-sheets' && (
            <TeamSheetsPage currentUser={currentUser} adminMode={true} />
          )}
          {activeTab === 'admin-users' && <AdminPortalPage initialTab="users" />}
          {activeTab === 'admin-companies' && <AdminPortalPage initialTab="companies" />}
          {activeTab === 'admin-settings' && <AdminPortalPage initialTab="settings" />}
          {activeTab === 'admin-tasks' && <TaskManagementPage />}
          {activeTab === 'admin-performance' && <PerformancePage />}
        </main>
        <footer className={`border-t py-4 text-center text-xs ${adminMode ? 'bg-amber-950/50 border-amber-800/40 text-amber-200/70' : 'bg-purple-950/50 border-purple-800/40 text-purple-200/70'}`}>
          CRM © {new Date().getFullYear()} — Internal Recruitment Automation Platform
        </footer>
      </div>

      {/* Admin Login Verification Modal */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={handleAdminLoginSuccess}
        initialEmail={currentUser.role === 'admin' ? currentUser.email : ''}
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
