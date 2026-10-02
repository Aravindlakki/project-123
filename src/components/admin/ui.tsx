import React, { useEffect } from 'react';
import { X, LucideIcon } from 'lucide-react';

/* ==============================================================================
   Admin Leadership Portal UI Primitives
   Shared kit for all admin pages and chrome
   ============================================================================== */

/* -----------------------------------------------------------------------------
   1. AdminPageHeader
   ----------------------------------------------------------------------------- */
export interface AdminPageHeaderProps {
  title: string;
  badge?: string;
  badgeIcon?: LucideIcon;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  badge = 'Admin Portal',
  badgeIcon: BadgeIcon,
  subtitle,
  actions,
  children,
}) => {
  return (
    <div className="admin-page-header">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="admin-badge admin-badge-gold">
              {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
              {badge}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl font-normal leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
      {children && <div className="mt-4 pt-4 border-t border-slate-700/40">{children}</div>}
    </div>
  );
};

/* -----------------------------------------------------------------------------
   2. AdminCard
   ----------------------------------------------------------------------------- */
export interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const AdminCard: React.FC<AdminCardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`admin-card ${className}`} {...props}>
      {(title || action) && (
        <div className="admin-card-header">
          <div>
            {title && <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

/* -----------------------------------------------------------------------------
   3. AdminButton (5 variants × 2 sizes)
   ----------------------------------------------------------------------------- */
export interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children?: React.ReactNode;
}

export const AdminButton: React.FC<AdminButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const variantClass = `admin-btn-${variant}`;
  const sizeClass = `admin-btn-${size}`;

  return (
    <button
      className={`admin-btn ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      )}
    </button>
  );
};

/* -----------------------------------------------------------------------------
   4. AdminIconButton
   ----------------------------------------------------------------------------- */
export interface AdminIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  size?: 'sm' | 'md';
  tooltip?: string;
  variant?: 'elevated' | 'ghost' | 'danger' | 'gold';
}

export const AdminIconButton: React.FC<AdminIconButtonProps> = ({
  icon: Icon,
  size = 'md',
  tooltip,
  variant = 'elevated',
  className = '',
  disabled,
  ...props
}) => {
  const variantClass =
    variant === 'gold'
      ? 'text-[#e8b339] border-[#e8b339]/40 bg-[#e8b339]/10 hover:bg-[#e8b339]/20'
      : variant === 'danger'
      ? 'text-red-400 border-red-500/30 hover:bg-red-500/20'
      : variant === 'ghost'
      ? 'border-transparent bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-white'
      : '';

  return (
    <button
      className={`admin-icon-btn ${variantClass} ${className}`}
      title={tooltip}
      aria-label={tooltip}
      disabled={disabled}
      {...props}
    >
      <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
    </button>
  );
};

/* -----------------------------------------------------------------------------
   5. Form Controls: AdminLabel, AdminInput, AdminSelect, AdminTextarea
   ----------------------------------------------------------------------------- */
export interface AdminLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const AdminLabel: React.FC<AdminLabelProps> = ({
  children,
  required,
  className = '',
  ...props
}) => (
  <label className={`admin-label ${className}`} {...props}>
    {children}
    {required && <span className="text-[#e8b339] ml-1">*</span>}
  </label>
);

export interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  inputSize?: 'sm' | 'md';
}

export const AdminInput = React.forwardRef<HTMLInputElement, AdminInputProps>(
  ({ icon: Icon, inputSize = 'md', className = '', ...props }, ref) => {
    return (
      <div className="relative w-full">
        {Icon && (
          <Icon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        )}
        <input
          ref={ref}
          className={`admin-input ${Icon ? 'admin-input-has-icon' : ''} ${
            inputSize === 'sm' ? 'admin-input-sm' : ''
          } ${className}`}
          {...props}
        />
      </div>
    );
  }
);
AdminInput.displayName = 'AdminInput';

export interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  inline?: boolean;
  selectSize?: 'sm' | 'md';
}

export const AdminSelect = React.forwardRef<HTMLSelectElement, AdminSelectProps>(
  ({ inline, selectSize = 'md', className = '', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`admin-select ${inline ? 'admin-select-inline' : ''} ${
          selectSize === 'sm' ? 'admin-select-sm' : ''
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);
AdminSelect.displayName = 'AdminSelect';

export interface AdminTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const AdminTextarea = React.forwardRef<HTMLTextAreaElement, AdminTextareaProps>(
  ({ className = '', ...props }, ref) => {
    return <textarea ref={ref} className={`admin-textarea ${className}`} {...props} />;
  }
);
AdminTextarea.displayName = 'AdminTextarea';

/* -----------------------------------------------------------------------------
   6. AdminModal
   ----------------------------------------------------------------------------- */
export interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  icon?: LucideIcon;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  maxWidth = 'md',
  children,
  footer,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass =
    maxWidth === 'sm'
      ? 'max-w-md'
      : maxWidth === 'lg'
      ? 'max-w-2xl'
      : maxWidth === 'xl'
      ? 'max-w-4xl'
      : 'max-w-lg';

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className={`admin-modal ${maxWidthClass}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="admin-modal-header">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-xl bg-[#e8b339]/15 border border-[#e8b339]/30 text-[#e8b339]">
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div>
              <h3 className="text-base font-black text-white tracking-tight">{title}</h3>
              {subtitle && <p className="text-xs text-slate-400 font-normal">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
        {footer && <div className="admin-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

/* -----------------------------------------------------------------------------
   7. AdminBadge
   ----------------------------------------------------------------------------- */
export interface AdminBadgeProps {
  variant?: 'gold' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({
  variant = 'gold',
  icon: Icon,
  children,
  className = '',
}) => {
  return (
    <span className={`admin-badge admin-badge-${variant} ${className}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
};

/* -----------------------------------------------------------------------------
   8. AdminStatCard
   ----------------------------------------------------------------------------- */
export interface AdminStatCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  icon?: LucideIcon;
  gold?: boolean;
  className?: string;
}

export const AdminStatCard: React.FC<AdminStatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  gold = false,
  className = '',
}) => {
  return (
    <div className={`admin-stat-card ${gold ? 'admin-stat-card-gold' : ''} ${className}`}>
      <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-2">
        <span className="uppercase tracking-wider text-[10px] text-slate-400">{label}</span>
        {Icon && <Icon className={`h-4 w-4 ${gold ? 'text-[#e8b339]' : 'text-slate-400'}`} />}
      </div>
      <div className={`text-2xl font-black ${gold ? 'text-[#e8b339]' : 'text-white'}`}>{value}</div>
      {subtext && <div className="text-[11px] text-slate-400 mt-1 font-medium">{subtext}</div>}
    </div>
  );
};

/* -----------------------------------------------------------------------------
   9. AdminTable
   ----------------------------------------------------------------------------- */
export interface AdminTableProps {
  headers: React.ReactNode[];
  children: React.ReactNode;
  className?: string;
}

export const AdminTable: React.FC<AdminTableProps> = ({ headers, children, className = '' }) => {
  return (
    <div className={`admin-table-wrap ${className}`}>
      <table className="admin-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

/* -----------------------------------------------------------------------------
   10. AdminEmptyState
   ----------------------------------------------------------------------------- */
export interface AdminEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="admin-empty-state">
      <div className="admin-empty-icon">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
