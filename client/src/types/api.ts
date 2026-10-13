export type EngineMode = 'REAL' | 'FALLBACK' | 'MOCK' | 'UNAVAILABLE';
export type DecisionState = 'BLOCK' | 'REVIEW' | 'ALLOW';
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type FindingCategory = 'secret' | 'pii';

export interface ComponentHealth {
  id: 'gitleaks' | 'presidio' | 'safepatch' | 'cool' | 'node';
  name: string;
  role: string;
  mode: EngineMode;
  version: string;
  last_self_test: string;
  self_test_passed: boolean;
  self_test_detail: string;
}

export interface HealthResponse {
  status: string;
  checked_at: string;
  components: ComponentHealth[];
}

export interface SharingContext {
  destination: string;
  audience: string;
  access: 'View only' | 'Download' | 'Edit' | string;
  note?: string;
}

export interface FiredRule {
  id: string;
  title: string;
  source: string;
  decision: DecisionState;
}

export interface FindingItem {
  id: string;
  category: FindingCategory;
  type: string;
  detector: 'Gitleaks' | 'Presidio' | string;
  line: number;
  col: number;
  severity: SeverityLevel;
  masked_preview: string;
}

export interface FilePreviewLine {
  line_number: number;
  prefix: string;
  masked_token?: string;
  Suffix?: string;
  highlight_category?: FindingCategory;
  finding_id?: string;
}

export interface FixOption {
  id: string;
  title: string;
  rationale: string;
  resolves_rules: string[];
  default_selected: boolean;
}

export interface SafePatchReport {
  targeted_removed: number;
  targeted_total: number;
  ranges_applied: number;
  ranges_rejected: number;
  duration_ms: number;
  input_sha256: string;
  output_sha256: string;
  sanitised_content: string;
}

export interface ReceiptSummary {
  receipt_id: string;
  checks_passed: number;
  checks_total: number;
  mode: string;
  timestamp: string;
  signer_key_id: string;
}

export interface IncidentDetail {
  id: string;
  file_name: string;
  file_size: string;
  created_at: string;
  policy_version: string;
  context: SharingContext;
  initial_decision: DecisionState;
  initial_risk: number;
  final_decision: DecisionState;
  final_risk: number;
  fix_applied: boolean;
  summary: {
    secrets_count: number;
    pii_count: number;
    highest_severity: SeverityLevel;
    reason_one_line: string;
    explanation_sentences: string[];
  };
  fired_rules: FiredRule[];
  findings: FindingItem[];
  file_preview: FilePreviewLine[];
  fix_options: FixOption[];
  safepatch_report: SafePatchReport;
  receipt_summary: ReceiptSummary;
}

export interface IncidentListItem {
  id: string;
  time: string;
  relative_time: string;
  file_name: string;
  file_size: string;
  destination: string;
  audience: string;
  access: string;
  initial_decision: DecisionState;
  final_decision: DecisionState;
  initial_risk: number;
  final_risk: number;
  secrets_count: number;
  pii_count: number;
  receipt_id: string;
  receipt_verified: boolean;
}

export interface IncidentsListResponse {
  incidents: IncidentListItem[];
}

export interface VerificationCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'na';
  badge: string;
  detail: string;
  fail_detail?: string;
}

export interface ReceiptDetail {
  receipt_id: string;
  incident_id: string;
  timestamp: string;
  signer_key_id: string;
  mode: string;
  mode_label: string;
  digest_sha256: string;
  checks: VerificationCheck[];
  tampered_checks?: VerificationCheck[];
  signed_record: Record<string, unknown>;
  tampered_record: Record<string, unknown>;
}

export interface HeatmapCell {
  destination: string;
  audience: string;
  decision: DecisionState;
  risk: number;
  rules: string[];
  explanation?: string;
}

export interface DestinationGroup {
  group: 'Public' | 'External' | 'Internal' | string;
  destinations: string[];
}

export interface SimulatorData {
  incident_id: string;
  file_name: string;
  policy_version: string;
  rules_catalog?: Record<string, string>;
  baseline: {
    destination: string;
    audience: string;
    access: string;
    contains_secret: boolean;
    contains_pii: boolean;
    secrets_count: number;
    pii_count: number;
    decision: DecisionState;
    risk: number;
  };
  audiences: string[];
  destination_groups: DestinationGroup[];
  cells: HeatmapCell[];
}

export type AuditEventType =
  | 'SCAN_COMPLETED'
  | 'POLICY_DECIDED'
  | 'REDACTION_APPLIED'
  | 'RESCAN_COMPLETED'
  | 'RECEIPT_CREATED'
  | 'RECEIPT_VERIFIED';

export interface AuditEvent {
  index: number;
  type: AuditEventType;
  incident_id: string;
  timestamp: string;
  summary: string;
  actor: string;
  prev_hash: string;
  hash: string;
}

export interface AuditResponse {
  chain_valid: boolean;
  total_events: number;
  events: AuditEvent[];
}
