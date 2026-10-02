import React, { useState, useEffect, useMemo } from 'react';
import {
  PipelineLead,
  PipelineChannel,
  PIPELINE_CHANNELS,
  PIPELINE_CHANNEL_LABELS,
} from '../types/pipeline';
import { pipelineService } from '../services/pipelineService';
import { clientFallbackStore } from '../services/clientFallbackStore';
import { CRA } from '../types';
import {
  Sparkles,
  Copy,
  Check,
  Mail,
  MessageCircle,
  Linkedin,
  Send,
  RefreshCw,
  X,
  Search,
} from 'lucide-react';

const channelIcon: Record<PipelineChannel, React.ReactNode> = {
  linkedin: <Linkedin className="h-3.5 w-3.5" />,
  whatsapp: <MessageCircle className="h-3.5 w-3.5" />,
  mail: <Mail className="h-3.5 w-3.5" />,
};

/**
 * Outreach Drafts — "Create a msg draft to outreach from leads, custom name
 * according to lead, for LinkedIn and WhatsApp and mail."
 */
export const OutreachDraftsPage: React.FC<{ currentUser?: CRA | null }> = ({ currentUser }) => {
  const sender = currentUser?.name || 'CRM Team';
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [channel, setChannel] = useState<PipelineChannel>('linkedin');
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const refresh = () => setLeads(pipelineService.list());

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!selectedId && leads.length > 0) setSelectedId(leads[0].id);
  }, [leads, selectedId]);

  const selected = useMemo(() => leads.find((l) => l.id === selectedId) || null, [leads, selectedId]);

  // Regenerate draft text whenever lead or channel changes (leave manual edits alone)
  useEffect(() => {
    if (selected) setDraft(pipelineService.draftFor(selected, channel, sender));
  }, [selectedId, channel]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = leads.filter((l) => l.contact.hr_name); // need an HR to address
    if (!q) return base;
    return base.filter(
      (l) =>
        l.company.company_name.toLowerCase().includes(q) ||
        l.contact.hr_name?.toLowerCase().includes(q) ||
        l.role_title?.toLowerCase().includes(q)
    );
  }, [leads, search]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const copy = async () => {
    const ok = await pipelineService.copyText(draft);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const saveDraft = () => {
    if (!selected || !draft.trim()) return;
    // If a draft for the same channel already exists, update it; otherwise create one.
    const existing = selected.outreach.find((o) => o.channel === channel && o.status === 'draft');
    if (existing) {
      pipelineService.updateDraft(selected.id, existing.id, { draft_text: draft });
      setSavedDraftId(existing.id);
    } else {
      const { outreach } = pipelineService.addDraft(selected.id, channel, draft);
      setSavedDraftId(outreach?.id || null);
    }
    refresh();
    showToast(`Draft saved for ${selected.contact.hr_name} via ${PIPELINE_CHANNEL_LABELS[channel]}`);
  };

  const sendNow = () => {
    if (!selected) return;
    const existing = selected.outreach.find((o) => o.channel === channel && o.status === 'draft');
    if (existing) {
      pipelineService.updateDraft(selected.id, existing.id, { draft_text: draft });
      pipelineService.markSent(selected.id, existing.id, {});
    } else {
      const { outreach } = pipelineService.addDraft(selected.id, channel, draft);
      if (outreach) pipelineService.markSent(selected.id, outreach.id, {});
    }
    refresh();
    showToast(`Marked as sent via ${PIPELINE_CHANNEL_LABELS[channel]} — now upload proof of response`);
  };

  const actionUrl = selected ? pipelineService.channelActionUrl(selected, channel) : undefined;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-400" /> Outreach Drafts
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Personalized messages per lead — custom name, company & role — for LinkedIn, WhatsApp and Mail.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lead picker */}
        <div className="bg-gray-950/70 border border-gray-800 rounded-3xl p-3">
          <div className="relative mb-2">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads…"
              className="w-full pl-8 pr-3 py-2 text-[11px] rounded-xl bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5 overflow-y-auto max-h-[520px] pr-1">
            {filtered.length === 0 && (
              <p className="text-[11px] text-gray-600 text-center py-8">
                No leads with HR contact info yet. Add leads in the Pipeline tab first.
              </p>
            )}
            {filtered.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedId(l.id)}
                className={`w-full text-left rounded-2xl p-2.5 transition border ${
                  selectedId === l.id
                    ? 'bg-purple-900/60 border-purple-600/60'
                    : 'bg-gray-900 border-gray-800 hover:bg-gray-800/80'
                }`}
              >
                <p className="text-[11px] font-bold text-gray-100 truncate">{l.contact.hr_name}</p>
                <p className="text-[10px] text-gray-400 truncate">
                  {l.company.company_name} {l.role_title ? `· ${l.role_title}` : ''}
                </p>
                <div className="flex gap-1 mt-1">
                  {PIPELINE_CHANNELS.map((c) => {
                    const has = pipelineService.channelActionUrl(l, c);
                    return (
                      <span
                        key={c}
                        title={`${PIPELINE_CHANNEL_LABELS[c]} ${has ? 'available' : 'missing'}`}
                        className={`p-0.5 rounded ${has ? 'text-emerald-400' : 'text-gray-700'}`}
                      >
                        {channelIcon[c]}
                      </span>
                    );
                  })}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Draft editor */}
        <div className="lg:col-span-2 bg-gray-950/70 border border-gray-800 rounded-3xl p-4 space-y-3">
          {!selected ? (
            <div className="h-full grid place-items-center py-16">
              <p className="text-xs text-gray-500">Select a lead to generate its outreach draft.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-white">
                    {selected.contact.hr_name} <span className="text-gray-500 font-medium">· {selected.company.company_name}</span>
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {selected.contact.hr_designation || 'HR'} {selected.role_title ? `· hiring for ${selected.role_title}` : ''}
                  </p>
                </div>
                <div className="flex gap-1.5">
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

              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 text-xs rounded-2xl bg-gray-900 border border-gray-700 text-gray-100 focus:border-purple-500 focus:outline-none leading-relaxed"
              />
              <p className="text-[10px] text-gray-500">
                The draft auto-uses the lead's name ({selected.contact.hr_name}), company ({selected.company.company_name})
                {selected.role_title ? ` and role (${selected.role_title})` : ''}. Edit freely — your own message is allowed too.
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => selected && setDraft(pipelineService.draftFor(selected, channel, sender))}
                  className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl bg-purple-900/60 border border-purple-700/50 text-purple-200 hover:bg-purple-800/70"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </button>
                <button onClick={copy} className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-gray-200 hover:bg-gray-800">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} Copy
                </button>
                <button onClick={saveDraft} className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white">
                  Save draft
                </button>
                {actionUrl && (
                  <a
                    href={actionUrl}
                    target={channel === 'mail' ? undefined : '_blank'}
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white"
                  >
                    Open {PIPELINE_CHANNEL_LABELS[channel]}
                  </a>
                )}
                <button onClick={sendNow} className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white">
                  <Send className="h-3.5 w-3.5" /> Mark as sent
                </button>
              </div>

              {selected.outreach.length > 0 && (
                <div className="pt-2 border-t border-gray-800/80">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">
                    Existing drafts / sent ({selected.outreach.length})
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {selected.outreach.map((o) => (
                      <div key={o.id} className="flex items-center justify-between gap-2 bg-gray-900/80 border border-gray-800 rounded-xl px-3 py-2">
                        <span className="text-[10px] font-bold text-gray-300 flex items-center gap-1.5">
                          {channelIcon[o.channel]} {PIPELINE_CHANNEL_LABELS[o.channel]} · {o.status.replace('_', ' ')}
                        </span>
                        <button
                          onClick={() => {
                            setChannel(o.channel);
                            setDraft(o.draft_text);
                          }}
                          className="text-[10px] font-bold text-purple-300 hover:text-purple-200"
                        >
                          Load
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl">{toast}</div>
      )}
    </div>
  );
};
