import type {
  AuditResponse,
  DecisionState,
  HealthResponse,
  IncidentDetail,
  IncidentsListResponse,
  ReceiptDetail,
  SimulatorData,
  VerificationCheck,
} from '../types/api';

/**
 * Single source of truth for backend/fixture base URL.
 * Default: '/contracts/fixtures' (loads fixture JSON files from /contracts/fixtures).
 * To switch to the real backend, change ONLY this constant (e.g. 'http://localhost:8000/api' or '/api').
 */
export const API_BASE = '/contracts/fixtures';

async function apiGet<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  let res = await fetch(url);
  const contentType = res.headers.get('content-type') || '';
  if ((!res.ok || !contentType.includes('application/json')) && !url.endsWith('.json')) {
    const jsonRes = await fetch(`${url}.json`);
    if (jsonRes.ok) {
      res = jsonRes;
    }
  }
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${url}`);
  }
  return res.json() as Promise<T>;
}

export function fetchHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>('/health');
}

export function fetchIncidents(): Promise<IncidentsListResponse> {
  return apiGet<IncidentsListResponse>('/incidents');
}

export function fetchIncidentById(id: string): Promise<IncidentDetail> {
  return apiGet<IncidentDetail>(`/incidents/${id}`);
}

export function fetchReceiptById(id: string): Promise<ReceiptDetail> {
  return apiGet<ReceiptDetail>(`/incidents/${id}/receipt`);
}

export function fetchSimulator(): Promise<SimulatorData> {
  return apiGet<SimulatorData>('/simulator');
}

export function fetchAuditLog(): Promise<AuditResponse> {
  return apiGet<AuditResponse>('/audit');
}

export interface CreateIncidentPayload {
  fileName: string;
  fileSize: string;
  fileContent?: string;
  context: {
    destination: string;
    audience: string;
    access: string;
    note?: string;
  };
}

export interface CreateIncidentResult {
  incidentId: string;
  incident: IncidentDetail;
}

/**
 * Isolated function for creating / analyzing a sharing request.
 * Currently simulates the POST /api/incidents call against fixtures.
 * Switch API_BASE away from '/contracts/fixtures' to target a real backend.
 */
export async function createIncident(
  payload: CreateIncidentPayload
): Promise<CreateIncidentResult> {
  // If pointed at a live backend instead of fixtures
  if (!API_BASE.includes('fixtures')) {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to create incident (${res.status})`);
    }
    return res.json() as Promise<CreateIncidentResult>;
  }

  // Fixture simulation: fetch reference incident
  const fixture = await fetchIncidentById('INC-20260101-0001');

  // Return a cloned incident with current request metadata attached
  const incident: IncidentDetail = {
    ...fixture,
    file_name: payload.fileName || fixture.file_name,
    file_size: payload.fileSize || fixture.file_size,
    context: {
      destination: payload.context.destination,
      audience: payload.context.audience,
      access: payload.context.access,
      note: payload.context.note,
    },
  };

  return {
    incidentId: fixture.id,
    incident,
  };
}

/**
 * Isolated receipt verification action.
 * Returns valid status and verification checks.
 */
export async function verifyReceipt(
  incidentId: string = 'INC-20260101-0001'
): Promise<{ valid: boolean; checks: VerificationCheck[]; message: string }> {
  if (!API_BASE.includes('fixtures')) {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/verify`, { method: 'POST' });
    if (!res.ok) throw new Error(`Verification failed (${res.status})`);
    return res.json();
  }

  const receipt = await fetchReceiptById(incidentId);
  return {
    valid: true,
    checks: receipt.checks,
    message: 'Receipt verified: signature and canonical SHA-256 digest match.',
  };
}

/**
 * Isolated tamper verification simulation.
 * Simulates verifying a mutated receipt where signature and binding fail.
 */
export async function tamperVerifyReceipt(
  incidentId: string = 'INC-20260101-0001'
): Promise<{ valid: boolean; checks: VerificationCheck[]; message: string }> {
  if (!API_BASE.includes('fixtures')) {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/verify?tampered=true`, { method: 'POST' });
    if (!res.ok) throw new Error(`Tamper check failed (${res.status})`);
    return res.json();
  }

  const receipt = await fetchReceiptById(incidentId);
  // Read failing checks directly from receipt.tampered_checks in fixture
  const checksToUse = receipt.tampered_checks || receipt.checks;

  return {
    valid: false,
    checks: checksToUse,
    message: 'Tampering detected: this receipt no longer verifies',
  };
}

/**
 * Isolated policy evaluation simulator action.
 */
export async function evaluatePolicy(params: {
  incidentId?: string;
  destination: string;
  audience: string;
  access: string;
  containsSecret: boolean;
  containsPii: boolean;
}): Promise<{
  decision: DecisionState;
  risk: number;
  firedRules: string[];
  explanation: string;
}> {
  if (!API_BASE.includes('fixtures')) {
    const res = await fetch(`${API_BASE}/simulator/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Evaluation failed (${res.status})`);
    return res.json();
  }

  const simData = await fetchSimulator();
  const matchedCell = simData.cells.find(
    (c) => c.destination === params.destination && c.audience === params.audience
  );

  let decision: DecisionState = matchedCell ? matchedCell.decision : 'BLOCK';
  let risk: number = matchedCell ? matchedCell.risk : 85;
  let firedRules: string[] = matchedCell ? matchedCell.rules : ['R1', 'R9'];
  let explanation: string = matchedCell?.explanation || "Computed from this incident's actual findings.";

  // Handle advanced overrides
  if (!params.containsSecret && !params.containsPii) {
    decision = 'ALLOW';
    risk = 8;
    firedRules = [];
    explanation = 'Allowed: all detected secrets and personal data have been mitigated or removed.';
  } else if (!params.containsSecret && params.containsPii) {
    if (params.destination.includes('Public')) {
      decision = 'BLOCK';
      risk = 74;
      firedRules = ['R4', 'R9'];
      explanation = 'Egress blocked: personal data cannot be published to public links or repositories.';
    } else if (params.destination.includes('External')) {
      decision = 'REVIEW';
      risk = 48;
      firedRules = ['R4'];
      explanation = 'Review required: sending personal data externally requires an active data transfer agreement.';
    } else {
      decision = 'ALLOW';
      risk = 16;
      firedRules = [];
      explanation = 'Allowed: internal transfer of personal data within authorized perimeter complies with policy.';
    }
  }

  return {
    decision,
    risk,
    firedRules,
    explanation,
  };
}

/**
 * Isolated audit chain verification action.
 */
export async function verifyAuditChain(): Promise<{
  valid: boolean;
  totalEvents: number;
  brokenAt?: number;
  message: string;
}> {
  if (!API_BASE.includes('fixtures')) {
    const res = await fetch(`${API_BASE}/audit/verify`, { method: 'POST' });
    if (!res.ok) throw new Error(`Chain verification failed (${res.status})`);
    return res.json();
  }

  const auditData = await fetchAuditLog();
  return {
    valid: auditData.chain_valid,
    totalEvents: auditData.total_events,
    message: `Chain valid - ${auditData.total_events} events`,
  };
}

/**
 * Isolated component self-test action.
 */
export async function runSelfTest(
  componentId?: string
): Promise<{ success: boolean; componentId?: string; message: string; timestamp: string }> {
  if (!API_BASE.includes('fixtures')) {
    const res = await fetch(`${API_BASE}/health/self-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ componentId }),
    });
    if (!res.ok) throw new Error(`Self-test failed (${res.status})`);
    return res.json();
  }

  const healthData = await fetchHealth();
  const comp = healthData.components.find((c) => c.id === componentId);
  const detail = comp?.self_test_detail || 'All synthetic vectors verified';

  return {
    success: true,
    componentId,
    message: `Self-test (simulated): last result from fixture · ${detail}`,
    timestamp: new Date().toISOString(),
  };
}


