import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'segmented' | 'underline' | 'pills';
  size?: 'sm' | 'md';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'segmented',
  size = 'md',
  className = '',
}) => {
  if (variant === 'underline') {
    return (
      <div className={`flex border-b border-neutral-800 space-x-6 ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-semibold transition-colors relative cursor-pointer ${
                isActive ? 'text-purple-400' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-purple-900/60 text-purple-200' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Segmented Pill Control (as seen in UX Pilot screens)
  const sizeClasses = size === 'sm' ? 'p-0.5 text-xs' : 'p-1 text-xs sm:text-sm';
  const buttonSizeClasses = size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5';

  return (
    <div
      className={`inline-flex items-center bg-[#0D1322] border border-neutral-800/90 rounded-xl ${sizeClasses} ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 cursor-pointer select-none whitespace-nowrap ${buttonSizeClasses} ${
              isActive
                ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-purple-900/80 text-white' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
