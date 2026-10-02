# PROMPT — Per-Employee Personal Portal: every employee gets their OWN dashboard (own leads, own JDs, own tasks, own performance)

Copy everything below this line into the AI Studio app (placemein-cra-outreach). **This task needs NO SQL — no database changes.**

---

Today every employee who logs in sees the same team-wide numbers on the Dashboard. Turn the Dashboard (and the personal pages around it) into a true **per-employee portal**: when **Charan** logs in, he sees ONLY Charan's leads, Charan's JDs, Charan's tasks and Charan's performance. When **Namitha** logs in, she sees only hers — different data for every user. Admins/CEO keep full team-wide views in the Admin Leadership Portal and Team Lead Dashboard, but their own employee-view dashboard is also personal-first, with one extra team-snapshot card.

## 0. Hard rules

- **Reuse** `isLeadOwnedByUser` from `src/utils/leadOwnership.ts` for all lead scoping. Do NOT reimplement lead matching.
- Create the matching helper for JDs (Section 1) and use it everywhere JDs are scoped.
- **These stay team-wide, do not scope them:** `CRMListPage` (CRM Directory, incl. its verified-proof eligibility rule), the entire Admin Leadership Portal (AdminLayout + all `admin-*` routes), `TeamLeadDashboardPage`, `ProofOfResponsePage` in `adminReviewMode`, the Pipeline board, and the JD Bank's underlying data pool.
- Do not touch `src/components/Sidebar.tsx`, `src/index.css`, or the admin theme files (`src/styles/adminTheme.css`, `src/components/admin/*`).
- All scoping is client-side filtering of data already fetched. The only allowed service change is read-only: if the JD fetch path does not currently return `created_by` (and ideally `creator` / `hr_contact`), extend the SELECT/row mapper so ownership matching works on real data.

## 1. New file `src/utils/jdOwnership.ts`

```ts
import { JD } from '../types';
import { isLeadOwnedByUser } from './leadOwnership';

/**
 * Personal-portal JD ownership. Matching order:
 *   1. created_by === user.id          (authoritative)
 *   2. creator name/email match        (joined creator)
 *   3. linked HR contact owned by user (JD that came from MY lead)
 */
export function jdOwnershipReason(
  jd: JD,
  user?: { id?: string; name?: string; email?: string } | null
): 'created_by' | 'creator' | 'hr_contact' | null {
  if (!user) return null;
  if (jd.created_by && user.id && jd.created_by === user.id) return 'created_by';

  const myName = (user.name || '').toLowerCase().trim();
  const myEmail = (user.email || '').toLowerCase().trim();
  const creatorName = (jd.creator?.name || '').toLowerCase().trim();
  const creatorEmail = (jd.creator?.email || '').toLowerCase().trim();
  if (myEmail && creatorEmail && creatorEmail === myEmail) return 'creator';
  if (myName && creatorName && (creatorName === myName || creatorName.includes(myName))) return 'creator';

  if (jd.hr_contact && isLeadOwnedByUser(jd.hr_contact, user)) return 'hr_contact';
  return null;
}

export function isJdOwnedByUser(
  jd: JD,
  user?: { id?: string; name?: string; email?: string } | null
): boolean {
  return jdOwnershipReason(jd, user) !== null;
}
```

## 2. `src/pages/DashboardPage.tsx` — rewrite into the per-employee portal

Keep the purple employee-portal theme and the overall structure (greeting hero, info boxes, quick actions) — but make **every number personal**. In the existing `Promise.all`, also fetch `api.getContacts()` and `api.getJDs()`. Do **not** use `api.getDashboardStats()` for personal numbers (it is team-wide) — compute from the fetched lists:

```ts
const myLeads   = contacts.filter((c) => isLeadOwnedByUser(c, currentUser));
const myJds     = jds.filter((j) => isJdOwnedByUser(j, currentUser));
const myTasks   = tasks.filter((t) => t.assignee_id === currentUser.id || t.assigned_by_id === currentUser.id);
const myResponses  = myLeads.filter((c) => c.response_status && c.response_status !== 'no_response_yet');
const myProofsPending  = myLeads.filter((c) =>
  c.proof_verified_status === 'pending' ||
  (c.response_status && c.response_status !== 'no_response_yet' && !c.proof_screenshot_url));
const myProofsVerified = myLeads.filter((c) => c.proof_verified_status === 'verified');
const myProofsRejected = myLeads.filter((c) => c.proof_verified_status === 'rejected');
const myJdsThisMonth = myJds.filter((j) => {
  const d = new Date(j.created_at); const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
});
```

**a) Greeting hero:** keep it, but title it `"{FirstName}'s Portal"` with a badge `Personal Portal` plus the user's `designation` and `emp_id` (if present on the CRA record). Sub-line: "Everything here belongs to {FirstName} — your leads, your JDs, your tasks."

**b) Personal stat cards — replace the team-wide tiles with 6 personal tiles:**
1. **My Leads** — `myLeads.length` (sub: "leads under my name")
2. **My Responses** — `myResponses.length` (sub: "{myProofsVerified.length} proofs verified")
3. **Proofs Under Review** — `myProofsPending.length` in amber (sub: "{myProofsRejected.length} rejected — must re-upload")
4. **My JDs** — `myJds.length` (sub: "{myJdsThisMonth.length} this month")
5. **My Tasks** — open tasks count (sub: "{n} due today")
6. **My Target** — progress bar `myJdsThisMonth.length / currentUser.monthly_jd_target` (emerald→gold fill; if target is 0 show "No target set").

**c) "My Leads Needing Attention" card (top 5 rows: company · HR name · status badge · days since added):** owned leads where (no response yet AND added > 2 days ago) OR proof rejected OR responded but proof still missing. Button "Open My Worksheet" → `setActiveTab('team-sheets')`.

**d) "My Follow-ups Today" card:** owned leads with status `'Follow-up'` or `responded_at` today. Empty state: "No follow-ups due today."

**e) "My Recent JDs" card:** last 5 owned JDs (company · title · eligibility badge). Button "Open JD Bank".

**f) Quick actions (existing tiles, re-scoped):** keep My Tasks / Apply for Leave / My Worksheet (rename the tile from "Team Worksheet" to "My Worksheet") / JD Intake. The "Team Lead Stats" tile is visible **only when `currentUser.role === 'admin'`**.

**g) Admin team snapshot (admins only):** one extra card strip rendered ABOVE the personal cards showing team-wide totals computed from the same full lists — team leads, team JDs this month, team pending proofs, overdue tasks — plus an "Open Team Lead Dashboard →" button. Admins still get their own personal cards below it.

## 3. `src/pages/TaskManagementPage.tsx` — "My Tasks" by default

- It already fetches the current user. Add a scope toggle at the top: **"My Tasks | All Tasks (Team)"**. Default = **My Tasks** for everyone. The "All Tasks (Team)" option renders **only for `role === 'admin'`**.
- My scope: `t.assignee_id === me.id || t.assigned_by_id === me.id`.
- Stat tiles, lists and counts reflect the active scope. Adapt if a similar filter already exists.

## 4. `src/pages/PerformancePage.tsx` — "My Performance" by default

- Same pattern: **"My Performance | Team Performance"** toggle. For non-admins the toggle is hidden — they are locked to My Performance. Admins can switch.
- **My Performance** computes from MY data via the two ownership helpers: my verified leads, my response rate, my JD target progress, my proofs approved, my tasks completed on time.
- **Team Performance** keeps whatever team metrics exist today (admins only).

## 5. JD pages (employee portal) — "My JDs" default, company pool still reachable

- In `JDBankPage` and `JDListPage` (employee-portal usage only), add a scope toggle **"My JDs | All JDs"**. Non-admins default to **My JDs** (`isJdOwnedByUser`), with the All-JDs option still available — JD Bank is a shared company pool and must not become invisible. Admins default to **All JDs**.
- Count badges and lists reflect the active scope. Do NOT change the admin-portal JD pages.

## 6. Verify (do this in Preview before reporting done)

1. `npx tsc --noEmit` clean.
2. Log in as **Charan Kumar** — `charankumar.n@placemein.com` / `Password123!`: header says "Charan's Portal"; every stat, list, task and JD shown belongs only to Charan; no teammate's company/lead/JD appears on any personal page.
3. Log in as **Namitha K** — `namitha.k@placemein.com` / `Password123!`: her numbers differ from Charan's; Charan's companies (Cyient, Sonata, Apexon, Inspira, Quickhyre) must NOT appear in her personal views.
4. Log in as CEO — `aravindreddy.l@placemein.com` / `placemein2026`: personal portal renders for him too, plus the Team Snapshot strip and the Team Lead Dashboard / All Tasks / Team Performance options; the Admin Leadership Portal remains fully team-wide.
5. Confirm CRM Directory still lists the full team-wide verified pool for everyone, and `npx vite build` passes.
