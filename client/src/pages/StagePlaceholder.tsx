import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, ArrowRight } from 'lucide-react';

export interface StagePlaceholderProps {
  screenName: string;
  stageLabel: string;
}

export const StagePlaceholder: React.FC<StagePlaceholderProps> = ({
  screenName,
  stageLabel,
}) => {
  const location = useLocation();

  return (
    <div className="bg-surface rounded-xl border border-border shadow-card p-space-xl max-w-xl mx-auto my-8 text-center flex flex-col items-center gap-space-md">
      <div className="w-12 h-12 rounded-xl bg-primary-tint text-primary flex items-center justify-center">
        <Layers className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <span className="px-2.5 py-0.5 rounded-full bg-raised text-ink2 text-badge-label font-semibold uppercase">
          Route Registered · {stageLabel}
        </span>
        <h1 className="text-display-title text-ink pt-1">{screenName}</h1>
        <p className="text-body-default text-ink2">
          Route <code className="font-mono text-code-sm bg-code px-1.5 py-0.5 rounded">{location.pathname}</code> is wired in React Router. Full screen implementation is scheduled for{' '}
          <strong className="text-ink font-semibold">{stageLabel}</strong>.
        </p>
      </div>
      <Link
        to="/dev-components"
        className="h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-body-medium font-medium inline-flex items-center gap-2 shadow-sm transition-colors"
      >
        <span>Review Stage A Shared Components</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};
