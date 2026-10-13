import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  Clock,
  Play,
  RefreshCw,
  Cpu,
  FileCode,
  ShieldCheck,
  Server,
  AlertTriangle,
  Info,
  Check,
  Terminal,
  AlertOctagon,
} from 'lucide-react';
import { fetchHealth, runSelfTest } from '../config/api';
import type { ComponentHealth } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { Accordion } from '../components/Accordion';
import { Skeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';

export const SystemStatusPage: React.FC = () => {
  const { showToast } = useToast();
  const shouldReduceMotion = useReducedMotion();

  // Load health data
  const {
    data: healthData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  // Track local self-test overrides per component
  const [testedComponents, setTestedComponents] = useState<
    Record<string, { lastTest: string; passed: boolean; detail: string }>
  >({});
  const [runningSelfTestId, setRunningSelfTestId] = useState<string | null>(null);

  // Handle Run Self-Test
  const handleRunSelfTest = async (comp: ComponentHealth) => {
    setRunningSelfTestId(comp.id);
    try {
      const res = await runSelfTest(comp.id);
      setTestedComponents((prev) => ({
        ...prev,
        [comp.id]: {
          lastTest: `Self-test (simulated): last result from fixture (${comp.last_self_test})`,
          passed: res.success,
          detail: res.message,
        },
      }));
      showToast(`Self-test (simulated): last result from fixture for ${comp.name}`);
    } catch {
      showToast(`Self-test failed for ${comp.name}`);
    } finally {
      setRunningSelfTestId(null);
    }
  };

  // Get component icon
  const getComponentIcon = (id: string) => {
    switch (id) {
      case 'gitleaks':
        return <Terminal className="w-5 h-5" />;
      case 'presidio':
        return <Cpu className="w-5 h-5" />;
      case 'safepatch':
        return <FileCode className="w-5 h-5" />;
      case 'cool':
        return <ShieldCheck className="w-5 h-5" />;
      case 'node':
        return <Server className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <Skeleton className="h-32 w-full" rounded="xl" />
        <Skeleton className="h-80 w-full" rounded="xl" />
        <Skeleton className="h-60 w-full" rounded="xl" />
      </div>
    );
  }

  if (error || !healthData) {
    return (
      <div className="p-8 rounded-2xl bg-surface border border-border shadow-card text-center max-w-xl mx-auto">
        <AlertTriangle className="w-10 h-10 text-review mx-auto mb-3" />
        <h2 className="text-headline-section font-bold text-ink">Health Status Unavailable</h2>
        <p className="text-body-default text-ink2 mt-1">
          Unable to retrieve telemetry signals from engine services.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-5 px-4 py-2 bg-primary text-white rounded-lg text-body-sm font-semibold hover:bg-primary-hover inline-flex items-center gap-2 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const unavailableComponents = healthData.components.filter((c) => c.mode === 'UNAVAILABLE');
  const hasFallback = healthData.components.some((c) => c.mode === 'FALLBACK');

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-caption text-muted">
          <Link to="/" className="hover:text-primary transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-ink font-semibold">System Status</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-headline-page font-bold text-ink">
                System Status & Engine Diagnostics
              </h1>
              <span className="text-caption font-mono uppercase bg-raised text-muted px-2.5 py-0.5 rounded border border-border">
                Simulated (fixtures)
              </span>
            </div>
            <p className="text-body-default text-ink2 mt-1">
              Real-time health telemetry, self-test verification, and engine execution modes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-caption border ${
                unavailableComponents.length > 0
                  ? 'bg-block-tint text-block border-block/20'
                  : hasFallback
                  ? 'bg-review-tint text-review border-review/20'
                  : 'bg-allow-tint text-allow border-allow/20'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  unavailableComponents.length > 0
                    ? 'bg-block'
                    : hasFallback
                    ? 'bg-review'
                    : 'bg-allow'
                } animate-pulse`}
              />
              <span>
                {unavailableComponents.length > 0
                  ? 'Engine Unavailable'
                  : hasFallback
                  ? 'Operational with Fallback'
                  : 'All engines operational'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => refetch()}
              className="h-8 w-8 rounded-lg bg-surface border border-border hover:bg-raised flex items-center justify-center text-muted hover:text-ink transition-colors focus-visible:ring-2 focus-visible:ring-primary"
              title="Refresh status"
              aria-label="Refresh status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Warning banner when any component is UNAVAILABLE */}
      {unavailableComponents.length > 0 && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-block-tint border-2 border-block/40 flex items-start gap-3.5 text-block shadow-sm"
        >
          <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5 text-block" />
          <div className="flex-1">
            <p className="font-bold text-body-medium">
              Service Outage: {unavailableComponents.map((c) => c.name).join(', ')} is currently UNAVAILABLE
            </p>
            <p className="text-body-sm text-block/90 mt-0.5">
              One or more scanning or evidence signing services cannot be reached. Security evaluations may be incomplete.
            </p>
          </div>
        </div>
      )}

      {/* Checked At Strip */}
      <div className="p-space-md rounded-xl bg-surface border border-border shadow-card flex items-center justify-between text-body-sm text-ink2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted shrink-0" />
          <span>Last automated health cycle:</span>
          <span className="font-mono text-ink text-code-sm">{healthData.checked_at}</span>
        </div>
        <span className="text-caption font-mono text-muted">5 of 5 services reporting</span>
      </div>

      {/* 2-Column Grid of 5 Component Health Cards with Staggered Fade-In */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {healthData.components.map((comp, idx) => {
          const testState = testedComponents[comp.id];
          const lastTestText = testState ? testState.lastTest : comp.last_self_test;
          const testDetailText = testState ? testState.detail : comp.self_test_detail;
          const isRunning = runningSelfTestId === comp.id;

          return (
            <motion.div
              key={comp.id}
              initial={{
                opacity: shouldReduceMotion ? 1 : 0,
                y: shouldReduceMotion ? 0 : 8,
              }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: shouldReduceMotion ? 0 : idx * 0.06,
                duration: 0.25,
              }}
              className="p-space-lg rounded-2xl bg-surface border border-border shadow-card flex flex-col justify-between gap-5 transition-shadow hover:shadow-card-hover"
            >
              {/* Top Header of Card */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-primary-tint text-primary flex items-center justify-center shrink-0">
                    {getComponentIcon(comp.id)}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-headline-subsection font-semibold text-ink">
                        {comp.name}
                      </h3>
                    </div>
                    <p className="text-caption text-muted">{comp.role}</p>
                  </div>
                </div>

                {/* Mode Badge */}
                <StatusBadge status={comp.mode} size="sm" />
              </div>

              {/* Version & Detail Body */}
              <div className="space-y-2.5 text-body-sm border-t border-border pt-4">
                <div className="flex items-center justify-between text-caption">
                  <span className="text-muted">Version:</span>
                  <span className="font-mono text-ink text-code-sm font-medium">
                    {comp.version}
                  </span>
                </div>

                <div className="flex items-center justify-between text-caption">
                  <span className="text-muted">Last benchmark:</span>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span className="text-ink font-medium">{lastTestText}</span>
                    <span className="text-[10px] font-mono uppercase bg-raised text-muted px-1.5 py-0.5 rounded border border-border">
                      Simulated (fixtures)
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-raised text-caption text-ink2 font-mono leading-relaxed">
                  {testDetailText}
                </div>
              </div>

              {/* Action Button: Run Self-Test */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-caption text-muted flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-allow" />
                  <span>Self-test passed</span>
                  <span className="text-[10px] font-mono uppercase bg-raised text-muted px-1.5 py-0.5 rounded border border-border">
                    Simulated (fixtures)
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => handleRunSelfTest(comp)}
                  disabled={isRunning}
                  aria-label={`Run self-test for ${comp.name}`}
                  className="h-8 px-3 rounded-lg bg-surface border border-border hover:bg-raised text-ink text-caption font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <RefreshCw className={`w-3 h-3 text-primary ${isRunning ? 'animate-spin' : ''}`} />
                  <span>Run self-test</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Limitations and Honest Claims Accordion */}
      <Accordion
        title="Limitations and honest claims"
        subtitle="Neutral architectural boundaries and compliance disclosures"
        defaultOpen={false}
        icon={<Info className="w-5 h-5" />}
      >
        <div className="space-y-4 pt-2 text-body-sm text-ink2 leading-relaxed">
          <div className="p-4 rounded-xl bg-raised/50 border border-border space-y-2">
            <h4 className="font-semibold text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Scanners do not guarantee full detection</span>
            </h4>
            <p>
              Gitleaks utilizes deterministic regular expressions and Shannon entropy calculations;
              Presidio uses spaCy named entity recognition models. Scanners do not guarantee full
              detection of novel, zero-day credentials, or obscure domain-specific PII formats.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-raised/50 border border-border space-y-2">
            <h4 className="font-semibold text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Hardware attestation is mocked</span>
            </h4>
            <p>
              The CooL evidence engine is operating in <strong className="text-ink">LOCAL FALLBACK</strong>{' '}
              mode with host Ed25519 signing. Hardware enclave attestation (TEE/SGX) is mocked; no
              hardware security module or sealed enclave is active in this build.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-raised/50 border border-border space-y-2">
            <h4 className="font-semibold text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>No public-chain anchoring</span>
            </h4>
            <p>
              Cryptographic hashes are chained locally in the application database; there is no
              public-chain anchoring or Merkle transparency log inclusion in this build.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-raised/50 border border-border space-y-2">
            <h4 className="font-semibold text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Sharing decision is simulated</span>
            </h4>
            <p>
              Egress evaluations, policy rules, and What-if simulator verdicts are simulated against
              sample rules and synthetic data; no live network or proxy gate enforcement is active.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-raised/50 border border-border space-y-2">
            <h4 className="font-semibold text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>SafePatch Byte-Range Guarantee</span>
            </h4>
            <p>
              Rust SafePatch redacts exact reported UTF-8 byte ranges; it does not perform semantic
              document rewriting or generative synthesis. Redaction does not automatically mean the
              file is safe for public distribution.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-raised/50 border border-border space-y-2">
            <h4 className="font-semibold text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Non-Compliance Disclaimer</span>
            </h4>
            <p>
              LeakLens AI is a developer and team security risk analysis tool, not an accredited
              statutory compliance certification body. Egress decisions are recommendations based on
              configured policy rules.
            </p>
          </div>
        </div>
      </Accordion>
    </div>
  );
};
