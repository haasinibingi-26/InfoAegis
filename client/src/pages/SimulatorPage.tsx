import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  SlidersHorizontal,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  ChevronDown,
  Info,
  RotateCcw,
  Sparkles,
  FileText,
  Lock,
  Layers,
} from 'lucide-react';
import {
  fetchIncidents,
  fetchSimulator,
  evaluatePolicy,
} from '../config/api';
import type { DecisionState } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { RiskGauge } from '../components/RiskGauge';
import { HeatmapMatrix } from '../components/HeatmapMatrix';
import { Accordion } from '../components/Accordion';
import { Skeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';

export const SimulatorPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  // Load incidents list for incident selector
  const { data: incidentsData } = useQuery({
    queryKey: ['incidents'],
    queryFn: fetchIncidents,
  });

  // Load simulator matrix and baseline data
  const {
    data: simData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['simulator'],
    queryFn: fetchSimulator,
  });

  const incidentList = useMemo(() => incidentsData?.incidents || [], [incidentsData]);

  // Selected incident ID from query params or default
  const selectedIncidentId =
    searchParams.get('incident') ||
    (incidentList.length > 0 ? incidentList[0].id : 'INC-20260101-0001');

  // Form states
  const [destination, setDestination] = useState<string>('Public GitHub repository');
  const [audience, setAudience] = useState<string>('Anyone');
  const [access, setAccess] = useState<string>('Download');

  // Advanced overrides
  const [showOverrides, setShowOverrides] = useState<boolean>(false);
  const [containsSecret, setContainsSecret] = useState<boolean>(true);
  const [containsPii, setContainsPii] = useState<boolean>(true);

  // Initialize from baseline when simData loads or changes
  useEffect(() => {
    if (simData?.baseline) {
      setDestination(simData.baseline.destination);
      setAudience(simData.baseline.audience);
      setAccess(simData.baseline.access);
      setContainsSecret(simData.baseline.contains_secret);
      setContainsPii(simData.baseline.contains_pii);
    }
  }, [simData]);

  // Handle changing incident selector
  const handleSelectIncident = (incId: string) => {
    setSearchParams({ incident: incId });
    showToast(`Loaded baseline findings for ${incId}`);
  };

  // Check if overrides differ from baseline
  const baselineSecret = simData?.baseline.contains_secret ?? true;
  const baselinePii = simData?.baseline.contains_pii ?? true;
  const secretOverridden = containsSecret !== baselineSecret;
  const piiOverridden = containsPii !== baselinePii;

  // Evaluate policy on current parameters
  const [evalResult, setEvalResult] = useState<{
    decision: DecisionState;
    risk: number;
    firedRules: string[];
    explanation: string;
  }>({
    decision: 'BLOCK',
    risk: 92,
    firedRules: ['R1', 'R4', 'R9'],
    explanation: "Computed from this incident's actual findings.",
  });

  useEffect(() => {
    let active = true;
    evaluatePolicy({
      incidentId: selectedIncidentId,
      destination,
      audience,
      access,
      containsSecret,
      containsPii,
    }).then((res) => {
      if (active) {
        setEvalResult(res);
      }
    });
    return () => {
      active = false;
    };
  }, [selectedIncidentId, destination, audience, access, containsSecret, containsPii]);

  // Reset to baseline
  const handleResetToBaseline = () => {
    if (!simData?.baseline) return;
    setDestination(simData.baseline.destination);
    setAudience(simData.baseline.audience);
    setAccess(simData.baseline.access);
    setContainsSecret(simData.baseline.contains_secret);
    setContainsPii(simData.baseline.contains_pii);
    showToast('Reset simulator context to scan baseline');
  };

  // Rule catalog descriptions from simulator.json fixture
  const rulesCatalog = useMemo(() => {
    return simData?.rules_catalog || {
      R1: 'Secrets cannot be shared to public destinations (Gitleaks detection)',
      R4: 'Personal identifiable data (PII) shared externally requires partner agreement',
      R9: 'High entropy credentials trigger immediate egress block',
    };
  }, [simData]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <Skeleton className="h-32 w-full" rounded="xl" />
        <Skeleton className="h-80 w-full" rounded="xl" />
        <Skeleton className="h-96 w-full" rounded="xl" />
      </div>
    );
  }

  if (error || !simData) {
    return (
      <div className="p-8 rounded-2xl bg-surface border border-block/30 shadow-card text-center max-w-xl mx-auto flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-block-tint text-block flex items-center justify-center mb-3">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <h2 className="text-headline-section font-bold text-ink">Failed to load simulator data</h2>
        <p className="text-body-default text-muted mt-1">
          Could not retrieve the boundary policy simulation matrix.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-5 px-4 py-2 rounded-lg bg-primary text-white text-body-sm font-medium hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary cursor-pointer transition-colors shadow-sm"
        >
          Retry loading
        </button>
      </div>
    );
  }

  const baseline = simData.baseline;
  const isContextModified =
    destination !== baseline.destination ||
    audience !== baseline.audience ||
    access !== baseline.access ||
    secretOverridden ||
    piiOverridden;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-caption text-muted">
          <Link to="/" className="hover:text-primary transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-ink font-semibold">What-if Simulator</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-headline-page font-bold text-ink">
                What-if Simulator
              </h1>
              <span className="text-caption font-mono uppercase bg-raised text-muted px-2.5 py-0.5 rounded border border-border">
                Simulated (fixtures)
              </span>
            </div>
            <p className="text-body-default text-ink2 mt-1">
              Simulate sharing scenarios against policy rules before sharing sensitive files.
            </p>
          </div>

          {/* Incident Selector */}
          <div className="flex items-center gap-2 bg-surface p-1.5 rounded-xl border border-border shadow-sm">
            <span className="text-caption font-medium text-muted pl-2">Incident:</span>
            <select
              value={selectedIncidentId}
              onChange={(e) => handleSelectIncident(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-raised text-body-sm font-semibold text-ink border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {incidentList.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  {inc.id} ({inc.file_name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Controls & Overrides | Right Live Evaluation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Context Controls & Advanced Overrides (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="p-space-lg rounded-2xl bg-surface border border-border shadow-card flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h2 className="text-headline-section font-semibold text-ink">
                  Simulation Context
                </h2>
              </div>
              {isContextModified && (
                <button
                  type="button"
                  onClick={handleResetToBaseline}
                  className="inline-flex items-center gap-1.5 text-caption font-medium text-muted hover:text-primary transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to baseline</span>
                </button>
              )}
            </div>

            {/* Destination Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sim-dest" className="text-body-sm font-semibold text-ink">
                Destination Channel
              </label>
              <select
                id="sim-dest"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface border border-border text-body-default text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                {simData.destination_groups.map((group) => (
                  <optgroup key={group.group} label={`${group.group} Perimeter`}>
                    {group.destinations.map((dest) => (
                      <option key={dest} value={dest}>
                        {dest}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Audience Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sim-aud" className="text-body-sm font-semibold text-ink">
                Audience Scope
              </label>
              <select
                id="sim-aud"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface border border-border text-body-default text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                {simData.audiences.map((aud) => (
                  <option key={aud} value={aud}>
                    {aud}
                  </option>
                ))}
              </select>
            </div>

            {/* Access Level Control */}
            <div className="flex flex-col gap-1.5">
              <label className="text-body-sm font-semibold text-ink">Access Permission</label>
              <div className="grid grid-cols-3 gap-2">
                {['View only', 'Download', 'Edit'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setAccess(lvl)}
                    className={`h-9 rounded-lg text-body-sm font-medium border transition-all ${
                      access === lvl
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface hover:bg-raised text-ink2 border-border'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Overrides Collapsible Disclosure */}
            <div className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowOverrides((prev) => !prev)}
                className="w-full flex items-center justify-between text-left py-2 text-body-sm font-semibold text-ink hover:text-primary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Advanced Finding Overrides</span>
                  {(secretOverridden || piiOverridden) && (
                    <span className="px-2 py-0.5 rounded-full bg-review-tint text-review border border-review/30 text-[11px] font-bold">
                      Overrides Active
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-muted transition-transform duration-200 ${
                    showOverrides ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showOverrides && (
                <div className="mt-3 p-4 rounded-xl bg-raised/50 border border-border flex flex-col gap-3">
                  <p className="text-caption text-ink2">
                    Override finding presence to test policy behavior when credentials or PII are
                    mitigated.
                  </p>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-surface border border-border">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        id="override-secret"
                        checked={containsSecret}
                        onChange={(e) => setContainsSecret(e.target.checked)}
                        className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                      />
                      <label htmlFor="override-secret" className="text-body-sm text-ink font-medium">
                        Contains Secrets ({baseline.secrets_count} detected)
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-raised text-muted border border-border">
                        from scan
                      </span>
                      {secretOverridden && (
                        <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-primary-tint text-primary border border-primary/20">
                          overridden
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-surface border border-border">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        id="override-pii"
                        checked={containsPii}
                        onChange={(e) => setContainsPii(e.target.checked)}
                        className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                      />
                      <label htmlFor="override-pii" className="text-body-sm text-ink font-medium">
                        Contains PII ({baseline.pii_count} detected)
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-raised text-muted border border-border">
                        from scan
                      </span>
                      {piiOverridden && (
                        <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-primary-tint text-primary border border-primary/20">
                          overridden
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Result Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="p-space-lg rounded-2xl bg-surface border border-border shadow-card flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-headline-section font-semibold text-ink">
                  Live Verdict
                </h2>
                <span className="text-caption font-mono uppercase bg-raised text-muted px-2 py-0.5 rounded border border-border">
                  Simulated (fixtures)
                </span>
              </div>
              <StatusBadge status={evalResult.decision} size="md" />
            </div>

            {/* Gauge & Score */}
            <div className="flex items-center justify-center py-2">
              <RiskGauge
                score={evalResult.risk}
                decision={evalResult.decision}
                size="lg"
                showLabel={true}
              />
            </div>

            {/* One-sentence explanation from simulator.json */}
            <div className="p-3.5 rounded-xl bg-raised border border-border flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-caption font-semibold uppercase text-muted tracking-wider">
                  Policy Explanation
                </span>
                <span className="text-[10px] font-mono uppercase bg-primary-tint text-primary px-1.5 py-0.5 rounded font-semibold">
                  Simulated (fixtures)
                </span>
              </div>
              <p className="text-body-default text-ink font-medium leading-relaxed">
                {evalResult.explanation}
              </p>
            </div>

            {/* Honest caption */}
            <div className="px-3 py-2 rounded-lg bg-raised/40 border border-border flex items-center justify-between text-caption text-ink2">
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Computed from this incident's actual findings.</span>
              </div>
              <span className="font-mono text-[10px] text-muted">Simulated (fixtures)</span>
            </div>

            {/* Transition Strip (Baseline -> Simulated) */}
            {isContextModified && (
              <div className="p-3 rounded-xl bg-primary-tint/30 border border-primary/20 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-primary">
                    Context Transition
                  </span>
                  <span className="text-[10px] font-mono text-muted uppercase">Simulated (fixtures)</span>
                </div>
                <div className="flex items-center justify-between text-caption font-mono gap-2">
                  <div className="flex flex-col">
                    <span className="text-muted">Baseline:</span>
                    <span className="text-ink font-semibold">
                      {baseline.destination} · {baseline.audience}
                    </span>
                    <span className="text-block font-semibold">
                      {baseline.decision} (Risk {baseline.risk})
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex flex-col text-right">
                    <span className="text-muted">Simulated:</span>
                    <span className="text-ink font-semibold">
                      {destination} · {audience}
                    </span>
                    <span
                      className={`font-semibold ${
                        evalResult.decision === 'BLOCK'
                          ? 'text-block'
                          : evalResult.decision === 'REVIEW'
                          ? 'text-review'
                          : 'text-allow'
                      }`}
                    >
                      {evalResult.decision} (Risk {evalResult.risk})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Why Accordion (Fired Rules from simulator.json) */}
            <Accordion
              title={`Fired Policy Rules (${evalResult.firedRules.length})`}
              subtitle="Rules triggered under current simulation parameters (from simulator.json)"
              defaultOpen={true}
            >
              {evalResult.firedRules.length === 0 ? (
                <p className="text-body-sm text-allow font-medium py-1">
                  ✓ No restrictive rules triggered in this context.
                </p>
              ) : (
                <div className="space-y-2 pt-2">
                  {evalResult.firedRules.map((ruleId) => (
                    <div
                      key={ruleId}
                      className="p-2.5 rounded-lg bg-raised border border-border flex items-start justify-between gap-2.5 text-body-sm"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-code-sm font-bold text-block px-1.5 py-0.5 rounded bg-block-tint border border-block/20">
                          {ruleId}
                        </span>
                        <span className="text-ink2">
                          {rulesCatalog[ruleId] || `Policy rule ${ruleId} evaluated.`}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted uppercase shrink-0 pt-0.5">
                        Rule from fixture
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Accordion>
          </div>
        </div>
      </div>

      {/* Compare Contexts Heatmap Matrix */}
      <HeatmapMatrix
        destinationGroups={simData.destination_groups}
        audiences={simData.audiences}
        cells={simData.cells}
        selectedDestination={destination}
        selectedAudience={audience}
        onSelectCell={(dest, aud) => {
          setDestination(dest);
          setAudience(aud);
          showToast(`Simulating: ${dest} -> ${aud}`);
        }}
      />
    </div>
  );
};
