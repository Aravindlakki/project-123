import React from 'react';

export interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'purple' | 'amber' | 'emerald' | 'gradient';
  className?: string;
}

const heightStyles: Record<string, string> = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const barVariants: Record<string, string> = {
  purple: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]',
  amber: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
  emerald: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
  gradient: 'bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400',
};

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  label,
  showValue = false,
  size = 'md',
  variant = 'gradient',
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center text-xs">
          {label && <span className="font-semibold text-neutral-300">{label}</span>}
          {showValue && (
            <span className="font-mono text-neutral-400 tabular-nums">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-neutral-800/80 rounded-full overflow-hidden border border-neutral-700/40 p-[1px] ${heightStyles[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${barVariants[variant]}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};

export interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  variant?: 'purple' | 'amber' | 'emerald';
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 72,
  strokeWidth = 6,
  label,
  variant = 'purple',
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clamped = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const strokeColors: Record<string, string> = {
    purple: '#A855F7',
    amber: '#F59E0B',
    emerald: '#10B981',
  };

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1F2937"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColors[variant]}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold font-mono text-white tabular-nums">
            {Math.round(clamped)}%
          </span>
        </div>
      </div>
      {label && <span className="text-[11px] font-semibold text-neutral-400 mt-1">{label}</span>}
    </div>
  );
};
