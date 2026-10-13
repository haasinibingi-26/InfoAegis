import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  UploadCloud,
  FileText,
  Key,
  Table,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileCode2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { createIncident } from '../config/api';

const ALLOWED_EXTENSIONS = ['.env', '.json', '.csv', '.txt', '.yaml', '.log'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

interface StagedFile {
  name: string;
  size: string;
  rawFile?: File;
}

const SAMPLE_FILES: Record<string, StagedFile> = {
  env: {
    name: 'demo_secret_and_pii.env',
    size: '840 B',
  },
  csv: {
    name: 'customer_report.csv',
    size: '1.2 KB',
  },
  txt: {
    name: 'clean_release_notes.txt',
    size: '2.4 KB',
  },
};

export const NewScanPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Wizard state
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedFile, setSelectedFile] = useState<StagedFile>(SAMPLE_FILES.csv);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sharing Context state
  const [destination, setDestination] = useState('public_github');
  const [audience, setAudience] = useState('external_partner');
  const [accessLevel, setAccessLevel] = useState<'View only' | 'Download' | 'Edit'>('View only');
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [auditNote, setAuditNote] = useState('');

  // Validate user uploaded file
  const validateAndStageFile = (file: File) => {
    setValidationError(null);
    const fileName = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some(
      (ext) => fileName.endsWith(ext) || fileName === ext
    );

    if (!hasValidExt) {
      setValidationError(
        `Unsupported file type "${file.name}". Please upload .env, .json, .csv, .txt, .yaml, or .log files only.`
      );
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setValidationError(`File size (${sizeMb} MB) exceeds the 2 MB limit.`);
      return false;
    }

    const formattedSize =
      file.size < 1024
        ? `${file.size} B`
        : file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    setSelectedFile({
      name: file.name,
      size: formattedSize,
      rawFile: file,
    });
    return true;
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndStageFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndStageFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Preset Scenario loader
  const handleLoadScenario = (
    fileName: string,
    fileSize: string,
    targetDest: string,
    targetAudience: string
  ) => {
    setValidationError(null);
    setSelectedFile({ name: fileName, size: fileSize });
    setDestination(targetDest);
    setAudience(targetAudience);
    setStep(2);
  };

  // Instant Policy Disposition Evaluation
  const evaluateDisposition = () => {
    const isCleanFile = selectedFile.name.includes('clean');
    if (isCleanFile) {
      return {
        verdict: 'ALLOW' as const,
        badgeClass: 'bg-allow-tint text-allow border-allow/20',
        containerClass: 'bg-allow-tint/30 text-ink border-allow/30',
        icon: <CheckCircle2 className="w-4 h-4 text-allow" />,
        text: 'Predicted disposition: Low risk boundary cleared',
      };
    }

    if (
      destination === 'public_github' ||
      destination === 'public_link' ||
      audience === 'anyone'
    ) {
      return {
        verdict: 'BLOCK' as const,
        badgeClass: 'bg-block-tint text-block border-block/20',
        containerClass: 'bg-block-tint/30 text-ink border-block/30',
        icon: <ShieldAlert className="w-4 h-4 text-block" />,
        text: 'Predicted disposition: High risk violation',
      };
    }

    if (
      destination === 'external_email' ||
      destination === 'partner_drive' ||
      audience === 'external_partner'
    ) {
      return {
        verdict: 'REVIEW' as const,
        badgeClass: 'bg-review-tint text-review border-review/20',
        containerClass: 'bg-review-tint/30 text-ink border-review/30',
        icon: <AlertTriangle className="w-4 h-4 text-review" />,
        text: 'Predicted disposition: Requires audit consent',
      };
    }

    return {
      verdict: 'ALLOW' as const,
      badgeClass: 'bg-allow-tint text-allow border-allow/20',
      containerClass: 'bg-allow-tint/30 text-ink border-allow/30',
      icon: <CheckCircle2 className="w-4 h-4 text-allow" />,
      text: 'Predicted disposition: Low risk boundary cleared',
    };
  };

  const disposition = evaluateDisposition();

  // Submit Sharing Request
  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    try {
      const result = await createIncident({
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        context: {
          destination,
          audience,
          access: accessLevel,
          note: auditNote || undefined,
        },
      });

      // Route to Analyzing screen with state
      navigate(`/analyzing/${result.incidentId}`, {
        state: {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          context: {
            destination,
            audience,
            access: accessLevel,
            note: auditNote,
          },
        },
      });
    } catch (err) {
      console.error('Failed to trigger analysis:', err);
      setIsSubmitting(false);
      setValidationError('Failed to initiate analysis request. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center w-full py-8">
      {/* Top Header */}
      <div className="max-w-2xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-tint text-primary text-[11px] font-bold shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span>NEW SHARING REQUEST</span>
        </div>

        <h1 className="text-display-title font-semibold text-ink tracking-tight mt-3">
          Share safely. Prove it.
        </h1>

        <p className="text-body-default text-ink2 max-w-lg mx-auto mt-2 leading-relaxed">
          Scan a file, check the risk of where it's going, fix it, and get verifiable cryptographic
          evidence.
        </p>

        {/* Step Indicator Navigation */}
        <div className="flex items-center justify-center gap-3 mt-6 mb-2">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all border ${
              step === 1
                ? 'bg-surface text-primary font-semibold shadow-sm border-border'
                : 'text-muted hover:text-ink border-transparent hover:bg-raised'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 1 ? 'bg-primary text-white' : 'bg-raised text-muted'
              }`}
            >
              1
            </span>
            <span className="text-body-sm">File</span>
          </button>

          <ChevronRight className="w-4 h-4 text-muted/60" />

          <button
            type="button"
            onClick={() => {
              if (selectedFile) setStep(2);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all border ${
              step === 2
                ? 'bg-surface text-primary font-semibold shadow-sm border-border'
                : 'text-muted hover:text-ink border-transparent hover:bg-raised'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 2 ? 'bg-primary text-white' : 'bg-raised text-muted'
              }`}
            >
              2
            </span>
            <span className="text-body-sm">Sharing context</span>
          </button>
        </div>
      </div>

      {/* Main Wizard Card */}
      <div className="w-full max-w-[640px] mx-auto mt-6 bg-surface rounded-2xl shadow-card p-8 border border-border relative transition-all">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -6 }}
            transition={{ duration: 0.2 }}
          >
            {/* ================= STEP 1: FILE SELECTION ================= */}
            {step === 1 && (
              <div className="flex flex-col gap-6">
            {/* Validation Error Banner */}
            {validationError && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-block-tint/60 border border-block/30 text-block text-body-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold">Validation Error: </span>
                  {validationError}
                </div>
              </div>
            )}

            {/* Dropzone Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer group transition-all border-2 border-dashed ${
                isDragging
                  ? 'border-primary bg-primary-tint/30'
                  : 'border-border hover:border-primary/50 bg-raised/60 hover:bg-raised'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".env,.json,.csv,.txt,.yaml,.log"
                onChange={handleFileInputChange}
              />
              <div className="w-12 h-12 rounded-full bg-surface border border-border/80 flex items-center justify-center group-hover:scale-105 transition-transform text-primary shadow-sm">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="text-headline-subsection text-ink font-semibold group-hover:text-primary transition-colors mt-3.5">
                Drop a file or click to browse
              </span>
              <span className="text-caption text-muted mt-1.5 max-w-sm">
                .env · .json · .csv · .txt · .yaml · .log &nbsp;·&nbsp; max 2 MB &nbsp;·&nbsp;
                synthetic data only
              </span>
            </div>

            {/* Staged File Preview Row */}
            {selectedFile && (
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-raised border border-border shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-body-medium text-ink font-medium truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-caption text-muted">·</span>
                  <span className="text-code-sm font-mono text-ink2">{selectedFile.size}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] text-primary uppercase bg-primary-tint px-2 py-0.5 rounded-full font-bold">
                  Staged
                </span>
              </div>
            )}

            {/* Divider */}
            <div className="relative flex items-center justify-center my-1">
              <div className="w-full h-px bg-border" />
              <span className="absolute px-3 bg-surface text-caption text-muted">
                or choose a quick sample
              </span>
            </div>

            {/* Quick Sample Chips Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Sample 1: .env */}
              <button
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setSelectedFile(SAMPLE_FILES.env);
                }}
                className={`group flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left shadow-sm ${
                  selectedFile.name === SAMPLE_FILES.env.name
                    ? 'bg-primary-tint/20 border-primary text-primary'
                    : 'bg-raised/70 border-border hover:bg-raised text-ink'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                    selectedFile.name === SAMPLE_FILES.env.name
                      ? 'bg-primary-tint text-primary'
                      : 'bg-surface text-muted group-hover:text-primary'
                  }`}
                >
                  <Key className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-body-sm font-medium truncate group-hover:text-primary transition-colors">
                    .env secrets
                  </span>
                  <span className="text-[11px] font-mono text-muted truncate">840 B</span>
                </div>
              </button>

              {/* Sample 2: CSV */}
              <button
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setSelectedFile(SAMPLE_FILES.csv);
                }}
                className={`group flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left shadow-sm ${
                  selectedFile.name === SAMPLE_FILES.csv.name
                    ? 'bg-primary-tint/20 border-primary text-primary'
                    : 'bg-raised/70 border-border hover:bg-raised text-ink'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                    selectedFile.name === SAMPLE_FILES.csv.name
                      ? 'bg-primary-tint text-primary'
                      : 'bg-surface text-muted group-hover:text-primary'
                  }`}
                >
                  <Table className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-body-sm font-medium truncate group-hover:text-primary transition-colors">
                    customer.csv
                  </span>
                  <span className="text-[11px] font-mono text-muted truncate">1.2 KB</span>
                </div>
              </button>

              {/* Sample 3: Clean TXT */}
              <button
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setSelectedFile(SAMPLE_FILES.txt);
                }}
                className={`group flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left shadow-sm ${
                  selectedFile.name === SAMPLE_FILES.txt.name
                    ? 'bg-primary-tint/20 border-primary text-primary'
                    : 'bg-raised/70 border-border hover:bg-raised text-ink'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                    selectedFile.name === SAMPLE_FILES.txt.name
                      ? 'bg-primary-tint text-primary'
                      : 'bg-surface text-muted group-hover:text-primary'
                  }`}
                >
                  <FileCode2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-body-sm font-medium truncate group-hover:text-primary transition-colors">
                    release.txt
                  </span>
                  <span className="text-[11px] font-mono text-muted truncate">2.4 KB</span>
                </div>
              </button>
            </div>

            {/* Continue Button */}
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!selectedFile}
              className="w-full h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-body-medium shadow-sm flex items-center justify-center gap-2 transition-all mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================= STEP 2: SHARING CONTEXT ================= */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            {/* Selected File Banner */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-raised border border-border shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-surface border border-border/60 flex items-center justify-center text-primary shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-body-sm text-ink font-semibold truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-[11px] font-mono text-muted">
                    {selectedFile.size} · ready for contextual evaluation
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-2.5 py-1 text-xs font-semibold text-primary hover:underline transition-colors shrink-0"
              >
                Change
              </button>
            </div>

            {/* Form Controls */}
            <div className="flex flex-col gap-4">
              {/* Destination Dropdown */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="destination-select" className="text-body-sm text-ink font-semibold">
                    Destination
                  </label>
                  <span className="text-[11px] text-muted">Target exposure zone</span>
                </div>
                <div className="relative">
                  <select
                    id="destination-select"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full h-10 pl-3 pr-9 rounded-lg bg-surface text-ink text-body-default border border-border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                  >
                    <option value="public_github">Public GitHub repository</option>
                    <option value="public_link">Public link</option>
                    <option value="external_email">External email</option>
                    <option value="partner_drive">Partner shared drive</option>
                    <option value="internal_slack">Internal team channel</option>
                    <option value="approved_workspace">Approved internal workspace</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 text-muted w-4 h-4" />
                </div>
              </div>

              {/* Audience Dropdown */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="audience-select" className="text-body-sm text-ink font-semibold">
                    Audience
                  </label>
                  <span className="text-[11px] text-muted">Access boundary</span>
                </div>
                <div className="relative">
                  <select
                    id="audience-select"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full h-10 pl-3 pr-9 rounded-lg bg-surface text-ink text-body-default border border-border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                  >
                    <option value="anyone">Anyone</option>
                    <option value="external_partner">External partner</option>
                    <option value="all_internal">All internal staff</option>
                    <option value="authorised_team">Authorised team</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 text-muted w-4 h-4" />
                </div>
              </div>

              {/* Access Level Segmented Control */}
              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm text-ink font-semibold">Access level</label>
                <div className="grid grid-cols-3 p-1 rounded-lg bg-raised border border-border gap-1 shadow-sm">
                  {(['View only', 'Download', 'Edit'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setAccessLevel(lvl)}
                      className={`py-1.5 px-3 rounded-md text-body-sm text-center transition-all ${
                        accessLevel === lvl
                          ? 'bg-surface text-primary shadow-sm font-semibold border border-border/40'
                          : 'text-ink2 hover:text-ink'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Collapsible Note Section */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setIsNoteOpen(!isNoteOpen)}
                  className="flex items-center justify-between py-1 text-ink2 hover:text-ink text-left transition-colors"
                >
                  <span className="text-body-sm font-medium flex items-center gap-1.5">
                    <span>Add a note (optional)</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted transition-transform ${
                      isNoteOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isNoteOpen && (
                  <div className="pt-2 pb-1">
                    <textarea
                      value={auditNote}
                      onChange={(e) => setAuditNote(e.target.value)}
                      placeholder="Specify business reason or client ticket identifier for audit records..."
                      rows={2}
                      className="w-full p-2.5 rounded-lg bg-surface border border-border text-body-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Instant Policy Preview Banner */}
            <div className="flex flex-col gap-1">
              <div
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${disposition.containerClass}`}
              >
                <div className="flex items-center gap-2">
                  {disposition.icon}
                  <span className="text-caption font-semibold">{disposition.text}</span>
                </div>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${disposition.badgeClass}`}
                >
                  {disposition.verdict}
                </span>
              </div>
              <p className="text-[11px] text-muted px-1">
                Estimate. Final decision comes from the policy engine after scanning.
              </p>
            </div>

            {/* Step 2 Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isSubmitting}
                className="w-full h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-body-medium shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Initiating analysis...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Analyze sharing request</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-center mt-1">
                <span className="text-[11px] font-mono text-muted">Policy:</span>
                <span className="text-[11px] font-mono font-semibold text-primary bg-primary-tint px-2 py-0.5 rounded">
                  leaklens-policy-v1.0
                </span>
                <span className="text-caption text-muted">· CooL engine verified</span>
              </div>
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Scenario Exploration / Interactive Presets (Below Wizard Card) */}
      <div className="w-full max-w-[640px] mx-auto mt-8 flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
            Try a scenario
          </span>
          <span className="text-caption text-muted">Click any preset to prefill context</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Scenario 1: Block */}
          <motion.button
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: shouldReduceMotion ? 0 : 0 }}
            type="button"
            onClick={() =>
              handleLoadScenario(
                'customer_report.csv',
                '1.2 KB',
                'public_github',
                'anyone'
              )
            }
            className="flex flex-col justify-between p-3.5 rounded-xl bg-surface hover:bg-raised border border-border transition-all text-left shadow-card group cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-[11px] font-mono text-muted">Case 01</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-block-tint text-block border border-block/20">
                <ShieldAlert className="w-3 h-3" />
                <span>BLOCK</span>
              </span>
            </div>
            <div className="text-body-sm font-semibold text-ink group-hover:text-primary transition-colors">
              Customer report → Public repo
            </div>
            <span className="text-caption text-muted mt-1.5">Direct PII leakage risk</span>
          </motion.button>

          {/* Scenario 2: Review */}
          <motion.button
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: shouldReduceMotion ? 0 : 0.06 }}
            type="button"
            onClick={() =>
              handleLoadScenario(
                'customer_report.csv',
                '1.2 KB',
                'external_email',
                'external_partner'
              )
            }
            className="flex flex-col justify-between p-3.5 rounded-xl bg-surface hover:bg-raised border border-border transition-all text-left shadow-card group cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-[11px] font-mono text-muted">Case 02</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-review-tint text-review border border-review/20">
                <AlertTriangle className="w-3 h-3" />
                <span>REVIEW</span>
              </span>
            </div>
            <div className="text-body-sm font-semibold text-ink group-hover:text-primary transition-colors">
              Customer report → External email
            </div>
            <span className="text-caption text-muted mt-1.5">Requires audit consent</span>
          </motion.button>

          {/* Scenario 3: Allow */}
          <motion.button
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: shouldReduceMotion ? 0 : 0.12 }}
            type="button"
            onClick={() =>
              handleLoadScenario(
                'clean_release_notes.txt',
                '2.4 KB',
                'approved_workspace',
                'authorised_team'
              )
            }
            className="flex flex-col justify-between p-3.5 rounded-xl bg-surface hover:bg-raised border border-border transition-all text-left shadow-card group cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-[11px] font-mono text-muted">Case 03</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-allow-tint text-allow border border-allow/20">
                <CheckCircle2 className="w-3 h-3" />
                <span>ALLOW</span>
              </span>
            </div>
            <div className="text-body-sm font-semibold text-ink group-hover:text-primary transition-colors">
              Release notes → Internal team
            </div>
            <span className="text-caption text-muted mt-1.5">Safe sanitized content</span>
          </motion.button>
        </div>

        {/* Audit History Link */}
        <div className="flex items-center justify-end mt-4 px-1">
          <Link
            to="/history"
            className="text-body-sm text-ink2 hover:text-primary transition-colors inline-flex items-center gap-1 group font-medium"
          >
            <span>View audit history</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};
