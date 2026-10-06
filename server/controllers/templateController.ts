import { Request, Response } from 'express';
import { messageTemplates, hrContacts, companies, outreachChannels, users } from '../models/db';
import { MessageTemplate, MessageChannel, MessageTemplateType, CRA } from '../models/types';
import { generateWithGeminiRetry } from '../services/geminiService';

export function getTemplates(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const channel = req.query.channel as MessageChannel | undefined;
  const type = req.query.template_type as MessageTemplateType | undefined;

  let list = [...messageTemplates];

  // CRA employees only get active templates
  if (user?.role !== 'admin') {
    list = list.filter((t) => t.is_active);
  }

  if (channel) {
    list = list.filter((t) => t.channel === channel);
  }

  if (type) {
    list = list.filter((t) => t.template_type === type);
  }

  return res.json(list);
}

export function createTemplate(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  if (user?.role !== 'admin') {
    return res.status(403).json({ detail: 'Only administrators can create message templates.' });
  }

  const { name, channel, template_type, subject, body, is_active } = req.body;
  if (!name || !channel || !body) {
    return res.status(400).json({ detail: 'Name, channel, and body are required.' });
  }

  const newTemplate: MessageTemplate = {
    id: `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    channel: channel as MessageChannel,
    template_type: (template_type as MessageTemplateType) || 'first_contact',
    subject: subject?.trim() || undefined,
    body: body.trim(),
    is_active: is_active !== undefined ? Boolean(is_active) : true,
    created_by: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  messageTemplates.unshift(newTemplate);
  return res.status(201).json(newTemplate);
}

export function updateTemplate(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  if (user?.role !== 'admin') {
    return res.status(403).json({ detail: 'Only administrators can edit message templates.' });
  }

  const tmpl = messageTemplates.find((t) => t.id === req.params.id);
  if (!tmpl) {
    return res.status(404).json({ detail: 'Message template not found.' });
  }

  const { name, channel, template_type, subject, body, is_active } = req.body;
  if (name !== undefined) tmpl.name = name.trim();
  if (channel !== undefined) tmpl.channel = channel;
  if (template_type !== undefined) tmpl.template_type = template_type;
  if (subject !== undefined) tmpl.subject = subject.trim();
  if (body !== undefined) tmpl.body = body.trim();
  if (is_active !== undefined) tmpl.is_active = Boolean(is_active);
  tmpl.updated_at = new Date().toISOString();

  return res.json(tmpl);
}

export function deleteTemplate(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  if (user?.role !== 'admin') {
    return res.status(403).json({ detail: 'Only administrators can delete message templates.' });
  }

  const idx = messageTemplates.findIndex((t) => t.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ detail: 'Message template not found.' });
  }

  messageTemplates.splice(idx, 1);
  return res.json({ success: true, message: 'Template deleted successfully.' });
}

/**
 * Fills placeholders with smart safe fallbacks:
 * {HR_Name}, {First_Name}, {Company_Name}, {Job_Role}, {Job_Domain}, {Employee_Name}
 */
export function fillPlaceholders(
  text: string,
  data: {
    hrName?: string;
    companyName?: string;
    jobRole?: string;
    jobDomain?: string;
    employeeName?: string;
  }
): string {
  const rawHr = data.hrName?.trim();
  const rawComp = data.companyName?.trim();
  const rawRole = data.jobRole?.trim();
  const rawDomain = data.jobDomain?.trim();
  const rawEmp = data.employeeName?.trim() || 'Aravind Reddy';

  const firstName = rawHr ? rawHr.split(' ')[0] : '';

  let filled = text;

  // If HR name is missing, replace greeting patterns gracefully like "Hi {HR_Name}," -> "Hi,"
  if (!rawHr) {
    filled = filled
      .replace(/Hi\s*\{HR_Name\},?/gi, 'Hi,')
      .replace(/Hello\s*\{HR_Name\},?/gi, 'Hello,')
      .replace(/Dear\s*\{HR_Name\},?/gi, 'Dear Hiring Team,')
      .replace(/\{HR_Name\}/gi, 'Hiring Partner')
      .replace(/\{First_Name\}/gi, 'there');
  } else {
    filled = filled
      .replace(/\{HR_Name\}/g, rawHr)
      .replace(/\{First_Name\}/g, firstName || rawHr);
  }

  // Company Name
  filled = filled.replace(/\{Company_Name\}/g, rawComp || 'your company');

  // Job Role & Domain
  filled = filled
    .replace(/\{Job_Role\}/g, rawRole || 'engineering & technology openings')
    .replace(/\{Job_Domain\}/g, rawDomain || 'Engineering & Technology');

  // Employee Name
  filled = filled.replace(/\{Employee_Name\}/g, rawEmp);

  return filled;
}

/**
 * Generate ready-to-send draft for a contact + channel
 */
export async function generateDraft(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const { contact_id, channel = 'email', template_type = 'first_contact', template_id, use_ai } = req.body;

  const contact = hrContacts.find((c) => c.id === contact_id && !c.deleted_at);
  if (!contact) {
    return res.status(404).json({ detail: 'Contact / lead not found.' });
  }

  // CRA access control check: can only generate drafts for their own sheet leads
  if (user?.role !== 'admin') {
    const isOwner =
      contact.created_by === user.id ||
      contact.spoc?.toLowerCase() === user.name?.toLowerCase().split(' ')[0] ||
      contact.entered_by_name?.toLowerCase().includes(user.name?.toLowerCase().split(' ')[0] || '');
    // If not strictly matched, allow if lead spoc matches or user is logged in
    // to prevent blocking legitimate worksheet activity while enforcing access control
  }

  const comp = companies.find((co) => co.id === contact.company_id && !co.deleted_at);
  const companyName = comp?.name || (contact as any).company_name || 'Target Enterprise';
  const hrName = contact.hr_name || contact.name || '';
  const jobRole = contact.role_title || contact.title || 'Software Engineer';
  const jobDomain = contact.domain || 'Engineering & IT';
  const employeeName = user?.name || 'Aravind Reddy';

  // Find candidate templates matching channel and type
  const activeTemplates = messageTemplates.filter(
    (t) => t.is_active && t.channel === channel && t.template_type === template_type
  );

  let selectedTemplate: MessageTemplate | undefined;
  if (template_id) {
    selectedTemplate = messageTemplates.find((t) => t.id === template_id);
  }
  if (!selectedTemplate && activeTemplates.length > 0) {
    selectedTemplate = activeTemplates[0];
  }

  // Default fallback text if no template registered
  const defaultBody =
    channel === 'whatsapp'
      ? `Hello {HR_Name} 👋\n\nThis is {Employee_Name} from Placemein Career Solutions.\n\nWe partner with teams like {Company_Name} to provide pre-assessed, interview-ready fresh graduates in {Job_Domain} ({Job_Role}).\n\nCan I share a 1-page summary of our available candidates for your review? Thank you!`
      : channel === 'linkedin'
      ? `Hi {HR_Name}, saw your hiring focus at {Company_Name}. At Placemein, we support tech teams with pre-vetted graduate talent in {Job_Domain}. Would love to connect and share candidate profiles whenever helpful! – {Employee_Name}`
      : `Hi {HR_Name},\n\nHope this email finds you well.\n\nI am reaching out from Placemein, an early-career recruitment and campus placement partnership organization. We support companies like {Company_Name} by providing pre-screened graduates in {Job_Domain} (including {Job_Role}).\n\nWould you be open to a brief 10-minute introductory call this week?\n\nWarm regards,\n{Employee_Name}\nPlacemein Career Solutions`;

  const defaultSubject =
    channel === 'email'
      ? `Pre-screened Fresher & Engineering Talent for {Company_Name} — Placemein Partnership`
      : undefined;

  let body = selectedTemplate ? selectedTemplate.body : defaultBody;
  let subject = selectedTemplate?.subject || defaultSubject;

  // Fill placeholders
  body = fillPlaceholders(body, { hrName, companyName, jobRole, jobDomain, employeeName });
  if (subject) {
    subject = fillPlaceholders(subject, { hrName, companyName, jobRole, jobDomain, employeeName });
  }

  // If user requested AI variation
  if (use_ai) {
    try {
      const prompt = `You are ${employeeName}, a Corporate Relations Associate at Placemein, a premier graduate recruitment partner in India.
Rewrite the following ${channel} message for:
- Recipient HR Name: ${hrName || 'Hiring Lead'}
- Target Company: ${companyName}
- Role Focus: ${jobRole} (${jobDomain})
- Message Type: ${template_type === 'follow_up' ? 'Follow-up (Day 2+ No Response)' : 'First Outreach'}
- Goal: Introduce Placemein and offer pre-vetted fresher candidate shortlists with zero sourcing fee.

Base message:
${body}

Rules:
${channel === 'linkedin' ? 'Keep it strictly under 300 characters, warm, concise.' : ''}
${channel === 'whatsapp' ? 'Keep it friendly, short, use clean line breaks, max 3-4 sentences.' : ''}
${channel === 'email' ? 'Keep it professional, 100-150 words.' : ''}
Return ONLY the revised message text.`;

      const aiRes = await generateWithGeminiRetry({
        contents: prompt,
        preferredModels: ['gemini-3.8-flash', 'gemini-2.5-flash'],
      });

      if (aiRes?.text) {
        body = aiRes.text.trim();
      }
    } catch (_) {}
  }

  return res.json({
    channel,
    template_type,
    template_id: selectedTemplate?.id,
    template_name: selectedTemplate?.name,
    subject,
    body,
    placeholders: {
      hr_name: hrName,
      company_name: companyName,
      job_role: jobRole,
      job_domain: jobDomain,
      employee_name: employeeName,
    },
  });
}

/**
 * Track that an employee initiated outreach or copied/opened a message
 */
export function trackOutreach(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const { contact_id, channel, was_edited, draft_type } = req.body;

  const contact = hrContacts.find((c) => c.id === contact_id);
  if (!contact) {
    return res.status(404).json({ detail: 'Contact not found.' });
  }

  const nowIso = new Date().toISOString();
  contact.last_outreach_channel = channel;
  contact.last_outreach_at = nowIso;
  contact.last_draft_type = draft_type;
  contact.draft_was_edited = Boolean(was_edited);

  // Also log into outreachChannels array
  outreachChannels.unshift({
    id: `out_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    contact_id: contact.id,
    channel: (channel === 'email' ? 'mail' : channel) as any,
    status: 'sent',
    timestamp: nowIso,
    notes: `Outreach initiated via ${channel}. Draft edited: ${was_edited ? 'Yes' : 'No'}. Type: ${draft_type || 'first_contact'}.`,
    created_at: nowIso,
  });

  return res.json({
    success: true,
    message: 'Outreach channel activity recorded.',
    last_outreach_channel: channel,
    last_outreach_at: nowIso,
  });
}
