import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Users,
  Download,
  SlidersHorizontal,
} from 'lucide-react';
import type { DecisionState, SharingContext } from '../types/api';
import { RiskGauge } from './RiskGauge';

export interface DecisionBannerProps {
  decision: DecisionState;
  score: number;
  reason: string;
  scannerInfo?: string;
  context?: SharingContext;
  onChangeContext?: () => void;
  className?: string;
}

export const DecisionBanner: React.FC<DecisionBannerProps> = ({
  decision,
  score,
  reason,
  scannerInfo = 'SafePatch Egress Router v2.4 · Policy leaklens-policy-v1.0',
  context,
  onChangeContext,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  const config = {
    BLOCK: {
      borderColor: 'border-l-block',
      tintBg: 'from-block-tint/40 via-surface to-surface',
      iconBoxBg: 'bg-block-tint text-block',
      icon: <ShieldAlert className="w-7 h-7 shrink-0 text-block" />,
      title: 'BLOCKED',
      pillText: 'BLOCKED',
      pillClass: 'bg-block text-white',
      glowColor: 'rgba(220, 38, 38, 0.16)',
    },
    REVIEW: {
      borderColor: 'border-l-review',
      tintBg: 'from-review-tint/40 via-surface to-surface',
      iconBoxBg: 'bg-review-tint text-review',
      icon: <AlertTriangle className="w-7 h-7 shrink-0 text-review" />,
      title: 'REVIEW',
      pillText: 'REVIEW',
      pillClass: 'bg-review text-white',
      glowColor: 'rgba(217, 119, 6, 0.16)',
    },
    ALLOW: {
      borderColor: 'border-l-allow',
      tintBg: 'from-allow-tint/40 via-surface to-surface',
      iconBoxBg: 'bg-allow-tint text-allow',
      icon: <CheckCircle2 className="w-7 h-7 shrink-0 text-allow" />,
      title: 'ALLOW',
      pillText: 'ALLOW',
      pillClass: 'bg-allow text-white',
      glowColor: 'rgba(22, 163, 74, 0.16)',
    },
  }[decision];

  // Soft pulsing glow in decision color, 3s loop, low opacity
  const glowBoxShadows = [
    `0 0 0 0px ${config.glowColor}`,
    `0 0 24px 6px ${config.glowColor}`,
    `0 0 0 0px ${config.glowColor}`,
  ];

  // Shake once on first render for BLOCKED if reduced motion not enabled
  const shakeKeyframes =
    decision === 'BLOCK' && !shouldReduceMotion
      ? [0, -6, 6, -4, 4, -2, 2, 0]
      : [0];

  return (
    <motion.section
      aria-label="Sharing Decision Banner"
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
      animate={{
        opacity: 1,
        y: 0,
        x: shakeKeyframes,
        boxShadow: shouldReduceMotion ? undefined : glowBoxShadows,
      }}
      transition={{
        opacity: { duration: 0.25 },
        y: { duration: 0.25 },
        x: { duration: 0.5, ease: 'easeInOut' },
        boxShadow: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
      }}
      className={`relative bg-surface rounded-xl border border-border overflow-hidden ${className}`}
    >
      {/* 4px solid decision bar on left */}
      <div
        className={`p-space-lg lg:p-space-xl border-l-4 ${config.borderColor} flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg bg-gradient-to-r ${config.tintBg}`}
      >
        {/* Left: Icon, Verdict, Reason */}
        <div className="flex items-start gap-space-md max-w-3xl">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${config.iconBoxBg}`}
          >
            {config.icon}
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <span className="text-headline-section font-bold tracking-tight text-ink">
                {config.title}
              </span>
              <span
                className={`text-badge-label uppercase px-2.5 py-0.5 rounded-full font-semibold ${config.pillClass}`}
              >
                {config.pillText}
              </span>
            </div>
            <p className="text-body-default text-ink leading-relaxed">
              {reason}
            </p>
            {scannerInfo && (
              <p className="text-caption text-muted font-mono pt-0.5">
                {scannerInfo}
              </p>
            )}

            {/* Context meta strip */}
            {context && (
              <div className="flex flex-wrap items-center gap-space-sm pt-2 text-body-sm text-ink2">
                <span className="inline-flex items-center gap-1.5 bg-surface/80 px-2.5 py-1 rounded-md border border-border">
                  <Globe className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="text-caption text-muted">Destination:</span>
                  <span className="font-semibold text-ink">{context.destination}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-surface/80 px-2.5 py-1 rounded-md border border-border">
                  <Users className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="text-caption text-muted">Audience:</span>
                  <span className="font-semibold text-ink">{context.audience}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-surface/80 px-2.5 py-1 rounded-md border border-border">
                  <Download className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="text-caption text-muted">Access:</span>
                  <span className="font-semibold text-ink">{context.access}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Risk Gauge & Simulate button */}
        <div className="flex items-center gap-space-lg shrink-0 w-full lg:w-auto justify-between lg:justify-end pt-space-sm lg:pt-0 border-t lg:border-t-0 border-border">
          <RiskGauge score={score} decision={decision} size="md" showLabel={true} />

          {onChangeContext && (
            <button
              type="button"
              onClick={onChangeContext}
              className="h-10 px-4 rounded-lg bg-surface hover:bg-raised text-ink border border-border text-body-sm font-semibold flex items-center gap-2 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary"
            >
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <span>Simulate what-if</span>
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );
};
