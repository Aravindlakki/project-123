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
