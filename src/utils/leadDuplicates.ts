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
