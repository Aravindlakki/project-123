import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'amber'
  | 'success';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-950/40 border border-purple-400/30 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
  amber:
    'bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-lg shadow-amber-950/40 border border-amber-400/30 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
  secondary:
    'bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-100 font-medium border border-neutral-700 shadow-sm active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
  outline:
    'bg-transparent hover:bg-neutral-800/60 text-neutral-200 font-medium border border-neutral-700/80 hover:border-neutral-500 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
  ghost:
    'bg-transparent hover:bg-neutral-800/60 text-neutral-300 hover:text-white font-medium active:scale-[0.99]',
  danger:
    'bg-rose-950/70 hover:bg-rose-900/80 text-rose-200 font-semibold border border-rose-700/60 shadow-lg shadow-rose-950/30 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
  success:
    'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-200 font-semibold border border-emerald-600/50 shadow-lg shadow-emerald-950/30 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'text-xs px-2.5 py-1 rounded-lg gap-1.5 min-h-[30px]',
  sm: 'text-xs px-3 py-1.5 rounded-xl gap-2 min-h-[36px]',
  md: 'text-sm px-4 py-2.5 rounded-xl gap-2 min-h-[42px]',
  lg: 'text-base px-5 py-3 rounded-2xl gap-2.5 min-h-[48px]',
  icon: 'p-2 rounded-xl min-w-[40px] min-h-[40px] justify-center',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children && <span className="truncate">{children}</span>}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export interface SocialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  provider: 'google' | 'microsoft' | 'github' | 'sso';
  label?: string;
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  label,
  className = '',
  ...props
}) => {
  const getProviderConfig = () => {
    switch (provider) {
      case 'google':
        return {
          defaultText: 'Continue with Google',
          icon: (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
              />
            </svg>
          ),
        };
      case 'microsoft':
        return {
          defaultText: 'Continue with Microsoft',
          icon: (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
          ),
        };
      case 'github':
        return {
          defaultText: 'Continue with GitHub',
          icon: (
            <svg className="h-4 w-4 shrink-0 fill-white" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          ),
        };
      case 'sso':
      default:
        return {
          defaultText: 'Single Sign-On (SSO)',
          icon: (
            <svg className="h-4 w-4 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          ),
        };
    }
  };

  const config = getProviderConfig();

  return (
    <button
      type="button"
      className={`w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-[#0F1422] hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700/80 hover:border-neutral-600 font-medium text-xs sm:text-sm shadow-md transition-all duration-150 cursor-pointer active:scale-[0.99] min-h-[42px] ${className}`}
      {...props}
    >
      {config.icon}
      <span>{label || config.defaultText}</span>
    </button>
  );
};
