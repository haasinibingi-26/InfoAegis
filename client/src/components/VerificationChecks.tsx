import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, X, Minus, AlertCircle } from 'lucide-react';
import type { VerificationCheck } from '../types/api';

export interface VerificationChecksProps {
  checks: VerificationCheck[];
  isTampered?: boolean;
  className?: string;
}

export const VerificationChecks: React.FC<VerificationChecksProps> = ({
  checks,
  isTampered = false,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`bg-surface rounded-xl border border-border shadow-card overflow-hidden flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="p-space-md border-b border-border flex items-center justify-between bg-surface">
        <div>
          <h2 className="text-headline-section font-semibold text-ink">
            Verification Checks
          </h2>
          <p className="text-caption text-muted">
            Deterministic cryptographic evaluation of payload signature and pipeline inputs
          </p>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-badge-label font-semibold ${
            isTampered
              ? 'bg-block-tint text-block'
              : 'bg-allow-tint text-allow'
          }`}
        >
          {isTampered ? 'Tamper Detected' : 'Checks Active'}
        </span>
      </div>

      {/* Check Rows */}
      <div className="divide-y divide-border flex flex-col">
        {checks.map((check, index) => {
          // Read failure state directly from check payload status, not computed in page
          const failed = check.status === 'fail';
          const isNa = check.status === 'na';

          // Shake once for failed checks if reduced motion not enabled
          const shakeKeyframes =
            failed && !shouldReduceMotion
              ? [0, -6, 6, -4, 4, -2, 2, 0]
              : [0];

          return (
            <motion.div
              key={check.id}
              initial={{
                opacity: shouldReduceMotion ? 1 : 0,
                y: shouldReduceMotion ? 0 : 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
                x: shakeKeyframes,
              }}
              transition={{
                opacity: { delay: shouldReduceMotion ? 0 : index * 0.08, duration: 0.25 },
                y: { delay: shouldReduceMotion ? 0 : index * 0.08, duration: 0.25 },
                x: { delay: shouldReduceMotion ? 0 : index * 0.08 + 0.15, duration: 0.4, ease: 'easeInOut' },
              }}
              className={`p-space-md flex items-start gap-3.5 transition-colors ${
                failed ? 'bg-block-tint/20' : isNa ? 'bg-raised/40' : 'hover:bg-raised/40'
              }`}
            >
              {/* Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  failed
                    ? 'bg-block-tint text-block'
                    : isNa
                    ? 'bg-raised text-muted border border-border'
                    : 'bg-allow-tint text-allow'
                }`}
              >
                {failed ? (
                  <X className="w-4 h-4 stroke-[2.5]" />
                ) : isNa ? (
                  <Minus className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                )}
              </div>

              {/* Text & Detail */}
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span
                    className={`text-body-medium font-semibold ${
                      failed ? 'text-block' : isNa ? 'text-muted' : 'text-ink'
                    }`}
                  >
                    {check.name}
                  </span>
                  <span
                    className={`font-mono text-code-sm font-medium ${
                      failed
                        ? 'text-block'
                        : isNa
                        ? 'text-muted'
                        : 'text-allow'
                    }`}
                  >
                    {check.badge}
                  </span>
                </div>
                <p
                  className={`text-body-sm ${
                    failed ? 'text-ink' : isNa ? 'text-muted' : 'text-ink2'
                  }`}
                >
                  {check.detail}
                </p>

                {failed && (
                  <div className="mt-1.5 p-2 rounded bg-block-tint/60 text-block text-code-sm font-mono flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Integrity breach: recomputed scalar mismatch against signed envelope</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
