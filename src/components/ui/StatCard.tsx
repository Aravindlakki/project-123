import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from './Card';

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: string | number;
    trend: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  iconBg?: string;
  variant?: 'default' | 'gradient-border' | 'glass';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  icon,
  iconBg = 'bg-purple-950/70 border border-purple-800/40 text-purple-300',
  variant = 'default',
  className = '',
}) => {
  return (
    <Card variant={variant} padding="md" className={`min-w-0 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 truncate">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1.5 font-mono tabular-nums truncate">
            {value}
          </p>
        </div>
        {icon && (
          <div className={`p-2.5 rounded-xl shrink-0 flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      {change && (
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-neutral-800/70 text-xs">
          <span
            className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[11px] ${
              change.trend === 'up'
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                : change.trend === 'down'
                ? 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
            }`}
          >
            {change.trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {change.trend === 'down' && <TrendingDown className="h-3 w-3" />}
            {change.trend === 'neutral' && <Minus className="h-3 w-3" />}
            <span>{change.value}</span>
          </span>
          {change.label && (
            <span className="text-neutral-400 truncate text-[11px]">{change.label}</span>
          )}
        </div>
      )}
    </Card>
  );
};
