import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { api } from '../services/api';
import {
  AlertTriangle,
  Trash2,
  X,
  Loader2,
  Users,
  Briefcase,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

interface DeleteCompanyModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deletedCompany: Company) => void;
  onError: (errorMessage: string) => void;
}

export const DeleteCompanyModal: React.FC<DeleteCompanyModalProps> = ({
  company,
  isOpen,
  onClose,
  onSuccess,
  onError,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [counts, setCounts] = useState<{ leads_count: number; jds_count: number; tasks_count: number }>({
    leads_count: 0,
    jds_count: 0,
    tasks_count: 0,
  });

  useEffect(() => {
    if (isOpen && company) {
      setIsLoadingCounts(true);
      api.getCompanyLinkedRecords(company.id)
        .then((res) => setCounts(res))
        .catch(() => {
          // Fallback from company object if available
          setCounts({
            leads_count: company.contacts?.length || company.contacts_count || 0,
            jds_count: company.jds?.length || 0,
            tasks_count: 0,
          });
        })
        .finally(() => setIsLoadingCounts(false));
    }
  }, [isOpen, company]);

  if (!isOpen || !company) return null;

  const totalLinked = counts.leads_count + counts.jds_count;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteCompany(company.id);
      onSuccess(company);
      onClose();
    } catch (err: any) {
      onError(err.message || 'Failed to delete company. Admin privileges required.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete Company</h3>
              <p className="text-xs text-rose-300/80 font-medium mt-0.5">Administrator Action Only</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80">
            <p className="text-sm text-slate-200">
              Are you sure you want to delete <strong className="text-white font-semibold">"{company.name}"</strong>?
            </p>
            <p className="text-xs text-rose-400 font-semibold mt-1">
              ⚠️ This cannot be undone. The company will be archived and removed from all directories and searches.
            </p>
          </div>

          {/* Linked Records Warning & Breakdown */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Linked Records Check
            </span>

            {isLoadingCounts ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                <span>Checking linked leads, contacts, and JD entries...</span>
              </div>
            ) : totalLinked > 0 ? (
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Associated records detected ({totalLinked} total)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Deleting this company will automatically cascade-archive all linked entries to prevent orphaned data:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-1.5 bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-slate-300">
                    <Users className="h-3.5 w-3.5 text-blue-400" />
                    <span><strong>{counts.leads_count}</strong> HR Contact / Lead{counts.leads_count === 1 ? '' : 's'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-slate-300">
                    <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
                    <span><strong>{counts.jds_count}</strong> Job Role{counts.jds_count === 1 ? '' : 's'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>No active linked leads or JDs found. Safe to remove.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-lg shadow-rose-950/50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Confirm & Delete Company</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
