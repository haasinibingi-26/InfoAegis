import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  AlertOctagon,
  ArrowLeft,
  Download,
  RefreshCw,
  FileCheck2,
  Lock,
  FileCode,
  KeyRound,
  Clock,
  Fingerprint,
  CheckCircle2,
} from 'lucide-react';
import {
  fetchReceiptById,
  verifyReceipt,
  tamperVerifyReceipt,
} from '../config/api';
import type { VerificationCheck } from '../types/api';
import { VerificationChecks } from '../components/VerificationChecks';
import { JsonViewer } from '../components/JsonViewer';
import { HashChip } from '../components/HashChip';
import { Accordion } from '../components/Accordion';
import { Skeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';

export const EvidenceVaultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const incidentId = id || 'INC-20260101-0001';
  const { showToast } = useToast();

  const [isTampered, setIsTampered] = useState<boolean>(false);
  const [activeChecks, setActiveChecks] = useState<VerificationCheck[] | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState<boolean>(false);

  // Load receipt fixture
  const {
    data: receipt,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['receipt', incidentId],
    queryFn: () => fetchReceiptById(incidentId),
  });

  // Handle Verify Receipt action - reads directly from fixture
  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const result = await verifyReceipt(incidentId);
      setIsTampered(false);
      setActiveChecks(result.checks); // Read from receipt.checks
      setVerifiedSuccess(true);
      showToast(result.message);
    } catch {
      showToast('Verification request failed');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Tamper with copy & re-verify action - reads failing checks from fixture payload
  const handleTamperVerify = async () => {
    setIsVerifying(true);
    try {
      const result = await tamperVerifyReceipt(incidentId);
      setIsTampered(true);
      setActiveChecks(result.checks); // Read from receipt.tampered_checks
      setVerifiedSuccess(false);
      showToast(result.message);
    } catch {
      showToast('Tamper verification simulation failed');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Download Receipt - exports only the fixture's receipt JSON
  const handleDownload = () => {
    if (!receipt) return;
    const blob = new Blob([JSON.stringify(receipt, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${receipt.receipt_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloaded receipt ${receipt.receipt_id}.json`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <Skeleton className="h-36 w-full" rounded="xl" />
        <Skeleton className="h-64 w-full" rounded="xl" />
        <Skeleton className="h-96 w-full" rounded="xl" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="p-8 rounded-2xl bg-surface border border-block/30 shadow-card text-center max-w-xl mx-auto flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-block-tint text-block flex items-center justify-center mb-3">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <h2 className="text-headline-section font-bold text-ink">Receipt not found</h2>
        <p className="text-body-default text-muted mt-1">
          Could not locate evidence receipt for incident {incidentId}.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg bg-primary text-white text-body-sm font-medium hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary cursor-pointer transition-colors shadow-sm"
          >
            Retry loading
          </button>
          <Link
            to={`/incidents/${incidentId}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border text-ink text-body-sm font-medium hover:bg-raised transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Incident</span>
          </Link>
        </div>
      </div>
    );
  }

  // Active checks read from fixture
  const currentChecks = activeChecks || receipt.checks;
  const currentRecord = isTampered ? receipt.tampered_record : receipt.signed_record;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-16">
      {/* Breadcrumbs & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-caption text-muted">
          <Link to="/history" className="hover:text-primary transition-colors">
            Audit History
          </Link>
          <span>/</span>
          <Link to={`/incidents/${incidentId}`} className="hover:text-primary transition-colors">
            {incidentId}
          </Link>
          <span>/</span>
          <span className="text-ink font-semibold">Evidence Vault</span>
        </nav>

        <Link
          to={`/incidents/${incidentId}`}
          className="inline-flex items-center gap-1.5 text-body-sm text-ink2 hover:text-primary font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incident Results</span>
        </Link>
      </div>

      {/* Main Vault Header Card */}
      <div className="p-space-lg rounded-2xl bg-surface border border-border shadow-card flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                isTampered
                  ? 'bg-block-tint text-block'
                  : 'bg-primary-tint text-primary'
              }`}
            >
              {isTampered ? (
                <AlertOctagon className="w-7 h-7" />
              ) : (
                <ShieldCheck className="w-7 h-7" />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-headline-page font-bold text-ink">
                  Evidence Vault
                </h1>
                <span className="font-mono text-body-medium font-semibold text-ink px-2.5 py-0.5 rounded-full bg-raised border border-border">
                  {receipt.receipt_id}
                </span>
                {receipt.mode === 'LOCAL FALLBACK' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-review-tint text-review border border-review/30 text-badge-label font-semibold">
                    LOCAL FALLBACK (not CooL SDK)
                  </span>
                )}
                <span className="text-caption font-mono uppercase bg-raised text-muted px-2 py-0.5 rounded border border-border">
                  Simulated (fixtures)
                </span>
              </div>
              <p className="text-body-default text-ink2 leading-relaxed">
                Deterministic cryptographic attestation proving unaltered execution and
                zero-knowledge evidence packaging.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying}
              className="h-9 px-3.5 rounded-lg bg-surface border border-border hover:bg-raised text-ink text-body-sm font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-primary ${isVerifying ? 'animate-spin' : ''}`} />
              <span>Verify receipt</span>
            </button>

            <button
              type="button"
              onClick={handleTamperVerify}
              disabled={isVerifying}
              className={`h-9 px-3.5 rounded-lg text-body-sm font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 ${
                isTampered
                  ? 'bg-block text-white hover:bg-block/90'
                  : 'bg-surface border border-block/30 text-block hover:bg-block-tint'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Tamper with a copy & re-verify</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="h-9 px-3.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-body-sm font-medium flex items-center gap-2 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download receipt</span>
            </button>
          </div>
        </div>

        {/* Cryptographic Metadata Strip */}
        <div className="pt-4 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-3 text-body-sm">
          <div className="flex items-center gap-2 text-ink2">
            <Clock className="w-4 h-4 text-muted shrink-0" />
            <span className="text-muted">Timestamp:</span>
            <span className="font-mono text-ink text-code-sm">{receipt.timestamp}</span>
          </div>

          <div className="flex items-center gap-2 text-ink2">
            <KeyRound className="w-4 h-4 text-muted shrink-0" />
            <span className="text-muted">Signer Key:</span>
            <HashChip value={receipt.signer_key_id} startChars={14} endChars={6} />
          </div>

          <div className="flex items-center gap-2 text-ink2">
            <Fingerprint className="w-4 h-4 text-muted shrink-0" />
            <span className="text-muted">Digest SHA-256:</span>
            <HashChip value={receipt.digest_sha256} startChars={8} endChars={6} />
          </div>
        </div>
      </div>

      {/* Verification Result Banner (when verified successfully) */}
      {!isTampered && verifiedSuccess && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-allow-tint border border-allow/30 flex items-center justify-between gap-3 text-allow shadow-sm"
        >
          <div className="flex items-center gap-2.5 font-semibold text-body-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Receipt verified: signature and canonical SHA-256 digest match (read from fixture).</span>
          </div>
          <span className="text-caption font-mono uppercase bg-allow/10 text-allow px-2 py-0.5 rounded font-semibold shrink-0">
            Simulated (fixtures)
          </span>
        </div>
      )}

      {/* Tampering Alert Banner (shown when tampered) */}
      {isTampered && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-block-tint border-2 border-block/40 flex items-center gap-3.5 text-block shadow-sm"
        >
          <div className="w-9 h-9 rounded-full bg-block text-white flex items-center justify-center shrink-0">
            <AlertOctagon className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-body-medium">
                Tampering detected: this receipt no longer verifies
              </p>
              <span className="text-caption font-mono uppercase bg-block/15 px-2 py-0.5 rounded font-bold">
                Simulated (fixtures)
              </span>
            </div>
            <p className="text-body-sm text-block/90 mt-0.5">
              The canonical JSON record payload was altered after signature generation. The failing checks
              below are loaded directly from the fixture tampered checks payload.
            </p>
          </div>
        </div>
      )}

      {/* Verification Checks Component */}
      <VerificationChecks checks={currentChecks} isTampered={isTampered} />

      {/* Signed Record JSON Viewer */}
      <JsonViewer
        data={currentRecord}
        title={isTampered ? 'Tampered record (Modified Payload)' : 'Signed record'}
        sha256Digest={receipt.digest_sha256}
      />

      {/* What this receipt does and does not prove Accordion */}
      <Accordion
        title="What this receipt does and does not prove"
        subtitle="Transparent cryptographic scope and legal boundary disclosures"
        defaultOpen={true}
        icon={<FileCheck2 className="w-5 h-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* What it DOES prove */}
          <div className="p-4 rounded-xl bg-raised/50 border border-border flex flex-col gap-3">
            <div className="flex items-center gap-2 text-allow font-semibold text-body-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>What this receipt DOES prove</span>
            </div>
            <ul className="text-body-sm text-ink2 space-y-2 list-disc list-inside leading-relaxed">
              <li>
                <strong className="text-ink font-medium">Authentic & unaltered:</strong> The recorded
                scan outcome, risk metrics, and finding counts have not been modified since signing.
              </li>
              <li>
                <strong className="text-ink font-medium">Deterministic pipeline binding:</strong> The
                Ed25519 signature cryptographically binds the input digest and output sanitised
                digest to the specific incident ID.
              </li>
              <li>
                <strong className="text-ink font-medium">Redaction verification:</strong> Confirms
                Rust SafePatch applied the exact byte-range redactions and produced the stated
                sanitised SHA-256 hash.
              </li>
            </ul>
          </div>

          {/* What it DOES NOT prove */}
          <div className="p-4 rounded-xl bg-raised/50 border border-border flex flex-col gap-3">
            <div className="flex items-center gap-2 text-block font-semibold text-body-medium">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>What this receipt DOES NOT prove</span>
            </div>
            <ul className="text-body-sm text-ink2 space-y-2 list-disc list-inside leading-relaxed">
              <li>
                <strong className="text-ink font-medium">Scanner infallibility:</strong> Scanners do not
                guarantee full detection of every secret or novel PII item in the input file.
              </li>
              <li>
                <strong className="text-ink font-medium">Policy completeness:</strong> Does not prove
                that the policy rules are legally sufficient or compliant with specific statutes.
              </li>
              <li>
                <strong className="text-ink font-medium">External enforcement:</strong> The sharing
                decision is simulated; this does not prove an external platform enforced the block.
              </li>
              <li>
                <strong className="text-ink font-medium">Hardware enclave attestation:</strong> Hardware
                attestation is mocked; no hardware enclave (SGX/TrustZone) was used to seal keys.
              </li>
              <li>
                <strong className="text-ink font-medium">Transparency log anchoring:</strong> There is
                no public-chain or Merkle transparency log anchoring in this build.
              </li>
            </ul>
          </div>
        </div>
      </Accordion>
    </div>
  );
};
