# CSS_ARCHITECTURE — Load Order, Specificity, Naming

This document explains how CSS is structured and layered in the production app (`frontend/consumer-app/src`), so future changes do not break the cascade. Line references point to the source files.

---

## 1. CSS Load Order

### 1.1 Entry chain (`src/main.jsx:3-11`)

All global CSS is loaded by JS imports in this exact order:

1. `leaflet/dist/leaflet.css` (node_modules — the only vendor CSS)
2. `./styles/design-system.css`
3. `./styles/dashboard.css`
4. `./styles/satellite-roof.css`
5. `./styles/auth.css`
6. `./styles/landing.css`
7. `./styles/chat.css`
8. `./styles/enterprise.css`
9. `./styles/admin.css`

Zero CSS is linked from HTML. `index.html` only loads `/src/main.jsx`; `public/index.html` is a stale CRA artifact with no stylesheets.

### 1.2 `design-system.css` aggregator (`src/styles/design-system.css:36-54`)

Imports 13 sub-modules in dependency order:

| # | File | Layer |
|---|---|---|
| 1 | `tokens.css` | Foundation |
| 2 | `typography.css` | Foundation |
| 3 | `utilities.css` | Foundation |
| 4 | `glass.css` | Visual language |
| 5 | `motion.css` | Visual language |
| 6 | `buttons.css` | Components |
| 7 | `cards.css` | Components |
| 8 | `forms.css` | Components |
| 9 | `tables.css` | Components |
| 10 | `badges.css` | Components |
| 11 | `navigation.css` | Components |
| 12 | `loading.css` | Components |
| 13 | `layout.css` | Layout templates |

Header rules (`design-system.css:6-16`): design-system.css is *"the ONLY design system file that should be linked"*; do not add component styles to it; do not import it from other CSS files.

### 1.3 Feature / page CSS (lazy route chunks)

Feature CSS files are imported at the top of their (lazy-loaded) page modules, so they load **after** all global styles and apply only when the route is visited:

| CSS | Imported by |
|---|---|
| `src/features/workOrders/styles/work-orders.css` | `WorkOrdersPage.tsx:12` |
| `src/features/technicianAi/styles/technician-ai.css` | `TechnicianAiPage.tsx:11` |
| `src/features/earnings/styles/earnings.css` | `EarningsPage.tsx:12` |
| `src/features/certifications/styles/certifications.css` | `CertificationsPage.tsx:14` |
| `src/features/profile/styles/profile.css` | `ProfilePage.tsx:14` |
| `src/features/knowledgeBase/styles/knowledge-base.css` | `KnowledgeBase.jsx:12` |
| `src/features/jobMarketplace/styles/job-marketplace.css` | `JobMarketplacePage.tsx:16` |
| `src/vendor/styles/vendor-theme.css` | `VendorAppShell.tsx:5` |

### 1.4 The fragile global order

At equal specificity, **later files win**. The entire enterprise look depends on `enterprise.css` loading **after** `dashboard.css`/`landing.css`/`auth.css` and **before** `admin.css`. Reordering `main.jsx` imports will silently change rendering.

---

## 2. Specificity & Override Hierarchy

Duplicate definitions of the same class across files resolve by load order (later wins at equal specificity). Verified examples:

| Class | First definition | Refined by (winner) |
|---|---|---|
| `.form-input` | `forms.css:36` | `auth.css:470` (height 52px, radius 14px, bg) |
| `.form-group` | `forms.css:9` | `auth.css:408` |
| `.form-label` | `forms.css:17` | `auth.css:420` |
| `.btn` | `buttons.css:12` | `enterprise.css:256` (adds transition) |
| `.card-base` | `dashboard.css:1811` | `enterprise.css:38-49` (gradient ::before) |
| `.card-glass` | `cards.css:62` | `enterprise.css:38-60, 343` |
| `.card-metric` | `cards.css:91` | `enterprise.css:62-78` (shadow, accent bar) |
| `.card-feature` | `cards.css:170` | `enterprise.css:176-189` (full re-style) |
| `.table th/td` | `tables.css:36/49` | `enterprise.css:196-219` (sticky, hover) |
| `.hero-card` / `.hero-title` / `.hero-desc` | `dashboard.css:1066/1270/1280` | `enterprise.css:133/162/169` |
| `.modal-overlay` | `navigation.css:276` | `dashboard.css:2943` |
| `.modal-title` | `navigation.css:313` | `dashboard.css:3000` |
| `.skeleton-text` | `loading.css:22` | `dashboard.css:4792` |
| `.skeleton-line` / `.skeleton-block` | `loading.css:91/33` | `landing.css:1561/1577` |
| `*` reset | `utilities.css:12-18` | `dashboard.css:27-34` (+ `font-family: 'Outfit'`) |
| `body` | `utilities.css:27` | `dashboard.css:36-44` (radial-gradient bg) |
| scrollbar | `utilities.css:43-60` | `dashboard.css:47-60` |

**The `[class$="-tab-btn"]` wildcard** (`enterprise.css:222-253`) unifies every per-feature tab-button class (`ew-tab-btn`, `earnings-tab-btn`, `wo-tab-btn`, `cert-tab-btn`, `profile-tab-btn`, `job-tab-btn`) — a deliberately broad selector that must not be broken by renaming tab classes.

### Override layers summary

```
tokens → typography → utilities → glass → motion → components → layout   (design-system.css)
    → dashboard → satellite-roof → auth → landing → chat                  (legacy page CSS)
    → enterprise (unification layer — wins over all above)                 
    → admin (admin-only)
    → feature CSS (route chunks)
    → vendor-theme (vendor portal)
```

---

## 3. Naming Conventions

### 3.1 Class naming: flat kebab-case with block prefixes

- **BEM is NOT used** — no `__element` / `--modifier` separators (0 matches for `__` in CSS).
- Modifiers are **separate suffix classes**: `.active`, `.success`, `.error`, `.warning`, `.paid`, `.pending`.

Examples:
- `.btn-primary`, `.btn-secondary`, `.btn-icon-round` (`buttons.css`)
- `.card-glass`, `.card-metric-label`, `.card-feature-icon` (`cards.css`)
- `.table-action-btn` (`enterprise.css:283`), `.badge-solid-orange` (`badges.css:70`)
- `.nav-tab-pill` (`navigation.css:61`), `.skeleton-card-header` (`loading.css:63`)
- `.kpi-value-text`, `.kpi-title` (`enterprise.css:88-107`)

### 3.2 Feature namespaces (per-module prefixes)

| Prefix | Feature | Evidence |
|---|---|---|
| `earnings-*` | Earnings | `earnings.css:3,13,51,57` |
| `wo-*` | Work Orders | `work-orders.css:13,50,56,118` |
| `cert-*` | Certifications | `certifications.css:13,50,129,181` |
| `profile-*` | Profile | `profile.css:13,54,128,190` |
| `kb-*` | Knowledge Base | `knowledge-base.css:7,15,37,59` |
| `job-*` | Job Marketplace | `job-marketplace.css:13,51,119,278` |
| `ai-*` | Technician AI | `technician-ai.css:13,49,67,126` |
| `vendor-*` | Vendor portal | `vendor-theme.css:52,79,110,202,237` |
| `ew-*` | Admin "Enterprise Workspace" | `admin.css:11,42,128,169,321,363,409` |
| `satellite-*` | Satellite roof | `satellite-roof.css:7,34` |
| `kanban-*` | Project tracking (dead page) | `project-tracking.css:1,14,58` |
| `auth-*` | Auth pages | `auth.css:26,34,201,219,395,831` |

### 3.3 Custom property (token) naming

`--category-value`: `--color-orange`, `--bg-card`, `--text-primary`, `--border-color`, `--radius-lg`, `--space-4`, `--z-modal`, `--font-weight-black`, `--duration-fast`, `--ease-bounce` (`tokens.css`).

### 3.4 Keyframe naming

`gs-*` prefix: `gs-fade-in`, `gs-slide-up`, `gs-scale-in`, `gs-shimmer`, `gs-spin`, etc. (`motion.css:16-151`).

---

## 4. Utility-Class Philosophy

### 4.1 A real utility layer exists (`src/styles/utilities.css`)

Loaded globally via `design-system.css:38`. Includes:
- Display: `.block/.inline-block/.inline/.hidden/.invisible/.flex/.inline-flex/.grid/.contents` (91-100)
- Flex: `.flex-col/.flex-row/.flex-wrap/.flex-1/.flex-auto/.flex-shrink-0/.flex-grow-1` (103-111)
- Alignment: `.items-*`, `.justify-*`, `.self-*` (113-128)
- Gap: `.gap-1`…`.gap-12` (131-139)
- Grid: `.grid-cols-1/2/3/4/6`, `.col-span-*` (142-149)
- Width/height: `.w-full/.w-auto/.h-full/.h-screen/.min-h-screen` (152-156)
- Position: `.relative/.absolute/.fixed/.sticky/.inset-0` (159-163)
- Overflow: `.overflow-hidden/-auto/-x-auto/-y-auto` (166-169)
- Radius: `.rounded-xs…rounded-full` (172-178)
- Padding/margin: `.p-0…p-12`, `.px-*`, `.py-*`, `.mt-*`, `.mb-*`, `.m-auto`, `.mx-auto` (182-209)
- Background/border/divider, cursor, select, pointer-events, opacity, z-index, sr-only, skip-link (212-296)
- Print: `.no-print` under `@media print` (299-302)

### 4.2 Utility helpers in other modules

- Typography utilities: `.text-*`, `.font-*`, alignment, truncation (`typography.css`)
- Motion utilities: `.animate-*`, `.delay-*`, `.transition-*`, `.hover-lift*`, `.stagger-children` (`motion.css`)
- Glass utilities: `.glow-blue/-orange/-green`, `.glass-reflect` (`glass.css`)

### 4.3 Reality: inline styles dominate

- **3,977** `style={{` occurrences across **297 files**
- **3,226** `className=` occurrences
- The canonical `ui/Button.tsx` is styled 100% inline (`Button.tsx:11-38`), which is why `Button.module.css` (24 lines) is an orphan (never imported).

Top inline-style files: `pages/BillAnalyzer.tsx` (163), `pages/crm/CrmCustomer360.tsx` (138), `pages/Proposal.jsx` (135), `pages/mlops/MlOpsPage.tsx` (126), `pages/RoofAnalyzer.tsx` (100).

### 4.4 `cn()` utility

`src/utils/cn.ts` exports `cn()` (using `clsx` + `tailwind-merge`) but is **not imported anywhere** — dead code (`DESIGN_AUDIT.md`).

---

## 5. Dead / Orphaned CSS (documented here, tracked in DESIGN_AUDIT.md)

| File | Status |
|---|---|
| `src/components/ui/Button.module.css` | Never imported; `Button.tsx` uses inline styles |
| `src/styles/project-tracking.css` | Imported only by `ProjectTracking.jsx:18`, which is not routed; dead bundle |
| `.nav-tabs` / `.nav-tab-pill` (navigation.css) | CSS defined; **0 references** in TSX/JSX |
| `frontend/styles/`, root `frontend/*.css`, `frontend/*.html` | Legacy HTML prototype, outside `consumer-app/src`; not part of the active system |

---

## 6. Rules to Prevent Future Drift

1. Keep `main.jsx` global import order stable; append feature CSS to feature route modules, not to `main.jsx`.
2. Only `design-system.css` aggregates the shared system; do not add page-specific rules to it.
3. Feature CSS must use the feature prefix and tokens only.
4. Prefer existing utility/component classes over inline styles.
5. When refining shared classes (like `enterprise.css` does), keep the refinement additive and place it in a file that loads after the original.
