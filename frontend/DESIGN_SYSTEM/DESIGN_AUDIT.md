# DESIGN_AUDIT — Known Inconsistencies & Gaps

Severity-classified findings from auditing the production app (`frontend/consumer-app/src`). Every item is verified against source. **Status**: documenting these is the deliverable of Phase 23.1 — no fixes are made in this phase.

Severity legend: **CRITICAL** (breaking/risk to production), **HIGH** (structural drift), **MEDIUM** (consistency), **LOW** (polish), **INFO** (fact).

---

## CRITICAL

### C1. `--card-theme` used without fallback at dashboard.css:2213
`.action-card:hover { border-color: rgba(var(--card-theme), 0.4); }` (`dashboard.css:2213`) references `--card-theme` with **no fallback**, unlike the other usages which provide fallbacks (`dashboard.css:1825,1827,2063,2064,3373-3375` all use `var(--card-theme, var(--accent-blue-rgb))` or `23, 168, 229`). `--card-theme` is only defined on the `.action-card.bill-analyzer/.roof-analysis/.roi-calc/.ai-assistant/.referrals` variants (`dashboard.css:2241-2245`). An `.action-card` without one of those modifier classes produces an invalid `rgba()` on hover.

### C2. The entire enterprise look depends on one import order
`enterprise.css` must load last (after dashboard/auth/landing) and before `admin.css` in `main.jsx:3-11`. Any reorder silently breaks the UI. See `CSS_ARCHITECTURE.md §1.4`.

### C3. `dashboard.css` re-declares the global reset
`dashboard.css:27-60` re-declares `*`, `body`, and scrollbar rules, shadowing `utilities.css:12-60`. Divergences between the two resets are latent bugs.

---

## HIGH

### H1. Dead shared components (0 production imports)
- `src/components/ui/Button.tsx` — imported only by its test. 100% inline-styled (`Button.tsx:11-38`); its sibling `Button.module.css` is never imported.
- `src/components/feedback/EmptyState.tsx` — 0 imports; all 16 feature empty states are hand-written.
- `src/utils/cn.ts` — `cn()` (clsx + tailwind-merge) never imported; deps effectively unused.

### H2. 17 empty states, 0 shared
16 hand-written `*EmptyState` components + inline `.table-empty` blocks (`projectTracking/drawerTabs/*.jsx`), none reuse `feedback/EmptyState.tsx`. See `COMPONENT_INVENTORY.md §13`.

### H3. 11 drawer shells repeating identical logic
Only `ui/DocumentDrawer.jsx` centralizes overlay+panel+Escape+focus-trap+scroll-lock, and it has exactly 1 consumer. 10 other shells duplicate it. See `COMPONENT_INVENTORY.md §4`.

### H4. Token gaps referenced but never defined
These tokens are **used in the codebase but not present in the current repository** (`tokens.css`):
- `--color-white` — references to white are hardcoded `#ffffff` (e.g. `typography.css:183`, `buttons.css:140`).
- `--color-text-secondary` — the canonical token is `--text-secondary`; any `--color-text-secondary` reference is invalid.
- `--font-mono` — monospace is hardcoded (`tables.css:209` `'Courier New', monospace`).
- `--ease-out` — not defined; the easing set uses `--ease-*` names in `tokens.css:261-268`.
- `--bar-color` — referenced in some feature CSS without a token definition.

### H5. Font-family violations
- `'Inter'` — `src/vendor/styles/vendor-theme.css:59` (`font-family: 'Outfit', 'Inter', ...`).
- `'Courier New', monospace` — `tables.css:209` (`.td-mono`), plus legacy landing/dashboard styles.
Only Outfit is approved (`typography.css:11-17`).

### H6. Orphaned/dead CSS
- `src/components/ui/Button.module.css` — never imported.
- `src/styles/project-tracking.css` + `src/pages/ProjectTracking.jsx` — page is not routed (`grep` finds only `routes.ts:69` string + the file itself); dead bundle.
- `.nav-tabs` / `.nav-tab-pill` (`navigation.css`) — 0 TSX/JSX references (feature tabs use `*-tab-btn` families).

---

## MEDIUM

### M1. Hardcoded colors (token violations)
- `dashboard.css`: **187** hex occurrences, 46 distinct (e.g. `#f59e0b`, `#ef4444`, `#10b981`, `#ff8a1d` duplicated despite `--color-*`).
- `landing.css`: **28** hex occurrences, 12 distinct (e.g. `#14b8a6`, `#f87171`, `#f97316`, `#ffc04d`).
- `auth.css`: **26** hex occurrences, 19 distinct (e.g. `#3f3f3f`, `#555555`, `#ff9d3b`).
- Feature CSS and `Button.tsx` (`#ff9d3d`, `#f43f5e`) also hardcode.

### M2. Inline-style dominance
3,977 `style={{` across 297 files vs 3,226 `className=`. Top files: `BillAnalyzer.tsx` (163), `CrmCustomer360.tsx` (138), `Proposal.jsx` (135), `MlOpsPage.tsx` (126), `RoofAnalyzer.tsx` (100). Contradicts the token/class philosophy.

### M3. 15 distinct media-query width breakpoints
Breakpoints observed: `1440, 1400, 1280, 1250, 1200, 1150, 1024, 992, 991, 900, 768, 640, 600, 540, 480` px (plus `max-height: 960/850`). No shared breakpoint token set; `tokens.css` defines no `--breakpoint-*` tokens. (`typography.css`/`layout.css`/`cards.css` use 1280/1024/768/640/480; dashboard uses many more.)

### M4. Parallel button vocabularies
5 families: `.btn*` (buttons.css), `.vendor-btn-*`, `.hero-btn-*`, `.calc-btn`, `.table-action-btn` — no shared abstraction despite `ui/Button.tsx` intent. See `COMPONENT_INVENTORY.md §2`.

### M5. Feature CSS token/prefix discipline inconsistent
Feature CSS use `.ew-*`/`earnings-*`/`wo-*`/`cert-*`/`kb-*`/`job-*`/`ai-*`/`vendor-*` prefixes, but `admin.css` uses only tokens (`.ew-*`, per header `admin.css:1-8`) while feature files contain raw values; e.g. `auth.css` re-defines `.form-*` with px values (`auth.css:408-479`) rather than tokens.

### M6. `--card-accent` design (enterprise) is fragile
`.card-metric::after` uses `rgba(var(--card-accent, 23, 168, 229), 0.55)` (`enterprise.css:76`); fine, but it layers on top of the `--card-theme` mechanism — two overlapping accent systems for cards.

---

## LOW

### L1. `--vendor-*` token layer
`vendor-theme.css:5-49` defines `--vendor-*` tokens (resolving to canonical tokens). Adds an extra indirection layer vs using canonical tokens directly.

### L2. `pagination-btn` / `.nav-pagination` duplication
`.pagination-btn` (`tables.css:140`) and `.nav-pagination` (`navigation.css:238`) overlap; no pagination React component.

### L3. `.status-badge` vs `.badge` overlap
`.status-badge` (`badges.css:142`) and `.badge-*` variants overlap in purpose; `status-badge` is used by 6 files.

### L4. Legacy compat aliases in `tokens.css:326-364`
`--accent-*`, `--text-navy`, `--border-radius-*`, `--ease` exist solely to keep legacy CSS working; header says "DO NOT use these names in new code."

### L5. Skip link CSS exists but global usage unverified
`.skip-link` (`utilities.css:281-296`) is defined; global rendering on every layout is not confirmed (see `ACCESSIBILITY.md §3`).

---

## INFO

- **Icon system**: single family `Md` (`react-icons/md`), 90 import lines, 88 distinct icons, 449 token usages. 93 files contain inline `<svg>` (sprites/logos) outside the icon library. `lucide-react` **not present**.
- **Empty dirs**: `src/components/common/`, `src/components/cards/`, `src/components/forms/` are empty.
- **Legacy HTML prototype**: `frontend/styles/`, root `frontend/*.css`/`*.html`, `public/index.html` (stale CRA) — not part of the active system.
- **Tech debt from Phase 23 (reported separately in `PHASE-23-LAUNCH-READINESS-REPORT.md`)**: Knowledge Base customer 401 permission mismatch (HIGH, deferred); StrictMode dev duplicate requests (MEDIUM); CRM lint warnings.

---

## Cleanup Priorities

| Priority | Action | Items |
|---|---|---|
| 1 | Fix `--card-theme` fallback | C1 |
| 2 | Adopt a shared drawer shell | H3, §4 |
| 3 | Adopt a shared empty state | H2, §13 |
| 4 | Remove/rewire dead code | H1, H6 |
| 5 | Add missing tokens; replace hardcoded values | H4, M1 |
| 6 | Unify buttons | M4, §2 |
| 7 | Freeze breakpoints | M3 |
| 8 | Reduce inline styles | M2 |
| 9 | Document/enforce import order | C2, C3 |
