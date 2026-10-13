import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Code2, Lock } from 'lucide-react';
import type { FilePreviewLine } from '../types/api';

export interface MaskedPreviewProps {
  fileName: string;
  lines: FilePreviewLine[];
  selectedFindingId?: string;
  selectedLine?: number;
  className?: string;
}

export const MaskedPreview: React.FC<MaskedPreviewProps> = ({
  fileName,
  lines,
  selectedFindingId,
  selectedLine,
  className = '',
}) => {
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const shouldReduceMotion = useReducedMotion();

  // Scroll to selected line when finding row is selected
  useEffect(() => {
    if (selectedLine && lineRefs.current.has(selectedLine)) {
      const el = lineRefs.current.get(selectedLine);
      el?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth', block: 'center' });
    }
  }, [selectedLine, selectedFindingId, shouldReduceMotion]);

  return (
    <div
      className={`bg-surface rounded-xl border border-border shadow-card overflow-hidden flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="px-space-md py-3 bg-raised border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-headline-subsection text-ink font-semibold">
            File Inspection
          </span>
        </div>
        <span className="font-mono text-code-sm text-muted">{fileName}</span>
      </div>

      {/* Monospace Code Body on #F1F5F9 */}
      <div className="p-space-md bg-code text-ink font-mono text-code-sm leading-relaxed overflow-y-auto max-h-[460px] select-text">
        <div className="space-y-1">
          {lines.map((line) => {
            const isMatch =
              (selectedFindingId && line.finding_id === selectedFindingId) ||
              (selectedLine && line.line_number === selectedLine);

            const isSecret = line.highlight_category === 'secret';
            const isPii = line.highlight_category === 'pii';

            return (
              <motion.div
                key={`${line.line_number}-${isMatch ? 'active' : 'inactive'}`}
                ref={(el) => {
                  if (el) lineRefs.current.set(line.line_number, el as HTMLDivElement);
                  else lineRefs.current.delete(line.line_number);
                }}
                animate={
                  isMatch && !shouldReduceMotion
                    ? {
                        backgroundColor: [
                          'rgba(79, 70, 229, 0.35)',
                          'rgba(79, 70, 229, 0.12)',
                        ],
                      }
                    : {
                        backgroundColor: isMatch ? 'rgba(79, 70, 229, 0.12)' : 'transparent',
                      }
                }
                transition={{ duration: 0.6 }}
                className={`flex items-start px-1.5 py-0.5 rounded transition-all ${
                  isMatch ? 'ring-1 ring-primary shadow-sm' : ''
                }`}
              >
                {/* Line Number */}
                <span className="w-8 shrink-0 text-muted select-none text-right pr-3 font-normal">
                  {String(line.line_number).padStart(2, '0')}
                </span>

                {/* Line Code Content */}
                <span className="flex-1 break-all">
                  <span className="text-ink2">{line.prefix}</span>
                  {line.masked_token && (
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded font-semibold mx-0.5 ${
                        isSecret
                          ? 'bg-secret-tint text-secret border border-secret/30'
                          : isPii
                          ? 'bg-pii-tint text-pii border border-pii/30'
                          : 'bg-raised text-ink'
                      }`}
                    >
                      {line.masked_token}
                    </span>
                  )}
                  {line.Suffix && <span className="text-ink2">{line.Suffix}</span>}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend & Encoding Footer */}
      <div className="px-space-md py-2.5 bg-raised/80 border-t border-border flex items-center justify-between text-caption text-ink2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secret" />
            <span className="font-semibold text-ink">Secret token</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pii" />
            <span className="font-semibold text-ink">Personal data</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-muted shrink-0" />
          <span className="font-mono text-muted">UTF-8 canonical preview</span>
        </div>
      </div>
    </div>
  );
};
