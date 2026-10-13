import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  KeyRound,
  UserCheck,
  Cpu,
  Clock,
} from 'lucide-react';

export type BadgeKind =
  | 'BLOCK'
  | 'BLOCKED'
  | 'REVIEW'
  | 'ALLOW'
  | 'ALLOWED'
  | 'REAL'
  | 'FALLBACK'
  | 'MOCK'
  | 'UNAVAILABLE'
  | 'LOCAL FALLBACK'
  | 'SECRET'
  | 'PII'
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW';

export interface StatusBadgeProps {
  status: BadgeKind | string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const normalized = status.toUpperCase();
  const displayLabel = label ?? status;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1'
      : 'px-2.5 py-0.5 text-badge-label gap-1.5';

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  if (normalized === 'BLOCK' || normalized === 'BLOCKED' || normalized === 'CRITICAL') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-block-tint text-block font-semibold border border-block/20 ${sizeClasses} ${className}`}
      >
        <ShieldAlert className={`${iconSize} shrink-0`} />
        <span>{displayLabel}</span>
      </span>
    );
  }

  if (normalized === 'HIGH') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-block-tint text-block font-semibold border border-block/20 ${sizeClasses} ${className}`}
      >
        <AlertTriangle className={`${iconSize} shrink-0`} />
        <span>{displayLabel}</span>
      </span>
    );
  }

  if (
    normalized === 'REVIEW' ||
    normalized === 'FALLBACK' ||
    normalized === 'LOCAL FALLBACK' ||
    normalized === 'MOCK' ||
    normalized === 'MEDIUM'
  ) {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-review-tint text-review font-semibold border border-review/20 ${sizeClasses} ${className}`}
      >
        <AlertTriangle className={`${iconSize} shrink-0`} />
        <span>{displayLabel}</span>
      </span>
    );
  }

  if (normalized === 'ALLOW' || normalized === 'ALLOWED' || normalized === 'REAL') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-allow-tint text-allow font-semibold border border-allow/20 ${sizeClasses} ${className}`}
      >
        <CheckCircle2 className={`${iconSize} shrink-0`} />
        <span>{displayLabel}</span>
      </span>
    );
  }

  if (normalized === 'UNAVAILABLE') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-block-tint text-block font-semibold border border-block/20 ${sizeClasses} ${className}`}
      >
        <XCircle className={`${iconSize} shrink-0`} />
        <span>{displayLabel}</span>
      </span>
    );
  }

  if (normalized === 'SECRET') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-secret-tint text-secret font-semibold border border-secret/20 ${sizeClasses} ${className}`}
      >
        <KeyRound className={`${iconSize} shrink-0`} />
        <span>{displayLabel}</span>
      </span>
    );
  }

  if (normalized === 'PII') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-pii-tint text-pii font-semibold border border-pii/20 ${sizeClasses} ${className}`}
      >
        <UserCheck className={`${iconSize} shrink-0`} />
        <span>{displayLabel}</span>
      </span>
    );
  }

  if (normalized === 'LOW') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-raised text-ink2 font-semibold border border-border ${sizeClasses} ${className}`}
      >
        <Clock className={`${iconSize} shrink-0`} />
        <span>{displayLabel}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-primary-tint text-primary font-semibold border border-primary/20 ${sizeClasses} ${className}`}
    >
      <Cpu className={`${iconSize} shrink-0`} />
      <span>{displayLabel}</span>
    </span>
  );
};
