import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  FileText,
  FileDown,
  LayoutDashboard,
  Search,
  Wand2,
  ShieldCheck,
  Key,
  Users2,
  AlertOctagon,
  ArrowRight,
  SlidersHorizontal,
  Info,
  ExternalLink,
  Check,
  CheckCircle2,
  Lock,
  X,
} from 'lucide-react';
import { fetchIncidentById, fetchHealth } from '../config/api';
import type { FindingItem } from '../types/api';
import { DecisionBanner } from '../components/DecisionBanner';
import { FindingsTable } from '../components/FindingsTable';
import { MaskedPreview } from '../components/MaskedPreview';
import { BeforeAfter } from '../components/BeforeAfter';
import { Accordion } from '../components/Accordion';
import { HashChip } from '../components/HashChip';
import { Skeleton } from '../components/Skeleton';
import { JsonViewer } from '../components/JsonViewer';
import { Tabs } from '../components/Tabs';
import { useToast } from '../components/Toast';

export const IncidentResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const incidentId = id || 'INC-20260101-0001';
  const { showToast } = useToast();
  const shouldReduceMotion = useReducedMotion();

  const [activeTab, setActiveTab] = useState<'overview' | 'findings' | 'fix' | 'evidence'>('overview');
  const [selectedFinding, setSelectedFinding] = useState<FindingItem | null>(null);
  const [showRawJsonModal, setShowRawJsonModal] = useState(false);

  // Fix & Verify interactive checkboxes
  const [selectedFixes, setSelectedFixes] = useState<Record<string, boolean>>({
    redact_secrets: true,
    redact_pii: true,
    restrict_audience: false,
    approved_workspace: false,
  });
  const [fixApplied, setFixApplied] = useState(false);

  // Fetch incident detail from fixtures / API_BASE
  const {
    data: incident,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['incident', incidentId],
    queryFn: () => fetchIncidentById(incidentId),
  });

  // Fetch system health for real engine states
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  // Handle sanitised file download
  const handleDownloadSanitised = () => {
    if (!incident) return;
    const content = incident.safepatch_report.sanitised_content;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanitised_${incident.file_name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Sanitised file downloaded successfully', 'success');
  };

  const handleCopyRawJson = () => {
    if (!incident) return;
    navigator.clipboard.writeText(JSON.stringify(incident, null, 2));
    showToast('Incident JSON copied to clipboard', 'info');
  };

  const handleShareReport = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Report URL copied to clipboard', 'info');
  };

  const toggleFixOption = (fixId: string) => {
    setSelectedFixes((prev) => ({ ...prev, [fixId]: !prev[fixId] }));
  };

  const handleApplyFix = () => {
    setFixApplied(true);
    showToast('SafePatch remediation plan applied in dry-run mode', 'success');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 py-6 pb-28 max-w-[1100px] mx-auto w-full">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="py-12 text-center flex flex-col items-center">
        <div className="p-6 rounded-2xl bg-surface border border-block/30 text-ink max-w-md shadow-card">
          <div className="w-12 h-12 rounded-full bg-block-tint text-block flex items-center justify-center mx-auto mb-3">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <p className="font-semibold text-headline-subsection text-ink">Failed to load incident details</p>
          <p className="text-body-sm text-ink2 mt-1">
            Unable to fetch incident record for {incidentId}.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-white rounded-lg text-body-sm font-medium hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary cursor-pointer transition-colors shadow-sm"
            >
              Retry loading
            </button>
            <Link
              to="/"
              className="px-4 py-2 bg-surface border border-border text-ink rounded-lg text-body-sm font-medium hover:bg-raised transition-colors"
            >
              Return to New Scan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentDecision = fixApplied ? incident.final_decision : incident.initial_decision;
  const currentRisk = fixApplied ? incident.final_risk : incident.initial_risk;

  const unavailableEngines = (health?.components ?? []).filter(
    (c) => c.mode === 'UNAVAILABLE'
  );

  const tabsConfig = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'findings',
      label: 'Findings',
      icon: <Search className="w-4 h-4" />,
      badge: incident.findings.length,
    },
    {
      id: 'fix',
      label: 'Fix & Verify',
      icon: <Wand2 className="w-4 h-4" />,
    },
    {
      id: 'evidence',
      label: 'Evidence',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex flex-col gap-6 py-4 pb-28 max-w-[1100px] mx-auto w-full">
      {/* Engine Alert Banner when components are UNAVAILABLE */}
      {unavailableEngines.length > 0 && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-block-tint border-2 border-block/40 flex items-start gap-3.5 text-block shadow-sm"
        >
          <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5 text-block" />
          <div className="flex-1">
            <p className="font-bold text-body-medium">
              Degraded Evaluation: {unavailableEngines.map((e) => e.name).join(', ')} is UNAVAILABLE
            </p>
            <p className="text-body-sm text-block/90 mt-0.5">
              This incident was evaluated under fallback policies. Redaction or attestation confidence may be reduced.
            </p>
          </div>
        </div>
      )}

      {/* Top Navigation & Breadcrumbs Bar */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5 text-body-sm text-ink2">
            <Link
              to="/history"
              className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <span>Audit History</span>
            </Link>
            <span className="text-border">/</span>
            <span className="font-mono text-code-sm text-ink bg-raised px-2 py-0.5 rounded border border-border">
              {incident.id}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-0.5">
            <FileText className="w-6 h-6 text-muted shrink-0" />
            <h1 className="text-display-title font-semibold text-ink tracking-tight truncate">
              {incident.file_name}
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-raised border border-border text-ink2 uppercase tracking-wider">
              {incident.file_size}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRawJsonModal(true)}
            className="h-9 px-3.5 rounded-lg bg-surface border border-border text-ink shadow-sm hover:bg-raised transition-all text-body-sm font-medium flex items-center gap-2 cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-muted" />
            <span>Raw JSON</span>
          </button>
        </div>
      </section>

      {/* Primary Decision Banner with Risk Gauge */}
      <DecisionBanner
        decision={currentDecision}
        score={currentRisk}
        reason={
          incident.summary.reason_one_line ||
          'Secret tokens and personal data were detected in payload, and the transmission boundary is configured as public egress.'
        }
        scannerInfo={`Scanner: SafePatch Egress Router · Timestamp: ${incident.created_at} · Policy: ${incident.policy_version}`}
        context={incident.context}
        onChangeContext={() => {
          showToast('Use the Simulator to test alternative boundary contexts', 'info');
        }}
      />

      {/* Underline Tabs Navigation Bar with sliding active indicator */}
      <Tabs
        tabs={tabsConfig}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {/* Cross-fading Tab Panes */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW PANE */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Secrets Metric */}
                <motion.div
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: shouldReduceMotion ? 0 : 0 }}
                  className="p-6 rounded-2xl bg-surface border border-border shadow-card flex flex-col justify-between hover:border-secret/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-body-sm font-medium text-ink2">Secrets Spilled</span>
                    <div className="w-10 h-10 rounded-xl bg-secret-tint text-secret flex items-center justify-center">
                      <Key className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[36px] font-bold text-ink leading-tight">
                      {incident.summary.secrets_count}
                    </span>
                  </div>
                  <span className="text-caption text-muted mt-2">
                    Detected by Gitleaks
                  </span>
                </motion.div>

                {/* Personal Data Metric */}
                <motion.div
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: shouldReduceMotion ? 0 : 0.06 }}
                  className="p-6 rounded-2xl bg-surface border border-border shadow-card flex flex-col justify-between hover:border-pii/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-body-sm font-medium text-ink2">Personal Data (PII)</span>
                    <div className="w-10 h-10 rounded-xl bg-pii-tint text-pii flex items-center justify-center">
                      <Users2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[36px] font-bold text-ink leading-tight">
                      {incident.summary.pii_count}
                    </span>
                  </div>
                  <span className="text-caption text-muted mt-2">
                    Detected by Presidio
                  </span>
                </motion.div>

                {/* Highest Severity Metric */}
                <motion.div
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: shouldReduceMotion ? 0 : 0.12 }}
                  className="p-6 rounded-2xl bg-surface border border-border shadow-card flex flex-col justify-between hover:border-block/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-body-sm font-medium text-ink2">Highest Severity</span>
                    <div className="w-10 h-10 rounded-xl bg-block-tint text-block flex items-center justify-center">
                      <AlertOctagon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[32px] font-bold text-block leading-tight">
                      {incident.summary.highest_severity}
                    </span>
                  </div>
                  <span className="text-caption text-muted mt-2">
                    Highest severity among findings
                  </span>
                </motion.div>
              </div>

              {/* 2-Column Split: Detailed Policy Violations & Actionable Advice */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Why this is blocked */}
                <motion.div
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: shouldReduceMotion ? 0 : 0.18 }}
                  className="lg:col-span-8 p-6 rounded-2xl bg-surface border border-border shadow-card flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-block" />
                        <h3 className="text-headline-section text-ink font-semibold">
                          Why this is blocked
                        </h3>
                      </div>
                      <span className="text-caption text-muted uppercase font-semibold tracking-wider">
                        {incident.fired_rules.length} Rules Triggered
                      </span>
                    </div>

                    <div className="text-body-default text-ink2 mb-6 leading-relaxed space-y-1">
                      {incident.summary.explanation_sentences.map((sentence, idx) => (
                        <p key={idx}>{sentence}</p>
                      ))}
                    </div>

                    {/* Rules Stack */}
                    <div className="flex flex-col gap-3">
                      {incident.fired_rules.map((rule) => (
                        <div
                          key={rule.id}
                          className="p-3.5 rounded-xl bg-raised border border-border flex items-center justify-between hover:bg-raised/80 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-mono text-code-sm font-bold px-2 py-1 rounded bg-surface border border-border text-primary">
                              {rule.id}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-body-sm text-ink font-medium truncate">
                                {rule.title}
                              </span>
                              <span className="text-caption text-muted">
                                Source: {rule.source}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-block-tint text-block border border-block/20 uppercase shrink-0">
                            {rule.decision}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div className="pt-4 mt-6 border-t border-border flex items-center justify-between text-caption text-muted">
                    <span>Security Orchestrator: Local Fallback Engine (Zero-Cloud Leakage)</span>
                    <Link
                      to="/simulator"
                      className="text-primary hover:text-primary-hover font-medium flex items-center gap-1"
                    >
                      <span>Open Simulator</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>

                {/* Right Column: Remedy Recommendation */}
                <motion.div
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: shouldReduceMotion ? 0 : 0.24 }}
                  className="lg:col-span-4 p-6 rounded-2xl bg-surface border border-border shadow-card flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary-tint/50 blur-2xl pointer-events-none" />

                  <div>
                    <div className="w-10 h-10 rounded-xl bg-primary-tint text-primary flex items-center justify-center mb-4">
                      <Wand2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-headline-section text-ink font-semibold mb-2">
                      Apply Recommended Fix
                    </h3>
                    <p className="text-body-sm text-ink2 mb-6 leading-relaxed">
                      LeakLens SafePatch can generate an attested patch in seconds, removing all{' '}
                      {incident.findings.length} token entities while retaining required configuration
                      syntax.
                    </p>

                    {/* Quick spec bullet points */}
                    <div className="space-y-3 mb-6 text-body-sm text-ink">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span>FPE token pseudonymisation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span>Automated dry-run re-verification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span>Generates signed receipt {incident.receipt_summary.receipt_id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setActiveTab('fix')}
                      className="w-full h-10 px-4 rounded-xl bg-primary text-white font-medium text-body-sm flex items-center justify-center gap-2 shadow-sm hover:bg-primary-hover transition-all cursor-pointer"
                    >
                      <span>Fix &amp; Verify File</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('findings')}
                      className="w-full h-9 rounded-lg text-ink2 hover:text-ink hover:bg-raised font-medium text-body-sm transition-colors text-center cursor-pointer"
                    >
                      Inspect {incident.findings.length} findings first
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

      {/* ========================================================================= */}
      {/* TAB 2: FINDINGS PANE */}
      {/* ========================================================================= */}
      {activeTab === 'findings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Findings Table */}
          <div className="lg:col-span-7">
            <FindingsTable
              findings={incident.findings}
              selectedFindingId={selectedFinding?.id}
              onSelectFinding={(f) => setSelectedFinding(f)}
            />
          </div>

          {/* Right Column: Masked Preview */}
          <div className="lg:col-span-5">
            <MaskedPreview
              fileName={incident.file_name}
              lines={incident.file_preview}
              selectedFindingId={selectedFinding?.id}
              selectedLine={selectedFinding?.line}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FIX & VERIFY PANE */}
      {/* ========================================================================= */}
      {activeTab === 'fix' && (
        <div className="flex flex-col gap-6">
          {/* Step 1: Choose a Fix */}
          <div className="p-6 rounded-2xl bg-surface border border-border shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-primary text-white text-caption flex items-center justify-center font-bold">
                  1
                </span>
                <div>
                  <h3 className="text-headline-section text-ink font-semibold">
                    Choose Remediation Strategy
                  </h3>
                  <p className="text-body-sm text-ink2">
                    Select automated sanitisation primitives to reconcile policy violations.
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded bg-raised border border-border text-primary">
                Interactive Plan
              </span>
            </div>

            {/* 2x2 Option Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {incident.fix_options.map((opt) => {
                const isChecked = !!selectedFixes[opt.id];
                return (
                  <label
                    key={opt.id}
                    className={`cursor-pointer p-4 rounded-xl border transition-all flex items-start gap-3 ${
                      isChecked
                        ? 'bg-primary-tint/30 border-primary shadow-sm'
                        : 'bg-raised/60 border-border hover:bg-raised'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleFixOption(opt.id)}
                      className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-body-sm text-ink font-semibold">
                          {opt.title}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-primary font-medium">
                          Resolves {opt.resolves_rules.join(', ')}
                        </span>
                      </div>
                      <p className="text-caption text-ink2">{opt.rationale}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleApplyFix}
                className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-body-sm shadow flex items-center gap-2 cursor-pointer transition-all"
              >
                <Check className="w-4 h-4" />
                <span>{fixApplied ? 'Re-Apply Fix' : 'Apply Fix'}</span>
              </button>
            </div>
          </div>

          {/* Step 2: Simulated Verification Result with BeforeAfter */}
          <BeforeAfter
            beforeRisk={incident.initial_risk}
            beforeDecision={incident.initial_decision}
            beforeFindingsCount={incident.findings.length}
            afterRisk={incident.final_risk}
            afterDecision={incident.final_decision}
            afterFindingsRemaining={Math.max(
              0,
              incident.findings.length - incident.safepatch_report.targeted_removed
            )}
            targetedRemovedCount={incident.safepatch_report.targeted_removed}
            targetedTotalCount={incident.safepatch_report.targeted_total}
            onDownloadSanitised={handleDownloadSanitised}
          />

          {/* Step 3: Technical Details Accordion */}
          <Accordion
            title="Technical Details &amp; Patch Cryptography"
            subtitle="SafePatch engine range telemetry and SHA-256 integrity hash diff."
            defaultOpen={false}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-raised border border-border flex flex-col gap-2">
                <span className="text-caption text-muted uppercase font-semibold">
                  Patch Evaluation
                </span>
                <span className="text-body-sm text-ink font-semibold">
                  {incident.safepatch_report.ranges_applied} applied,{' '}
                  {incident.safepatch_report.ranges_rejected} rejected
                </span>
                <p className="text-caption text-ink2">
                  Byte boundaries cleanly swapped without line break skew or syntax corruption in{' '}
                  {incident.safepatch_report.duration_ms}ms.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-raised border border-border flex flex-col gap-2">
                <span className="text-caption text-muted uppercase font-semibold">
                  Input → Output Integrity Hashes
                </span>
                <div className="flex flex-col gap-2">
                  <HashChip
                    value={incident.safepatch_report.input_sha256}
                    prefix="IN SHA-256"
                  />
                  <HashChip
                    value={incident.safepatch_report.output_sha256}
                    prefix="OUT SHA-256"
                  />
                </div>
              </div>
            </div>

            {/* Caution Note */}
            <div className="mt-4 p-3 rounded-lg bg-raised border border-border text-caption text-muted flex items-start gap-2">
              <Info className="w-4 h-4 text-muted shrink-0 mt-0.5" />
              <span>Redaction does not automatically mean the file is safe.</span>
            </div>
          </Accordion>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EVIDENCE VAULT PANE */}
      {/* ========================================================================= */}
      {activeTab === 'evidence' && (
        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-surface border border-border shadow-card flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-tint text-primary flex items-center justify-center shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-headline-section font-bold text-ink">
                    Receipt {incident.receipt_summary.receipt_id}
                  </h3>
                  <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-allow-tint text-allow border border-allow/20">
                    {incident.receipt_summary.checks_passed}/{incident.receipt_summary.checks_total}{' '}
                    Checks Passed
                  </span>
                  <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-raised border border-border text-muted">
                    {incident.receipt_summary.mode}
                  </span>
                </div>
                <p className="text-body-default text-ink2 max-w-2xl leading-relaxed">
                  Cryptographic attestation generated locally on the edge node. No unencrypted
                  content or credentials were leaked to cloud telemetry endpoints during this
                  evaluation cycle.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2 font-mono text-[11px] text-muted">
                  <span>Timestamp: {incident.receipt_summary.timestamp}</span>
                  <span>•</span>
                  <span>Signer Key ID: {incident.receipt_summary.signer_key_id}</span>
                </div>
              </div>
            </div>

            <Link
              to={`/incidents/${incident.id}/evidence`}
              className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white text-body-sm font-medium shadow flex items-center gap-2 shrink-0 transition-all"
            >
              <span>Open Evidence Vault</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          {/* Engine Signature Cards (Mode, Status, Version from Health Data) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface border border-border shadow-card flex flex-col gap-1">
              <span className="text-caption text-muted uppercase font-semibold">Engine 01</span>
              <span className="text-body-sm text-ink font-semibold">
                {health?.components.find((c) => c.id === 'gitleaks')?.name || 'Gitleaks'}
              </span>
              <span className="font-mono text-code-sm text-allow">
                Mode: {health?.components.find((c) => c.id === 'gitleaks')?.mode || 'REAL'}
              </span>
              <span className="text-caption text-muted mt-1">
                {health?.components.find((c) => c.id === 'gitleaks')?.version || 'v8.18.2'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border shadow-card flex flex-col gap-1">
              <span className="text-caption text-muted uppercase font-semibold">Engine 02</span>
              <span className="text-body-sm text-ink font-semibold">
                {health?.components.find((c) => c.id === 'presidio')?.name || 'Presidio'}
              </span>
              <span className="font-mono text-code-sm text-allow">
                Mode: {health?.components.find((c) => c.id === 'presidio')?.mode || 'REAL'}
              </span>
              <span className="text-caption text-muted mt-1">
                {health?.components.find((c) => c.id === 'presidio')?.version || 'v2.2.33'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border shadow-card flex flex-col gap-1">
              <span className="text-caption text-muted uppercase font-semibold">Engine 03</span>
              <span className="text-body-sm text-ink font-semibold">
                {health?.components.find((c) => c.id === 'safepatch')?.name || 'Rust SafePatch'}
              </span>
              <span className="font-mono text-code-sm text-allow">
                Mode: {health?.components.find((c) => c.id === 'safepatch')?.mode || 'REAL'}
              </span>
              <span className="text-caption text-muted mt-1">
                {health?.components.find((c) => c.id === 'safepatch')?.version || 'v0.4.1'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border shadow-card flex flex-col gap-1">
              <span className="text-caption text-muted uppercase font-semibold">Engine 04</span>
              <span className="text-body-sm text-ink font-semibold">
                CooL Evidence Signer
              </span>
              <span className="font-mono text-code-sm text-review">
                Mode: {health?.components.find((c) => c.id === 'cool')?.mode || 'FALLBACK'}
              </span>
              <span className="text-caption text-muted mt-1">
                {health?.components.find((c) => c.id === 'cool')?.version || 'v1.0.0-fallback'}
              </span>
            </div>
          </div>
        </div>
      )}
        </motion.div>
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PERSISTENT ALWAYS-VISIBLE FOOTER STATUS BAR */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-[232px] right-0 h-14 bg-surface/95 backdrop-blur-md border-t border-border shadow-lg z-30 px-6 flex items-center justify-between">
        {/* Left: Status Lifecycle Stepper */}
        <div className="flex items-center gap-2 text-caption">
          {/* Step 1 */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold ${
              !fixApplied
                ? 'bg-block-tint text-block border border-block/20'
                : 'text-muted bg-raised border border-border'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                !fixApplied ? 'bg-block animate-pulse' : 'bg-muted'
              }`}
            />
            <span>BLOCKED {!fixApplied ? '(Active)' : ''}</span>
          </div>

          <span className="text-border font-bold">→</span>

          {/* Step 2 */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold ${
              fixApplied
                ? 'bg-review-tint text-review border border-review/20'
                : 'text-muted opacity-60'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                fixApplied ? 'bg-review animate-pulse' : 'bg-muted'
              }`}
            />
            <span>Ready for Review {fixApplied ? '(Active)' : ''}</span>
          </div>

          <span className="text-border font-bold">→</span>

          {/* Step 3 */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-muted opacity-60">
            <span className="w-1.5 h-1.5 rounded-full bg-muted" />
            <span>Approved for Sharing</span>
          </div>
        </div>

        {/* Center: Honesty Notice */}
        <div className="hidden xl:flex items-center gap-1.5 text-ink2 text-caption">
          <Info className="w-4 h-4 text-muted shrink-0" />
          <span>
            LeakLens simulates the sharing decision. It does not actually block uploads to
            external platforms.
          </span>
        </div>

        {/* Right: Simulator Link */}
        <div className="flex items-center gap-2">
          <Link
            to={`/simulator?incident=${incident.id}`}
            className="text-body-sm text-primary hover:text-primary-hover font-medium flex items-center gap-1 transition-colors"
          >
            <span>Open in What-if Simulator</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Raw JSON Modal */}
      {showRawJsonModal && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-popover max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-raised">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-headline-subsection font-semibold text-ink">
                  Raw Incident JSON ({incident.id})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRawJsonModal(false)}
                className="text-muted hover:text-ink p-1 rounded-lg hover:bg-surface transition-colors cursor-pointer"
                aria-label="Close raw JSON modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <JsonViewer data={incident} title={incident.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
