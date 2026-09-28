import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  size = 'md',
  children,
  footer,
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${sizeClasses[size]} bg-[#0B0F19] border border-neutral-700/80 rounded-2xl shadow-2xl shadow-black/90 z-10 my-8 overflow-hidden animate-in zoom-in-95 duration-200 ${className}`}
      >
        {/* Header */}
        {(title || icon) && (
          <div className="px-5 sm:px-6 py-4 border-b border-neutral-800/80 flex items-start justify-between gap-4 bg-[#0F1422]">
            <div className="flex items-start gap-3">
              {icon && (
                <div className="p-2 rounded-xl bg-purple-950/70 border border-purple-800/50 text-purple-300 shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h3>}
                {description && (
                  <p className="text-xs text-neutral-400 mt-0.5 leading-normal">{description}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 sm:p-6 text-neutral-200 max-h-[75vh] overflow-y-auto">{children}</div>

        {/* Footer Actions */}
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-neutral-800/80 bg-[#0F1422] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
