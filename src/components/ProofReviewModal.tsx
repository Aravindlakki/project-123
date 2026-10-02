import React, { useState } from 'react';
import { HRContact } from '../types';
import { responseLabel } from '../constants/worksheet';
import {
  X,
  ShieldCheck,
  ShieldX,
  Building2,
  User,
  Calendar,
  MessageSquare,
  Check,
  AlertTriangle,
  Phone,
  Mail,
  MessageCircle,
  Search,
} from 'lucide-react';

interface ProofReviewModalProps {
  lead: HRContact;
  reviewerName: string;
  onClose: () => void;
  onDecision: (decision: 'verified' | 'rejected', notes: string) => Promise<void> | void;
  onOpenFull: (url: string) => void;
}

type StepId = 'screenshot_authentic' | 'contact_matches' | 'date_matches' | 'response_genuine';

const STEPS: Array<{ id: StepId; label: string; hint: string }> = [
  {
    id: 'screenshot_authentic',
    label: 'Screenshot looks authentic',
    hint: 'No signs of editing — full window visible, UI intact',
  },
  {
    id: 'contact_matches',
    label: 'Contact details match the lead',
    hint: 'HR name / company / phone / email in the screenshot match this row',
  },
  {
    id: 'date_matches',
    label: 'Date & time are plausible',
    hint: 'Screenshot timestamp lines up with when the response was logged',
  },
  {
    id: 'response_genuine',
    label: 'Response matches the claim',
    hint: 'The visible reply actually supports the claimed response type',
  },
];

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  called: <Phone className="h-3.5 w-3.5" />,
  messaged: <MessageCircle className="h-3.5 w-3.5" />,
  mailed: <Mail className="h-3.5 w-3.5" />,
};

/**
 * Admin proof-of-contact verification modal.
 * Structured checklist → explicit decision with reason. Verifying marks the
 * lead as genuine; rejecting resets its response to "No response yet".
 */
export const ProofReviewModal: React.FC<ProofReviewModalProps> = ({
  lead,
  reviewerName,
  onClose,
  onDecision,
  onOpenFull,
}) => {
  const [checks, setChecks] = useState<Record<StepId, boolean>>({
    screenshot_authentic: false,
    contact_matches: false,
    date_matches: false,
    response_genuine: false,
  });
  const [notes, setNotes] = useState(lead.proof_admin_notes || '');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [deciding, setDeciding] = useState(false);

  const checkedCount = Object.values(checks).filter(Boolean).length;
  const allChecked = checkedCount === STEPS.length;
  const channel = lead.proof_channel || 'mailed';

  const toggle = (id: StepId) => setChecks((c) => ({ ...c, [id]: !c[id] }));

  const verify = async () => {
    if (!allChecked || deciding) return;
    setDeciding(true);
    try {
      await onDecision('verified', notes);
    } finally {
      setDeciding(false);
    }
  };

  const reject = async () => {
    if (!rejectionReason || deciding) return;
    setDeciding(true);
    try {
      await onDecision('rejected', `${rejectionReason}${notes ? ` — ${notes}` : ''}`);
    } finally {
      setDeciding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-950 border border-amber-800/50 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-800/80 flex items-start justify-between gap-3 bg-gradient-to-r from-amber-950/40 to-transparent">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-900/50 border border-amber-700/50 text-amber-300">
                <Search className="h-4 w-4" />
              </span>
              <h3 className="text-base font-black text-white">Proof Verification</h3>
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-950 border border-amber-700/60 text-amber-300">
                Admin Review
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Reviewing as <b className="text-gray-300">{reviewerName}</b> — verify this proof before the lead counts.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Lead summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: <Building2 className="h-3.5 w-3.5 text-purple-400" />, label: 'Company', value: lead.company?.name || lead.hr_name || '—' },
              { icon: <User className="h-3.5 w-3.5 text-sky-400" />, label: 'HR Contact', value: lead.name || '—' },
              {
                icon: <span className="text-purple-300">{CHANNEL_ICON[channel]}</span>,
                label: 'Channel',
                value: channel.charAt(0).toUpperCase() + channel.slice(1),
              },
              {
                icon: <Calendar className="h-3.5 w-3.5 text-emerald-400" />,
                label: 'Responded',
                value: lead.responded_at ? new Date(lead.responded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—',
              },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900/80 border border-gray-800 rounded-2xl px-3 py-2.5 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1">{s.icon} {s.label}</p>
                <p className="text-[11px] font-bold text-gray-100 truncate mt-0.5" title={s.value}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Claimed response */}
          <div className="bg-purple-950/30 border border-purple-800/40 rounded-2xl px-4 py-3 flex items-center gap-2.5">
            <MessageSquare className="h-4 w-4 text-purple-300 shrink-0" />
            <p className="text-[11px] text-purple-100">
              CRA claims: <b className="text-white">{responseLabel(lead.response_status)}</b>
              {lead.proof_channel && (
                <> · via <b className="text-white">{channel}</b></>
              )}
            </p>
          </div>

          {/* Screenshot viewer */}
          {lead.proof_screenshot_url ? (
            <div className="space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Evidence — click to enlarge</p>
              <div className="relative group rounded-2xl overflow-hidden border border-gray-700 bg-gray-900">
                <img
                  src={lead.proof_screenshot_url}
                  alt="Proof screenshot"
                  className="w-full max-h-72 object-contain cursor-zoom-in"
                  onClick={() => onOpenFull(lead.proof_screenshot_url!)}
                />
              </div>
            </div>
          ) : (
            <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6 text-center">
              <p className="text-xs text-gray-500">No screenshot attached.</p>
            </div>
          )}

          {/* Verification checklist */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Verification checklist</p>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                  allChecked
                    ? 'bg-emerald-950 border-emerald-700/60 text-emerald-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                {checkedCount}/{STEPS.length} confirmed
              </span>
            </div>
            {STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border text-left transition cursor-pointer ${
                  checks[s.id]
                    ? 'bg-emerald-950/40 border-emerald-700/50'
                    : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                }`}
              >
                <span
                  className={`mt-0.5 h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition ${
                    checks[s.id] ? 'bg-emerald-600 border-emerald-500' : 'border-gray-600'
                  }`}
                >
                  {checks[s.id] && <Check className="h-3 w-3 text-white" />}
                </span>
                <span className="min-w-0">
                  <span className={`block text-[11px] font-bold ${checks[s.id] ? 'text-emerald-200' : 'text-gray-200'}`}>
                    {s.label}
                  </span>
                  <span className="block text-[10px] text-gray-500 mt-0.5">{s.hint}</span>
                </span>
              </button>
            ))}
          </div>

          {/* Decision section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Verify path */}
            <div className={`rounded-2xl border p-3.5 space-y-2 transition ${allChecked ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-gray-900/40 border-gray-800 opacity-60'}`}>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Accept as genuine
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional note — e.g. verified against mail timestamp…"
                className="w-full px-3 py-2 text-[11px] rounded-xl bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-600 focus:border-emerald-600 focus:outline-none"
              />
              <button
                type="button"
                disabled={!allChecked || deciding}
                onClick={verify}
                className={`w-full py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                  allChecked
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                {deciding ? 'Verifying…' : allChecked ? '✓ Verify Lead — It Counts' : `Check all ${STEPS.length} points to verify`}
              </button>
            </div>

            {/* Reject path */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-3.5 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <ShieldX className="h-3.5 w-3.5" /> Reject as fake
              </p>
              <div className="space-y-1.5">
                {['Screenshot looks edited / photoshopped', 'Details do not match the lead', 'Timestamp does not add up', 'Response looks staged'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRejectionReason(rejectionReason === r ? '' : r)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      rejectionReason === r
                        ? 'bg-rose-950 border-rose-700/60 text-rose-200'
                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={1}
                placeholder="Extra detail (optional)…"
                className="w-full px-3 py-2 text-[11px] rounded-xl bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-600 focus:border-rose-700 focus:outline-none"
              />
              <button
                type="button"
                disabled={!rejectionReason || deciding}
                onClick={reject}
                className={`w-full py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                  rejectionReason
                    ? 'bg-rose-800 hover:bg-rose-700 text-white'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                {deciding ? 'Rejecting…' : rejectionReason ? '✕ Reject — Response Reset' : 'Pick a rejection reason'}
              </button>
            </div>
          </div>

          <p className="text-[10px] text-gray-500 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
            Verifying marks this lead as genuine and counts toward performance. Rejecting resets its response to "No response yet" and the CRA must re-upload.
          </p>
        </div>
      </div>
    </div>
  );
};
