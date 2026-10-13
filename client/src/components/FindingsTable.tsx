import React, { useState } from 'react';
import type { FindingItem } from '../types/api';
import { StatusBadge } from './StatusBadge';

export interface FindingsTableProps {
  findings: FindingItem[];
  selectedFindingId?: string;
  onSelectFinding?: (finding: FindingItem) => void;
  className?: string;
}

export const FindingsTable: React.FC<FindingsTableProps> = ({
  findings,
  selectedFindingId,
  onSelectFinding,
  className = '',
}) => {
  const [filter, setFilter] = useState<'all' | 'secret' | 'pii'>('all');

  const secretsCount = findings.filter((f) => f.category === 'secret').length;
  const piiCount = findings.filter((f) => f.category === 'pii').length;

  const filtered = findings.filter((f) => {
    if (filter === 'all') return true;
    return f.category === filter;
  });

  return (
    <div
      className={`bg-surface rounded-xl border border-border shadow-card overflow-hidden flex flex-col justify-between ${className}`}
    >
      {/* Filter Chips Bar */}
      <div className="p-space-md border-b border-border flex flex-wrap items-center justify-between gap-space-sm bg-surface">
        <div className="flex items-center gap-2">
          <span className="text-caption text-muted uppercase font-semibold mr-1">
            Filter:
          </span>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-badge-label font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-raised text-ink hover:bg-border'
            }`}
          >
            All ({findings.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('secret')}
            className={`px-3 py-1 rounded-full text-badge-label font-semibold transition-colors ${
              filter === 'secret'
                ? 'bg-secret text-white'
                : 'bg-raised text-ink hover:bg-border'
            }`}
          >
            Secrets ({secretsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pii')}
            className={`px-3 py-1 rounded-full text-badge-label font-semibold transition-colors ${
              filter === 'pii'
                ? 'bg-pii text-white'
                : 'bg-raised text-ink hover:bg-border'
            }`}
          >
            PII ({piiCount})
          </button>
        </div>
        <span className="text-caption text-muted hidden sm:inline">
          Click row to inspect line in file preview
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-raised text-ink2 text-caption uppercase tracking-wider border-b border-border">
              <th className="py-3 px-4 font-semibold">Type &amp; Entity</th>
              <th className="py-3 px-3 font-semibold">Detector</th>
              <th className="py-3 px-3 font-semibold">Location</th>
              <th className="py-3 px-3 font-semibold">Severity</th>
              <th className="py-3 px-4 font-semibold">Masked Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-body-sm">
            {filtered.map((item) => {
              const isSelected = item.id === selectedFindingId;
              const isSecret = item.category === 'secret';

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectFinding?.(item)}
                  className={`h-[52px] cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary-tint/60 font-medium'
                      : 'hover:bg-raised/70'
                  }`}
                >
                  <td className="py-2.5 px-4 text-ink flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isSecret ? 'bg-secret' : 'bg-pii'
                      }`}
                    />
                    <span className="truncate">{item.type}</span>
                  </td>
                  <td className="py-2.5 px-3 text-ink2 text-caption">
                    <span className="px-2 py-0.5 rounded bg-raised font-mono">
                      {item.detector}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-code-sm text-muted">
                    L {item.line}:{item.col}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={item.severity} size="sm" />
                  </td>
                  <td className="py-2.5 px-4 font-mono text-code-sm">
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        isSecret
                          ? 'bg-secret-tint text-secret'
                          : 'bg-pii-tint text-pii'
                      }`}
                    >
                      {item.masked_preview}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination / Count Footer */}
      <div className="px-space-md py-3 bg-raised/60 border-t border-border flex items-center justify-between text-muted text-caption">
        <span>
          Showing {filtered.length} of {findings.length} findings
        </span>
        <span className="font-mono text-ink2">Masking: Active Zero-Leak</span>
      </div>
    </div>
  );
};
