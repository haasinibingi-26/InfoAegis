import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Keyboard navigation for accessible tabs
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIdx = (index + 1) % tabs.length;
      onChange(tabs[nextIdx].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIdx = (index - 1 + tabs.length) % tabs.length;
      onChange(tabs[prevIdx].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(tabs[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(tabs[tabs.length - 1].id);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Section tabs"
      className={`flex items-center gap-space-lg border-b border-border bg-surface px-space-md rounded-t-xl ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`relative py-3 px-2 font-sans text-body-medium flex items-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-t-md ${
              isActive
                ? 'text-primary font-semibold'
                : 'text-ink2 hover:text-ink font-medium'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`px-2 py-0.5 rounded-full text-badge-label font-semibold ${
                  isActive
                    ? 'bg-primary-tint text-primary'
                    : 'bg-raised text-ink2'
                }`}
              >
                {tab.badge}
              </span>
            )}
            {isActive && (
              <motion.span
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                transition={{
                  type: 'spring',
                  stiffness: shouldReduceMotion ? 1000 : 450,
                  damping: 35,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
