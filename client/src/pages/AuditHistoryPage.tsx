import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  ExternalLink,
  RefreshCw,
  FileText,
  Link as LinkIcon,
  Check,
  FileCheck2,
  AlertOctagon,
} from 'lucide-react';
import {
  fetchIncidents,
  fetchAuditLog,
  verifyAuditChain,
} from '../config/api';
import type { IncidentListItem, AuditEvent } from '../types/api';
import { Tabs } from '../components/Tabs';
import { StatusBadge } from '../components/StatusBadge';
import { HashChip } from '../components/HashChip';
import { Skeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';

export const AuditHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const shouldReduceMotion = useReducedMotion();

  const [activeTab, setActiveTab] = useState<string>('incidents');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [decisionFilter, setDecisionFilter] = useState<'ALL' | 'BLOCK' | 'REVIEW' | 'ALLOW'>('ALL');

  // Chain verification state
  const [isVerifyingChain, setIsVerifyingChain] = useState<boolean>(false);
  const [chainVerificationResult, setChainVerificationResult] = useState<{
    valid: boolean;
    message: string;
    totalEvents: number;
  } | null>(null);

  // Load incidents data
  const {
    data: incidentsData,
    isLoading: incidentsLoading,
    error: incidentsError,
    refetch: refetchIncidents,
  } = useQuery({
    queryKey: ['incidents'],
    queryFn: fetchIncidents,
  });

  // Load audit chain data
  const {
    data: auditData,
    isLoading: auditLoading,
    error: auditError,
    refetch: refetchAudit,
  } = useQuery({
    queryKey: ['audit'],
    queryFn: fetchAuditLog,
  });

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    if (!incidentsData?.incidents) return [];
    return incidentsData.incidents.filter((inc) => {
      // Decision filter
      if (decisionFilter !== 'ALL' && inc.initial_decision !== decisionFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = inc.id.toLowerCase().includes(query);
        const matchesFile = inc.file_name.toLowerCase().includes(query);
        const matchesDest = inc.destination.toLowerCase().includes(query);
        const matchesAud = inc.audience.toLowerCase().includes(query);
        return matchesId || matchesFile || matchesDest || matchesAud;
      }
      return true;
    });
  }, [incidentsData, decisionFilter, searchQuery]);

  // Handle Verify Audit Chain action
  const handleVerifyChain = async () => {
    setIsVerifyingChain(true);
    try {
      const res = await verifyAuditChain();
      setChainVerificationResult(res);
      showToast(res.message);
    } catch {
      showToast('Audit chain verification failed');
    } finally {
      setIsVerifyingChain(false);
    }
  };

  const tabsConfig = [
    {
      id: 'incidents',
      label: 'Incidents',
      badge: incidentsData?.incidents.length || 3,
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'audit',
      label: 'Audit Log (Chain)',
      badge: auditData?.total_events || 6,
      icon: <LinkIcon className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-caption text-muted">
          <Link to="/" className="hover:text-primary transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-ink font-semibold">Audit History</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-headline-page font-bold text-ink">
                Audit History
              </h1>
              <span className="text-caption font-mono uppercase bg-raised text-muted px-2.5 py-0.5 rounded border border-border">
                Simulated (fixtures)
              </span>
            </div>
            <p className="text-body-default text-ink2 mt-1">
              Tamper-evident record of all processed security incidents and cryptographic attestation events.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabsConfig}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId)}
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
          {/* TAB 1: INCIDENTS TABLE */}
          {/* ========================================================================= */}
          {activeTab === 'incidents' && (
            <div className="flex flex-col gap-5">
              {/* Controls: Search and Filter Chips */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-space-md rounded-2xl border border-border shadow-card">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by ID, file name, destination, or audience..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface border border-border text-body-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Filter Category Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-caption text-muted font-medium mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filter:</span>
                  </span>
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: 'BLOCK', label: 'Blocked' },
                    { id: 'REVIEW', label: 'Review' },
                    { id: 'ALLOW', label: 'Allowed' },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setDecisionFilter(chip.id as any)}
                      className={`h-8 px-3 rounded-full text-caption font-semibold transition-all cursor-pointer ${
                        decisionFilter === chip.id
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-raised hover:bg-raised/80 text-ink2 border border-border'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Incidents Table */}
              {incidentsLoading ? (
                <Skeleton className="h-72 w-full" rounded="xl" />
              ) : incidentsError ? (
                <div className="p-8 rounded-2xl bg-surface border border-block/30 shadow-card text-center flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-block-tint text-block flex items-center justify-center mb-3">
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <h3 className="text-headline-subsection font-semibold text-ink">Failed to load incidents</h3>
                  <p className="text-body-sm text-ink2 mt-1">Unable to fetch incident history records from the server.</p>
                  <button
                    type="button"
                    onClick={() => refetchIncidents()}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-body-sm font-medium hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary cursor-pointer transition-colors shadow-sm"
                  >
                    Retry loading
                  </button>
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div className="p-12 rounded-2xl bg-surface border border-border shadow-card text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-raised flex items-center justify-center text-muted mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-headline-subsection font-semibold text-ink">No matching incidents</h3>
                  <p className="text-body-sm text-ink2 mt-1 max-w-sm">
                    {searchQuery || decisionFilter !== 'ALL'
                      ? 'No incidents matched your search filter criteria. Try adjusting your query or resetting filters.'
                      : 'There are currently no security incidents recorded.'}
                  </p>
                  {(searchQuery || decisionFilter !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setDecisionFilter('ALL');
                      }}
                      className="mt-4 px-4 py-2 rounded-lg bg-raised hover:bg-raised/80 text-ink text-body-sm font-medium border border-border transition-colors cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[850px]">
                      <thead>
                        <tr className="bg-raised text-ink2 text-caption uppercase tracking-wider border-b border-border">
                          <th className="py-3.5 px-4 font-semibold">Incident ID &amp; Time</th>
                          <th className="py-3.5 px-4 font-semibold">File &amp; Size</th>
                          <th className="py-3.5 px-4 font-semibold">Destination / Audience</th>
                          <th className="py-3.5 px-4 font-semibold">Initial → Final Decision</th>
                          <th className="py-3.5 px-4 font-semibold text-center">Risk Before → After</th>
                          <th className="py-3.5 px-4 font-semibold text-center">Receipt</th>
                          <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredIncidents.map((inc) => (
                          <tr
                            key={inc.id}
                            onClick={() => navigate(`/incidents/${inc.id}`)}
                            className="hover:bg-raised/40 transition-colors cursor-pointer group"
                          >
                            {/* ID & Relative Time */}
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-mono text-body-sm font-semibold text-ink group-hover:text-primary transition-colors">
                                  {inc.id}
                                </span>
                                <span className="text-caption text-muted flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  <span>{inc.relative_time}</span>
                                </span>
                              </div>
                            </td>

                            {/* File & Size */}
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="text-body-sm font-medium text-ink">
                                  {inc.file_name}
                                </span>
                                <span className="text-caption text-muted font-mono">{inc.file_size}</span>
                              </div>
                            </td>

                            {/* Destination & Audience */}
                            <td className="py-3 px-4">
                              <div className="flex flex-col max-w-[200px]">
                                <span className="text-body-sm text-ink truncate" title={inc.destination}>
                                  {inc.destination}
                                </span>
                                <span className="text-caption text-muted truncate" title={inc.audience}>
                                  {inc.audience}
                                </span>
                              </div>
                            </td>

                            {/* Decision Pills */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <StatusBadge status={inc.initial_decision} size="sm" />
                                <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" />
                                <StatusBadge status={inc.final_decision} size="sm" />
                              </div>
                            </td>

                            {/* Risk Before -> After */}
                            <td className="py-3 px-4 text-center">
                              <span className="font-mono text-code-sm font-semibold text-ink">
                                {inc.initial_risk} →{' '}
                                <span
                                  className={
                                    inc.final_risk < 30
                                      ? 'text-allow font-bold'
                                      : inc.final_risk < 70
                                      ? 'text-review font-bold'
                                      : 'text-block font-bold'
                                  }
                                >
                                  {inc.final_risk}
                                </span>
                              </span>
                            </td>

                            {/* Receipt Status */}
                            <td className="py-3 px-4 text-center">
                              {inc.receipt_verified ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-allow-tint text-allow border border-allow/20 text-badge-label font-semibold">
                                  <Check className="w-3 h-3" />
                                  <span>Verified</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-raised text-muted border border-border text-badge-label font-semibold">
                                  <span>Pending</span>
                                </span>
                              )}
                            </td>

                            {/* View Action */}
                            <td className="py-3 px-4 text-right">
                              <Link
                                to={`/incidents/${inc.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-body-sm font-medium text-primary hover:text-primary-hover transition-colors"
                              >
                                <span>View</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: AUDIT LOG (CHAIN TIMELINE) */}
          {/* ========================================================================= */}
          {activeTab === 'audit' && (
            <div className="flex flex-col gap-6">
              {/* Action Bar: Chain Verification */}
              <div className="p-space-md rounded-2xl bg-surface border border-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-headline-section font-semibold text-ink">
                    Cryptographic Audit Log
                  </h2>
                  <p className="text-body-sm text-ink2 mt-0.5">
                    Append-only SHA-256 event chain linking incident evaluations, redaction transforms, and signed receipts.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {chainVerificationResult ? (
                    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-allow-tint border border-allow/30 text-allow font-semibold text-body-sm">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{chainVerificationResult.message}</span>
                      <span className="text-[10px] font-mono uppercase bg-allow/15 px-2 py-0.5 rounded font-bold">
                        Simulated (fixtures)
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleVerifyChain}
                      disabled={isVerifyingChain}
                      className="h-9 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-body-sm font-medium flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${isVerifyingChain ? 'animate-spin' : ''}`}
                      />
                      <span>Verify audit chain</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Audit Chain Timeline */}
              {auditLoading ? (
                <Skeleton className="h-80 w-full" rounded="xl" />
              ) : auditError ? (
                <div className="p-8 rounded-2xl bg-surface border border-block/30 shadow-card text-center flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-block-tint text-block flex items-center justify-center mb-3">
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <h3 className="text-headline-subsection font-semibold text-ink">Failed to load audit chain</h3>
                  <p className="text-body-sm text-ink2 mt-1">Unable to fetch cryptographic audit events from the server.</p>
                  <button
                    type="button"
                    onClick={() => refetchAudit()}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-body-sm font-medium hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary cursor-pointer transition-colors shadow-sm"
                  >
                    Retry loading
                  </button>
                </div>
              ) : (
                <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-border space-y-6">
                  {auditData?.events.map((event: AuditEvent, idx: number) => (
                    <motion.div
                      key={event.index}
                      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: shouldReduceMotion ? 0 : idx * 0.06 }}
                      className="relative group bg-surface rounded-2xl border border-border shadow-card p-space-md transition-shadow hover:shadow-card-hover"
                    >
                      {/* Timeline Node Badge */}
                      <div className="absolute -left-6 sm:-left-8 top-5 w-6 h-6 rounded-full bg-surface border-2 border-primary flex items-center justify-center -translate-x-1/2">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      </div>

                      {/* Event Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-body-sm font-bold text-primary px-2 py-0.5 rounded bg-primary-tint">
                            #{String(event.index).padStart(2, '0')}
                          </span>
                          <span className="font-mono text-body-sm font-semibold text-ink">
                            {event.type}
                          </span>
                          <Link
                            to={`/incidents/${event.incident_id}`}
                            className="text-caption font-mono text-muted hover:text-primary transition-colors"
                          >
                            ({event.incident_id})
                          </Link>
                        </div>

                        <div className="flex items-center gap-2 text-caption text-muted font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{event.timestamp}</span>
                        </div>
                      </div>

                      {/* Summary & Actor */}
                      <div className="py-3 flex flex-col gap-1.5">
                        <p className="text-body-default text-ink font-medium leading-relaxed">
                          {event.summary}
                        </p>
                        <div className="flex items-center gap-2 text-caption text-ink2">
                          <User className="w-3.5 h-3.5 text-muted shrink-0" />
                          <span>Actor:</span>
                          <span className="font-semibold text-ink">{event.actor}</span>
                        </div>
                      </div>

                      {/* Cryptographic Hash Binding Strip */}
                      <div className="pt-3 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-3 text-caption">
                        <div className="flex items-center gap-2">
                          <span className="text-muted font-sans font-medium">Prev Hash:</span>
                          <HashChip value={event.prev_hash} startChars={8} endChars={6} />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-muted font-sans font-medium">Block Hash:</span>
                          <HashChip value={event.hash} startChars={8} endChars={6} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
