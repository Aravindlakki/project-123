import {
  PipelineLead,
  PipelineChannel,
  PIPELINE_CHANNEL_LABELS,
  PipelineDraftContext,
  PipelineStats,
  ProofReviewItem,
} from '../types/pipeline';
import { pipelineStore, pipelineDateUtils } from './pipelineStore';

/**
 * Personalized outreach draft generation (custom name per lead) for
 * LinkedIn / WhatsApp / Mail. Mirrors the notebook spec:
 * "Create a msg draft to outreach from leads. Recruiter custom name according
 * to lead for LinkedIn and WhatsApp and mail."
 */
export function buildOutreachDraft(ctx: PipelineDraftContext): string {
  const { lead, channel, sender_name, follow_up_number } = ctx;
  const hr = lead.contact.hr_name?.trim() || 'there';
  const firstName = hr.split(' ')[0] || hr;
  const company = lead.company.company_name;
  const role = lead.role_title?.trim();
  const sender = sender_name?.trim() || 'Aravind';
  const isFollowUp = Boolean(follow_up_number && follow_up_number > 1);

  const roleLine = role ? ` for the ${role} role` : '';
  const roleLineShort = role ? ` ${role} ` : ' ';

  if (isFollowUp) {
    switch (channel) {
      case 'linkedin':
        return `Hi ${firstName}, just floating this back to the top of your inbox. We're supporting ${company} with pre-vetted graduate talent${roleLineShort}— happy to share a shortlist whenever it's useful. – ${sender}, CRM`;
      case 'whatsapp':
        return `Hello ${firstName} 👋 Gentle reminder from CRM regarding hiring support for ${company}. We have screened candidates ready for interviews${roleLine}. May I share 2–3 profiles? – ${sender}`;
      case 'mail':
        return `Subject: Following up — CRM x ${company}\n\nHi ${firstName},\n\nJust following up on my earlier note about partnering with ${company} on early-careers hiring${roleLine}. We have pre-assessed candidates available for immediate interviews.\n\nWould a quick 10-minute call this week work?\n\nBest regards,\n${sender}\nCRM — Corporate Relations`;
    }
  }

  switch (channel) {
    case 'linkedin':
      return `Hi ${firstName}, I came across ${company} while researching teams growing their engineering & business talent. At CRM we maintain a pool of pre-vetted, job-ready graduates — happy to share a shortlist${roleLineShort}if that helps your current openings. Would you be open to a quick connect? – ${sender}, CRM`;
    case 'whatsapp':
      return `Hello ${firstName} 👋 This is ${sender} from CRM. We're helping companies like ${company} hire pre-screened fresh graduates${roleLine}. Can I send across a 1-page summary of our available candidates?`;
    case 'mail':
      return `Subject: Pre-vetted graduate talent for ${company}${roleLineShort}— CRM\n\nHi ${firstName},\n\nI'm ${sender} from CRM, a recruitment partner specializing in early-career hiring. We work with companies like ${company} to fill roles${roleLine} with pre-assessed, interview-ready graduates — at zero sourcing effort from your side.\n\nWould you be open to a brief chat this week? I can also share a sample candidate profile right away.\n\nBest regards,\n${sender}\nCRM — Corporate Relations`;
  }
}

/** Generate the day-2 follow-up message for a lead + channel. */
export function buildFollowUpMessage(lead: PipelineLead, channel: PipelineChannel, sender?: string): string {
  return buildOutreachDraft({ lead, channel, sender_name: sender, follow_up_number: 2 });
}

export const pipelineService = {
  list(): PipelineLead[] {
    return pipelineStore.list();
  },

  get(id: string): PipelineLead | undefined {
    return pipelineStore.get(id);
  },

  create(input: Parameters<typeof pipelineStore.create>[0]): PipelineLead {
    return pipelineStore.create(input);
  },

  update(id: string, updates: Partial<PipelineLead>): PipelineLead | undefined {
    return pipelineStore.update(id, updates);
  },

  remove(id: string): boolean {
    return pipelineStore.remove(id);
  },

  startSourcing: pipelineStore.startSourcing.bind(pipelineStore),
  saveHrContact: pipelineStore.saveHrContact.bind(pipelineStore),
  addDraft: pipelineStore.addDraft.bind(pipelineStore),
  updateDraft: pipelineStore.updateDraft.bind(pipelineStore),
  markSent: pipelineStore.markSent.bind(pipelineStore),
  addProof: pipelineStore.addProof.bind(pipelineStore),
  reviewProof: pipelineStore.reviewProof.bind(pipelineStore),
  markResponse: pipelineStore.markResponse.bind(pipelineStore),
  scheduleFollowUpFromToday: pipelineStore.scheduleFollowUpFromToday.bind(pipelineStore),
  logFollowUp: pipelineStore.logFollowUp.bind(pipelineStore),
  completeFollowUp: pipelineStore.completeFollowUp.bind(pipelineStore),
  closeLead: pipelineStore.closeLead.bind(pipelineStore),

  byStage: pipelineStore.byStage.bind(pipelineStore),
  todaysFollowUps: pipelineStore.todaysFollowUps.bind(pipelineStore),
  pendingFollowUps: pipelineStore.pendingFollowUps.bind(pipelineStore),
  proofsPendingReview: pipelineStore.proofsPendingReview.bind(pipelineStore),

  stats(): PipelineStats {
    return pipelineStore.stats();
  },

  draftFor(lead: PipelineLead, channel: PipelineChannel, sender?: string, followUpNumber?: number): string {
    return buildOutreachDraft({ lead, channel, sender_name: sender, follow_up_number: followUpNumber });
  },

  /** Copy-to-clipboard helper used across pipeline pages. */
  async copyText(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
      } catch {
        return false;
      }
    }
  },

  /** Best-effort deep link to start the actual conversation. */
  channelActionUrl(lead: PipelineLead, channel: PipelineChannel): string | undefined {
    const email = lead.contact.hr_email;
    const phone = (lead.contact.hr_phone || '').replace(/[^0-9]/g, '');
    const linkedin = lead.contact.hr_linkedin;
    switch (channel) {
      case 'mail':
        return email ? `mailto:${email}` : undefined;
      case 'whatsapp':
        return phone ? `https://wa.me/${phone.startsWith('91') ? phone : `91${phone}`}` : undefined;
      case 'linkedin':
        return linkedin || undefined;
    }
  },

  proofsPending(): ProofReviewItem[] {
    return pipelineStore.proofsPendingReview();
  },

  utils: pipelineDateUtils,
};
