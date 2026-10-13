import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { DestinationGroup, HeatmapCell } from '../types/api';

export interface HeatmapMatrixProps {
  destinationGroups: DestinationGroup[];
  audiences: string[];
  cells: HeatmapCell[];
  selectedDestination?: string;
  selectedAudience?: string;
  onSelectCell?: (destination: string, audience: string) => void;
  className?: string;
}

export const HeatmapMatrix: React.FC<HeatmapMatrixProps> = ({
  destinationGroups,
  audiences,
  cells,
  selectedDestination,
  selectedAudience,
  onSelectCell,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  const getCell = (dest: string, aud: string): HeatmapCell | undefined => {
    return cells.find((c) => c.destination === dest && c.audience === aud);
  };

  return (
    <div
      className={`bg-surface rounded-xl border border-border shadow-card p-space-lg flex flex-col gap-space-md ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <h3 className="text-headline-section font-semibold text-ink">
            Compare Contexts (Decision Heatmap Matrix)
          </h3>
          <p className="text-body-sm text-ink2">
            Simulated egress decisions across destinations and audience scopes. Click any cell to test context.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-raised text-caption text-ink2 border border-border">
          <span>{cells.length} Context Permutations</span>
        </div>
      </div>

      {/* Heatmap Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-raised text-ink2 text-caption uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold w-[260px]">Destination Channel</th>
              {audiences.map((aud) => (
                <th key={aud} className="py-3 px-2.5 font-semibold text-center">
                  {aud}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {destinationGroups.map((group, groupIdx) => (
              <React.Fragment key={group.group}>
                {/* Group Heading Row */}
                <tr className="bg-raised/40">
                  <td
                    colSpan={audiences.length + 1}
                    className="py-1.5 px-4 text-[11px] uppercase tracking-wider font-bold text-muted"
                  >
                    Group: {group.group} Perimeter
                  </td>
                </tr>

                {/* Destinations inside group */}
                {group.destinations.map((dest, destIdx) => (
                  <tr key={dest} className="hover:bg-raised/40 transition-colors">
                    <td className="py-2.5 px-4 text-body-sm font-medium text-ink">
                      {dest}
                    </td>

                    {audiences.map((aud, audIdx) => {
                      const cell = getCell(dest, aud);
                      const isSelected =
                        selectedDestination === dest && selectedAudience === aud;

                      const decision = cell?.decision ?? 'BLOCK';
                      const cellStyle = {
                        BLOCK: 'bg-block-tint text-block hover:bg-block-tint/80',
                        REVIEW: 'bg-review-tint text-review hover:bg-review-tint/80',
                        ALLOW: 'bg-allow-tint text-allow hover:bg-allow-tint/80',
                      }[decision];

                      const icon = {
                        BLOCK: <ShieldAlert className="w-3.5 h-3.5 shrink-0" />,
                        REVIEW: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
                        ALLOW: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />,
                      }[decision];

                      const tooltipText = `${dest} -> ${aud}: ${decision} (Risk ${cell?.risk ?? 0})${
                        cell?.rules.length ? ` · Rules: ${cell.rules.join(', ')}` : ''
                      }`;

                      // Diagonal cascade delay
                      const diagDelay = shouldReduceMotion
                        ? 0
                        : (groupIdx * 2 + destIdx + audIdx) * 0.025;

                      return (
                        <td key={aud} className="p-1.5 text-center">
                          <motion.button
                            type="button"
                            title={tooltipText}
                            onClick={() => onSelectCell?.(dest, aud)}
                            initial={{
                              opacity: shouldReduceMotion ? 1 : 0,
                              scale: shouldReduceMotion ? 1 : 0.95,
                            }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: diagDelay, duration: 0.2 }}
                            whileHover={{
                              scale: shouldReduceMotion ? 1 : 1.05,
                              zIndex: 10,
                            }}
                            whileTap={{
                              scale: shouldReduceMotion ? 1 : 0.97,
                            }}
                            className={`w-full h-10 rounded-lg text-badge-label font-semibold flex items-center justify-center gap-1.5 transition-shadow focus-visible:ring-2 focus-visible:ring-primary ${cellStyle} ${
                              isSelected
                                ? 'ring-2 ring-primary ring-offset-1 shadow-sm font-bold'
                                : ''
                            }`}
                          >
                            {icon}
                            <span>{decision}</span>
                          </motion.button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-sm border-t border-border text-body-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-block" />
            <span className="text-ink font-medium">BLOCK</span>
            <span className="text-caption text-muted">(Egress denied)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-review" />
            <span className="text-ink font-medium">REVIEW</span>
            <span className="text-caption text-muted">(Requires verification)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-allow" />
            <span className="text-ink font-medium">ALLOW</span>
            <span className="text-caption text-muted">(Safe egress)</span>
          </div>
        </div>
        <span className="text-caption text-muted font-mono">
          Interactive: click any cell to test context
        </span>
      </div>
    </div>
  );
};
