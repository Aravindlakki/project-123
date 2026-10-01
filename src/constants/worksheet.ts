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
