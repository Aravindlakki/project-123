import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline'
  | 'neutral'
  | 'purple'
  | 'amber';

export type BadgeSize = 'sm' | 'md' | 'lg';
export type BadgeShape = 'pill' | 'rounded';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  dot?: boolean;
  dotColor?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-neutral-800 text-neutral-200 border-neutral-700/60',
  neutral: 'bg-neutral-900/90 text-neutral-300 border-neutral-700/80',
  primary: 'bg-purple-950/80 text-purple-200 border-purple-700/50 shadow-sm shadow-purple-900/30',
  purple: 'bg-purple-900/40 text-purple-300 border-purple-500/40',
  secondary: 'bg-indigo-950/70 text-indigo-200 border-indigo-700/40',
  amber: 'bg-amber-950/80 text-amber-200 border-amber-600/50 shadow-sm shadow-amber-900/20',
  warning: 'bg-amber-950/60 text-amber-300 border-amber-600/40',
  success: 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40',
  danger: 'bg-rose-950/70 text-rose-300 border-rose-600/40',
  info: 'bg-cyan-950/70 text-cyan-300 border-cyan-600/40',
  outline: 'bg-transparent text-neutral-300 border-neutral-600 hover:border-neutral-500',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-neutral-400',
  neutral: 'bg-neutral-400',
  primary: 'bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.8)]',
  purple: 'bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.8)]',
  secondary: 'bg-indigo-400',
  amber: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]',
  warning: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]',
  success: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]',
  danger: 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)]',
  info: 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]',
  outline: 'bg-neutral-400',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-2 py-0.5 gap-1 tracking-wider',
  md: 'text-xs px-2.5 py-1 gap-1.5 tracking-wide',
  lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  shape = 'pill',
  dot = false,
  dotColor,
  icon,
  className = '',
  children,
  ...props
}) => {
  const shapeClass = shape === 'pill' ? 'rounded-full' : 'rounded-lg';
  const baseDotClass = dotColor || dotColors[variant];

  return (
    <span
      className={`inline-flex items-center font-medium border select-none transition-colors ${shapeClass} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 animate-pulse ${baseDotClass}`}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
};
