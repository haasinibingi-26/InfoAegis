import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Download } from 'lucide-react';
import type { DecisionState } from '../types/api';
import { StatusBadge } from './StatusBadge';

export interface BeforeAfterProps {
  beforeRisk: number;
  beforeDecision: DecisionState;
  beforeFindingsCount: number;
  afterRisk: number;
  afterDecision: DecisionState;
  afterFindingsRemaining: number;
  targetedRemovedCount: number;
  targetedTotalCount: number;
  onDownloadSanitised?: () => void;
  className?: string;
}

export const BeforeAfter: React.FC<BeforeAfterProps> = ({
  beforeRisk,
  beforeDecision,
  beforeFindingsCount,
  afterRisk,
  afterDecision,
  afterFindingsRemaining,
  targetedRemovedCount,
  targetedTotalCount,
  onDownloadSanitised,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const riskDelta = beforeRisk - afterRisk;

  // Animate before and after risk count up/down
  const [displayBeforeRisk, setDisplayBeforeRisk] = useState(
    shouldReduceMotion ? beforeRisk : 0
  );
  const [displayAfterRisk, setDisplayAfterRisk] = useState(
    shouldReduceMotion ? afterRisk : 0
  );

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayBeforeRisk(beforeRisk);
      setDisplayAfterRisk(afterRisk);
      return;
    }

    let startTimestamp: number | null = null;
    const duration = 800;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      setDisplayBeforeRisk(Math.round(beforeRisk * eased));
      setDisplayAfterRisk(Math.round(afterRisk * eased));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const reqId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(reqId);
  }, [beforeRisk, afterRisk, shouldReduceMotion]);

  return (
    <div
      className={`bg-surface rounded-xl border border-border shadow-card p-space-lg flex flex-col gap-space-md ${className}`}
    >
      {/* Title & Target Pill */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-headline-section font-semibold text-ink">
            Simulated Verification Result
          </h3>
          <p className="text-body-sm text-ink2">
            Deterministic dry run evaluated with Rust SafePatch engine.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-allow-tint text-allow text-badge-label font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-allow" />
          <span>
            Targeted values removed {targetedRemovedCount}/{targetedTotalCount}
          </span>
        </div>
      </div>

      {/* Split Cards Container */}
      <div className="p-space-lg rounded-xl bg-raised flex flex-col md:flex-row items-center justify-between gap-space-lg">
        {/* BEFORE BOX */}
        <div className="w-full md:w-5/12 p-space-md rounded-xl bg-surface border border-border shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-caption text-muted uppercase font-semibold">
              Before SafePatch
            </span>
            <StatusBadge status={beforeDecision} size="sm" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display-title text-[28px] font-bold text-block">
              Risk {displayBeforeRisk}
            </span>
            <span className="text-caption text-muted">/ 100 max</span>
          </div>
          <span className="text-body-sm text-ink2">
            {beforeFindingsCount} Sensitive findings detected
          </span>
        </div>

        {/* TRANSFORMATION ARROW & DELTA CHIP */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-9 h-9 rounded-full bg-allow text-white flex items-center justify-center shadow-sm">
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
          <motion.span
            initial={{ scale: shouldReduceMotion ? 1 : 0.8, opacity: shouldReduceMotion ? 1 : 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 350, damping: 25 }}
            className="text-caption font-bold text-allow bg-allow-tint px-2.5 py-0.5 rounded-full border border-allow/20"
          >
            {riskDelta > 0 ? `-${riskDelta}` : riskDelta} Risk Delta
          </motion.span>
        </div>

        {/* AFTER BOX */}
        <div className="w-full md:w-5/12 p-space-md rounded-xl bg-surface border border-border shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-caption text-muted uppercase font-semibold">
              After SafePatch
            </span>
            <StatusBadge status={afterDecision} size="sm" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display-title text-[28px] font-bold text-ink">
              Risk {displayAfterRisk}
            </span>
            <span className="text-caption text-muted">/ 100 max</span>
          </div>
          <span className="text-body-sm text-ink2">
            {afterFindingsRemaining} Findings remaining
          </span>
        </div>
      </div>

      {/* Download Action Footer */}
      {onDownloadSanitised && (
        <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-caption text-muted">
            Click to download the sanitized candidate file generated by SafePatch byte-range execution.
          </div>
          <button
            type="button"
            onClick={onDownloadSanitised}
            className="h-9 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-body-sm font-semibold flex items-center gap-2 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Sanitized File</span>
          </button>
        </div>
      )}
    </div>
  );
};
