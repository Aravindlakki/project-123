import React, { useState, useEffect, useMemo } from 'react';
import {
  PipelineLead,
  PipelineChannel,
  PIPELINE_CHANNELS,
  PIPELINE_CHANNEL_LABELS,
} from '../types/pipeline';
import { pipelineService } from '../services/pipelineService';
import { CRA } from '../types';
import {
  AlarmClock,
  AlarmClockOff,
  Mail,
  MessageCircle,
  Linkedin,
  Send,
  Copy,
  Check,
  RefreshCw,
  X,
} from 'lucide-react';

const channelIcon: Record<PipelineChannel, React.ReactNode> = {
  linkedin: <Linkedin className="h-3.5 w-3.5" />,
  whatsapp: <MessageCircle className="h-3.5 w-3.5" />,
  mail: <Mail className="h-3.5 w-3.5" />,
};

/**
 * Follow-ups — notebook spec:
 * "People who didn't respond need to follow up after 2 days.
 *  The follow-up of 1 day leads which not responded should show in list of today's follow-ups."
 * → Every non-responded lead whose follow-up date is due (or overdue) shows
 *   under "Today's Follow-ups".
 */
export const FollowUpsPage: React.FC<{ currentUser?: CRA | null }> = ({ currentUser }) => {
  const sender = currentUser?.name || 'CRM Team';
  const [tab, setTab] = useState<'today' | 'all' | 'history'>('today');
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [channel, setChannel] = useState<PipelineChannel>('mail');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = () => setLeads(pipelineService.list());

  useEffect(() => {
    refresh();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const today = pipelineService.utils.todayStr();

  const dueToday = useMemo(
    () =>
      leads.filter(
        (l) =>
          l.next_follow_up_date &&
          l.next_follow_up_date <= today &&
          l.status !== 'closed_won' &&
          l.status !== 'closed_lost'
      ),
    [leads, today]
  );

  const allNonResponders = useMemo(
    () => leads.filter((l) => l.response_status !== 'responded' && l.status !== 'closed_won' && l.status !== 'closed_lost'),
    [leads]
  );

  const history = useMemo(
    () =>
      leads
        .flatMap((l) => l.follow_ups.map((f) => ({ lead: l, fu: f })))
        .sort((a, b) => (b.fu.logged_at || '').localeCompare(a.fu.logged_at || '')),
    [leads]
  );

  const genDraft = (lead: PipelineLead): string =>
    drafts[lead.id] ?? pipelineService.draftFor(lead, channel, sender, 2);

  const setDraft = (leadId: string, text: string) => setDrafts((d) => ({ ...d, [leadId]: text }));

  const logFollowUp = (lead: PipelineLead) => {
    const msg = genDraft(lead);
    if (!msg.trim()) return;
    pipelineService.logFollowUp(lead.id, { channel, message: msg, logged_by: sender });
    setDrafts((d) => {
      const next = { ...d };
      delete next[lead.id];
      return next;
    });
    refresh();
    showToast(`Follow-up logged for ${lead.company.company_name} — next in 2 days`);
  };

  const complete = (lead: PipelineLead, outcome: 'replied' | 'still_no_response' | 'not_interested' | 'wrong_contact') => {
    const latest = lead.follow_ups.find((f) => !f.completed_at);
    if (latest) {
      pipelineService.completeFollowUp(lead.id, latest.id, outcome);
    } else {
      // No explicit follow-up row; treat this as a manual outcome on the lead
      if (outcome === 'replied') pipelineService.markResponse(lead.id, true, 'Replied after follow-up');
      else if (outcome === 'still_no_response') pipelineService.scheduleFollowUpFromToday(lead.id, 'Still no response', 2);
      else pipelineService.closeLead(lead.id, false, outcome === 'not_interested' ? 'Not interested' : 'Wrong contact');
    }
    refresh();
    showToast(`Marked ${outcome.replace(/_/g, ' ')}`);
  };

  const copy = async (id: string, text: string) => {
    const ok = await pipelineService.copyText(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const LeadCard: React.FC<{ lead: PipelineLead; overdue?: boolean }> = ({ lead, overdue }) => (
    <div className="bg-gray-950/70 border border-gray-800 rounded-3xl p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-black text-white truncate">{lead.company.company_name}</p>
          <p className="text-[11px] text-gray-400 truncate">
            {lead.contact.hr_name || 'HR pending'} · {lead.lead_code}
            {lead.role_title ? ` · ${lead.role_title}` : ''}
          </p>
        </div>
        <span
          className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border shrink-0 ${
            overdue ? 'bg-rose-950 border-rose-700/60 text-rose-300' : 'bg-sky-950 border-sky-700/60 text-sky-300'
          }`}
        >
          {overdue ? 'Overdue' : 'Due'} {lead.next_follow_up_date}
        </span>
      </div>

      <div className="flex gap-1.5">
        {PIPELINE_CHANNELS.map((c) => (
          <button
            key={c}
            onClick={() => setChannel(c)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition ${
              channel === c ? 'bg-purple-600 text-white' : 'bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800'
            }`}
          >
            {channelIcon[c]} {PIPELINE_CHANNEL_LABELS[c]}
          </button>
        ))}
      </div>

      <textarea
        value={genDraft(lead)}
        onChange={(e) => setDraft(lead.id, e.target.value)}
        rows={4}
        className="w-full px-3 py-2.5 text-[11px] rounded-xl bg-gray-900 border border-gray-700 text-gray-100 focus:border-purple-500 focus:outline-none"
      />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setDraft(lead.id, pipelineService.draftFor(lead, channel, sender, 2))}
          className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-purple-900/60 border border-purple-700/50 text-purple-200 hover:bg-purple-800/70"
        >
          <RefreshCw className="h-3 w-3" /> Regenerate
        </button>
        <button
          onClick={() => copy(lead.id, genDraft(lead))}
          className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          {copiedId === lead.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />} Copy
        </button>
        {(() => {
          const url = pipelineService.channelActionUrl(lead, channel);
          return url ? (
            <a
              href={url}
              target={channel === 'mail' ? undefined : '_blank'}
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-600 text-white"
            >
              Open {PIPELINE_CHANNEL_LABELS[channel]}
            </a>
          ) : null;
        })()}
        <button
          onClick={() => logFollowUp(lead)}
          className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white"
        >
          <Send className="h-3 w-3" /> Log follow-up
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-800/80">
        <span className="text-[9px] font-black uppercase text-gray-500 self-center mr-1">Outcome:</span>
        <button onClick={() => complete(lead, 'replied')} className="text-[9px] font-black uppercase px-2 py-1 rounded-md bg-emerald-800 hover:bg-emerald-700 text-white">
          Replied
        </button>
        <button onClick={() => complete(lead, 'still_no_response')} className="text-[9px] font-black uppercase px-2 py-1 rounded-md bg-amber-800 hover:bg-amber-700 text-white">
          Still no resp
        </button>
        <button onClick={() => complete(lead, 'not_interested')} className="text-[9px] font-black uppercase px-2 py-1 rounded-md bg-rose-900 hover:bg-rose-800 text-white">
          Not interested
        </button>
        <button onClick={() => complete(lead, 'wrong_contact')} className="text-[9px] font-black uppercase px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-200">
          Wrong contact
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <AlarmClock className="h-6 w-6 text-amber-400" /> Follow-ups
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Non-responders get a follow-up after 2 days. Everything due shows in Today's Follow-ups.
          </p>
        </div>
        <div className="flex gap-1 bg-gray-900/80 border border-gray-800 rounded-2xl p-1">
          {(
            [
              { id: 'today', label: `Today (${dueToday.length})` },
              { id: 'all', label: `All Non-Responders (${allNonResponders.length})` },
              { id: 'history', label: 'History' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition ${
                tab === t.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'today' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {dueToday.length === 0 && (
            <div className="xl:col-span-2 bg-gray-950/70 border border-gray-800 rounded-3xl p-10 text-center">
              <AlarmClockOff className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Nothing due today — you're all caught up! 🎉</p>
            </div>
          )}
          {dueToday.map((l) => (
            <LeadCard key={l.id} lead={l} overdue={Boolean(l.next_follow_up_date && l.next_follow_up_date < today)} />
          ))}
        </div>
      )}

      {tab === 'all' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {allNonResponders.length === 0 && (
            <div className="xl:col-span-2 bg-gray-950/70 border border-gray-800 rounded-3xl p-10 text-center">
              <p className="text-xs text-gray-400">Every lead has responded or is closed. Great work!</p>
            </div>
          )}
          {allNonResponders.map((l) => (
            <LeadCard key={l.id} lead={l} overdue={Boolean(l.next_follow_up_date && l.next_follow_up_date <= today)} />
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-2">
          {history.length === 0 && (
            <div className="bg-gray-950/70 border border-gray-800 rounded-3xl p-10 text-center">
              <p className="text-xs text-gray-400">No follow-ups logged yet.</p>
            </div>
          )}
          {history.map(({ lead, fu }) => (
            <div key={fu.id} className="bg-gray-950/70 border border-gray-800 rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="text-gray-400 shrink-0">{channelIcon[fu.channel]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-gray-200 truncate">
                  {lead.company.company_name} <span className="text-gray-500 font-medium">· {lead.contact.hr_name}</span>
                </p>
                <p className="text-[10px] text-gray-500 truncate">{fu.message}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-gray-500">{new Date(fu.logged_at).toLocaleDateString()}</p>
                {fu.completed_at ? (
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border ${
                      fu.outcome === 'replied'
                        ? 'bg-emerald-950 border-emerald-700/60 text-emerald-300'
                        : fu.outcome === 'still_no_response'
                        ? 'bg-amber-950 border-amber-700/60 text-amber-300'
                        : 'bg-rose-950 border-rose-700/60 text-rose-300'
                    }`}
                  >
                    {fu.outcome?.replace(/_/g, ' ')}
                  </span>
                ) : (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-gray-800 border border-gray-700 text-gray-400">
                    open
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl">{toast}</div>
      )}
    </div>
  );
};
