import React, { useState } from 'react';
import { HRContact } from '../types';
import { responseLabel } from '../constants/worksheet';
import { formatIndianDateTime } from '../utils/formatters';
import {
  Search,
  Phone,
  MessageSquare,
  Mail,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
  Building2,
  User,
  Calendar,
  Check,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface ProofReviewModalProps {
  lead: HRContact;
  reviewerName?: string;
  onClose: () => void;
  onDecision: (decision: 'verified' | 'rejected', notes?: string) => Promise<void> | void;
  onOpenFull: (url: string) => void;
}

const REJECT_REASONS = [
  'Screenshot looks edited / photoshopped',
  'Details do not match the lead',
  'Timestamp does not add up',
  'Response looks staged',
];

export const ProofReviewModal: React.FC<ProofReviewModalProps> = ({
  lead,
  reviewerName = 'Admin',
  onClose,
  onDecision,
  onOpenFull,
}) => {
  const [checklist, setChecklist] = useState({
    authentic: false,
    detailsMatch: false,
    timestampPlausible: false,
    responseMatches: false,
  });

  const [verifyNotes, setVerifyNotes] = useState('');
  const [selectedRejectReason, setSelectedRejectReason] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirmAllChecklist = () => {
    setChecklist({
      authentic: true,
      detailsMatch: true,
      timestampPlausible: true,
      responseMatches: true,
    });
  };

  const confirmedCount = Object.values(checklist).filter(Boolean).length;
  const allConfirmed = confirmedCount === 4;

  const handleVerify = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Auto-confirm checklist when approved
      setChecklist({
        authentic: true,
        detailsMatch: true,
        timestampPlausible: true,
        responseMatches: true,
      });
      await onDecision('verified', verifyNotes.trim() || 'Verified by Admin Leadership');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRejectReason || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const combinedNotes = rejectNotes.trim()
        ? `${selectedRejectReason} — ${rejectNotes.trim()}`
        : selectedRejectReason;
      await onDecision('rejected', combinedNotes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const channel = lead.proof_channel || 'mailed';
  const getChannelIcon = () => {
    switch (channel) {
      case 'called':
        return <Phone className="h-4 w-4 text-emerald-400" />;
      case 'messaged':
        return <MessageSquare className="h-4 w-4 text-sky-400" />;
      case 'mailed':
      default:
        return <Mail className="h-4 w-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-gray-950 border border-amber-800/50 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-gray-100 my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-amber-900/40 bg-gradient-to-r from-amber-950/60 via-gray-900 to-gray-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Search className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Proof Verification</h3>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Admin Review
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Reviewing as <span className="text-amber-300 font-semibold">{reviewerName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Summary Strip (4 tiles) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-gray-900/80 border border-gray-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                Company
              </div>
              <div className="text-xs font-bold text-white truncate mt-1">
                {lead.company?.name || 'Unknown Company'}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-900/80 border border-gray-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                HR Contact
              </div>
              <div className="text-xs font-bold text-white truncate mt-1">
                {lead.name || 'Unnamed'}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-900/80 border border-gray-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                {getChannelIcon()}
                Channel
              </div>
              <div className="text-xs font-bold text-white capitalize mt-1">
                {channel}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-900/80 border border-gray-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Responded Date
              </div>
              <div className="text-xs font-bold text-white truncate mt-1">
                {lead.responded_at ? formatIndianDateTime(lead.responded_at) : 'Not recorded'}
              </div>
            </div>
          </div>

          {/* Claimed Response Strip */}
          <div className="px-4 py-2.5 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">CRA claims:</span>
              <span className="text-white font-semibold">
                {responseLabel(lead.response_status)}
              </span>
              <span className="text-slate-400">· via</span>
              <span className="text-amber-200 capitalize font-medium">{channel}</span>
            </div>
            {lead.response_note && (
              <span className="text-slate-300 italic text-[11px] truncate max-w-xs">
                &ldquo;{lead.response_note}&rdquo;
              </span>
            )}
          </div>

          {/* Evidence Screenshot */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Screenshot Evidence</span>
              {lead.proof_screenshot_url && (
                <button
                  type="button"
                  onClick={() => onOpenFull(lead.proof_screenshot_url!)}
                  className="text-amber-400 hover:text-amber-300 text-[11px] flex items-center gap-1 font-semibold"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Full Screen
                </button>
              )}
            </div>
            <div
              onClick={() => lead.proof_screenshot_url && onOpenFull(lead.proof_screenshot_url)}
              className="relative w-full h-56 bg-black/60 rounded-2xl border border-gray-800 overflow-hidden flex items-center justify-center cursor-pointer hover:border-amber-600/50 transition group"
            >
              {lead.proof_screenshot_url ? (
                <>
                  <img
                    src={lead.proof_screenshot_url}
                    alt="Proof screenshot"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <span className="px-3 py-1.5 rounded-xl bg-gray-900/90 text-white text-xs font-semibold flex items-center gap-1.5 border border-gray-700">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Click to expand full screen
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-500 text-xs">
                  No screenshot uploaded
                </div>
              )}
            </div>
          </div>

          {/* 4-point Checklist */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                4-Point Verification Checklist
              </span>
              <div className="flex items-center gap-2">
                {!allConfirmed && (
                  <button
                    type="button"
                    onClick={handleConfirmAllChecklist}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition cursor-pointer"
                  >
                    Confirm All 4 Points
                  </button>
                )}
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    allConfirmed
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40'
                      : 'bg-gray-800 text-amber-300 border-amber-700/40'
                  }`}
                >
                  {confirmedCount}/4 confirmed
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => toggleCheck('authentic')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition ${
                  checklist.authentic
                    ? 'bg-emerald-950/50 border-emerald-600/60 text-emerald-100'
                    : 'bg-gray-900/80 border-gray-800 text-slate-300 hover:border-gray-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center border shrink-0 transition ${
                    checklist.authentic
                      ? 'bg-emerald-500 border-emerald-400 text-gray-950'
                      : 'border-slate-600 bg-gray-800'
                  }`}
                >
                  {checklist.authentic && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <div>
                  <div className="font-semibold text-white">1. Screenshot looks authentic</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">No signs of editing or doctoring</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => toggleCheck('detailsMatch')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition ${
                  checklist.detailsMatch
                    ? 'bg-emerald-950/50 border-emerald-600/60 text-emerald-100'
                    : 'bg-gray-900/80 border-gray-800 text-slate-300 hover:border-gray-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center border shrink-0 transition ${
                    checklist.detailsMatch
                      ? 'bg-emerald-500 border-emerald-400 text-gray-950'
                      : 'border-slate-600 bg-gray-800'
                  }`}
                >
                  {checklist.detailsMatch && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <div>
                  <div className="font-semibold text-white">2. Contact details match</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">HR name/email/phone match the lead</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => toggleCheck('timestampPlausible')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition ${
                  checklist.timestampPlausible
                    ? 'bg-emerald-950/50 border-emerald-600/60 text-emerald-100'
                    : 'bg-gray-900/80 border-gray-800 text-slate-300 hover:border-gray-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center border shrink-0 transition ${
                    checklist.timestampPlausible
                      ? 'bg-emerald-500 border-emerald-400 text-gray-950'
                      : 'border-slate-600 bg-gray-800'
                  }`}
                >
                  {checklist.timestampPlausible && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <div>
                  <div className="font-semibold text-white">3. Date & time are plausible</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Timestamp is recent and matches record</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => toggleCheck('responseMatches')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition ${
                  checklist.responseMatches
                    ? 'bg-emerald-950/50 border-emerald-600/60 text-emerald-100'
                    : 'bg-gray-900/80 border-gray-800 text-slate-300 hover:border-gray-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center border shrink-0 transition ${
                    checklist.responseMatches
                      ? 'bg-emerald-500 border-emerald-400 text-gray-950'
                      : 'border-slate-600 bg-gray-800'
                  }`}
                >
                  {checklist.responseMatches && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <div>
                  <div className="font-semibold text-white">4. Response matches claim</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Content confirms the reported outcome</div>
                </div>
              </button>
            </div>
          </div>

          {/* Decision Panels: Accept vs Reject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Accept Panel (Left, emerald) */}
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Verify Lead (Accept)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Marks the proof verified. The lead is eligible and flows into the CRM Directory.
                </p>
                <textarea
                  placeholder="Optional admin verification note..."
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  rows={2}
                  className="w-full mt-3 px-3 py-2 bg-gray-900/90 border border-emerald-700/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleVerify}
                disabled={isSubmitting}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                  !isSubmitting
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-emerald-900/40 active:scale-[0.98]'
                    : 'bg-emerald-950/60 text-emerald-500/50 border border-emerald-900/50 cursor-not-allowed'
                }`}
              >
                <Check className="h-4 w-4 stroke-[3]" />
                <span>{isSubmitting ? 'Approving...' : '✓ Approve Screenshot — Mark as Approved Lead'}</span>
              </button>
            </div>

            {/* Reject Panel (Right, rose) */}
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/40 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                  <XCircle className="h-4 w-4" />
                  <span>Reject Proof (Reset)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pick a reason. Resets response to &ldquo;No response yet&rdquo; for CRA re-upload.
                </p>

                {/* Single-pick reason buttons */}
                <div className="space-y-1.5 mt-2.5">
                  {REJECT_REASONS.map((reason) => {
                    const isSelected = selectedRejectReason === reason;
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setSelectedRejectReason(reason)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition ${
                          isSelected
                            ? 'bg-rose-900/60 border-rose-500 text-white font-bold'
                            : 'bg-gray-900/70 border-gray-800 text-slate-300 hover:bg-gray-800/60'
                        }`}
                      >
                        {isSelected ? '● ' : '○ '} {reason}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  placeholder="Optional additional notes to CRA..."
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  rows={1}
                  className="w-full mt-2 px-3 py-1.5 bg-gray-900/90 border border-rose-700/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleReject}
                disabled={!selectedRejectReason || isSubmitting}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                  selectedRejectReason && !isSubmitting
                    ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-rose-900/40'
                    : 'bg-rose-950/60 text-rose-500/50 border border-rose-900/50 cursor-not-allowed'
                }`}
              >
                <X className="h-4 w-4" />
                <span>✕ Reject — Response Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Warning */}
        <div className="px-6 py-3 border-t border-gray-800/80 bg-gray-950 text-slate-400 text-[11px] flex items-center gap-2 shrink-0">
          <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            Verifying marks this lead as genuine and counts toward performance. Rejecting resets its response to &lsquo;No response yet&rsquo; and the CRA must re-upload.
          </span>
        </div>
      </div>
    </div>
  );
};
