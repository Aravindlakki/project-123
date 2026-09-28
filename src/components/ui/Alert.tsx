import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export type AlertType = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  type?: AlertType;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const typeConfig: Record<
  AlertType,
  { container: string; icon: React.ReactNode; titleColor: string }
> = {
  info: {
    container: 'bg-cyan-950/60 border-cyan-800/60 text-cyan-200',
    icon: <Info className="h-4 w-4 text-cyan-400 shrink-0" />,
    titleColor: 'text-cyan-300',
  },
  success: {
    container: 'bg-emerald-950/60 border-emerald-800/60 text-emerald-200',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />,
    titleColor: 'text-emerald-300',
  },
  warning: {
    container: 'bg-amber-950/60 border-amber-800/60 text-amber-200',
    icon: <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />,
    titleColor: 'text-amber-300',
  },
  danger: {
    container: 'bg-rose-950/60 border-rose-800/60 text-rose-200',
    icon: <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />,
    titleColor: 'text-rose-300',
  },
};

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  onClose,
  action,
  className = '',
}) => {
  const cfg = typeConfig[type];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm shadow-md ${cfg.container} ${className}`}
    >
      <div className="pt-0.5">{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        {title && <h4 className={`font-bold mb-1 ${cfg.titleColor}`}>{title}</h4>}
        <div className="leading-relaxed opacity-90">{children}</div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 text-xs font-bold underline hover:opacity-80 cursor-pointer block"
          >
            {action.label}
          </button>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
