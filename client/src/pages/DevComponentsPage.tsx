import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Sparkles, Bell } from 'lucide-react';
import {
  fetchHealth,
  fetchIncidentById,
  fetchReceiptById,
  fetchSimulator,
} from '../config/api';
import type { FindingItem } from '../types/api';
import { DecisionBanner } from '../components/DecisionBanner';
import { RiskGauge } from '../components/RiskGauge';
import { PipelineStepper, type PipelineStep } from '../components/PipelineStepper';
import { FindingsTable } from '../components/FindingsTable';
import { MaskedPreview } from '../components/MaskedPreview';
import { BeforeAfter } from '../components/BeforeAfter';
import { HashChip } from '../components/HashChip';
import { StatusBadge } from '../components/StatusBadge';
import { HeatmapMatrix } from '../components/HeatmapMatrix';
import { VerificationChecks } from '../components/VerificationChecks';
import { JsonViewer } from '../components/JsonViewer';
import { Tabs } from '../components/Tabs';
import { Accordion } from '../components/Accordion';
import { useToast } from '../components/Toast';
import { Skeleton } from '../components/Skeleton';

const SAMPLE_PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'step-1',
    title: 'Detect secrets — Gitleaks',
    description: 'Gitleaks v8.18.2 scanning API tokens and private keys',
    duration: '0.34s',
    status: 'completed',
    badge: '3 Flagged',
  },
  {
    id: 'step-2',
    title: 'Detect personal data — Presidio',
    description: 'Microsoft Presidio scanning PII, SSNs, emails, and names',
    duration: '0.42s',
    status: 'completed',
    badge: '5 Flagged',
  },
  {
    id: 'step-3',
    title: 'Evaluate context',
    description: 'Checking Public GitHub repository · Anyone · Download',
    duration: '0.18s',
    status: 'completed',
    badge: 'Done',
  },
  {
    id: 'step-4',
    title: 'Decide',
    description: 'Evaluating policy leaklens-policy-v1.0 rules R1, R4, R9',
    duration: '0.8s',
    status: 'active',
    badge: 'Running',
  },
  {
    id: 'step-5',
    title: 'Prepare fix',
    description: 'Rust SafePatch preparing byte-range redactions',
    status: 'pending',
    badge: 'Queued',
  },
  {
    id: 'step-6',
    title: 'Create evidence',
    description: 'Signing canonical receipt RCPT-0001',
    status: 'pending',
    badge: 'Queued',
  },
];

export const DevComponentsPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeDemoTab, setActiveDemoTab] = useState('overview');
  const [selectedFinding, setSelectedFinding] = useState<FindingItem | undefined>(
    undefined
  );
  const [isTamperedDemo, setIsTamperedDemo] = useState(false);
  const [selectedCell, setSelectedCell] = useState({
    destination: 'Public GitHub repository',
    audience: 'Anyone',
  });

  const { data: incident, isLoading: incidentLoading } = useQuery({
    queryKey: ['incident', 'INC-20260101-0001'],
    queryFn: () => fetchIncidentById('INC-20260101-0001'),
  });

  const { data: receipt, isLoading: receiptLoading } = useQuery({
    queryKey: ['receipt', 'INC-20260101-0001'],
    queryFn: () => fetchReceiptById('INC-20260101-0001'),
  });

  const { data: simulator, isLoading: simLoading } = useQuery({
    queryKey: ['simulator'],
    queryFn: fetchSimulator,
  });

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  if (incidentLoading || receiptLoading || simLoading || !incident || !receipt || !simulator) {
    return (
      <div className="space-y-space-lg">
        <Skeleton className="h-10 w-72" rounded="lg" />
        <Skeleton className="h-36 w-full" rounded="xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <Skeleton className="h-64 w-full" rounded="xl" />
          <Skeleton className="h-64 w-full" rounded="xl" />
        </div>
      </div>
    );
  }

  const currentFinding = selectedFinding ?? incident.findings[0];

  return (
    <div className="space-y-space-xl pb-16">
      {/* Stage A Header Banner */}
      <div className="bg-surface rounded-xl border border-border shadow-card p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-primary-tint text-primary text-badge-label font-semibold">
              STAGE A REVIEW
            </span>
            <span className="font-mono text-code-sm text-muted">
              Fixture: {incident.id} ({incident.file_name})
            </span>
          </div>
          <h1 className="text-display-title text-ink">
            Shared Component Showcase
          </h1>
          <p className="text-body-default text-ink2 mt-1">
            All 15 reusable components rendered with live React Query data from{' '}
            <code className="font-mono text-code-sm bg-code px-1.5 py-0.5 rounded">
              /contracts/fixtures
            </code>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            showToast('Toast verified! Auto-dismisses after 3 seconds.', 'success')
          }
          className="h-9 px-3.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-body-sm font-medium inline-flex items-center gap-2 shadow-sm shrink-0 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span>Trigger Toast</span>
        </button>
      </div>

      {/* 1. DecisionBanner + 2. RiskGauge */}
      <section className="space-y-space-sm">
        <h2 className="text-headline-section text-ink">
          1. DecisionBanner &amp; 2. RiskGauge
        </h2>
        <DecisionBanner
          decision={incident.initial_decision}
          score={incident.initial_risk}
          reason={incident.summary.reason_one_line}
          context={incident.context}
          onChangeContext={() =>
            showToast('Change context clicked (navigates to Simulator in Stage C)', 'info')
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-2">
          <div className="bg-surface rounded-xl border border-border p-space-md shadow-card">
            <RiskGauge score={92} decision="BLOCK" />
          </div>
          <div className="bg-surface rounded-xl border border-border p-space-md shadow-card">
            <RiskGauge score={18} decision="REVIEW" />
          </div>
          <div className="bg-surface rounded-xl border border-border p-space-md shadow-card">
            <RiskGauge score={8} decision="ALLOW" />
          </div>
        </div>
      </section>

      {/* 3. StatusBadge & 4. HashChip & 5. Tabs */}
      <section className="bg-surface rounded-xl border border-border shadow-card p-space-lg space-y-space-md">
        <h2 className="text-headline-section text-ink">
          3. StatusBadge, 4. HashChip &amp; 5. Tabs
        </h2>

        <div className="space-y-2">
          <span className="text-caption uppercase tracking-wider text-muted font-semibold">
            Decision, Engine Mode &amp; Category Badges (Icon + Label, never color alone)
          </span>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <StatusBadge status="BLOCK" />
            <StatusBadge status="REVIEW" />
            <StatusBadge status="ALLOW" />
            <StatusBadge status="REAL" />
            <StatusBadge status="FALLBACK" />
            <StatusBadge status="MOCK" />
            <StatusBadge status="UNAVAILABLE" />
            <StatusBadge status="SECRET" />
            <StatusBadge status="PII" />
            {health?.components.map((c) => (
              <StatusBadge
                key={c.id}
                status={c.mode}
                label={`${c.name}: ${c.mode}`}
                size="sm"
              />
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <span className="text-caption uppercase tracking-wider text-muted font-semibold">
            HashChips (Truncated Monospace + Copy to Clipboard)
          </span>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <HashChip
              prefix="IN"
              value={incident.safepatch_report.input_sha256}
            />
            <HashChip
              prefix="OUT"
              value={incident.safepatch_report.output_sha256}
            />
            <HashChip
              prefix="KEY"
              value={receipt.signer_key_id}
              startChars={12}
              endChars={4}
            />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <span className="text-caption uppercase tracking-wider text-muted font-semibold">
            Tabs (Note: Results 4th tab label is &quot;Evidence&quot;)
          </span>
          <Tabs
            tabs={[
              { id: 'overview', label: 'Overview' },
              {
                id: 'findings',
                label: 'Findings',
                badge: incident.findings.length,
              },
              { id: 'fix', label: 'Fix & Verify' },
              { id: 'evidence', label: 'Evidence' },
            ]}
            activeTab={activeDemoTab}
            onChange={setActiveDemoTab}
          />
        </div>
      </section>

      {/* 6. FindingsTable (62%) & 7. MaskedPreview (38%) */}
      <section className="space-y-space-sm">
        <h2 className="text-headline-section text-ink">
          6. FindingsTable (62%) &amp; 7. MaskedPreview (38%)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <div className="lg:col-span-7">
            <FindingsTable
              findings={incident.findings}
              selectedFindingId={currentFinding?.id}
              onSelectFinding={(item) => setSelectedFinding(item)}
            />
          </div>
          <div className="lg:col-span-5">
            <MaskedPreview
              fileName={incident.file_name}
              lines={incident.file_preview}
              selectedFindingId={currentFinding?.id}
              selectedLine={currentFinding?.line}
            />
          </div>
        </div>
      </section>

      {/* 8. BeforeAfter & 9. PipelineStepper */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        <div className="lg:col-span-7 space-y-space-sm">
          <h2 className="text-headline-section text-ink">8. BeforeAfter</h2>
          <BeforeAfter
            beforeRisk={incident.initial_risk}
            beforeDecision={incident.initial_decision}
            beforeFindingsCount={incident.findings.length}
            afterRisk={incident.final_risk}
            afterDecision={incident.final_decision}
            afterFindingsRemaining={0}
            targetedRemovedCount={incident.safepatch_report.targeted_removed}
            targetedTotalCount={incident.safepatch_report.targeted_total}
            onDownloadSanitised={() =>
              showToast('Downloading sanitised demo_secret_and_pii.env', 'success')
            }
          />
        </div>

        <div className="lg:col-span-5 space-y-space-sm">
          <h2 className="text-headline-section text-ink">9. PipelineStepper</h2>
          <div className="bg-surface rounded-xl border border-border shadow-card p-space-lg">
            <PipelineStepper steps={SAMPLE_PIPELINE_STEPS} progressPercent={62} />
          </div>
        </div>
      </section>

      {/* 10. VerificationChecks & 11. JsonViewer */}
      <section className="space-y-space-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-headline-section text-ink">
            10. VerificationChecks (55%) &amp; 11. JsonViewer (45%)
          </h2>
          <button
            type="button"
            onClick={() => setIsTamperedDemo((prev) => !prev)}
            className="h-8 px-3 rounded-lg border border-block text-block hover:bg-block-tint text-body-sm font-medium transition-colors"
          >
            {isTamperedDemo
              ? 'Restore Valid Receipt'
              : 'Simulate Tamper Variant'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <div className="lg:col-span-7">
            <VerificationChecks
              checks={receipt.checks}
              isTampered={isTamperedDemo}
            />
          </div>
          <div className="lg:col-span-5">
            <JsonViewer
              data={
                isTamperedDemo ? receipt.tampered_record : receipt.signed_record
              }
              sha256Digest={
                isTamperedDemo ? '0x7c2e... (MISMATCH)' : '4a2f8b...0f9c'
              }
            />
          </div>
        </div>
      </section>

      {/* 12. HeatmapMatrix */}
      <section className="space-y-space-sm">
        <h2 className="text-headline-section text-ink">12. HeatmapMatrix</h2>
        <HeatmapMatrix
          destinationGroups={simulator.destination_groups}
          audiences={simulator.audiences}
          cells={simulator.cells}
          selectedDestination={selectedCell.destination}
          selectedAudience={selectedCell.audience}
          onSelectCell={(destination, audience) => {
            setSelectedCell({ destination, audience });
            showToast(`Loaded context: ${destination} -> ${audience}`, 'info');
          }}
        />
      </section>

      {/* 13. Accordion & 14. Skeleton */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        <div className="lg:col-span-7 space-y-space-sm">
          <h2 className="text-headline-section text-ink">13. Accordion</h2>
          <Accordion
            title="What this receipt does and does not prove"
            subtitle="Honesty disclosure required on Evidence Vault"
            badge="Honesty Spec"
            icon={<ShieldCheck className="w-4 h-4" />}
            defaultOpen={true}
          >
            <p className="text-body-default text-ink2 leading-relaxed">
              This receipt shows the recorded result is authentic and unaltered.
              It does not prove the scanners found every secret, that the policy
              is correct, or that an external platform enforced the decision.
              Hardware attestation is mocked and there is no public-chain
              anchoring in this build.
            </p>
          </Accordion>
        </div>

        <div className="lg:col-span-5 space-y-space-sm">
          <h2 className="text-headline-section text-ink">
            14. Skeleton &amp; 15. Toast
          </h2>
          <div className="bg-surface rounded-xl border border-border shadow-card p-space-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-body-medium font-semibold text-ink">
                Shimmer Skeleton States
              </span>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <Skeleton className="h-5 w-2/3" rounded="md" />
            <Skeleton className="h-4 w-full" rounded="md" />
            <Skeleton className="h-4 w-5/6" rounded="md" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-7 w-20" rounded="full" />
              <Skeleton className="h-7 w-24" rounded="full" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
