import { HRContact } from '../types';

/**
 * Duplicate detection for My Worksheet (Part A).
 *
 * A lead is a duplicate when the SAME company (case/spacing-insensitive) AND the
 * SAME role/title (normalized) already exist in the contact list — regardless of
 * who added it. So if a teammate already added the lead, the current user gets a
 * warning ("Already added by <name> on <date>") even though the teammate's lead
 * never appears in their own worksheet.
 */

export interface DuplicateWarning {
  lead: HRContact;
  /** Display name of the person who added the original lead. */
  uploaderName: string;
  /** IST date key of the original lead, e.g. 2026-09-29. */
  dateKey: string;
  /** Human-friendly date, e.g. "29 Sept 2026". */
  dateLabel: string;
}

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

  // Exact-ish company+role match first; fall back to company+HR-name match.
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

  const uploader =
    (match.entered_by_name || '').trim() ||
    (match.spoc || '').trim() ||
    'a teammate';

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
