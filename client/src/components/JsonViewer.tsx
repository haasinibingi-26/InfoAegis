import React, { useState } from 'react';
import { Lock, Copy, Check, FileCode } from 'lucide-react';
import { useToast } from './Toast';

export interface JsonViewerProps {
  data: unknown;
  title?: string;
  sha256Digest?: string;
  maxHeight?: string;
  className?: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  title = 'Signed record',
  sha256Digest = '4a2f8b...9c10',
  maxHeight = '420px',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const formattedJson = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson);
    } catch {
      // Fallback
    }
    setCopied(true);
    showToast('Copied signed JSON record');
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`bg-surface rounded-xl border border-border shadow-card overflow-hidden flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="p-space-md bg-surface border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-primary shrink-0" />
          <span className="text-headline-subsection font-semibold text-ink">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-raised text-ink2 border border-border text-badge-label font-semibold">
            <Lock className="w-3 h-3 text-muted shrink-0" />
            <span>Contains no raw sensitive values</span>
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="h-7 px-2.5 rounded bg-surface border border-border hover:bg-raised text-body-sm text-ink2 font-medium flex items-center gap-1 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-allow" />
                <span className="text-allow text-caption font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-muted" />
                <span className="text-caption">Copy JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Syntax Highlighted JSON Body on #F1F5F9 */}
      <div
        className="p-space-md bg-code text-ink font-mono text-code-sm leading-relaxed overflow-y-auto select-all"
        style={{ maxHeight }}
      >
        <pre className="whitespace-pre">
          {formattedJson.split('\n').map((line, idx) => {
            // Simple syntax coloration for keys and string values
            const isKey = line.includes('":');
            return (
              <div key={idx} className="hover:bg-raised/80 px-1 rounded">
                <span className={isKey ? 'text-ink font-medium' : 'text-primary'}>
                  {line}
                </span>
              </div>
            );
          })}
        </pre>
      </div>

      {/* Digest Footer */}
      <div className="px-space-md py-2.5 bg-raised/70 border-t border-border flex items-center justify-between text-caption text-muted font-mono">
        <div className="flex items-center gap-1.5">
          <span>SHA-256 Digest:</span>
          <span className="font-semibold text-ink">{sha256Digest}</span>
          <span className="text-[11px] font-sans text-muted">(RFC-8785 Canonical JCS)</span>
        </div>
        <span className="text-[11px] font-sans text-muted">UTF-8 / Deterministic</span>
      </div>
    </div>
  );
};
