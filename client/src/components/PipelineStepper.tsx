import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

export interface PipelineStep {
  id: string;
  title: string;
  description: string;
  engine?: string;
  duration?: string;
  status: 'completed' | 'active' | 'pending';
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'primary' | 'muted';
}

export interface PipelineStepperProps {
  steps: PipelineStep[];
  progressPercent?: number;
  className?: string;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  steps,
  progressPercent,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`relative flex flex-col ${className}`}>
      {/* Optional Top Progress Bar */}
      {progressPercent !== undefined && (
        <div className="w-full h-1.5 bg-raised rounded-full overflow-hidden mb-space-lg">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Step Rows */}
      <div className="relative flex flex-col">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id} className="relative flex items-start gap-space-md">
              {/* Connecting Vertical Spine */}
              {!isLast && (
                <div
                  aria-hidden="true"
                  className="absolute left-[17px] top-[36px] w-[2px] h-[calc(100%+8px)] bg-border overflow-hidden"
                >
                  <motion.div
                    className="w-full h-full bg-primary origin-top"
                    initial={{ scaleY: step.status === 'completed' ? 1 : 0 }}
                    animate={{ scaleY: step.status === 'completed' ? 1 : 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
                  />
                </div>
              )}

              {/* Node Icon with Active Pulsing Ring */}
              <div className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                {step.status === 'completed' && (
                  <motion.div
                    initial={{ scale: shouldReduceMotion ? 1 : 0.8, opacity: shouldReduceMotion ? 1 : 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="w-9 h-9 rounded-full bg-primary-tint text-primary flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-primary stroke-[3]" />
                  </motion.div>
                )}
                {step.status === 'active' && (
                  <div className="relative flex items-center justify-center">
                    {!shouldReduceMotion && (
                      <motion.span
                        className="absolute inset-0 rounded-full bg-primary/30"
                        animate={{ scale: [1, 1.45, 1], opacity: [0.7, 0, 0.7] }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                      />
                    )}
                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    </div>
                  </div>
                )}
                {step.status === 'pending' && (
                  <div className="w-9 h-9 rounded-full bg-raised text-muted flex items-center justify-center border border-border">
                    <span className="w-2 h-2 rounded-full bg-border" />
                  </div>
                )}
              </div>

              {/* Step Content */}
              <div
                className={`flex-1 min-w-0 pb-6 pt-0.5 flex items-start justify-between transition-colors ${
                  step.status === 'active'
                    ? 'bg-primary-tint/30 px-3 py-1.5 rounded-xl -mr-2'
                    : ''
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-headline-subsection font-semibold ${
                        step.status === 'active'
                          ? 'text-primary'
                          : step.status === 'completed'
                          ? 'text-ink'
                          : 'text-muted'
                      }`}
                    >
                      {step.title}
                    </span>
                    {step.duration && (
                      <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-raised text-ink2">
                        {step.duration}
                      </span>
                    )}
                  </div>
                  <p className="text-body-sm text-ink2 mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Badges / Engine name */}
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {step.engine && (
                    <span className="text-caption font-mono text-muted hidden sm:inline">
                      {step.engine}
                    </span>
                  )}
                  {step.badge && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        step.badgeVariant === 'success'
                          ? 'bg-allow-tint text-allow border border-allow/20'
                          : step.badgeVariant === 'warning'
                          ? 'bg-review-tint text-review border border-review/20'
                          : step.badgeVariant === 'primary'
                          ? 'bg-primary-tint text-primary'
                          : 'bg-raised text-muted'
                      }`}
                    >
                      {step.badge}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
