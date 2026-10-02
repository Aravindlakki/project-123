import React, { useState, useEffect, useMemo } from 'react';
import {
  PipelineLead,
  PipelineProof,
  PipelineChannel,
  PIPELINE_CHANNELS,
  PIPELINE_CHANNEL_LABELS,
  ProofReviewItem,
} from '../types/pipeline';
import { pipelineService } from '../services/pipelineService';
import { CRA } from '../types';
import {
  Camera,
  ShieldCheck,
  Check,
  X,
  Mail,
  MessageCircle,
  Linkedin,
  Building2,
  Clock,
} from 'lucide-react';

const channelIcon: Record<PipelineChannel, React.ReactNode> = {
  linkedin: <Linkedin className="h-3.5 w-3.5" />,
  whatsapp: <MessageCircle className="h-3.5 w-3.5" />,
  mail: <Mail className="h-3.5 w-3.5" />,
};

/**
 * Proof of Response — notebook spec:
 * "If emp uses the draft or uses his own msg of mail or phone, need to upload
 * screenshot of it → this should go to admin."
 * Employees upload proofs; Admin sees a verification queue across all leads.
 */
export const ProofOfResponsePage: React.FC<{ currentUser?: CRA | null; adminReviewMode?: boolean }> = ({
  currentUser,
  adminReviewMode = false,
}) => {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [pending, setPending] = useState<ProofReviewItem[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [channel, setChannel] = useState<PipelineChannel>('linkedin');
  const fileRef = React.useRef<HTMLInputElement>(null);

  const refresh = () => {
    setLeads(pipelineService.list());
    setPending(pipelineService.proofsPending());
  };

  useEffect(() => {
    refresh();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  // In admin mode we show the verification queue across every lead.
  // In employee mode we show the uploader for leads this user created/sourced.
  const myLeads = useMemo(() => {
    if (adminReviewMode) return leads;
    return leads.filter(
      (l) => !currentUser || !l.created_by || l.created_by === currentUser.id
    );
  }, [leads, currentUser, adminReviewMode]);

  const uploadToLead = (leadId: string, file?: File | null) => {
    if (!file) return;
    if (file.size > 3.5 * 1024 * 1024) {
      showToast('Screenshot too large — keep it under 3.5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      pipelineService.addProof(leadId, {
        channel,
        screenshot_url: reader.result as string,
        filename: file.name,
        uploaded_by: currentUser?.id,
        uploaded_by_name: currentUser?.name,
      });
      refresh();
      showToast('Proof uploaded — sent to Admin for verification');
    };
    reader.readAsDataURL(file);
  };

  const review = (leadId: string, proofId: string, decision: 'approved' | 'rejected') => {
    pipelineService.reviewProof(leadId, proofId, decision, undefined, currentUser?.name);
    refresh();
    showToast(decision === 'approved' ? 'Proof approved — lead marked as responded' : 'Proof rejected');
  };

  const sentLeads = myLeads.filter((l) => l.outreach.some((o) => o.status === 'sent') || l.proofs.length > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          {adminReviewMode ? <ShieldCheck className="h-6 w-6 text-amber-400" /> : <Camera className="h-6 w-6 text-purple-400" />}
          {adminReviewMode ? 'Proof Review Queue (Admin)' : 'Proof of Response'}
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {adminReviewMode
            ? 'Every outreach screenshot uploaded by employees lands here for approval. Approving marks the lead as responded.'
            : 'Upload the screenshot of the message you sent (draft or your own) — mail, WhatsApp or LinkedIn. It goes to Admin for verification.'}
        </p>
      </div>

      {adminReviewMode && (
        <div className="bg-amber-950/40 border border-amber-800/50 rounded-2xl p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-200">
            <b>{pending.length}</b> proof{pending.length === 1 ? '' : 's'} awaiting your review.
          </p>
        </div>
      )}

      {adminReviewMode ? (
        <div className="space-y-3">
          {pending.length === 0 && (
            <div className="bg-gray-950/70 border border-gray-800 rounded-3xl p-10 text-center">
              <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Queue is clear — no pending proofs.</p>
            </div>
          )}
          {pending.map(({ lead, proof }) => (
            <div key={proof.id} className="bg-gray-950/70 border border-amber-900/40 rounded-3xl p-4 flex flex-col md:flex-row gap-4">
              {proof.screenshot_url ? (
                <img
                  src={proof.screenshot_url}
                  alt="proof"
                  className="w-full md:w-64 h-44 object-cover rounded-2xl border border-gray-700 cursor-pointer hover:opacity-90"
                  onClick={() => setPreview(proof.screenshot_url)}
                />
              ) : (
                <div className="w-full md:w-64 h-44 rounded-2xl bg-gray-900 border border-gray-700 grid place-items-center text-gray-500 text-[10px] font-bold">
                  NO SCREENSHOT
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm font-black text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-400 shrink-0" /> {lead.company.company_name}
                </p>
                <p className="text-[11px] text-gray-400">
                  {lead.contact.hr_name || 'HR pending'} · {lead.lead_code} · {lead.role_title || '—'}
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="font-black uppercase px-2 py-0.5 rounded-md bg-gray-900 border border-gray-700 text-gray-300 flex items-center gap-1">
                    {channelIcon[proof.channel]} {PIPELINE_CHANNEL_LABELS[proof.channel]}
                  </span>
                  {proof.uploaded_by_name && (
                    <span className="font-black uppercase px-2 py-0.5 rounded-md bg-gray-900 border border-gray-700 text-gray-300">
                      by {proof.uploaded_by_name}
                    </span>
                  )}
                  <span className="font-black uppercase px-2 py-0.5 rounded-md bg-gray-900 border border-gray-700 text-gray-400">
                    {new Date(proof.uploaded_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => review(lead.id, proof.id, 'approved')}
                    className="flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => review(lead.id, proof.id, 'rejected')}
                    className="flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-2 rounded-xl bg-rose-900 hover:bg-rose-800 text-white"
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-gray-950/70 border border-gray-800 rounded-3xl p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Proof channel</p>
            <div className="flex gap-2">
              {PIPELINE_CHANNELS.map((c) => (
                <button
                  key={c}
                  onClick={() => setChannel(c)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
                    channel === c ? 'bg-purple-600 text-white' : 'bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {channelIcon[c]} {PIPELINE_CHANNEL_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sentLeads.length === 0 && (
              <div className="md:col-span-2 bg-gray-950/70 border border-gray-800 rounded-3xl p-10 text-center">
                <Camera className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">
                  No outreach sent yet. Send a message from the Pipeline or Outreach Drafts tab first.
                </p>
              </div>
            )}
            {sentLeads.map((l) => (
              <div key={l.id} className="bg-gray-950/70 border border-gray-800 rounded-3xl p-4 space-y-2">
                <p className="text-sm font-black text-white truncate">{l.company.company_name}</p>
                <p className="text-[11px] text-gray-400 truncate">
                  {l.contact.hr_name || 'HR pending'} · via {PIPELINE_CHANNEL_LABELS[channel]}
                </p>
                {l.proofs.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {l.proofs.map((p) => (
                      <span
                        key={p.id}
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border ${
                          p.verification === 'approved'
                            ? 'bg-emerald-950 border-emerald-700/60 text-emerald-300'
                            : p.verification === 'rejected'
                            ? 'bg-rose-950 border-rose-700/60 text-rose-300'
                            : 'bg-amber-950 border-amber-700/60 text-amber-300'
                        }`}
                      >
                        {p.channel} · {p.verification}
                      </span>
                    ))}
                  </div>
                )}
                <label className="block w-full py-2.5 rounded-xl border-2 border-dashed border-gray-700 hover:border-purple-600 text-[11px] font-bold text-gray-400 hover:text-purple-300 transition text-center cursor-pointer">
                  📷 Upload proof screenshot
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => uploadToLead(l.id, e.target.files?.[0])}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-6" onClick={() => setPreview(null)}>
          <img src={preview} alt="proof preview" className="max-h-[85vh] max-w-full rounded-2xl border border-gray-700" />
        </div>
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl">{toast}</div>
      )}
    </div>
  );
};
