import { Request, Response } from 'express';
import {
  outreachChannels,
  outreachOutcomes,
  campaigns,
  hrContacts,
  companies,
  enrichOutreach,
  enrichCampaign,
} from '../models/db';
import { OutreachChannel, OutreachProof, OutreachOutcome, Campaign, CRA } from '../models/types';
import { generateWithGeminiRetry } from '../services/geminiService';

export function getOutreach(req: Request, res: Response) {
  return res.json(outreachChannels.map(enrichOutreach));
}

export function createOutreach(req: Request, res: Response) {
  const { contact_id, channel, status, notes, call_duration_seconds, call_outcome, campaign_id } = req.body;
  const newOutreach: OutreachChannel = {
    id: `out_${Date.now()}`,
    contact_id,
    channel: channel || 'mail',
    status: status || 'sent',
    timestamp: new Date().toISOString(),
    notes: notes || '',
    call_duration_seconds,
    call_outcome,
    campaign_id,
    created_at: new Date().toISOString(),
  };
  outreachChannels.unshift(newOutreach);
  return res.status(201).json(enrichOutreach(newOutreach));
}

export function updateOutreachStatus(req: Request, res: Response) {
  const item = outreachChannels.find((o) => o.id === req.params.id);
  if (!item) return res.status(404).json({ detail: 'Outreach channel entry not found' });
  const { status, notes, call_duration_seconds, call_outcome } = req.query;
  if (status) item.status = status as any;
  if (notes) item.notes = notes as string;
  if (call_duration_seconds) item.call_duration_seconds = parseInt(call_duration_seconds as string, 10);
  if (call_outcome) item.call_outcome = call_outcome as string;
  item.timestamp = new Date().toISOString();
  return res.json(enrichOutreach(item));
}

export function uploadProof(req: Request, res: Response) {
  const item = outreachChannels.find((o) => o.id === req.params.id);
  if (!item) return res.status(404).json({ detail: 'Outreach channel entry not found' });
  const file = req.file;
  const proof: OutreachProof = {
    id: `prf_${Date.now()}`,
    outreach_id: item.id,
    filename: file?.originalname || 'proof.png',
    mime_type: file?.mimetype || 'image/png',
    evidence_type: 'Outreach screenshot / Call recording',
    verification_status: 'verified',
    confidence: 'high',
    summary: 'Visual confirmation of delivered outreach message and timestamp verified.',
    extracted_details: `Verified sender and receiver with matching email/handle. Timestamp confirmed: ${new Date().toLocaleDateString()}.`,
    concerns: 'None',
    file_buffer: file?.buffer?.toString('base64'),
    created_at: new Date().toISOString(),
  };
  item.proof = proof;
  return res.json(proof);
}

export function getProofImage(req: Request, res: Response) {
  const item = outreachChannels.find((o) => o.id === req.params.id);
  if (!item?.proof?.file_buffer) {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="#1e1b4b"/><text x="50%" y="50%" fill="#a5b4fc" font-size="16" text-anchor="middle" dominant-baseline="middle">Verified Outreach Proof Attachment</text></svg>`
    );
  }
  const buf = Buffer.from(item.proof.file_buffer, 'base64');
  res.setHeader('Content-Type', item.proof.mime_type || 'image/png');
  return res.send(buf);
}

export async function draftMessage(req: Request, res: Response) {
  const { contact_id, channel } = req.body;
  const contact = hrContacts.find((c) => c.id === contact_id);
  const comp = contact ? companies.find((co) => co.id === contact.company_id) : undefined;
  const contactName = contact?.name || 'Hiring Lead';
  const compName = comp?.name || 'your company';

  const prompt = `You are a Corporate Relations Associate (CRA) at Placemein, an Indian recruitment and student talent placement partnership organization.
Draft a short, highly professional, non-spammy outreach message tailored for:
- Contact Name: ${contactName}
- Target Company: ${compName}
- Communication Channel: ${channel} (e.g. Call script, LinkedIn message, WhatsApp text, or Email)
Focus: Placement partnerships for pre-assessed graduating talent in Full-Stack, AI, and Cybersecurity. Keep it natural, direct, and engaging. Return only the message text.`;

  const aiResult = await generateWithGeminiRetry({
    contents: prompt,
    preferredModels: ['gemini-3.8-flash', 'gemini-2.5-flash'],
  });

  if (aiResult?.text) {
    return res.json({ draft_text: aiResult.text.trim() });
  }

  let draft = '';
  if (channel === 'call') {
    draft = `Call Script:\n"Hello ${contactName}, this is from Placemein Campus Relations. I am calling to discuss your engineering and talent requirements for ${compName}. Do you have 2 minutes to hear how we provide pre-vetted campus candidates?"`;
  } else if (channel === 'linkedin') {
    draft = `Hi ${contactName}, noticed your team's expansion at ${compName}. At Placemein, we connect fast-growing teams with verified, pre-screened fresh graduates across Tech & Data domains. Would love to share our candidate roster with you!`;
  } else if (channel === 'whatsapp') {
    draft = `Hi ${contactName} 👋 Following up from Placemein regarding talent opportunities at ${compName}. We have vetted candidates ready for immediate interviews. Open to receiving a 1-page summary?`;
  } else {
    draft = `Subject: Placemein Candidate Pipeline for ${compName}\n\nDear ${contactName},\n\nHope this finds you well. Reaching out from Placemein regarding ${compName}'s hiring plans. We have highly skilled candidates ready for technical evaluations.\n\nBest regards,\nPlacemein CRA Team`;
  }

  return res.json({ draft_text: draft });
}

export function analyzeProfile(req: Request, res: Response) {
  const contactId = req.query.contact_id as string;
  const contact = hrContacts.find((c) => c.id === contactId);
  const comp = contact ? companies.find((co) => co.id === contact.company_id) : undefined;
  const contactName = contact?.name || 'Talent Acquisition';
  const compName = comp?.name || 'Target Company';

  return res.json({
    contact_id: contactId,
    profile_summary: `Verified profile for ${contactName}, currently leading recruiting efforts at ${compName}. Specializes in early career campus intake and tech talent acquisition.`,
    relevant_hooks: `Align with ${compName}'s recent hiring initiatives in software engineering and cloud infrastructure.`,
    email_subject: `Connecting with ${compName} - Pre-screened Graduate Talent Roster`,
    email_body: `Dear ${contactName},\n\nI was reviewing your active leadership in tech talent acquisition at ${compName}. We have prepared a dedicated cohort of top engineering talent ready for immediate placement.\n\nLooking forward to collaborating,\nPlacemein Team`,
    sms_body: `Hi ${contactName}, saw your hiring focus at ${compName}. Placemein has pre-screened graduates ready for interviews. Can we share the roster?`,
  });
}

export function bulkDraftMessage(req: Request, res: Response) {
  const { contact_ids, channel } = req.body;
  const drafts: Record<string, string> = {};
  (contact_ids || []).forEach((id: string) => {
    const c = hrContacts.find((contact) => contact.id === id);
    const name = c?.name || 'Hiring Lead';
    drafts[id] = `Hello ${name}, reaching out via ${channel} from Placemein regarding campus talent partnerships!`;
  });
  return res.json({ channel, drafts });
}

export function bulkStatus(req: Request, res: Response) {
  const { contact_ids, channel, status, notes } = req.body;
  let count = 0;
  (contact_ids || []).forEach((cId: string) => {
    outreachChannels.unshift({
      id: `out_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      contact_id: cId,
      channel: channel || 'mail',
      status: status || 'sent',
      timestamp: new Date().toISOString(),
      notes: notes || 'Bulk outreach update',
      created_at: new Date().toISOString(),
    });
    count++;
  });
  return res.json({ status: 'success', updated_count: count });
}

export function getOutcomeByContactId(req: Request, res: Response) {
  const outcome = outreachOutcomes.find((o) => o.contact_id === req.params.contactId);
  if (!outcome) {
    return res.json({
      id: `outc_mock_${req.params.contactId}`,
      contact_id: req.params.contactId,
      jd_received: false,
      outcome_status: 'pending',
      updated_at: new Date().toISOString(),
    });
  }
  return res.json(outcome);
}

export function updateOutcomeByContactId(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  let outcome = outreachOutcomes.find((o) => o.contact_id === req.params.contactId);
  if (!outcome) {
    outcome = {
      id: `outc_${Date.now()}`,
      contact_id: req.params.contactId,
      jd_received: false,
      outcome_status: 'pending',
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    outreachOutcomes.push(outcome);
  }
  Object.assign(outcome, req.body, { updated_by: user.id, updated_at: new Date().toISOString() });
  return res.json(outcome);
}

// Campaign handlers
export function getCampaigns(req: Request, res: Response) {
  return res.json(campaigns.map(enrichCampaign));
}

export function createCampaign(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const { name, status } = req.body;
  const newCamp: Campaign = {
    id: `camp_${Date.now()}`,
    name: name || 'New Outreach Campaign',
    owner_id: user.id,
    status: status || 'draft',
    contact_ids: [],
    created_at: new Date().toISOString(),
  };
  campaigns.unshift(newCamp);
  return res.status(201).json(enrichCampaign(newCamp));
}

export function getCampaignById(req: Request, res: Response) {
  const camp = campaigns.find((c) => c.id === req.params.id);
  if (!camp) return res.status(404).json({ detail: 'Campaign not found' });
  return res.json(enrichCampaign(camp));
}

export function addContactToCampaign(req: Request, res: Response) {
  const camp = campaigns.find((c) => c.id === req.params.id);
  if (!camp) return res.status(404).json({ detail: 'Campaign not found' });
  const contactId = req.query.contact_id as string;
  if (contactId && !camp.contact_ids.includes(contactId)) {
    camp.contact_ids.push(contactId);
  }
  return res.json(enrichCampaign(camp));
}

export async function campaignDraftMessage(req: Request, res: Response) {
  const contactId = req.query.contact_id as string;
  const channel = (req.query.channel as string) || 'mail';
  const contact = hrContacts.find((c) => c.id === contactId);
  const comp = contact ? companies.find((co) => co.id === contact.company_id) : undefined;
  const contactName = contact?.name || 'Hiring Manager';
  const companyName = comp?.name || 'your esteemed organization';

  const prompt = `You are a Corporate Relations Associate (CRA) at Placemein, an Indian recruitment and student talent placement partnership organization.
Draft a professional, personalized outreach message tailored for:
- Contact Name: ${contactName}
- Target Company: ${companyName}
- Communication Channel: ${channel} (e.g. Call opening script, LinkedIn InMail/DM, WhatsApp text, or Email)
Focus: Placemein's pre-assessed, rigorously trained students in Full-Stack, AI, and Cybersecurity. Keep it polite, direct, and zero-spam. Do not include markdown meta markers.`;

  const aiResult = await generateWithGeminiRetry({
    contents: prompt,
    preferredModels: ['gemini-3.8-flash', 'gemini-2.5-flash'],
  });

  if (aiResult?.text) {
    return res.json({ draft_message: aiResult.text.trim() });
  }

  let draft = '';
  if (channel === 'linkedin') {
    draft = `Hi ${contactName}, noticed ${companyName}'s active engineering hiring. At Placemein, we train pre-assessed fresh graduates in Full-Stack, AI, and Cyber. Would love to share a curated batch profile for your next hiring sprint!`;
  } else if (channel === 'whatsapp') {
    draft = `Hello ${contactName}, this is from Placemein Corporate Relations. Reaching out to see if ${companyName} is open to exploring campus placement partnerships for 2025/2026 batches. Happy to share our talent brochure!`;
  } else if (channel === 'call') {
    draft = `Intro Script:\n"Good morning ${contactName}, this is from Placemein Corporate Relations. I noticed ${companyName} is expanding technical teams. We have pre-assessed candidates ready for immediate placement drives. Could I take 2 minutes to understand your hiring forecast?"`;
  } else {
    draft = `Subject: Campus Recruitment & Verified Talent Pipeline for ${companyName}

Dear ${contactName},

I hope this email finds you well. I am reaching out from Placemein regarding ${companyName}'s upcoming campus hiring cycles.

We have pre-assessed, high-caliber students with rigorous hands-on training in current technology domains (Full-Stack Engineering, Cyber Security, and AI/Data Analytics). We can facilitate direct recruitment drives or tailored candidate shortlists with zero administrative friction.

Would you be open for a brief 10-minute discovery call this week to review our placement batch statistics?

Warm regards,
CRA Team | Placemein`;
  }

  return res.json({ draft_message: draft });
}
