# LeakLens AI — Security Dashboard Frontend

LeakLens AI is a client-side security console built with React 18, TypeScript, Vite, Tailwind CSS, TanStack React Query, Framer Motion, and Lucide React. It provides real-time detection, policy gate evaluation, automated redaction with SafePatch, and cryptographic evidence attestation with CooL.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd client
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
```
This runs type-checking (`tsc -b`) and generates the optimized production bundle in `dist/`.

---

## 🔌 API & Backend Configuration

The frontend is designed to run against local contract fixtures out of the box, and can be switched to a live backend with a single configuration change.

### Switching `API_BASE`
Open `client/src/config/api.ts` and update line 17:

```typescript
// Fixture Mode (Default)
export const API_BASE = '/contracts/fixtures';

// Live Backend Mode
export const API_BASE = 'http://localhost:8000/api';
// or for reverse-proxy / same-origin setups:
// export const API_BASE = '/api';
```

When `API_BASE` points to a live backend (i.e. does not contain `fixtures`), all simulated calls automatically transition to live HTTP requests with standard JSON payloads.

---

## 📡 API Endpoint Mapping (`api.ts`)

All API interactions are isolated in `client/src/config/api.ts`. Below is the complete mapping of client functions to backend endpoints:

| Function in `api.ts` | Method | Endpoint / Route | Description |
| :--- | :--- | :--- | :--- |
| `fetchHealth()` | `GET` | `/health` | Retrieves scanner, sandbox, and engine operational health, mode (`REAL`, `FALLBACK`, `MOCK`, `UNAVAILABLE`), and versions. |
| `fetchIncidents()` | `GET` | `/incidents` | Retrieves the list of historical incidents, decision summaries, and receipt statuses. |
| `fetchIncidentById(id)` | `GET` | `/incidents/:id` | Loads detailed incident record including findings, code preview, fired rules, and remediation plan. |
| `fetchReceiptById(id)` | `GET` | `/incidents/:id/receipt` | Fetches cryptographic attestation receipt, signatures, and pass/fail verification checks. |
| `fetchSimulator()` | `GET` | `/simulator` | Loads the boundary policy simulation matrix, baseline conditions, and rule descriptions. |
| `fetchAuditLog()` | `GET` | `/audit` | Retrieves append-only cryptographic event chain with SHA-256 block hashes and linking signatures. |
| `createIncident(payload)` | `POST` | `/incidents` | Submits a file and sharing boundary context for scanning and automated policy evaluation. |
| `verifyReceipt(id)` | `POST` | `/incidents/:id/verify` | Cryptographically verifies the Ed25519 signature and SHA-256 digest of an evidence receipt. |
| `tamperVerifyReceipt(id)` | `POST` | `/incidents/:id/verify?tampered=true` | Tests tamper detection by simulating an altered receipt payload where signatures and digests fail. |
| `evaluatePolicy(params)` | `POST` | `/simulator/evaluate` | Evaluates what-if boundary scenarios with overrides for destination, audience, and credential states. |
| `verifyAuditChain()` | `POST` | `/audit/verify` | Re-computes SHA-256 hashes across the full incident event log to ensure chain continuity. |
| `runSelfTest(componentId)` | `POST` | `/health/self-test` | Triggers a diagnostic self-test against a scanner or signer component. |

---

## 🎨 Animations & Micro-Interactions (Stage E)

The dashboard utilizes `framer-motion` for fluid, GPU-accelerated micro-interactions (animating only `opacity` and `transform` for 60fps performance):

1. **Page Transitions**: Smooth fade + 8px upward slide in 250ms on route change (`AppLayout.tsx`).
2. **Card Stagger**: Cards fade in with a 60ms stagger across Overview, Simulator, Audit History, and New Scan presets.
3. **Analyzing Pipeline**: Progressive checkoff with smooth progress line fill and pulsing indigo focus ring on the active scanner (`PipelineStepper.tsx`).
4. **Decision Banner**: Soft 3-second pulsing glow in the decision color (red `BLOCK`, amber `REVIEW`, green `ALLOW`), with a subtle one-time shake on initial `BLOCKED` mount (`DecisionBanner.tsx`).
5. **Risk Gauge**: 1-second SVG arc animation with real-time numeric count-up from 0 to target score (`RiskGauge.tsx`).
6. **Tabs Navigation**: Sliding underline indicator with `layoutId="activeTabUnderline"`, paired with cross-fading tab content via `<AnimatePresence mode="wait">` (`Tabs.tsx`, `IncidentResultsPage.tsx`, `AuditHistoryPage.tsx`).
7. **Before & After**: Interactive number count up/down with spring-scaled delta reduction pill (`BeforeAfter.tsx`).
8. **Finding Selection**: Clicking a finding row smoothly scrolls the masked preview to the offending line and flashes the highlight box (`FindingsTable.tsx`, `MaskedPreview.tsx`).
9. **Heatmap Matrix**: Matrix cells animate in diagonally with a 1.05 hover zoom and tooltip indicator (`HeatmapMatrix.tsx`).
10. **Verification Checks**: Check rows tick in sequentially; failing checks shake once on tamper verification (`VerificationChecks.tsx`).
11. **Button Micro-Interactions**: Hover lift of 1px and active press scale to 0.98 (`index.css`).
12. **Toast Notifications**: Slide in from top-right with auto-dismiss after 3 seconds (`Toast.tsx`).

---

## ♿ Accessibility (a11y) & Reduced Motion

- **Focus Rings**: High-contrast 2px `#4F46E5` outline with 4px soft halo on all interactive elements (`index.css`).
- **Keyboard Navigation**: Full arrow-key navigation (`ArrowLeft`, `ArrowRight`, `Home`, `End`) across tabs with proper `role="tablist"` and `role="tab"` attributes.
- **Dual-Coded Decision States**: Decisions always display both high-contrast color/badge and explicit text labels + distinct icons (`ShieldAlert` for BLOCK, `AlertTriangle` for REVIEW, `CheckCircle2` for ALLOW).
- **Reduced Motion Support**:
  All Framer Motion components inspect `useReducedMotion()`. When `prefers-reduced-motion: reduce` is active:
  - Continuous loops (pulsing glow) and shake animations are disabled.
  - Page and card entrance translations are omitted in favor of simple fades.
  - Transitions complete instantaneously.

### Testing Reduced Motion:
1. Open Google Chrome DevTools (`F12` or `Ctrl+Shift+I`).
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) and type `Show Rendering`.
3. Scroll down to **Emulate CSS media feature prefers-reduced-motion**.
4. Select `prefers-reduced-motion: reduce`.
5. Observe that all pulsing glows, shakes, and transforms are immediately neutralized while preserving full application functionality.

---

## 🛡️ Honesty Disclosures & Fallbacks

- **Zero Hard-Coded Results**: Engine modes, versions, and verification checks are sourced directly from fixtures via `API_BASE`.
- **Honesty Disclosures**: Explicit notices indicate that scanning uses synthetic data, hardware attestation is mocked, public-chain anchoring is simulated, and external platform egress blocking is simulated.
- **Degraded Health Alerts**: When any engine in `health.json` is marked `UNAVAILABLE`, a persistent warning banner appears at the top of the interface and diagnostics page.
