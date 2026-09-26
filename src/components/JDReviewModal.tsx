import React, { useState, useEffect } from 'react';
import { JD, CRA } from '../types';
import { api } from '../services/api';
import { formatIndianDate } from '../utils/formatters';
import {
  ShieldCheck,
  Check,
  X,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  FileText,
  AlertTriangle,
  MessageSquare,
  Video,
  CheckCircle2,
  Trash2,
  Lock,
  ExternalLink,
  Edit3,
} from 'lucide-react';

interface JDReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  jd: JD | null;
  isAdmin: boolean;
  onSave?: (updatedJD: JD) => void;
  onDelete?: (jdId: string) => void;
}

export const JDReviewModal: React.FC<JDReviewModalProps> = ({
  isOpen,
  onClose,
  jd,
  isAdmin,
  onSave,
  onDelete,
}) => {
  const [eligibilityStatus, setEligibilityStatus] = useState<'pending_admin_review' | 'eligible' | 'not_eligible'>('pending_admin_review');
  const [adminNotes, setAdminNotes] = useState('');
  const [interviewScheduled, setInterviewScheduled] = useState<'yes' | 'no' | 'pending' | 'completed'>('no');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewRound, setInterviewRound] = useState('Round 1 - Technical Screening');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [hrFeedbackStatus, setHrFeedbackStatus] = useState<'awaiting' | 'received'>('awaiting');
  const [hrFeedback, setHrFeedback] = useState('');
  const [hrFeedbackDate, setHrFeedbackDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (jd) {
      setEligibilityStatus(jd.eligibility_status || (jd.is_verified ? 'eligible' : 'pending_admin_review'));
      setAdminNotes(jd.admin_review_notes || '');
      setInterviewScheduled(jd.interview_scheduled || 'no');
      setInterviewDate(jd.interview_date || '');
      setInterviewRound(jd.interview_round || 'Round 1 - Technical Screening');
      setInterviewNotes(jd.interview_notes || '');
      setHrFeedbackStatus(jd.hr_feedback_status || 'awaiting');
      setHrFeedback(jd.hr_feedback || '');
      setHrFeedbackDate(jd.hr_feedback_date || new Date().toISOString().slice(0, 10));
      setFeedback(null);
      setShowDeleteConfirm(false);
    }
  }, [jd]);

  if (!isOpen || !jd) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      const updates: Partial<JD> = {
        eligibility_status: eligibilityStatus,
        admin_review_notes: adminNotes.trim(),
        is_verified: eligibilityStatus === 'eligible',
        reviewed_at: new Date().toISOString(),
        interview_scheduled: eligibilityStatus === 'eligible' ? interviewScheduled : 'no',
        interview_date: eligibilityStatus === 'eligible' && interviewScheduled === 'yes' ? interviewDate : undefined,
        interview_round: eligibilityStatus === 'eligible' && interviewScheduled === 'yes' ? interviewRound : undefined,
        interview_notes: eligibilityStatus === 'eligible' && interviewScheduled === 'yes' ? interviewNotes.trim() : undefined,
        hr_feedback_status: hrFeedbackStatus,
        hr_feedback: hrFeedback.trim() || undefined,
        hr_feedback_date: hrFeedback.trim() ? (hrFeedbackDate || new Date().toISOString().slice(0, 10)) : undefined,
      };

      const updated = await api.updateJD(jd.id, updates);
      setFeedback({ type: 'success', text: `Evaluation & tracking updated for ${jd.title} (${jd.jd_id || 'JD'})` });
      onSave?.(updated);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update JD record' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin || !jd) return;
    setIsDeleting(true);
    try {
      await api.deleteJD(jd.id);
      onDelete?.(jd.id);
      onClose();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete JD' });
      setIsDeleting(false);
    }
  };

  const isEligible = eligibilityStatus === 'eligible';

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700/80 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-gray-800 bg-gray-900/95 sticky top-0 z-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-amber-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Briefcase className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black uppercase px-2.5 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-600/60 shadow-sm">
                  {jd.jd_id || 'JD-2026'}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{jd.title}</h2>
              </div>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-gray-300 font-semibold">{jd.company?.name || 'Company'}</span>
                <span>•</span>
                <span>Logged: {formatIndianDate(jd.created_at || jd.date_found)}</span>
                <span>•</span>
                <span className="capitalize text-gray-400">Type: {jd.opportunity_type?.replace('_', ' ')}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAdmin && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-gray-800 border border-gray-700 text-gray-400">
                <Lock className="h-3 w-3 text-amber-400" />
                Employee View (Read-Only)
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border-b border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-300 border-b border-rose-500/20'
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-current opacity-70 hover:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* SECTION 1: MANDATORY HR CONTACT DETAILS */}
          <div className="p-4 rounded-2xl bg-gray-800/60 border border-purple-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <User className="h-4 w-4 text-purple-400" />
                Mandatory HR Contact Details (Received with JD)
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                Mandatory Record
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-700/60">
                <span className="text-gray-400 text-[11px] block">HR Contact Name</span>
                <span className="font-bold text-white text-sm mt-0.5 block">
                  {jd.hr_name || 'Not Recorded'}
                </span>
              </div>
              <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-700/60">
                <span className="text-gray-400 text-[11px] block">HR Email</span>
                <a
                  href={jd.hr_email ? `mailto:${jd.hr_email}` : undefined}
                  className="font-semibold text-purple-300 hover:underline truncate block mt-0.5"
                >
                  {jd.hr_email || 'Not Provided'}
                </a>
              </div>
              <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-700/60">
                <span className="text-gray-400 text-[11px] block">HR Phone Number</span>
                <a
                  href={jd.hr_phone ? `tel:${jd.hr_phone}` : undefined}
                  className="font-bold text-emerald-400 hover:underline truncate block mt-0.5"
                >
                  {jd.hr_phone || 'Not Provided'}
                </a>
              </div>
              <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-700/60">
                <span className="text-gray-400 text-[11px] block">Designation / Role</span>
                <span className="font-semibold text-gray-200 truncate block mt-0.5">
                  {jd.hr_designation || 'HR Manager'}
                </span>
              </div>
            </div>
            {jd.hr_linkedin && (
              <div className="text-[11px] text-gray-400 pt-1 flex items-center gap-1.5">
                <span>LinkedIn:</span>
                <a
                  href={jd.hr_linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline flex items-center gap-1 truncate"
                >
                  <span>{jd.hr_linkedin}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
            )}
          </div>

          {/* SECTION 2: JOB DESCRIPTION TEXT & SUMMARY */}
          <div className="p-4 rounded-2xl bg-gray-800/40 border border-gray-700/60 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-gray-400" />
              Job Description Specification
            </h3>
            <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 text-xs text-gray-300 font-mono leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
              {jd.raw_text || 'No job description text provided.'}
            </div>
          </div>

          {/* SECTION 3: ADMIN ELIGIBILITY DECISION WORKFLOW */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-gray-900 to-amber-950/20 border border-amber-800/50 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                  Admin Eligibility Review
                </h3>
                <p className="text-xs text-amber-200/70">
                  {isAdmin
                    ? 'Review the uploaded JD and determine if it is eligible for placement drives.'
                    : 'Administrator evaluates eligibility, interview schedules, and HR feedback.'}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${
                  eligibilityStatus === 'eligible'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : eligibilityStatus === 'not_eligible'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {eligibilityStatus === 'eligible'
                  ? '✅ Eligible'
                  : eligibilityStatus === 'not_eligible'
                  ? '❌ Not Eligible'
                  : '⏳ Pending Admin Review'}
              </span>
            </div>

            {isAdmin ? (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-amber-200">
                  Select Eligibility Status *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEligibilityStatus('eligible')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition flex items-center justify-center gap-2 ${
                      eligibilityStatus === 'eligible'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-900/40'
                        : 'bg-gray-900 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    <span>Eligible</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEligibilityStatus('not_eligible')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition flex items-center justify-center gap-2 ${
                      eligibilityStatus === 'not_eligible'
                        ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-900/40'
                        : 'bg-gray-900 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600'
                    }`}
                  >
                    <X className="h-4 w-4 text-rose-300" />
                    <span>Not Eligible</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEligibilityStatus('pending_admin_review')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition flex items-center justify-center gap-2 ${
                      eligibilityStatus === 'pending_admin_review'
                        ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-900/40'
                        : 'bg-gray-900 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600'
                    }`}
                  >
                    <Clock className="h-4 w-4 text-amber-300" />
                    <span>Pending Review</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">
                    Admin Review Notes / Eligibility Justification
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g. Approved. Requirements match candidate batch. Placement drive scheduled for 20 candidates."
                    className="w-full bg-gray-950 border border-amber-700/50 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 text-xs text-gray-300">
                <span className="text-gray-400 block mb-1">Admin Evaluation Notes:</span>
                <p className="italic text-gray-300">{jd.admin_review_notes || 'No review notes entered yet by Administrator.'}</p>
                {jd.reviewed_at && (
                  <span className="text-[10px] text-gray-500 block mt-2">
                    Evaluated on: {formatIndianDate(jd.reviewed_at)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* SECTION 4: INTERVIEW SCHEDULING (FOR ELIGIBLE JDS) */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isEligible
              ? 'bg-gradient-to-br from-indigo-950/40 via-gray-900 to-indigo-950/20 border-indigo-700/50 shadow-lg'
              : 'bg-gray-900/40 border-gray-800 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-200">
                  Interview Scheduling Pipeline
                </h3>
              </div>
              {!isEligible && (
                <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                  Requires "Eligible" status
                </span>
              )}
            </div>

            {isAdmin && isEligible ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-xs font-bold text-indigo-200 mb-1">
                      Is Interview Scheduled? *
                    </label>
                    <select
                      value={interviewScheduled}
                      onChange={(e: any) => setInterviewScheduled(e.target.value)}
                      className="w-full bg-gray-950 border border-indigo-700/60 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none"
                    >
                      <option value="no">❌ No · Not Scheduled Yet</option>
                      <option value="yes">✅ Yes · Interview Scheduled</option>
                      <option value="pending">⏳ Pending Confirmation</option>
                      <option value="completed">🏆 Completed / Drives Finished</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-200 mb-1">
                      Interview Round / Phase
                    </label>
                    <input
                      type="text"
                      value={interviewRound}
                      onChange={(e) => setInterviewRound(e.target.value)}
                      placeholder="e.g. Round 1 - Technical Screening"
                      className="w-full bg-gray-950 border border-indigo-700/60 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {interviewScheduled === 'yes' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <label className="block text-xs font-bold text-indigo-200 mb-1">
                        Scheduled Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="w-full bg-gray-950 border border-indigo-700/60 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-indigo-200 mb-1">
                        Interview Link / Instructions
                      </label>
                      <input
                        type="text"
                        value={interviewNotes}
                        onChange={(e) => setInterviewNotes(e.target.value)}
                        placeholder="e.g. Google Meet link or On-premise Office address"
                        className="w-full bg-gray-950 border border-indigo-700/60 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Schedule Status:</span>
                  <span className={`font-bold ${
                    jd.interview_scheduled === 'yes' ? 'text-emerald-400' : 'text-gray-400'
                  }`}>
                    {jd.interview_scheduled === 'yes'
                      ? '✅ Interview Scheduled'
                      : jd.interview_scheduled === 'completed'
                      ? '🏆 Interview Completed'
                      : 'Not Scheduled'}
                  </span>
                </div>
                {jd.interview_date && (
                  <div className="mt-2 text-indigo-200">
                    <span className="text-gray-400">Date/Time: </span>
                    <strong>{jd.interview_date}</strong>
                  </div>
                )}
                {jd.interview_round && (
                  <div className="mt-1 text-gray-300">
                    <span className="text-gray-400">Round: </span>
                    {jd.interview_round}
                  </div>
                )}
                {jd.interview_notes && (
                  <div className="mt-1 text-gray-300">
                    <span className="text-gray-400">Notes: </span>
                    {jd.interview_notes}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 5: HR FEEDBACK TRACKER */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-950/30 via-gray-900 to-purple-950/20 border border-purple-800/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-200">
                  HR Feedback & Outcome
                </h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                hrFeedbackStatus === 'received'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {hrFeedbackStatus === 'received' ? '✅ Feedback Received' : '⏳ Awaiting Feedback'}
              </span>
            </div>

            {isAdmin ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-purple-200 mb-1">
                      Feedback Status
                    </label>
                    <select
                      value={hrFeedbackStatus}
                      onChange={(e: any) => setHrFeedbackStatus(e.target.value)}
                      className="w-full bg-gray-950 border border-purple-700/60 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none"
                    >
                      <option value="awaiting">⏳ Awaiting HR Feedback</option>
                      <option value="received">✅ Feedback Received from HR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-purple-200 mb-1">
                      Feedback Date
                    </label>
                    <input
                      type="date"
                      value={hrFeedbackDate}
                      onChange={(e) => setHrFeedbackDate(e.target.value)}
                      className="w-full bg-gray-950 border border-purple-700/60 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 mb-1">
                    HR Feedback Comments / Outcome
                  </label>
                  <textarea
                    rows={2}
                    value={hrFeedback}
                    onChange={(e) => setHrFeedback(e.target.value)}
                    placeholder="e.g. HR liked candidate resumes. Requested scheduling for next Tuesday at 3 PM."
                    className="w-full bg-gray-950 border border-purple-700/50 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 text-xs">
                <span className="text-gray-400 block mb-1">Feedback from HR:</span>
                <p className="italic text-gray-300">
                  {jd.hr_feedback || 'No feedback logged yet from HR.'}
                </p>
                {jd.hr_feedback_date && (
                  <span className="text-[10px] text-gray-500 block mt-2">
                    Received on: {formatIndianDate(jd.hr_feedback_date)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-gray-800 bg-gray-900/95 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>
            {isAdmin && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete JD Record</span>
              </button>
            )}

            {isAdmin && showDeleteConfirm && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-300 font-bold">Confirm delete?</span>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold transition"
            >
              Close
            </button>

            {isAdmin && (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl font-extrabold shadow-lg shadow-amber-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>{isSaving ? 'Saving Updates...' : 'Save Evaluation & Schedule'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
