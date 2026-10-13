# LeakLens AI — API Contract (`/contracts/api.md`)

All frontend requests use a single base constant `API_BASE`.
- **Fixture mode (default):** `API_BASE = '/contracts/fixtures'`
- **Live backend mode:** `API_BASE = 'http://localhost:8000/api'` (or `/api`)

## Endpoints

### 1. `GET ${API_BASE}/health`
Returns live status and metadata for the 5 system components (`gitleaks`, `presidio`, `safepatch`, `cool`, `node`).
Each component reports:
- `id`: `'gitleaks' | 'presidio' | 'safepatch' | 'cool' | 'node'`
- `name`: Display name
- `role`: Short role description (`"Finds secrets"`, `"Finds personal data"`, `"Redacts and verifies"`, `"Signs evidence"`, `"Runs the server"`)
- `mode`: `'REAL' | 'FALLBACK' | 'MOCK' | 'UNAVAILABLE'`
- `version`: Monospace version string
- `last_self_test`: ISO timestamp or relative summary
- `self_test_passed`: boolean
- `self_test_detail`: One-line diagnostic detail

### 2. `GET ${API_BASE}/incidents`
Returns the list of evaluated incidents for Audit History (`Incidents` tab) and Simulator selector.

### 3. `GET ${API_BASE}/incidents/:id`
Returns full incident details for `INC-20260101-0001` (and other sample incidents):
- Metadata (`id`, `file_name`, `file_size`, `created_at`, `policy_version`)
- `context` (`destination`, `audience`, `access`, `note`)
- `initial_decision` (`'BLOCK' | 'REVIEW' | 'ALLOW'`), `initial_risk` (number)
- `final_decision` (`'BLOCK' | 'REVIEW' | 'ALLOW'`), `final_risk` (number)
- `fix_applied`: boolean
- `summary`: `{ secrets_count, pii_count, highest_severity, explanation_sentences }`
- `fired_rules`: Array of `{ id, title, source, decision }`
- `findings`: Array of `{ id, category: 'secret' | 'pii', type, detector, line, col, severity, masked_preview }`
- `file_preview`: Array of `{ line_number, content, highlight_category?: 'secret' | 'pii', finding_id?: string, masked_token?: string }`
- `fix_options`: Array of `{ id, title, rationale, resolves_rules, default_selected }`
- `safepatch_report`: `{ targeted_removed, targeted_total, ranges_applied, ranges_rejected, duration_ms, input_sha256, output_sha256, sanitised_content }`
- `receipt_summary`: `{ receipt_id, checks_passed, checks_total, mode, timestamp, signer_key_id }`

### 4. `GET ${API_BASE}/incidents/:id/receipt`
Returns the full cryptographic receipt (`RCPT-0001`) and verification checks (plus tampered simulation payload for client/server verification).

### 5. `GET ${API_BASE}/simulator`
Returns the What-if Simulator evaluation ruleset and 6×4 destination × audience heatmap matrix for an incident.

### 6. `GET ${API_BASE}/audit`
Returns the hash-chained audit timeline events (`SCAN_COMPLETED`, `POLICY_DECIDED`, `REDACTION_APPLIED`, `RESCAN_COMPLETED`, `RECEIPT_CREATED`, `RECEIPT_VERIFIED`) with `prev_hash` and `hash`.
