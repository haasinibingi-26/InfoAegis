import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useToast } from './Toast';

export interface HashChipProps {
  value: string;
  prefix?: string;
  startChars?: number;
  endChars?: number;
  className?: string;
}

export const HashChip: React.FC<HashChipProps> = ({
  value,
  prefix,
  startChars = 8,
  endChars = 6,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const truncated =
    value.length > startChars + endChars + 3
      ? `${value.slice(0, startChars)}...${value.slice(-endChars)}`
      : value;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback if clipboard API fails in non-secure context
    }
    setCopied(true);
    showToast(`Copied ${prefix ? `${prefix} ` : ''}${truncated}`);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-code border border-border font-mono text-code-sm text-ink ${className}`}
      title={value}
    >
      {prefix && <span className="text-muted font-sans text-[11px] font-medium">{prefix}:</span>}
      <span>{truncated}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="text-muted hover:text-primary transition-colors p-0.5 rounded"
        aria-label={`Copy ${prefix || 'hash'} ${value}`}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-allow" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </span>
  );
};
