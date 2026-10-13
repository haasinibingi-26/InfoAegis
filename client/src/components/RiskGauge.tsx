import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { DecisionState } from '../types/api';

export interface RiskGaugeProps {
  score: number;
  maxScore?: number;
  decision?: DecisionState;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  maxScore = 100,
  decision,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const clampedScore = Math.max(0, Math.min(score, maxScore));
  const percentage = clampedScore / maxScore;

  // Number count-up animation state
  const [displayScore, setDisplayScore] = useState(shouldReduceMotion ? clampedScore : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayScore(clampedScore);
      return;
    }

    let startTimestamp: number | null = null;
    const duration = 1000;
    const startVal = 0;
    const endVal = clampedScore;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(startVal + (endVal - startVal) * eased));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const reqId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(reqId);
  }, [clampedScore, shouldReduceMotion]);

  // Determine semantic color by decision or score
  let strokeColor = '#DC2626'; // block
  let levelText = 'Critical Risk';

  if (decision === 'ALLOW' || (!decision && score < 30)) {
    strokeColor = '#16A34A';
    levelText = 'Low Risk';
  } else if (decision === 'REVIEW' || (!decision && score < 70)) {
    strokeColor = '#D97706';
    levelText = 'Review Required';
  }

  const dimension = size === 'sm' ? 64 : size === 'lg' ? 96 : 80;
  const strokeWidth = size === 'sm' ? 6 : size === 'lg' ? 8 : 7;
  const radius = (dimension - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percentage);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: dimension, height: dimension }}
      >
        <svg
          className="w-full h-full -rotate-90 transform"
          viewBox={`0 0 ${dimension} ${dimension}`}
        >
          {/* Background Track */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="transparent"
            stroke="#E4E8F2"
            strokeWidth={strokeWidth}
          />
          {/* Animated Progress Indicator */}
          <motion.circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: shouldReduceMotion ? offset : circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: shouldReduceMotion ? 0 : 1, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display-title text-[20px] font-bold text-ink leading-tight">
            {displayScore}
          </span>
          <span className="font-caption text-[9px] uppercase tracking-wider text-muted">
            /{maxScore}
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: strokeColor }}
          >
            {levelText}
          </span>
          <span className="text-body-sm font-semibold text-ink">Risk Score</span>
          <span className="text-caption text-muted">Perimeter Cap</span>
        </div>
      )}
    </div>
  );
};
