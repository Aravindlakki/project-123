# PROMPT — My Worksheet: Response tracking + mandatory Proof-of-Response with Admin verification

Copy everything below this line into the AI Studio app (placemein-cra-outreach). This converts the shared Team Worksheet into a per-user "My Worksheet" where every HR response must be backed by a screenshot proof that an Admin verifies before the lead counts.

---

Implement the following feature exactly. It touches the worksheet page, types, services, server, and the Supabase `contacts` table.

## 1. Database — run these two SQL scripts in the Supabase SQL Editor (idempotent)

**Script 1 — response fields:**

```sql
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS response_status text NOT NULL DEFAULT 'no_response_yet';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS response_note text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS responded_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contacts_response_status_check') THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_response_status_check
      CHECK (response_status IN ('no_response_yet','replied_interested','replied_asked_jd','replied_not_interested','call_scheduled','wrong_contact'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contacts_response_status ON public.contacts (response_status);
```

**Script 2 — proof verification fields:**

```sql
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS proof_channel TEXT CHECK (proof_channel IN ('called','messaged','mailed')),
  ADD COLUMN IF NOT EXISTS proof_verified_status TEXT DEFAULT 'pending' CHECK (proof_verified_status IN ('pending','verified','rejected')),
  ADD COLUMN IF NOT EXISTS proof_verified_by UUID REFERENCES public.cras(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS proof_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proof_admin_notes TEXT;

UPDATE contacts SET proof_verified_status = 'pending'
WHERE proof_screenshot_url IS NOT NULL AND proof_screenshot_url <> '' AND proof_verified_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_proof_pending ON contacts (proof_verified_status) WHERE proof_verified_status = 'pending';
```

## 2. Types — `src/types/index.ts`

Add:

```ts
export type LeadResponseStatus =
  | 'no_response_yet'
  | 'replied_interested'
  | 'replied_asked_jd'
  | 'replied_not_interested'
  | 'call_scheduled'
  | 'wrong_contact';
```

On the `HRContact` interface add:

```ts
  // My Worksheet response tracking
  response_status?: LeadResponseStatus;
  response_note?: string;
  responded_at?: string;
  // Proof of contact — mandatory when a response is logged. Goes to Admin for verification.
  proof_channel?: 'called' | 'messaged' | 'mailed';
  proof_verified_status?: 'pending' | 'verified' | 'rejected';
  proof_verified_by?: string;
  proof_verified_at?: string;
  proof_admin_notes?: string;
```

## 3. New file `src/constants/worksheet.ts`

Single source of truth for response options + badges:

```ts
import { LeadResponseStatus } from '../types';

export const RESPONSE_OPTIONS: Array<{ value: LeadResponseStatus; label: string; shortLabel: string }> = [
  { value: 'no_response_yet', label: 'No response yet', shortLabel: 'No response' },
  { value: 'replied_interested', label: 'Replied - interested', shortLabel: 'Interested' },
  { value: 'replied_asked_jd', label: 'Replied - asked for JD/details', shortLabel: 'Asked for JD' },
  { value: 'replied_not_interested', label: 'Replied - not interested', shortLabel: 'Not interested' },
  { value: 'call_scheduled', label: 'Call/meeting scheduled', shortLabel: 'Call scheduled' },
  { value: 'wrong_contact', label: 'Wrong contact/bounced', shortLabel: 'Wrong contact' },
];

export const RESPONDED_VALUES: LeadResponseStatus[] = RESPONSE_OPTIONS.filter((o) => o.value !== 'no_response_yet').map((o) => o.value);

export function responseLabel(value?: LeadResponseStatus | string | null): string {
  if (!value) return RESPONSE_OPTIONS[0].label;
  return RESPONSE_OPTIONS.find((o) => o.value === value)?.label || RESPONSE_OPTIONS[0].label;
}

export function responseShortLabel(value?: LeadResponseStatus | string | null): string {
  if (!value) return RESPONSE_OPTIONS[0].shortLabel;
  return RESPONSE_OPTIONS.find((o) => o.value === value)?.shortLabel || RESPONSE_OPTIONS[0].shortLabel;
}

export function isResponseStatus(value?: string | null): value is LeadResponseStatus {
  return RESPONSE_OPTIONS.some((o) => o.value === value);
}

export function responseBadgeClass(value?: LeadResponseStatus | string | null): string {
  switch (value) {
    case 'replied_interested': return 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40';
    case 'replied_asked_jd': return 'bg-sky-950/80 text-sky-300 border-sky-600/40';
    case 'replied_not_interested': return 'bg-rose-950/80 text-rose-300 border-rose-600/40';
    case 'call_scheduled': return 'bg-indigo-950/80 text-indigo-300 border-indigo-600/40';
    case 'wrong_contact': return 'bg-gray-800 text-gray-400 border-gray-600/40';
    default: return 'bg-gray-800/60 text-gray-500 border-gray-700/60';
  }
}
```

## 4. New file `src/utils/leadOwnership.ts`

```ts
import { HRContact } from '../types';

/** My Worksheet is scoped to the logged-in user for EVERYONE, including admins. */
export function leadOwnershipReason(lead: HRContact, user?: { id?: string; name?: string } | null): 'created_by' | 'entered_by' | 'spoc' | null {
  if (!user) return null;
  const myName = (user.name || '').toLowerCase().trim();
  const myFirst = myName.split(' ')[0] || '';
  if (lead.created_by && user.id && lead.created_by === user.id) return 'created_by';
  const enteredBy = (lead.entered_by_name || '').toLowerCase();
  if (myName && enteredBy && enteredBy.includes(myName)) return 'entered_by';
  const spoc = (lead.spoc || '').toLowerCase().trim();
  if (myFirst && spoc && spoc === myFirst) return 'spoc';
  return null;
}

export function isLeadOwnedByUser(lead: HRContact, user?: { id?: string; name?: string } | null): boolean {
  return leadOwnershipReason(lead, user) !== null;
}

/** Strip import-source suffixes like "Namitha (Excel Import)" -> "Namitha". */
export function cleanUploaderName(name?: string | null): string {
  if (!name || !name.trim()) return '';
  return name.replace(/\s*\((HTML|PDF|Excel|CSV)[^)]*\)/i, '').trim();
}
```

## 5. New file `src/utils/leadDuplicates.ts`

Warn (do not block) when a teammate already added the same company+role:

```ts
import { HRContact } from '../types';

export interface DuplicateWarning { lead: HRContact; uploaderName: string; dateKey: string; dateLabel: string; }

function normalizeText(value?: string | null): string {
  return (value || '')
    .toLowerCase()
    .replace(/\b(pvt|private|ltd|limited|llp|inc|technologies|technology|solutions?|services?|software|systems?)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function findDuplicateLead(
  allLeads: HRContact[],
  input: { company_name?: string; role_title?: string; hr_name?: string; title?: string },
  excludeLeadId?: string
): DuplicateWarning | null {
  const company = normalizeText(input.company_name);
  if (!company) return null;
  const role = normalizeText(input.role_title || input.hr_name || input.title || '');
  const match =
    allLeads.find((l) => {
      if (excludeLeadId && l.id === excludeLeadId) return false;
      const leadCompany = normalizeText(l.company?.name || '');
      if (!leadCompany || leadCompany !== company) return false;
      if (role) {
        const leadRole = normalizeText(l.role_title || l.title || '');
        if (leadRole && leadRole === role) return true;
      }
      const leadHr = normalizeText(l.name || '');
      if (!role && input.hr_name && leadHr && leadHr === normalizeText(input.hr_name)) return true;
      return false;
    }) || null;
  if (!match) return null;

  const uploader = (match.entered_by_name || '').trim() || (match.spoc || '').trim() || 'a teammate';
  const created = match.created_at ? new Date(match.created_at) : null;
  const dateLabel = created
    ? created.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
    : 'an earlier date';

  return {
    lead: match,
    uploaderName: uploader.replace(/\s*\((HTML|PDF|Excel|CSV)[^)]*\)/i, '').trim() || uploader,
    dateKey: created ? created.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : '',
    dateLabel,
  };
}

export function duplicateWarningMessage(w: DuplicateWarning): string {
  return `Already added by ${w.uploaderName} on ${w.dateLabel}. Check the CRM Directory before adding again.`;
}
```

## 6. `src/components/TeamSheetsPage.tsx` — the main conversion

Do ALL of the following:

**a) Scoping ("Team Worksheet" → "My Worksheet"):** keep fetching the full team contact list into a `useRef<HRContact[]>` (`allContactsRef`) for duplicate warnings only, then filter displayed leads with `isLeadOwnedByUser(lead, currentUser)`. Apply the same filter to the client-fallback-store path in the catch block. Re-fetch on `currentUser?.id` change. REMOVE entirely: the "All team | Only me" toggle, the member-dropdown filter, the uploader search match, the "Uploaded By" table column, the "HR Role" table column, the "HR Designation" field in the add-lead modal and HR Sourcing drawer, and the `uniqueUploaders` memo. Update headings: badge "My Worksheet · My Leads" (admin: "Admin Portal · My Worksheet"), title "My Worksheet & HR Sourcing", stat subtext "In my daily sheets (this view)", search placeholder "Search company, HR name, phone, email...". In the edit-lead modal, relabel the "HR Role / Title" field to "HR LinkedIn URL" bound to the linkedin value.

**b) Response column:** add state `const [responseEditId, setResponseEditId] = useState<string | null>(null);`. Add a "Response" table column between LinkedIn and Proof: clicking a badge opens an inline `<select>` of `RESPONSE_OPTIONS` that calls `handleSetResponse(lead, value)`; show `responded_at` (IST) under the badge. Implement:

```ts
const handleSetResponse = async (lead: HRContact, value: LeadResponseStatus, note?: string) => {
  const isResponded = value !== 'no_response_yet';
  // PROOF RULE: any responded value requires a screenshot proof (call/msg/mail)
  if (isResponded && !(lead.proof_screenshot_url && lead.proof_verified_status !== 'rejected')) {
    setProofModalLead(lead); setProofModalResponse(value);
    setProofChannel(lead.proof_channel || 'mailed'); setProofFile(null); setProofPreview(null);
    return;
  }
  const updates: Partial<HRContact> = {
    response_status: value,
    response_note: note !== undefined ? note : lead.response_note,
    responded_at: isResponded ? (lead.responded_at || new Date().toISOString()) : null,
  };
  try {
    await api.updateContact(lead.id, updates);
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, ...updates } : l)));
    showToast(isResponded ? `Response saved: ${responseShortLabel(value)}` : 'Response reset to "No response yet"');
  } catch (err: any) { showToast(err.message || 'Failed to save response', 'error'); }
};
```

**c) Proof upload flow:** states `proofModalLead`, `proofModalResponse`, `proofChannel ('called'|'messaged'|'mailed')`, `proofFile`, `proofPreview`, `isSavingProof`, `proofPreviewFull`. When a responded value is picked without valid proof, open a fixed-overlay modal: channel picker (📞 Called / 💬 Messaged / ✉️ Mailed), file input (`accept="image/*"`, reject > 3.5 MB with toast), image preview (click → full-screen preview), amber note "This proof goes to Admin for verification. The lead only counts once Admin approves it.", Cancel + "Upload & Send to Admin" buttons. On save: `uploadLeadProof(lead, { channel, screenshotUrl: base64DataUrl })` which writes `proof_channel`, `proof_screenshot_url`, `proof_screenshot_uploaded_at: new Date().toISOString()`, `proof_verified_status: 'pending'`, clears `proof_verified_by/at/admin_notes` via `api.updateContact`, then immediately saves the pending `response_status` + `responded_at`. Add a full-screen proof preview overlay (z-[80]).

**d) Verification column ("Eligible / Under Review / Not Eligible"):** helper

```ts
const getProofReviewState = (lead: HRContact): 'none' | 'pending' | 'verified' | 'rejected' => {
  if (!lead.proof_screenshot_url) return 'none';
  return lead.proof_verified_status || 'pending';
};
```

Column after Proof: verified → emerald "Eligible" badge (CheckCircle2, tooltip "Admin verified this proof — lead is eligible and flows to CRM Directory"); rejected → rose "Not Eligible" (X); pending → amber "Under Review" (Clock); none → "—" or "Proof Needed" when a response is claimed.

**e) Admin review:** state `reviewModalLead` + `reviewNotes`. Clicking the proof thumbnail opens `ProofReviewModal` for admins (otherwise opens the full preview). Implement:

```ts
const reviewLeadProof = async (leadId: string, decision: 'verified' | 'rejected', adminNotes?: string, reviewerName?: string) => {
  const updates: Partial<HRContact> = {
    proof_verified_status: decision,
    proof_verified_by: reviewerName,
    proof_verified_at: new Date().toISOString(),
    proof_admin_notes: adminNotes,
    ...(decision === 'rejected' ? { response_status: 'no_response_yet' as LeadResponseStatus, responded_at: null } : {}),
  };
  await api.updateContact(leadId, updates);
  setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, ...updates } : l)));
};
```

Toast on decision: verified → "Proof verified — lead now counts" (success); rejected → "Proof rejected — response reset to No response yet" (error). Above the sheet, show an amber admin alert banner when any visible lead has `proof_verified_status === 'pending'` (count + "Admin action needed" chip).

**f) Response filter:** add a Response `<select>` next to the Domain filter using `RESPONSE_OPTIONS`; filter `(lead.response_status || 'no_response_yet') !== selectedResponse`; include in the Reset-filters button.

**g) Table polish:** make the Company Name column sticky-left (`sticky left-0 z-10 bg-gray-900 border-r border-gray-800` on th/td, `min-w-[150px]`), tighten cell padding to `py-2 px-2.5`, rename headers ("Date (IST)", "Email", "LinkedIn", "Response", "Proof", "Verification").

**h) CSV export:** columns become Company Name, Company LinkedIn, Company Size, Role / JD, HR Name, Domain, Email, Contact Number, LinkedIn, Status, Response (`responseShortLabel`), Response Note, Responded At (`formatIndianDateTime`), Proof ("Uploaded <date>" | "None"). Remove HR Role and Uploaded By. Filename prefix `CRM_Worksheet_`.

**i) Duplicate warning:** in the add-lead submit handler, before saving, run `findDuplicateLead(allContactsRef.current, { company_name, role_title, hr_name, title })`; if found, `setAddLeadError(duplicateWarningMessage(dup))` and stop.

**j) Pipeline counts (optional if present):** per-stage count badges on the pipeline filter buttons.

## 7. New file `src/components/ProofReviewModal.tsx`

Admin verification modal. Props: `lead, reviewerName, onClose, onDecision(decision, notes), onOpenFull(url)`. Contents:
- Header: search icon + "Proof Verification" + "Admin Review" chip + "Reviewing as <reviewerName>".
- Summary strip (4 tiles): Company, HR Contact, Channel (called/messaged/mailed icons), Responded date.
- Claimed response strip: "CRA claims: **<responseLabel(lead.response_status)>** · via <channel>".
- Evidence: screenshot (`object-contain`, click → `onOpenFull`).
- **4-point checklist** (toggle buttons with emerald check state + "N/4 confirmed" counter): (1) "Screenshot looks authentic" — no signs of editing; (2) "Contact details match the lead"; (3) "Date & time are plausible"; (4) "Response matches the claim".
- **Accept panel** (left, emerald): optional note textarea; "✓ Verify Lead — It Counts" button disabled until all 4 checked → `onDecision('verified', notes)`.
- **Reject panel** (right, rose): single-pick reason buttons — "Screenshot looks edited / photoshopped", "Details do not match the lead", "Timestamp does not add up", "Response looks staged" — plus optional textarea; "✕ Reject — Response Reset" disabled until a reason is picked → `onDecision('rejected', "<reason> — <notes>")`.
- Footer warning: "Verifying marks this lead as genuine and counts toward performance. Rejecting resets its response to 'No response yet' and the CRA must re-upload."
- Styling: `fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm`, panel `bg-gray-950 border border-amber-800/50 rounded-3xl max-w-3xl max-h-[92vh]` with amber-tinted header, dark checklist rows, emerald/rose decision panels.

## 8. Services — persist the new fields

- `src/services/supabaseDataService.ts` → in `updateContact`, add to the payload when defined: `response_status, response_note, responded_at, proof_channel, proof_screenshot_url, proof_screenshot_uploaded_at, proof_verified_status, proof_verified_by, proof_verified_at, proof_admin_notes`. In the contact row mappers (fetch + create paths), map `response_status: c.response_status || 'no_response_yet'`, `response_note`, `responded_at`.
- `src/services/clientFallbackStore.ts` → wherever contacts are created (Excel/HTML import and manual add), default `response_status: 'no_response_yet'`.
- Server: `server/models/types.ts` — add the same optional response fields to `HRContact`; `server/controllers/worksheetController.ts` — in `createWorksheetLead` and `bulkCreateWorksheetLeads`, set `response_status: 'no_response_yet'` on every new contact.

## 9. CRM eligibility rule — `src/pages/CRMListPage.tsx`

At the top of the `filteredContacts` filter, add:

```ts
// ELIGIBILITY RULE: leads whose proof was rejected by Admin are NOT eligible
const claimedResponse = c.response_status && c.response_status !== 'no_response_yet';
if (c.proof_verified_status === 'rejected') return false;
if (claimedResponse && c.proof_verified_status !== 'verified') return false;
```

so only Admin-verified responded leads appear in the CRM Directory.

## 10. Rules

- The proof modal must intercept BEFORE saving any responded value; "No response yet" never needs proof.
- Rejecting a proof resets `response_status` to `no_response_yet` and `responded_at` to null so the CRA must re-upload and re-claim.
- Base64 data URLs are acceptable for screenshots (≤ 3.5 MB) for now.
- Do not change the JD Intake, Pipeline kanban, or admin theme in this task.
- Verify: `tsc --noEmit` passes; then in Preview set a response on a lead → proof modal forces upload → upload → status shows "Under Review" → as admin click the thumbnail → run the 4-point checklist → Verify → lead shows "Eligible" and appears in CRM Directory; also test Reject resets the response.
