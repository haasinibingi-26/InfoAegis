import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  title,
  subtitle,
  badge,
  icon,
  defaultOpen = false,
  children,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={`bg-surface rounded-xl border border-border shadow-card overflow-hidden ${className}`}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-space-lg py-space-md flex items-center justify-between text-left hover:bg-raised/60 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-primary-tint text-primary flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-headline-subsection text-ink font-semibold">
                {title}
              </span>
              {badge && (
                <span className="px-2 py-0.5 rounded-full bg-raised text-ink2 text-badge-label">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-caption text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-space-lg pb-space-lg pt-space-md border-t border-border">
          {children}
        </div>
      )}
    </div>
  );
};
