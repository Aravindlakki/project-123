# PROMPT — Give the Admin Leadership Portal its own visual theme (replay of work done so far)

Copy everything below this line into a fresh session on a vanilla copy of project-123.

---

Refactor the app so the **Admin Leadership Portal** has its own visual theme, fully separate from the CRA **Employee Portal** (which must stay 100% untouched). Do all of the following:

## 1. Create `src/styles/adminTheme.css` (new file — the single source of admin theming)

All rules must be scoped under `[data-portal='admin']` (the attribute is set only by AdminLayout, so the employee portal is never affected). Note: this project uses Tailwind v4 via `@tailwindcss/vite`; Tailwind emits utilities inside `@layer utilities`, so **unlayered** CSS rules win over utilities without `!important` — exploit this for the remap layer. Structure the file in 4 layers:

**Layer 1 — design tokens** on `[data-portal='admin']`:
- Primary (executive gold, distinct from the employee purple): `--admin-primary:#e8b339`, `--admin-primary-strong:#cf9520`, `--admin-primary-hover:#f3c356`, `--admin-primary-soft:rgba(232,179,57,.14)`, `--admin-primary-faint:rgba(232,179,57,.07)`, `--admin-primary-border:rgba(232,179,57,.38)`, `--admin-on-primary:#201604`.
- Surfaces (deep executive navy): `--admin-bg:#070c16`, `--admin-surface:#0e1524`, `--admin-surface-raised:#141d31`, `--admin-surface-sunken:#0a0f1b`, `--admin-sidebar-bg:linear-gradient(180deg,#0b1220,#070c16)`, `--admin-header-bg:rgba(7,12,22,.88)`.
- Borders `--admin-border:rgba(148,163,184,.16)` / `--admin-border-strong:rgba(148,163,184,.3)`; text `--admin-text:#eef2f8`, `--admin-text-muted:#9aa7bd`, `--admin-text-faint:#64748b`.
- Semantic status (do NOT theme away): `--admin-success:#34d399`, `--admin-warning:#fbbf24`, `--admin-danger:#fb7185`, `--admin-info:#60a5fa` (+ info-soft/info-border alphas).
- Radii (sharper "corporate" scale): `--admin-radius-sm:10px`, `--admin-radius:16px`, `--admin-radius-lg:24px`; shadows `--admin-shadow`, `--admin-shadow-pop`.

**Layer 2 — shell/layout classes:** `.admin-portal-root` (flex shell, radial gold/blue ambient background over `--admin-bg`, admin scrollbar/selection), `.admin-sidebar` (272px, fixed + slide-in on mobile, sticky ≥1024px, `.admin-sidebar-collapsed` = 86px), `.admin-sidebar-brand/-logo/-title/-subtitle/-exit`, `.admin-nav/-label/-item(.active)` (active = gold gradient), `.admin-sidebar-footer/-user/-avatar/-username/-usertitle/-logout`, `.admin-backdrop`, `.admin-body`, `.admin-topbar` (sticky, blurred) + `.admin-topbar-title` (gold pill), `.admin-db-pill.ok/.local`, `.admin-topbar-exit` (visible ≥768px), `.admin-topbar-profile/-name/-avatar`, `.admin-mobile-toggle` (hidden ≥1024px), `.admin-main` (max-width 1440px, responsive padding), `.admin-footer`, `.admin-sidebar-collapse` (**desktop-only via media query, not utilities** — an unlayered `.admin-icon-btn{display:inline-flex}` overrides `hidden lg:inline-flex`, so a plain utility approach breaks on mobile).

**Layer 3 — shared component classes:** `.admin-page-header` (+`-sub`, `-actions`, `h1`), `.admin-card[-padded]`, `.admin-btn` + `.admin-btn-{primary,secondary,ghost,danger,success}` + `.admin-btn-sm`, `.admin-icon-btn`, `.admin-label`, `.admin-input/.admin-select/.admin-textarea` (sunken bg, gold focus ring) + modifiers `.admin-select-inline`, `.admin-input-has-icon` (left padding for a search icon), `.admin-input-sm`, `.admin-table-wrap` (**`overflow-x:auto`** so wide tables scroll) / `.admin-table` (thead/tbody/hover styles), `.admin-stat[-label/-value]` + `.tone-gold/.tone-success/.tone-info/.tone-danger`, `.admin-badge-{gold,success,danger,info,neutral}`, `.admin-tabs/.admin-tab(.active)`, `.admin-modal-overlay/.admin-modal/-header/-title/-subtitle/-close/-body/-footer` (pop/fade animations `adminFade`/`adminPop`), `.admin-empty`.

**Layer 4 — utility remap layer** (re-points the Tailwind color utilities the legacy admin pages were written with onto the admin tokens, so unconverted pages still look on-theme): unlayered rules scoped `[data-portal='admin']` covering bg/border/text/placeholder/hover:/focus:/divide-/shadow- variants of **gray** (→ admin surfaces/text), **purple/violet** (→ admin primary), **amber** (→ admin primary; include at least `bg-amber-500/10-30, bg-amber-600/20, bg-amber-700, bg-amber-900/20-70, bg-amber-950/10-80`, `border-amber-400/30-900/40`, `text-amber-100, amber-200, amber-200/60-90, amber-300, amber-300/60-80, amber-400, amber-500`, `hover:bg-amber-500/800/900`, `placeholder-amber-200/300/400`, `focus:border-amber-400/500/700`, `focus:ring-amber-500`), **indigo/blue** (→ admin info for text/borders/soft bgs; solid indigo/blue buttons → primary-strong), plus compound gradients: `from-amber-600.to-amber-700`/`to-amber-500`, `from-purple-600.to-indigo-600`, `from-indigo-600.to-indigo-700` (→ gold gradient buttons), `from-purple-900/90.via-purple-950/95.to-gray-950`, `from-amber-900/80.via-amber-950/90.to-gray-950` (→ gold-tinted banner gradient), `from-amber-950/70.via-gray-950.to-purple-950/50`, `from-blue-950/70.via-indigo-950/50.to-purple-950/70`, `from-blue-500.via-indigo-500.to-purple-500`, `from-purple-600.via-violet-500.to-indigo-400`, `from-gray-950.via-amber-950/20.to-gray-950` (→ admin ambient bg), `from-blue-500/20.to-purple-500/20`. **Leave emerald/rose/red/teal/sky untouched** (semantic status/link colors).

## 2. Create `src/components/admin/ui.tsx` (new file — shared admin component kit)

All styled exclusively with the classes above: `AdminPageHeader` (badge/title/subtitle/icon/actions), `AdminCard` (props `padded`, `className`), `AdminButton` (variant primary/secondary/ghost/danger/success, size sm/md, default `type="button"`, spreads rest), `AdminIconButton` (`label` → title+aria-label), `AdminLabel`, `AdminInput`, `AdminSelect`, `AdminTextarea`, `AdminModal` (isOpen/onClose/title/subtitle/icon/children/footer/maxWidth rem default 36/closeOnOverlay default true; owns its own X close button, overlay click closes), `AdminBadge` (tone), `AdminStatCard` (label/value/tone/className), `AdminTable` (renders `.admin-table-wrap > table.admin-table`), `AdminEmptyState` (icon/title/message).

## 3. Create `src/components/admin/AdminLayout.tsx` (new file — the ONE admin shell)

Root renders `<div data-portal="admin" className="admin-portal-root">`. Props: `activeTab, onNavigate, currentUser, onLogout, onExitAdmin, children`.
- **Sidebar:** gold ShieldCheck logo + "CRM" / "Admin Leadership Portal"; desktop-only collapse toggle using class `admin-icon-btn admin-sidebar-collapse ml-auto` (NOT `hidden lg:inline-flex` — see CSS note above); "Exit to Employee View" button → `onExitAdmin`; nav with the 10 admin menu entries (`admin-users`, `admin-companies`, `admin-settings`, `admin-jd-list`, `admin-jd-bank-tech`, `admin-jd-bank-non-tech`, `admin-team-lead-dashboard`, `admin-sheets`, `admin-tasks`, `admin-performance` — the proof-review route is reachable but intentionally has no sidebar item); footer with current user name/designation + logout.
- **Topbar (sticky):** mobile hamburger → slide-in sidebar with backdrop; gold pill showing the current page heading (map including `admin-proof-review`); DB status pill using `isSupabaseConfigured` from `../services/supabase` (green "Supabase" / amber "Local"); Exit to Employee; profile button that navigates to `admin-performance`.
- **Content:** `<main className="admin-main">{children}</main>` + `.admin-footer`.
- State: `collapsed`, `mobileOpen`.

## 4. Modify `src/App.tsx` (wiring — do not touch the employee branch)

- Add imports: `import { AdminLayout } from './components/admin/AdminLayout';` and `import './styles/adminTheme.css';` (only place the theme is loaded).
- `adminMode = activeTab.startsWith('admin-') && isAdminVerified && currentUser?.role === 'admin'` already exists; after `const heading = getTabHeading();` add an **early return** when `adminMode`:

```tsx
if (adminMode) {
  return (
    <>
      <AdminLayout activeTab={activeTab} onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout} onExitAdmin={handleExitAdmin}>
        {activeTab === 'admin-jd-list' && <JDListPage currentUser={currentUser} adminMode={true} />}
        {activeTab === 'admin-jd-bank-tech' && <JDBankPage currentUser={currentUser} defaultCategory="tech" standalone />}
        {activeTab === 'admin-jd-bank-non-tech' && <JDBankPage currentUser={currentUser} defaultCategory="non_tech" standalone />}
        {activeTab === 'admin-proof-review' && <ProofOfResponsePage currentUser={currentUser} adminReviewMode />}
        {activeTab === 'admin-team-lead-dashboard' && <TeamLeadDashboardPage setActiveTab={navigate} adminMode={true} />}
        {activeTab === 'admin-sheets' && <TeamSheetsPage currentUser={currentUser} adminMode={true} />}
        {activeTab === 'admin-users' && <AdminPortalPage initialTab="users" />}
        {activeTab === 'admin-companies' && <AdminPortalPage initialTab="companies" />}
        {activeTab === 'admin-settings' && <AdminPortalPage initialTab="settings" />}
        {activeTab === 'admin-tasks' && <TaskManagementPage />}
        {activeTab === 'admin-performance' && <PerformancePage />}
      </AdminLayout>
      <AdminLoginModal isOpen={showAdminLoginModal} onClose={() => setShowAdminLoginModal(false)} onSuccess={handleAdminLoginSuccess} initialEmail={currentUser.role === 'admin' ? currentUser.email : ''} onCancelToEmployee={handleExitAdmin} />
      <SystemReportModal isOpen={showSystemReportModal} onClose={() => setShowSystemReportModal(false)} />
    </>
  );
}
```

(Adapt prop names to the actual codebase.) The pre-login admin gate (`AdminLoginModal`) staying outside AdminLayout with its old amber styling is acceptable. Employee branch, `Sidebar.tsx`, and `src/index.css` must remain byte-identical.

## 5. Convert `src/pages/AdminPortalPage.tsx` to the shared kit

- Import `AdminPageHeader, AdminCard, AdminButton, AdminIconButton, AdminModal, AdminLabel, AdminInput, AdminSelect, AdminStatCard, AdminTable, AdminEmptyState` from `../components/admin/ui`.
- Header banner → `AdminPageHeader` (gold badge "Administrative Governance", actions: Add Team Member `AdminButton` + refresh `AdminIconButton`).
- Tab row → `.admin-tabs` / `.admin-tab(.active)`.
- Roster banner → `AdminCard`; its 5 metric tiles → `AdminStatCard` (tones gold/info/success).
- Users loading state → `.admin-empty`; users table wrapper + raw `<table>` → `AdminTable` (delete custom thead styling; keep all columns/logic).
- Filter bar: status `<select>` → `admin-select admin-select-inline`; search input → `admin-input admin-input-has-icon`; Add Team Member → `.admin-btn .admin-btn-primary`.
- JD oversight tab: the 5 hand-styled section containers (`rounded-3xl bg-amber-950/30 border-amber-800/40 shadow-xl`) → `AdminCard className="space-y-… p-6"`; "Admin Review & Decision" button → `admin-btn admin-btn-primary admin-btn-sm`; empty JD list → `AdminEmptyState`.
- Merge tool: both company selects → `admin-select`; Merge button → `AdminButton type="submit" className="w-full"`.
- Settings tab: number inputs → `admin-input`; Update Benchmark / Update Snooze buttons → `AdminButton`; form labels → `admin-label`.
- Create-user modal: all labels → `admin-label`, all inputs → `admin-input`, selects → `admin-select`.
- All 4 modals (merge confirm, create user, soft-delete, JD review) → `AdminModal` (maxWidth 28/32/28/42) with `AdminButton` ghost/danger/primary footers; JD review modal's inputs/selects/textarea (eligibility notes, interview status/datetime/round/link, HR feedback status/date/notes) → `admin-input` (their old classes `border-indigo-700/60`/`border-amber-700/60` with `focus:border-indigo-400`/`focus:border-amber-400` have NO remap coverage and look off-theme).
- Keep semantic emerald/rose/red feedback colors (success/error banner, status badges) as-is.

## 6. Rules & verification

- Do NOT modify the employee portal theme: `src/components/Sidebar.tsx`, `src/index.css`, and the employee branch of `App.tsx` stay untouched.
- New admin pages must render only via tokens/shared components; old pages are acceptable if visually themed by the remap layer while inside AdminLayout.
- Then verify: `cd project-123 && npx tsc --noEmit` clean; `npx vite build` passes; open every admin route (`/#/admin/users`, `/admin/companies`, `/admin/settings`, `/admin/worksheets`, `/admin/jd-list`, `/admin/jd-bank/tech`, `/admin/jd-bank/non-tech`, `/admin/pipeline/proofs`, `/admin/team-lead-dashboard`, `/admin/tasks`, `/admin/performance`) and confirm each shows the gold sidebar/topbar AdminLayout shell; then confirm `/#/dashboard` and `/#/crm` still render the original purple employee theme, unchanged. Admin login for testing: `aravindreddy.l@placemein.com` / `placemein2026`.
