import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Hourglass, Lock } from 'lucide-react';
import { PipelineStepper, type PipelineStep } from '../components/PipelineStepper';

const PIPELINE_STEP_DEFS = [
  {
    id: 'gitleaks',
    title: 'Detect secrets (Gitleaks)',
    description: 'Scanning API tokens, keys, and credentials',
    duration: '0.34s',
    completedBadge: 'Passed',
    badgeVariant: 'success' as const,
  },
  {
    id: 'presidio',
    title: 'Detect personal data (Presidio)',
    description: 'Scanning PII, emails, and identifiers',
    duration: '0.42s',
    completedBadge: '1 Flagged',
    badgeVariant: 'warning' as const,
    isSimulated: true,
  },
  {
    id: 'context',
    title: 'Evaluate context',
    description: 'Evaluating destination permissions & exposure risk',
    duration: '0.28s',
    completedBadge: 'Clear',
    badgeVariant: 'success' as const,
  },
  {
    id: 'decide',
    title: 'Decide',
    description: 'Synthesizing boundary verdict and policy compliance',
    duration: '0.19s',
    completedBadge: 'Done',
    badgeVariant: 'success' as const,
  },
  {
    id: 'safepatch',
    title: 'Prepare fix',
    description: 'Preparing format-preserving redaction diff',
    duration: '0.31s',
    completedBadge: 'Done',
    badgeVariant: 'success' as const,
  },
  {
    id: 'evidence',
    title: 'Create evidence (CooL)',
    description: 'Generating cryptographic SHA-256 attestation receipt',
    duration: '0.22s',
    completedBadge: 'Done',
    badgeVariant: 'success' as const,
  },
];

export const AnalyzingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract metadata from router state or fallback defaults
  const state = location.state as { fileName?: string; context?: unknown } | undefined;
  const fileName = state?.fileName || 'customer_report.csv';
  const incidentId = id || 'INC-20260101-0001';
  const isClean = fileName.includes('clean');

  // Multi-step progress state (0 through 6)
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  useEffect(() => {
    // Progress each step sequentially every 500ms
    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev < PIPELINE_STEP_DEFS.length) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 520);

    return () => clearInterval(interval);
  }, []);

  // When all 6 steps are complete, navigate to Incident Results page
  useEffect(() => {
    if (currentStepIdx >= PIPELINE_STEP_DEFS.length) {
      const timeout = setTimeout(() => {
        navigate(`/incidents/${incidentId}`, { state });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentStepIdx, incidentId, navigate, state]);

  // Map steps to PipelineStepper format
  const steps: PipelineStep[] = PIPELINE_STEP_DEFS.map((def, idx) => {
    const description =
      def.id === 'presidio'
        ? `${def.description} (Simulated via fixtures)`
        : def.description;

    if (idx < currentStepIdx) {
      return {
        id: def.id,
        title: def.title,
        description,
        duration: def.duration,
        status: 'completed',
        badge: isClean && def.id === 'presidio' ? 'Passed' : def.completedBadge,
        badgeVariant: isClean && def.id === 'presidio' ? 'success' : def.badgeVariant,
      };
    }
    if (idx === currentStepIdx) {
      return {
        id: def.id,
        title: def.title,
        description,
        status: 'active',
        badge: 'Running',
        badgeVariant: 'primary',
      };
    }
    return {
      id: def.id,
      title: def.title,
      description,
      status: 'pending',
      badge: 'Queued',
      badgeVariant: 'muted',
    };
  });

  const progressPercent = Math.min(
    100,
    Math.round(((currentStepIdx + 0.5) / PIPELINE_STEP_DEFS.length) * 100)
  );
  const remainingSeconds = Math.max(0, Math.ceil((PIPELINE_STEP_DEFS.length - currentStepIdx) * 0.5));

  return (
    <div className="flex flex-col items-center justify-center w-full py-8 min-h-[calc(100vh-120px)]">
      {/* Screen Header Section */}
      <div className="w-full max-w-[580px] flex flex-col items-center text-center mb-6">
        {/* Processing Indicator Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border shadow-sm mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
            Analysis in Progress
          </span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span className="text-[11px] font-mono text-muted font-medium">
            JOB #{incidentId.replace('INC-', 'LL-')}
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-display-title font-semibold text-ink tracking-tight">
          Analyzing{' '}
          <span className="font-mono text-primary bg-primary-tint px-2 py-0.5 rounded-lg select-all">
            {fileName}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-body-default text-ink2 mt-1.5 flex items-center justify-center gap-1.5">
          <Hourglass className="w-4 h-4 text-muted animate-spin" />
          <span>Synthesizing multi-engine boundary telemetry. This takes a few seconds.</span>
        </p>
      </div>

      {/* Central Pipeline Card */}
      <div className="w-full max-w-[580px] bg-surface rounded-2xl shadow-card border border-border p-8 relative overflow-hidden">
        {/* Top Progress Line Indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-raised">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Pipeline Steps Container using PipelineStepper */}
        <PipelineStepper steps={steps} />

        {/* Card Separator & Footer Telemetry */}
        <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
          {/* Live scanning progress line & ETA */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-caption">
              <span className="text-ink font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Overall Execution Progress
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-ink2 font-medium">
                  Estimated time remaining:{' '}
                  <strong className="text-ink font-semibold">~{remainingSeconds}s</strong>
                </span>
                <span className="text-[10px] font-mono text-muted bg-raised px-1.5 py-0.5 rounded border border-border">
                  Simulated (fixtures)
                </span>
              </div>
            </div>

            {/* Mini Progress Track */}
            <div className="w-full h-1.5 bg-raised rounded-full overflow-hidden flex">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Demo mode notice */}
          <div className="mt-1 py-2 px-3 rounded-xl bg-raised border border-border flex items-center justify-between text-ink2">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span className="text-caption text-ink2 truncate">
                Demo mode: scanning uses synthetic data only.
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted bg-surface px-2 py-0.5 rounded border border-border shrink-0 font-medium">
              Simulated (fixtures)
            </span>
          </div>
        </div>
      </div>

      {/* Cancel analysis action & secure enclave notice */}
      <div className="mt-4 flex items-center gap-3 text-muted text-body-sm">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-body-sm text-ink2 hover:text-ink hover:underline transition-colors cursor-pointer"
        >
          Cancel analysis
        </button>
        <span className="text-border">·</span>
        <span className="flex items-center gap-1 text-muted text-body-sm">
          <Lock className="w-3.5 h-3.5" />
          <span>Secure Enclave active</span>
        </span>
      </div>
    </div>
  );
};
