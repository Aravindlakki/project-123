import React, { useState } from 'react';
import {
  LayoutDashboard,
  UserCog,
  FileSpreadsheet,
  Briefcase,
  CheckSquare,
  Building2,
  Award,
  Settings,
  Cpu,
  Layers,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  ShieldCheck,
  Database,
  Menu,
} from 'lucide-react';
import { CRA } from '../../types';
import { isSupabaseConfigured } from '../../services/supabase';

export interface AdminNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { id: 'admin-team-lead-dashboard', label: 'Team Lead Dashboard', icon: LayoutDashboard },
  { id: 'admin-users', label: 'User Management', icon: UserCog },
  { id: 'admin-sheets', label: 'All Worksheets & PDF', icon: FileSpreadsheet },
  { id: 'proof-review', label: 'Proof Review & Verification', icon: ShieldCheck, tag: 'Verify' },
  { id: 'admin-jd-list', label: 'JD List & Tracking', icon: Briefcase },
  { id: 'admin-tasks', label: 'Task Management', icon: CheckSquare },
  { id: 'admin-companies', label: 'Company & JD Oversight', icon: Building2 },
  { id: 'admin-performance', label: 'Team Performance', icon: Award },
  { id: 'admin-settings', label: 'System Settings', icon: Settings },
  { id: 'jd-bank-tech', label: 'JD Bank — Tech', icon: Cpu, tag: 'Bank' },
  { id: 'jd-bank-non-tech', label: 'JD Bank — Non-Tech', icon: Layers, tag: 'Bank' },
];

export interface AdminLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: CRA | null;
  onLogout: () => void;
  onSwitchToEmployee: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onSwitchToEmployee,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const getHeading = (): string => {
    const item = ADMIN_NAV_ITEMS.find((n) => n.id === activeTab);
    if (item) return item.label;
    switch (activeTab) {
      case 'admin-users':
        return 'User Management';
      case 'admin-sheets':
        return 'All Worksheets & PDF';
      case 'proof-review':
        return 'Proof Review & Verification';
      case 'admin-jd-list':
        return 'JD List & Tracking';
      case 'admin-team-lead-dashboard':
        return 'Team Lead Dashboard';
      case 'admin-tasks':
        return 'Task Management';
      case 'admin-companies':
        return 'Company & JD Oversight';
      case 'admin-performance':
        return 'Team Performance';
      case 'admin-settings':
        return 'System Settings';
      case 'jd-bank-tech':
        return 'JD Bank — Tech';
      case 'jd-bank-non-tech':
        return 'JD Bank — Non-Tech';
      default:
        return activeTab.replace(/^admin-/, '').replace(/-/g, ' ');
    }
  };

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const isAravind =
    currentUser?.email?.toLowerCase().includes('aravind') ||
    currentUser?.name?.toLowerCase().includes('aravind');

  return (
    <div data-portal="admin" className="admin-shell">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="admin-backdrop lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${
          mobileOpen ? 'translate-x-0 fixed inset-y-0 left-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-700/30 flex items-center justify-between">
          <button
            onClick={() => handleNavClick('admin-users')}
            className="flex items-center space-x-3 text-left overflow-hidden group cursor-pointer"
          >
            <div className="bg-gradient-to-br from-[#e8b339] to-[#d69e26] p-2 rounded-2xl shrink-0 shadow-lg shadow-[#e8b339]/20 flex items-center justify-center">
              <img
                src="/placemein-logo.png"
                alt="CRM"
                className="h-7 w-7 object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.endsWith('placemein-symbol.svg')) {
                    target.src = '/placemein-symbol.svg';
                  }
                }}
              />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="text-base font-black text-white block tracking-tight group-hover:text-[#e8b339] transition">
                  CRM
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#e8b339]">
                  Leadership Portal
                </span>
              </div>
            )}
          </button>

          <div className="flex items-center gap-1">
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="admin-sidebar-collapse p-1.5 rounded-xl border border-slate-700/50 bg-[#141d31] text-slate-400 hover:text-[#e8b339] hover:border-[#e8b339]/40 transition cursor-pointer"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Navigation"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#e8b339] to-[#d69e26] text-[#070c16] shadow-md shadow-[#e8b339]/20 font-black'
                    : 'text-slate-300 hover:bg-[#141d31] hover:text-white border border-transparent'
                }`}
              >
                <span
                  className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#070c16]/20 text-[#070c16]'
                      : 'bg-slate-800/60 text-slate-400 group-hover:text-[#e8b339] group-hover:bg-[#e8b339]/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {!collapsed && (
                  <span className="truncate flex-1 flex items-center justify-between">
                    <span>{item.label}</span>
                    {item.tag && (
                      <span
                        className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono ${
                          isActive
                            ? 'bg-[#070c16]/30 text-[#070c16]'
                            : 'bg-[#e8b339]/15 text-[#e8b339] border border-[#e8b339]/30'
                        }`}
                      >
                        {item.tag}
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-slate-700/30 space-y-2 bg-[#070c16]/60">
          {/* Switch to Employee Portal */}
          <button
            onClick={onSwitchToEmployee}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-[#141d31]/80 hover:bg-[#141d31] border border-slate-700/50 hover:border-slate-500/50 transition cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Exit to Employee Portal"
          >
            <User className="h-4 w-4 text-[#e8b339] shrink-0" />
            {!collapsed && <span>Exit to Employee</span>}
          </button>

          {/* User Status / Logout */}
          <div
            className={`flex items-center justify-between p-2 rounded-xl bg-[#0a0f1b] border border-slate-800 ${
              collapsed ? 'flex-col gap-2' : ''
            }`}
          >
            <div className={`flex items-center gap-2 min-w-0 ${collapsed ? 'justify-center' : ''}`}>
              <div className="p-1.5 rounded-lg bg-[#e8b339]/15 text-[#e8b339] border border-[#e8b339]/30 shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {isAravind ? 'Aravind Reddy' : currentUser?.name || 'Administrator'}
                  </p>
                  <p className="text-[10px] text-[#e8b339] truncate font-medium">
                    {isAravind ? 'Founder & CEO' : 'Admin'}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer shrink-0"
              title="Log out of CRM"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Sticky Topbar */}
        <header className="admin-topbar">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger button for mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Heading Pill */}
            <span className="admin-badge admin-badge-gold">
              <ShieldCheck className="h-3.5 w-3.5 text-[#e8b339]" />
              <span className="truncate max-w-[150px] sm:max-w-none">
                Admin · {getHeading()}
              </span>
            </span>

            {/* Live Database Status Pill */}
            <div
              className={`admin-db-pill ${!isSupabaseConfigured ? 'local' : ''}`}
              title={
                isSupabaseConfigured
                  ? 'Supabase Cloud Database connected and operational.'
                  : 'Supabase credentials are not set. App is running in LocalStorage mode.'
              }
            >
              <Database className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">
                {isSupabaseConfigured ? 'Supabase' : 'Local DB'}
              </span>
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  isSupabaseConfigured
                    ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                    : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                }`}
                aria-label={isSupabaseConfigured ? 'Database Connected' : 'Database Offline/Local'}
              />
            </div>

            {/* Exit to Employee Button (Desktop) */}
            <button
              onClick={onSwitchToEmployee}
              className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all bg-[#141d31] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow-sm cursor-pointer"
            >
              <User className="h-3.5 w-3.5 text-[#e8b339]" />
              <span>Exit to Employee</span>
            </button>
          </div>

          {/* Profile Header */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('admin-performance')}
              className="flex items-center gap-2 text-xs text-right min-h-[44px] p-1.5 rounded-xl hover:bg-white/5 transition cursor-pointer"
              aria-label="Admin User Profile"
            >
              <span className="hidden md:block">
                <b className="text-white">
                  {isAravind ? 'Aravind Reddy' : currentUser?.name || 'Administrator'}
                </b>
                <br />
                <span className="text-[#e8b339] font-medium text-[11px]">
                  {isAravind ? 'Founder & CEO' : 'Admin Portal'}
                </span>
              </span>
              <span className="p-2 rounded-xl shrink-0 bg-gradient-to-br from-[#e8b339] to-[#d69e26] text-[#070c16] shadow-sm font-black">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </button>
          </div>
        </header>

        {/* Page Container */}
        <main className="admin-main">{children}</main>

        {/* Footer */}
        <footer className="admin-footer">
          CRM © {new Date().getFullYear()} — Internal Recruitment Automation CRM
        </footer>
      </div>
    </div>
  );
};
