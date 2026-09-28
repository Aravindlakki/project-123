import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'gradient-border' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles: Record<string, string> = {
  default:
    'bg-[#0B0F19]/90 border border-neutral-800/80 text-neutral-100 shadow-xl shadow-black/40',
  elevated:
    'bg-[#0F1422] border border-neutral-700/80 text-neutral-100 shadow-2xl shadow-black/60',
  glass:
    'bg-gray-950/60 backdrop-blur-md border border-neutral-800/70 text-neutral-100 shadow-lg',
  'gradient-border':
    'bg-[#0B0F19] relative before:absolute before:-inset-[1px] before:rounded-2xl before:bg-gradient-to-r before:from-purple-500/40 before:via-indigo-500/20 before:to-purple-500/40 before:-z-10 text-neutral-100 shadow-2xl shadow-purple-950/30',
  interactive:
    'bg-[#0B0F19]/90 border border-neutral-800/80 hover:border-purple-500/50 hover:bg-[#0F1422] transition-all duration-200 text-neutral-100 shadow-xl hover:shadow-2xl hover:shadow-purple-950/20 cursor-pointer',
};

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-2xl relative ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`flex flex-col space-y-1.5 pb-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <h3
      className={`text-base sm:text-lg font-bold text-white tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <p className={`text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`min-w-0 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`flex items-center justify-between pt-4 mt-4 border-t border-neutral-800/80 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
