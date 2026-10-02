import React, { useState } from 'react';
import {
  LayoutDashboard,
  UserCog,
  FileSpreadsheet,
  Cpu,
  Layers,
  Briefcase,
  CheckSquare,
  Building2,
  Award,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Database,
  User,
  ShieldCheck,
} from 'lucide-react';
import { CRA } from '../../types';
import { isSupabaseConfigured } from '../../services/supabase';

interface AdminLayoutProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  currentUser: CRA | null;
  onLogout: () => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
}

/* Admin navigation — mirrors the admin section of the CRM menu. */
const ADMIN_NAV_ITEMS: Array<{ id: string; label: string; icon: React.ElementType }> = [
  { id: 'admin-team-lead-dashboard', label: 'Team Lead Dashboard', icon: LayoutDashboard },
  { id: 'admin-users', label: 'User Management', icon: UserCog },
  { id: 'admin-sheets', label: 'All Worksheets & PDF', icon: FileSpreadsheet },
  { id: 'admin-jd-bank-tech', label: 'JD Bank — Tech', icon: Cpu },
  { id: 'admin-jd-bank-non-tech', label: 'JD Bank — Non-Tech', icon: Layers },
  { id: 'admin-jd-list', label: 'JD List & Tracking', icon: Briefcase },
  { id: 'admin-tasks', label: 'Task Management', icon: CheckSquare },
  { id: 'admin-companies', label: 'Company & JD Oversight', icon: Building2 },
  { id: 'admin-performance', label: 'Team Performance', icon: Award },
  { id: 'admin-settings', label: 'System Settings', icon: Settings },
];

const ADMIN_HEADING: Record<string, string> = {
  'admin-users': 'User Management',
  'admin-companies': 'Company & JD Oversight',
  'admin-settings': 'System Settings',
  'admin-sheets': 'All Worksheets & PDF',
  'admin-jd-list': 'JD List & Tracking',
  'admin-jd-bank-tech': 'JD Bank — Tech',
  'admin-jd-bank-non-tech': 'JD Bank — Non-Tech',
  'admin-proof-review': 'Proof Review Queue',
  'admin-team-lead-dashboard': 'Team Lead Dashboard',
  'admin-tasks': 'Task Management',
  'admin-performance': 'Team Performance',
};

/**
 * Single layout shell for the entire Admin Leadership Portal.
 * Applies the admin theme scope (data-portal="admin") and renders the admin
 * sidebar, topbar, content area and footer. Every admin route is rendered
 * as a child of this component (see App.tsx).
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onNavigate,
  currentUser,
  onLogout,
  onExitAdmin,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const heading = ADMIN_HEADING[activeTab] || 'Admin Leadership Portal';

  const handleNav = (id: string) => {
    setMobileOpen(false);
    onNavigate(id);
  };

  return (
    <div data-portal="admin" className="admin-portal-root">
      {mobileOpen && <div className="admin-backdrop" onClick={() => setMobileOpen(false)} />}

      {/* ---------------------------------------------- Admin sidebar */}
      <aside
        className={`admin-sidebar ${collapsed ? 'admin-sidebar-collapsed' : ''} ${
          mobileOpen ? 'admin-sidebar-open' : ''
        }`}
      >
        <div>
          <div className="admin-sidebar-brand">
            <button
              type="button"
              onClick={() => handleNav('admin-users')}
              className="flex items-center gap-3 text-left overflow-hidden min-w-0"
              title="Admin Leadership Portal"
            >
              <span className="admin-sidebar-logo">
                <ShieldCheck className="h-5 w-5" />
              </span>
              {!collapsed && (
                <span className="min-w-0">
                  <span className="admin-sidebar-title block">CRM</span>
                  <span className="admin-sidebar-subtitle block">Admin Leadership Portal</span>
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="admin-icon-btn admin-sidebar-collapse ml-auto"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          <button type="button" onClick={onExitAdmin} className="admin-sidebar-exit" title="Exit to Employee View">
            <User className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span>Exit to Employee View</span>}
          </button>

          <nav className="admin-nav">
            {!collapsed && <p className="admin-nav-label">Administration Oversight</p>}
            {ADMIN_NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = id === activeTab;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleNav(id)}
                  title={collapsed ? label : undefined}
                  className={`admin-nav-item ${active ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          {currentUser && !collapsed && (
            <div className="admin-sidebar-user">
              <span className="admin-sidebar-avatar">
                <User className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="admin-sidebar-username block">{currentUser.name}</span>
                <span className="admin-sidebar-usertitle block">
                  {currentUser.designation || (currentUser.role === 'admin' ? 'Administrator' : 'CRA Employee')}
                </span>
              </span>
            </div>
          )}
          <button type="button" onClick={onLogout} className="admin-sidebar-logout" title="Log out">
            <LogOut className="h-4 w-4" />
            {!collapsed && 'Log out'}
          </button>
        </div>
      </aside>

      {/* -------------------------------------------- Body: topbar + main */}
      <div className="admin-body">
        <header className="admin-topbar">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="admin-mobile-toggle"
              aria-label="Open navigation menu"
              title="Open Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="admin-topbar-title">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{heading}</span>
            </span>
            <div
              className={`admin-db-pill ${isSupabaseConfigured ? 'ok' : 'local'}`}
              title={
                isSupabaseConfigured
                  ? 'Supabase Cloud Database connected and operational.'
                  : 'Supabase credentials are not set. App is running in LocalStorage mode.'
              }
            >
              <Database className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{isSupabaseConfigured ? 'Supabase' : 'Local DB'}</span>
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{
                  background: isSupabaseConfigured ? 'var(--admin-success)' : 'var(--admin-warning)',
                  boxShadow: '0 0 8px rgba(255, 255, 255, 0.25)',
                }}
                aria-label={isSupabaseConfigured ? 'Database Connected' : 'Database Offline/Local'}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button type="button" onClick={onExitAdmin} className="admin-topbar-exit">
              <User className="h-3.5 w-3.5" />
              <span>Exit to Employee</span>
            </button>
            <button
              type="button"
              onClick={() => handleNav('admin-performance')}
              className="admin-topbar-profile"
              aria-label="User Profile"
              title="My Profile"
            >
              <span className="admin-topbar-profile-name">
                <b className="block text-xs" style={{ color: 'var(--admin-text)' }}>
                  {currentUser?.name}
                </b>
                <span className="block text-[11px] font-medium" style={{ color: 'var(--admin-primary)' }}>
                  {currentUser?.designation || 'Administrator'}
                </span>
              </span>
              <span className="admin-topbar-avatar">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </button>
          </div>
        </header>

        <main className="admin-main">{children}</main>

        <footer className="admin-footer">
          CRM — Admin Leadership Portal © {new Date().getFullYear()} · Internal Recruitment Automation Platform
        </footer>
      </div>
    </div>
  );
};
