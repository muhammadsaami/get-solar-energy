# Phase 20.9 — Repository-wide Error Handling Standardization

> **Status:** Proposal (awaiting approval — not yet implemented)
> **Depends on:** Phase 20.8A (Training API restoration & repository API consistency) — complete
> **Scope:** Error handling architecture only. No business logic changes.

---

## 1. Motivation

Phase 20.8A resolved the `/api/api/` duplication for the Training module and verified
repository-wide API consistency. During that audit, three `.catch(() => null)` instances
were identified in non-training services. They were intentionally left unchanged because
they are graceful degradation for optional panels, not the `/api/api/` bug.

The audit also revealed that error handling across the repository is **inconsistent**:
- Some services throw, some return `null`, some swallow errors.
- Some pages show honest error states with retry; others silently render empty content.
- Loading/empty/error state handling is duplicated and varies per feature.
- There is no shared error-boundary, toast, or logging standard.

This proposal establishes **one consistent error-handling architecture** for the entire
repository without changing business logic.

---

## 2. Current Patterns (Inventory)

### 2.1 The three deferred `.catch(() => null)` instances (from 20.8A)

| File | Line | Purpose | Why graceful today | Revisit |
|---|---|---|---|---|
| `frontend/consumer-app/src/services/technicianDashboard.service.ts` | 40 | Notifications feed (secondary panel on dashboard) | Optional panel; hides content when offline rather than failing the whole dashboard | Yes |
| `frontend/consumer-app/src/services/customerDashboard.service.ts` | 31–33 | Dashboard stats, recent bills, analytics (three parallel calls) | Each is an independent panel; a failure should not blank the whole dashboard | Yes |
| `frontend/consumer-app/src/features/profile/services/profile.service.ts` | 14 | Performance section on profile page | Optional section; falls back to `{}` when the endpoint is unavailable | Yes |

### 2.2 Other observed patterns (to be fully audited in Phase 20.9)

- **Service layer:**
  - `training.service.js` — throws on failure; throws when live data is `null` (20.8A).
  - `knowledgeBase.service.js` — `try { live } catch { fallback to MOCK_DOCUMENTS }`
    (silent fallback to mock data — the pattern 20.8A explicitly rejected).
  - `technicianDashboard.service.ts`, `customerDashboard.service.ts`, `profile.service.ts` —
    `.catch(() => null)` graceful degradation.
  - Most other services — no explicit error handling; rely on the axios interceptor.
- **API client:** `src/services/api/client.js` — single axios instance with request/response
  interceptors (`injectToken`, `onError`). Response interceptor behavior must be standardized
  (what gets thrown, whether the original error object is preserved).
- **Pages/hooks:** ad-hoc `loading`/`error` `useState` + `useEffect` patterns with no shared hook.
- **Forms:** per-feature validation and submit-error handling; no standard.
- **Tables:** empty vs. error states not consistently distinguished.
- **Dashboard widgets:** mix of `.catch(() => null)`, empty-object fallbacks, and thrown errors.
- **Background refreshes:** polling/refetch exist in some pages (e.g., CRM, SystemPerformance)
  with inconsistent error surfacing.
- **Retry behaviour:** manual Retry button added to Training (20.8A); absent elsewhere.
- **Toasts:** ad-hoc toast usage; no global error-toast contract.
- **Error boundaries:** not observed — need to confirm in audit.
- **Auth:** token expiry / 401 handling exists in interceptors; must be standardized.
- **Network/timeout/offline:** no uniform offline detection; timeout is 45s on the client.

### 2.3 Targets to audit (representative, not exhaustive)

- `src/services/api/client.js` and `src/services/api/interceptors.*`
- All `src/services/*.service.{js,ts}`
- All `src/features/*/services/*.service.{js,ts}`
- All `src/hooks/*`
- All page components that fetch data (`src/pages/**`, `src/features/**/pages/**`, `src/vendor/pages/**`)
- All dashboard/widget components that fetch data
- All forms and tables

---

## 3. Target Standard

### 3.1 Service layer

- **Every API service function** must:
  - Return typed data or **throw** — never return `null`/`undefined`/`{}` as a success substitute.
  - **Preserve the original error object** (do not `catch` and lose it).
  - Not swallow errors with empty `catch {}` blocks.
  - Not silently fall back to mock/fabricated data (per 20.8A rule).
- **Optional data** must be modeled explicitly, e.g. return `{ data } | { error }` union or
  throw and let the widget decide, using a documented optional-data convention.
- All services use the shared `api` client — never bespoke `fetch` for internal endpoints.

### 3.2 API client

- Standardize interceptor behavior:
  - Normalize API validation errors (`detail` from FastAPI / pydantic) into a typed
    `ApiError` with `status`, `code`, `message`, `fieldErrors`, `original`.
  - Distinguish: network failure, timeout, 401 (auth), 403 (authorization), 4xx (validation),
    5xx (server), offline.
  - Preserve the original error object on `ApiError.original`.
- Add shared `ApiError` class + factory.

### 3.3 React hooks

- One shared data-fetching hook (e.g. `useAsyncData(fetcher, deps)`) that returns:
  `{ data, loading, error, retry, refetch }`.
- One shared `useOffline()` / network-status hook.
- Replace ad-hoc `useState` loading/error patterns incrementally.

### 3.4 Pages & widgets

- Standard states for every data region: **Loading → Empty → Error → Data**.
- Error state: real message from `ApiError`, visible, with a **Retry** button.
- Empty state: distinct from error, with appropriate copy/action.
- Background refresh: errors surfaced via toast, not silent.
- Widgets may independently fail without blanking the whole page (graceful degradation is
  acceptable **only** when it is explicit and communicated, not silent).

### 3.5 Forms

- Standard submit-error handling: map `fieldErrors` to fields, surface non-field errors via
  toast, disable submit while pending, preserve user input on failure.

### 3.6 Tables

- Standard row-loading, empty-table, and table-level error states (with retry).

### 3.7 Toasts

- One toast contract (success / error / warning / info) used across the app.
- Error toasts show a concise message; detail available via console/diagnostics.

### 3.8 Error boundaries

- Introduce a root Error Boundary and per-feature boundaries as needed.
- Boundary catches render-time errors, shows honest fallback, and logs to diagnostics.

### 3.9 Auth & authorization

- 401 → standardized session-expired flow (redirect to login + toast), centralized in the
  interceptor.
- 403 → standardized "not authorized" state, consistent across pages.
- Remove any inline token-expiry handling that duplicates the interceptor.

### 3.10 Network / timeout / offline

- Standard timeout constant on the client (already 45s; centralize it).
- Offline: hook exposes online status; pages show offline banner and disable non-essential actions.
- Retry: shared retry with backoff for idempotent GETs (manual button + optional auto-retry).

### 3.11 Logging & diagnostics

- One `logger` utility (dev-console + optional remote sink).
- Every caught error is logged once at the boundary with `ApiError` shape.
- `?debug` / diagnostics view exposing recent errors for developer use.
- No secrets ever logged.

---

## 4. Migration Strategy

1. **Foundation** (no behavior change):
   - Add `ApiError` + factory; standardize interceptor to always produce it.
   - Add shared hooks: `useAsyncData`, `useOffline`.
   - Add toast contract and `logger`.
   - Add root Error Boundary.
2. **Critical paths first** (auth, profile, dashboard):
   - Remove silent `.catch(() => null)` on critical data; use explicit optional-data pattern.
   - Wire 401/403 flows.
3. **Feature-by-feature** (non-critical): migrate pages/widgets to shared hooks and standard
   Loading/Empty/Error/Retry states.
4. **Optional panels** (the three 20.8A instances and similar): replace silent degradation with
   explicit optional-data handling + toast when a background refresh fails.
5. **Delete duplicated patterns** (mock fallback in `knowledgeBase.service.js` and similar).
6. **Verification per phase:** `npx tsc --noEmit`, `npm run build`, targeted tests, manual
   browser checks (Network/Console) for each migrated feature.

**Ordering principle:** migrate one feature at a time, keep business logic identical, and
verify each before moving on. No wholesale rewrite in one change.

---

## 5. Files Affected (representative, to be expanded by the audit)

- `src/services/api/client.js`, `src/services/api/interceptors.*` (+ new `ApiError` module)
- `src/services/technicianDashboard.service.ts`, `customerDashboard.service.ts`,
  `profile.service.ts`
- `src/features/knowledgeBase/services/knowledgeBase.service.js` (remove silent mock fallback)
- `src/features/training/services/training.service.js` (align to standard)
- All `src/features/*/services/*`, all `src/services/*.service.*`
- All data-fetching pages, hooks, forms, tables, dashboard widgets
- New shared modules: `src/hooks/useAsyncData.ts`, `src/hooks/useOffline.ts`,
  `src/utils/logger.ts`, `src/components/ErrorBoundary.tsx`
- `src/contexts/AuthContext.jsx` (401/403 flow alignment)
- `src/config/env.ts` (centralize timeout / API URL)
- New: `src/components/toast/*` (if no global toast exists)

---

## 6. Priority

### Critical
- Standardize `ApiError` + interceptor (auth/network/validation normalization).
- 401 session-expired and 403 authorization flows.
- Remove silent mock fallback (`knowledgeBase.service.js`) and silent data loss.
- Root Error Boundary.

### Major
- Shared `useAsyncData` / `useOffline` hooks.
- Standard Loading/Empty/Error/Retry states for pages, tables, dashboard widgets.
- Toast contract + logger.
- The three deferred `.catch(() => null)` instances (notifications, customer dashboard,
  profile performance) converted to explicit optional-data handling.

### Minor
- Form field-error mapping standardization.
- Offline banner and background-refresh error surfacing.
- Per-feature error boundaries.
- Developer diagnostics view.

---

## 7. Acceptance Criteria

1. No silent error swallowing anywhere (no empty `catch {}`, no `.catch(() => null)` masking
   real failures, no silent mock fallback for API-backed data).
2. Every API-backed surface has distinct Loading / Empty / Error(with Retry) / Data states.
3. Every failure produces a typed `ApiError` preserving the original error.
4. 401/403 handled uniformly at the client boundary.
5. Network, timeout, and offline cases handled uniformly.
6. One toast contract and one logger; no inconsistent ad-hoc handling.
7. `npx tsc --noEmit` and `npm run build` pass.
8. No business logic changes: all data shapes and user flows preserved.
