import React, { useState, useEffect, useMemo } from 'react';
import { MessageTemplate, MessageChannel, MessageTemplateType, CRA } from '../types';
import { api } from '../services/api';
import {
  MessageSquareQuote,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Mail,
  MessageCircle,
  Linkedin,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Info,
  Layers,
  Send,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

interface MessageTemplatesPageProps {
  currentUser?: CRA | null;
}

export const MessageTemplatesPage: React.FC<MessageTemplatesPageProps> = ({ currentUser }) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [channelFilter, setChannelFilter] = useState<'all' | MessageChannel>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | MessageTemplateType>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [formName, setFormName] = useState('');
  const [formChannel, setFormChannel] = useState<MessageChannel>('email');
  const [formType, setFormType] = useState<MessageTemplateType>('first_contact');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation State
  const [templateToDelete, setTemplateToDelete] = useState<MessageTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMessageTemplates();
      setTemplates(data);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // If unauthorized CRA reaches this page, display clear restricted access notice
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="h-12 w-12 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Message template management is restricted to Administrators only. CRA Specialists can copy ready-to-send drafts directly from the Team Worksheet.
        </p>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormChannel('email');
    setFormType('first_contact');
    setFormSubject('');
    setFormBody('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: MessageTemplate) => {
    setEditingTemplate(t);
    setFormName(t.name);
    setFormChannel(t.channel);
    setFormType(t.template_type);
    setFormSubject(t.subject || '');
    setFormBody(t.body);
    setFormIsActive(t.is_active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBody.trim()) {
      showToast('error', 'Name and body are required.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingTemplate) {
        await api.updateMessageTemplate(editingTemplate.id, {
          name: formName.trim(),
          channel: formChannel,
          template_type: formType,
          subject: formChannel === 'email' ? formSubject.trim() : undefined,
          body: formBody.trim(),
          is_active: formIsActive,
        });
        showToast('success', `Template "${formName}" updated.`);
      } else {
        await api.createMessageTemplate({
          name: formName.trim(),
          channel: formChannel,
          template_type: formType,
          subject: formChannel === 'email' ? formSubject.trim() : undefined,
          body: formBody.trim(),
          is_active: formIsActive,
        });
        showToast('success', `Created new template "${formName}".`);
      }
      setIsModalOpen(false);
      loadTemplates();
    } catch (err: any) {
      showToast('error', err.message || 'Operation failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (t: MessageTemplate) => {
    try {
      await api.updateMessageTemplate(t.id, { is_active: !t.is_active });
      showToast('success', `Template ${!t.is_active ? 'activated' : 'deactivated'}.`);
      loadTemplates();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteMessageTemplate(templateToDelete.id);
      showToast('success', `Template "${templateToDelete.name}" deleted.`);
      setTemplateToDelete(null);
      loadTemplates();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete template');
    } finally {
      setIsDeleting(false);
    }
  };

  const insertPlaceholder = (tag: string) => {
    setFormBody((prev) => `${prev}${tag}`);
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (channelFilter !== 'all' && t.channel !== channelFilter) return false;
      if (typeFilter !== 'all' && t.template_type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesBody = t.body.toLowerCase().includes(q);
        const matchesSub = (t.subject || '').toLowerCase().includes(q);
        if (!matchesName && !matchesBody && !matchesSub) return false;
      }
      return true;
    });
  }, [templates, channelFilter, typeFilter, search]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border animate-in fade-in slide-in-from-bottom-2 ${
          toast.type === 'success'
            ? 'bg-slate-900 text-emerald-300 border-emerald-500/40'
            : 'bg-slate-900 text-rose-300 border-rose-500/40'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 border border-indigo-700/40 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold mb-2 border border-white/10">
            <MessageSquareQuote className="h-3.5 w-3.5 text-indigo-300" />
            <span>Admin Leadership Portal</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Outreach Message Templates</h1>
          <p className="text-indigo-200 text-xs mt-1 max-w-xl leading-relaxed">
            Manage the central message copy used by CRA employees when copying outreach drafts for Email, WhatsApp, and LinkedIn.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 transition cursor-pointer self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Template</span>
        </button>
      </div>

      {/* Placeholders Guide Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
            <Info className="h-4 w-4 text-indigo-400" />
            <span>Dynamic Placeholder Guide (Auto-Filled on Generation)</span>
          </div>
          <span className="text-[11px] text-slate-400">Missing fields safely fall back (e.g. "Hi," if no HR Name)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
            <code className="text-indigo-300 font-bold block">{'{HR_Name}'}</code>
            <span className="text-slate-400 text-[10px]">HR Recruiter Full Name</span>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
            <code className="text-indigo-300 font-bold block">{'{First_Name}'}</code>
            <span className="text-slate-400 text-[10px]">HR Contact First Name</span>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
            <code className="text-indigo-300 font-bold block">{'{Company_Name}'}</code>
            <span className="text-slate-400 text-[10px]">Target Hiring Enterprise</span>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
            <code className="text-indigo-300 font-bold block">{'{Job_Role}'}</code>
            <span className="text-slate-400 text-[10px]">Hiring Designation / Opening</span>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
            <code className="text-indigo-300 font-bold block">{'{Job_Domain}'}</code>
            <span className="text-slate-400 text-[10px]">Domain (e.g. AI, Cyber Security)</span>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
            <code className="text-indigo-300 font-bold block">{'{Employee_Name}'}</code>
            <span className="text-slate-400 text-[10px]">Logged-in CRA Specialist</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates by name, subject, or content..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Channel Filters */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setChannelFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                channelFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Channels
            </button>
            <button
              onClick={() => setChannelFilter('email')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                channelFilter === 'email' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="h-3 w-3" />
              <span>Email</span>
            </button>
            <button
              onClick={() => setChannelFilter('whatsapp')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                channelFilter === 'whatsapp' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageCircle className="h-3 w-3" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => setChannelFilter('linkedin')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                channelFilter === 'linkedin' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Linkedin className="h-3 w-3" />
              <span>LinkedIn</span>
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                typeFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('first_contact')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                typeFilter === 'first_contact' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              First Contact
            </button>
            <button
              onClick={() => setTypeFilter('follow_up')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                typeFilter === 'follow_up' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="h-3 w-3" />
              <span>Follow-Up</span>
            </button>
          </div>
        </div>
      </div>

      {/* Templates Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <MessageSquareQuote className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Message Templates Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No templates match your active filters. Click "+ Create New Template" to add one.
            </p>
          </div>
        ) : (
          filteredTemplates.map((t) => {
            const channelBadge =
              t.channel === 'email' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </span>
              ) : t.channel === 'whatsapp' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  WhatsApp
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                  <Linkedin className="h-3 w-3" />
                  LinkedIn
                </span>
              );

            const typeBadge =
              t.template_type === 'follow_up' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Follow-up (Day 2+)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  First Contact
                </span>
              );

            return (
              <div
                key={t.id}
                className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition space-y-3 ${
                  t.is_active ? 'border-slate-800 hover:border-indigo-500/40' : 'border-slate-800/40 opacity-60'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-white">{t.name}</h3>
                        {channelBadge}
                        {typeBadge}
                      </div>
                      {t.subject && (
                        <p className="text-xs text-slate-300 mt-1 font-medium line-clamp-1">
                          <strong className="text-slate-400">Subject:</strong> {t.subject}
                        </p>
                      )}
                    </div>

                    {/* Active toggle button */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(t)}
                      className="cursor-pointer"
                      title={t.is_active ? 'Deactivate template' : 'Activate template'}
                    >
                      {t.is_active ? (
                        <ToggleRight className="h-6 w-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-slate-500" />
                      )}
                    </button>
                  </div>

                  {/* Body Preview */}
                  <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-300 whitespace-pre-wrap line-clamp-6 leading-relaxed">
                    {t.body}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[11px]">
                    Status: <strong className={t.is_active ? 'text-emerald-400' : 'text-slate-500'}>
                      {t.is_active ? 'Active (Live for CRA)' : 'Inactive'}
                    </strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(t)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Edit2 className="h-3 w-3 text-indigo-400" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateToDelete(t)}
                      className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <form
            onSubmit={handleSave}
            className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95"
          >
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <h3 className="font-bold text-base text-white">
                {editingTemplate ? 'Edit Message Template' : 'Create New Message Template'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Template Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Graduate Tech Partner Intro"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Channel <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formChannel}
                    onChange={(e) => setFormChannel(e.target.value as MessageChannel)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Template Type <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as MessageTemplateType)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="first_contact">First Contact</option>
                    <option value="follow_up">Follow-up (Day 2+ No Response)</option>
                  </select>
                </div>
              </div>

              {formChannel === 'email' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Subject Line (Email Only)
                  </label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="e.g. Pre-screened Fresher Talent for {Company_Name} — Placemein"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Template Body <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Click chips below to insert:</span>
                </div>

                {/* Placeholder chips */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    '{HR_Name}',
                    '{First_Name}',
                    '{Company_Name}',
                    '{Job_Role}',
                    '{Job_Domain}',
                    '{Employee_Name}',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => insertPlaceholder(chip)}
                      className="px-2 py-0.5 bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/60 rounded-md text-[10px] font-mono text-indigo-300 transition"
                    >
                      +{chip}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={8}
                  required
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Type message text with placeholders..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="templateActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="templateActive" className="text-xs font-medium text-slate-300 cursor-pointer">
                  Activate this template immediately for CRA employee outreach drafts
                </label>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>{editingTemplate ? 'Save Changes' : 'Create Template'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Delete Template?</h3>
                <p className="text-xs text-rose-300/80 mt-0.5">"{templateToDelete.name}"</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this template? Employees will no longer be able to generate drafts using this variant.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
