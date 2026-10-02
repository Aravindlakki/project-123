import React from 'react';
import { X } from 'lucide-react';

/* ============================================================================
 * SHARED ADMIN COMPONENTS
 * The only building blocks admin pages should use for chrome (headers, cards,
 * buttons, forms, tables, modals). Every class maps to a token defined in
 * src/styles/adminTheme.css under [data-portal="admin"].
 * ========================================================================== */

/* ------------------------------------------------------------- PageHeader */
export interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  subtitle,
  badge,
  icon,
  actions,
}) => (
  <div className="admin-page-header">
    <div className="min-w-0">
      {badge && <div className="mb-1">{badge}</div>}
      <h1>
        {icon}
        {title}
      </h1>
      {subtitle && <p className="admin-page-header-sub">{subtitle}</p>}
    </div>
    {actions && <div className="admin-page-header-actions">{actions}</div>}
  </div>
);

/* ------------------------------------------------------------------- Card */
export interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}

export const AdminCard: React.FC<AdminCardProps> = ({ children, className = '', padded = false }) => (
  <div className={`admin-card ${padded ? 'admin-card-padded' : ''} ${className}`}>{children}</div>
);

/* ----------------------------------------------------------------- Button */
export interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md';
}

export const AdminButton: React.FC<AdminButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...rest
}) => (
  <button
    type={type}
    className={`admin-btn admin-btn-${variant} ${size === 'sm' ? 'admin-btn-sm' : ''} ${className}`}
    {...rest}
  >
    {children}
  </button>
);

export interface AdminIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const AdminIconButton: React.FC<AdminIconButtonProps> = ({ label, className = '', children, ...rest }) => (
  <button type="button" title={label} aria-label={label} className={`admin-icon-btn ${className}`} {...rest}>
    {children}
  </button>
);

/* ------------------------------------------------------------ Form pieces */
export const AdminLabel: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <label className={`admin-label ${className}`} {...rest}>
    {children}
  </label>
);

export const AdminInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = '',
  ...rest
}) => <input className={`admin-input ${className}`} {...rest} />;

export const AdminSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <select className={`admin-select ${className}`} {...rest}>
    {children}
  </select>
);

export const AdminTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className = '',
  ...rest
}) => <textarea className={`admin-textarea ${className}`} {...rest} />;

/* ------------------------------------------------------------------ Modal */
export interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
  closeOnOverlay?: boolean;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = 36,
  closeOnOverlay = true,
}) => {
  if (!isOpen) return null;
  return (
    <div
      className="admin-modal-overlay"
      onClick={closeOnOverlay ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div className="admin-modal" style={{ maxWidth: `${maxWidth}rem` }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="min-w-0">
            <div className="admin-modal-title">
              {icon}
              <span>{title}</span>
            </div>
            {subtitle && <span className="admin-modal-subtitle">{subtitle}</span>}
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Close dialog">
            <X className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
        {footer && <div className="admin-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ Badge */
export interface AdminBadgeProps {
  tone?: 'gold' | 'success' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({ tone = 'neutral', children }) => (
  <span className={`admin-badge admin-badge-${tone}`}>{children}</span>
);

/* -------------------------------------------------------------- StatCard */
export interface AdminStatCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: 'default' | 'gold' | 'success' | 'info' | 'danger';
  className?: string;
}

export const AdminStatCard: React.FC<AdminStatCardProps> = ({ label, value, tone = 'default', className = '' }) => (
  <div className={`admin-stat ${className}`}>
    <div className="admin-stat-label">{label}</div>
    <div className={`admin-stat-value ${tone !== 'default' ? `tone-${tone}` : ''}`}>{value}</div>
  </div>
);

/* ------------------------------------------------------------------ Table */
export const AdminTable: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`admin-table-wrap ${className}`}>
    <table className="admin-table">{children}</table>
  </div>
);

/* ------------------------------------------------------------- EmptyState */
export const AdminEmptyState: React.FC<{ icon?: React.ReactNode; title: string; message?: string }> = ({
  icon,
  title,
  message,
}) => (
  <div className="admin-empty">
    {icon}
    <div className="font-bold text-sm" style={{ color: 'var(--admin-text)' }}>
      {title}
    </div>
    {message && <div className="text-xs">{message}</div>}
  </div>
);
