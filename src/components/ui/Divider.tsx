import React from 'react';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const Divider: React.FC<DividerProps> = ({
  label,
  orientation = 'horizontal',
  className = '',
  ...props
}) => {
  if (orientation === 'vertical') {
    return (
      <div
        className={`inline-block self-stretch w-[1px] bg-neutral-800/80 mx-2 ${className}`}
        role="separator"
        aria-orientation="vertical"
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div
        className={`relative flex items-center justify-center my-4 ${className}`}
        role="separator"
        {...props}
      >
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-800/80" />
        </div>
        <div className="relative px-3 bg-[#0B0F19] text-[11px] font-semibold tracking-wider uppercase text-neutral-400 select-none">
          {label}
        </div>
      </div>
    );
  }

  return (
    <hr
      className={`border-t border-neutral-800/80 my-4 ${className}`}
      role="separator"
      {...props}
    />
  );
};
