import React, { useState, useEffect, useMemo } from 'react';
import { HRContact, CRA, MessageChannel, MessageTemplateType, MessageTemplate } from '../types';
import { api } from '../services/api';
import {
  X,
  Mail,
  MessageCircle,
  Linkedin,
  Copy,
  Check,
  RotateCw,
  ExternalLink,
  Sparkles,
  Camera,
  CheckCircle2,
  Clock,
  Send,
  Building2,
  User,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

interface OutreachDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: HRContact | null;
  currentUser: CRA | null;
  onMarkContactedAndUploadProof?: (lead: HRContact, channel: 'mailed' | 'messaged' | 'called') => void;
}

export const OutreachDraftModal: React.FC<OutreachDraftModalProps> = ({
  isOpen,
  onClose,
  lead,
  currentUser,
  onMarkContactedAndUploadProof,
}) => {
  const [activeChannel, setActiveChannel] = useState<MessageChannel>('email');
  const [templateType, setTemplateType] = useState<MessageTemplateType>('first_contact');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [originalBody, setOriginalBody] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [templateIndex, setTemplateIndex] = useState(0);
  const [showPromptBanner, setShowPromptBanner] = useState(false);
  const [hasMarkedContacted, setHasMarkedContacted] = useState(false);

  // Auto-detect if lead is overdue for follow-up (e.g. status is Follow-up or response is no_response_yet and > 2 days)
  useEffect(() => {
    if (lead) {
      const isFollowUpStage =
        lead.status === 'Follow-up' ||
        lead.remarks?.toLowerCase().includes('follow') ||
        (lead.response_status === 'no_response_yet' && Boolean(lead.created_at && (Date.now() - new Date(lead.created_at).getTime()) > 2 * 86400000));
      setTemplateType(isFollowUpStage ? 'follow_up' : 'first_contact');
      setShowPromptBanner(false);
      setHasMarkedContacted(false);
    }
  }, [lead]);

  // Load message templates
  useEffect(() => {
    if (isOpen) {
      api.getMessageTemplates().then(setTemplates).catch(() => []);
    }
  }, [isOpen]);

  // Filter templates matching current channel and type
  const matchingTemplates = useMemo(() => {
    return templates.filter((t) => t.channel === activeChannel && t.template_type === templateType && t.is_active);
  }, [templates, activeChannel, templateType]);

  // Generate or refill draft
  const loadDraft = async (useAi: boolean = false, rotateIdx?: number) => {
    if (!lead) return;
    setIsGenerating(true);
    try {
      const candidateTemplate = matchingTemplates.length > 0
        ? matchingTemplates[(rotateIdx !== undefined ? rotateIdx : templateIndex) % matchingTemplates.length]
        : undefined;

      const res = await api.generateOutreachDraft({
        contact_id: lead.id,
        channel: activeChannel,
        template_type: templateType,
        template_id: candidateTemplate?.id,
        use_ai: useAi,
      });

      setSubject(res.subject || '');
      setBody(res.body || '');
      setOriginalBody(res.body || '');
    } catch (_) {
      // Fallback in-client generation if network fails
      fillClientFallback(rotateIdx);
    } finally {
      setIsGenerating(false);
    }
  };

  const fillClientFallback = (rotateIdx?: number) => {
    if (!lead) return;
    const hrName = (lead.hr_name || lead.name || '').trim();
    const companyName = (lead.company?.name || (lead as any).company_name || 'your company').trim();
    const jobRole = (lead.role_title || lead.title || 'engineering opportunities').trim();
    const jobDomain = (lead.domain || 'Technology & Engineering').trim();
    const employeeName = currentUser?.name || 'Aravind Reddy';

    const candidateTemplate = matchingTemplates.length > 0
      ? matchingTemplates[(rotateIdx !== undefined ? rotateIdx : templateIndex) % matchingTemplates.length]
      : undefined;

    let rawBody = candidateTemplate?.body || '';
    let rawSubject = candidateTemplate?.subject || `Pre-screened Fresher Talent for ${companyName} — Placemein`;

    if (!rawBody) {
      if (activeChannel === 'whatsapp') {
        rawBody = `Hello {HR_Name} 👋\n\nThis is {Employee_Name} from Placemein Career Solutions.\n\nWe partner with teams like {Company_Name} to provide pre-screened graduates in {Job_Domain} ({Job_Role}).\n\nMay I share a 1-page summary of available candidates? Thank you!`;
      } else if (activeChannel === 'linkedin') {
        rawBody = `Hi {HR_Name}, saw your hiring focus at {Company_Name}. At Placemein, we support tech teams with pre-vetted graduate talent in {Job_Domain}. Would love to connect and share candidate shortlists whenever helpful! – {Employee_Name}`;
      } else {
        rawBody = `Hi {HR_Name},\n\nI hope this email finds you well.\n\nI am reaching out from Placemein regarding hiring support for {Company_Name}. We provide pre-screened, interview-ready graduates in {Job_Domain} ({Job_Role}) at zero upfront sourcing fee.\n\nWould you be open to a brief 10-minute introductory call this week?\n\nWarm regards,\n{Employee_Name}\nPlacemein Career Solutions`;
      }
    }

    const replacer = (text: string) => {
      let s = text;
      if (!hrName) {
        s = s.replace(/Hi\s*\{HR_Name\},?/gi, 'Hi,').replace(/Hello\s*\{HR_Name\},?/gi, 'Hello,').replace(/\{HR_Name\}/gi, 'Hiring Lead');
      } else {
        s = s.replace(/\{HR_Name\}/g, hrName).replace(/\{First_Name\}/g, hrName.split(' ')[0]);
      }
      return s
        .replace(/\{Company_Name\}/g, companyName)
        .replace(/\{Job_Role\}/g, jobRole)
        .replace(/\{Job_Domain\}/g, jobDomain)
        .replace(/\{Employee_Name\}/g, employeeName);
    };

    const finalBody = replacer(rawBody);
    const finalSubject = replacer(rawSubject);
    setBody(finalBody);
    setOriginalBody(finalBody);
    setSubject(activeChannel === 'email' ? finalSubject : '');
  };

  // Re-generate whenever channel, type, or lead changes
  useEffect(() => {
    if (isOpen && lead) {
      loadDraft(false, 0);
    }
  }, [isOpen, lead, activeChannel, templateType]);

  if (!isOpen || !lead) return null;

  const handleCopy = async (field: 'subject' | 'body' | 'all') => {
    let textToCopy = body;
    if (field === 'subject') textToCopy = subject;
    else if (field === 'all' && activeChannel === 'email') textToCopy = `Subject: ${subject}\n\n${body}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedField(field);
      setShowPromptBanner(true);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (_) {}
  };

  const handleRegenerate = () => {
    const nextIdx = (templateIndex + 1) % Math.max(1, matchingTemplates.length);
    setTemplateIndex(nextIdx);
    loadDraft(true, nextIdx);
  };

  // Channel link shortcuts
  const cleanPhone = (lead.hr_phone || lead.phone || '').replace(/[^\d]/g, '');
  const cleanEmail = (lead.hr_email || lead.email || '').trim();
  const linkedinProfile = lead.hr_linkedin || lead.linkedin_url || lead.company?.linkedin_url;

  const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=${encodeURIComponent(body)}` : null;
  const mailLink = cleanEmail ? `mailto:${cleanEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` : null;

  const handleMarkContacted = async () => {
    if (!lead) return;
    const wasEdited = body.trim() !== originalBody.trim();
    await api.trackLeadOutreach(lead.id, {
      channel: activeChannel,
      was_edited: wasEdited,
      draft_type: templateType,
    });
    setHasMarkedContacted(true);

    const mappedChannel: 'mailed' | 'messaged' | 'called' =
      activeChannel === 'email' ? 'mailed' : 'messaged';

    if (onMarkContactedAndUploadProof) {
      onMarkContactedAndUploadProof(lead, mappedChannel);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Send className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-white truncate">
                  Outreach Message Draft
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {lead.company?.name || (lead as any).company_name || 'Enterprise'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate flex items-center gap-2">
                <User className="h-3 w-3 text-slate-400" />
                <span>HR: <strong className="text-slate-200">{lead.hr_name || lead.name || 'Not specified'}</strong></span>
                <span className="text-slate-600">•</span>
                <span>Role: <strong className="text-slate-200">{lead.role_title || lead.title || 'Tech opening'}</strong></span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Channel & Type Selection Tabs */}
        <div className="p-3 sm:p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Channel Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveChannel('email')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeChannel === 'email'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveChannel('whatsapp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeChannel === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveChannel('linkedin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeChannel === 'linkedin'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <Linkedin className="h-3.5 w-3.5" />
              <span>LinkedIn</span>
            </button>
          </div>

          {/* First Contact vs Follow-Up Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTemplateType('first_contact')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                templateType === 'first_contact'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              First Contact
            </button>
            <button
              type="button"
              onClick={() => setTemplateType('follow_up')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                templateType === 'follow_up'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="h-3 w-3" />
              <span>Follow-up (Day 2+)</span>
            </button>
          </div>
        </div>

        {/* Draft Editor Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {/* Email Subject Field */}
          {activeChannel === 'email' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                <label>Subject Line</label>
                <button
                  type="button"
                  onClick={() => handleCopy('subject')}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition font-semibold"
                >
                  {copiedField === 'subject' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied Subject!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Subject</span>
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject line..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
          )}

          {/* Message Body Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300">
              <div className="flex items-center gap-2">
                <span>Message Body</span>
                {activeChannel === 'linkedin' && (
                  <span className={`text-[11px] px-1.5 py-0.2 rounded font-mono ${
                    body.length > 300 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {body.length}/300 chars
                  </span>
                )}
                {activeChannel === 'email' && (
                  <span className="text-[11px] text-slate-400">
                    (~{body.trim().split(/\s+/).filter(Boolean).length} words)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition font-semibold"
                  title="Rotate to another template or AI variation"
                >
                  <RotateCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate Variant</span>
                </button>
              </div>
            </div>

            <textarea
              rows={activeChannel === 'email' ? 10 : 6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Your outreach message..."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          {/* Prompt banner shown after copy or shortcut open */}
          {showPromptBanner && (
            <div className="bg-gradient-to-r from-emerald-950/60 to-indigo-950/60 border border-emerald-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Draft Copied / App Launched</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Sent this manually to HR? Log contact timestamp and upload screenshot proof for Admin verification.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleMarkContacted}
                disabled={hasMarkedContacted}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 self-start sm:self-center cursor-pointer shadow-md shadow-emerald-950"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Mark Contacted & Add Proof</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions & Shortcut Openers */}
        <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Shortcuts to Open Apps */}
          <div className="flex items-center gap-2 flex-wrap">
            {activeChannel === 'whatsapp' && (
              <a
                href={waLink || '#'}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowPromptBanner(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  cleanPhone
                    ? 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 pointer-events-none'
                }`}
                title={cleanPhone ? `Open WhatsApp Web (+${cleanPhone})` : 'No phone number for this HR contact'}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Open in WhatsApp</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {activeChannel === 'email' && (
              <a
                href={mailLink || '#'}
                onClick={() => setShowPromptBanner(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  cleanEmail
                    ? 'bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-500/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 pointer-events-none'
                }`}
                title={cleanEmail ? `Open Default Mail Client (${cleanEmail})` : 'No email address for this HR contact'}
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Open in Mail</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {linkedinProfile && (
              <a
                href={linkedinProfile.startsWith('http') ? linkedinProfile : `https://${linkedinProfile}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowPromptBanner(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600/20 text-sky-300 hover:bg-sky-600 hover:text-white border border-sky-500/30 flex items-center gap-1.5 transition"
                title="Open HR LinkedIn profile in new tab"
              >
                <Linkedin className="h-3.5 w-3.5" />
                <span>Open LinkedIn</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Primary Copy Buttons */}
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => handleCopy(activeChannel === 'email' ? 'all' : 'body')}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 cursor-pointer"
            >
              {copiedField ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-300 stroke-[3]" />
                  <span>Copied Message!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>{activeChannel === 'email' ? 'Copy Subject & Body' : 'Copy Message'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
