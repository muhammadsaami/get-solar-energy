# COMPONENTS — CSS-Class Component Library

The design system is **CSS-class based**. There is no shared React primitive library for most components; instead, markup uses well-defined class names from the CSS modules under `frontend/consumer-app/src/styles/`. This document catalogs the class-based component library. For the React-level inventory (per-component location, usage, duplication), see `COMPONENT_INVENTORY.md`.

Line references below are to the defining CSS file.

---

## 1. Buttons — `buttons.css`

Base `.btn` (buttons.css:12) plus:

| Variant | Class | Definition |
|---|---|---|
| Primary (orange CTA) | `.btn-primary` | buttons.css:67 |
| Secondary (blue) | `.btn-secondary` | buttons.css:86 |
| Ghost | `.btn-ghost` | buttons.css:100 |
| Outline | `.btn-outline` | buttons.css:112 |
| Outline orange | `.btn-outline-orange` | buttons.css:125 |
| Danger | `.btn-danger` | buttons.css:138 |
| Success | `.btn-success` | buttons.css:152 |
| Glass | `.btn-glass` | buttons.css:165 |

**Sizes:** `.btn-xs` (180), `.btn-sm` (187), `.btn-lg` (193), `.btn-xl` (200), `.btn-full` (208).
**Icon variants:** `.btn-icon` (213), `.btn-icon-round` (234), `.btn-with-icon` (243).
**States:** `.btn.loading` (259), `:disabled` (277).
**Group/link:** `.btn-group` (288), `.btn-link` (311).

**Other button class families used across the app (see audit):** `vendor-btn-*` (vendor portal, `vendor-theme.css`), `hero-btn-*` (dashboard/landing heroes, `dashboard.css:1441`, refined `enterprise.css:267`), `calc-btn` (calculators), `table-action-btn` (`enterprise.css:283`). These are parallel, non-unified vocabularies — see `DESIGN_AUDIT.md`.

---

## 2. Cards — `cards.css`

| Class | Definition | Notes |
|---|---|---|
| `.card` | cards.css:9 | Base card + header/title/subtitle/body/footer |
| `.card-glass` | cards.css:62 | Glass card |
| `.card-metric` | cards.css:91 | KPI card + `.card-metric-value/-label/-change` |
| `.card-dashboard` | cards.css:145 | Dashboard panel |
| `.card-feature` | cards.css:170 | Feature/CTA card + icon/title/desc |
| `.card-insight` | cards.css:216 | Horizontal insight row |
| `.card-stat` | cards.css:233 | Stat strip + `.card-stat-num/-label` |
| `.card-grid`, `-2/-3/-4` | cards.css:259-266 | Card grids (responsive at 1024/640) |

**Glass variants in `glass.css`:** `.glass-card` (14), `.glass-light` (46), `.glass-heavy` (56), `.glass-ultra` (66).

> Note: `card-base` is defined in `dashboard.css:1811` and refined by `enterprise.css:38-49`. `card-glass`/`card-metric`/`card-feature` are refined by `enterprise.css` (gradient overlay, accent bar). See `CSS_ARCHITECTURE.md`.

---

## 3. Forms — `forms.css`

| Class | Definition | Notes |
|---|---|---|
| `.form-group` | forms.css:9 | Vertical field group |
| `.form-label` | forms.css:17 | + `.form-label-required` (28) |
| `.form-input` | forms.css:36 | Text input; states `.error/.success` (192/200) |
| `.form-select` | forms.css:72 | Select |
| `.form-textarea` | forms.css:101 | Textarea |
| `.form-input-group` | forms.css:124 | Prefix/suffix wrapper |
| `.form-search` | forms.css:170 | Search input + icon |
| `.form-error-msg` | forms.css:208 | `.form-helper-text` (217), `.form-success-msg` (223) |
| `.form-checkbox` | forms.css:238 | + `.form-checkbox-wrapper/-label` |
| `.form-radio` | forms.css:282 | |
| `.form-switch` | forms.css:308 | Toggle + track/thumb |
| `.form-upload` | forms.css:350 | File upload dropzone |

> `auth.css` re-defines `.form-group`/`.form-label`/`.form-input` (auth.css:408/420/470) — see `CSS_ARCHITECTURE.md`.

---

## 4. Tables — `tables.css`

| Class | Definition | Notes |
|---|---|---|
| `.table-container` | tables.css:9 | Scrollable wrapper |
| `.table` | tables.css:29 | Base table; th/td |
| `.table-hover` | tables.css:61 | Hover rows |
| `.table-striped` | tables.css:75 | Zebra |
| `.table-compact` | tables.css:80 | Dense |
| `.table th.sortable` | tables.css:86 | Sortable headers + `.sort-asc/-desc` |
| `.table-toolbar` | tables.css:106 | Toolbar |
| `.table-pagination` | tables.css:124 | + `.pagination-btn` |
| `.table-empty` | tables.css:175 | Empty state block (+ icon/title/desc) |
| `.td-primary` / `.td-mono` / `.td-actions` | tables.css:203-218 | Cell types |

`enterprise.css` refines `.table-container`/`.table th`/`.table tbody tr:hover` (sticky headers) at `enterprise.css:192-219`.

---

## 5. Badges & Avatars — `badges.css`

| Class | Definition |
|---|---|
| `.badge` | badges.css:9 |
| `.badge-success` / `.badge-warning` / `.badge-error` / `.badge-info` / `.badge-neutral` / `.badge-orange` / `.badge-purple` | badges.css:26-66 |
| `.badge-solid-orange/-blue/-green` | badges.css:70-86 |
| `.badge-sm` / `.badge-lg` | badges.css:90-100 |
| `.status-dot` (+ `.pulse`) | badges.css:103-139 |
| `.status-badge` | badges.css:142 |
| `.tag` / `.tag-remove` | badges.css:156-197 |
| `.avatar` (+ xs/sm/lg/xl, `.avatar-group`) | badges.css:200-238 |

---

## 6. Navigation, Overlays, Feedback — `navigation.css`

| Component | Classes | Definition |
|---|---|---|
| Tabs (underline) | `.nav-tabs` / `.nav-tab` / `.active` | navigation.css:9-48 |
| Tabs (pill) | `.nav-tabs-pill` / `.nav-tab-pill` | navigation.css:51-85 |
| Breadcrumb | `.nav-breadcrumb` / `.breadcrumb-item` / `.breadcrumb-separator` | navigation.css:88-121 |
| Dropdown | `.dropdown` / `.dropdown-menu` / `.dropdown-item` / `.dropdown-divider` / `.dropdown-header` | navigation.css:124-192 |
| Sidebar nav | `.nav-sidebar` / `.nav-sidebar-item` | navigation.css:195-235 |
| Tooltip | `[data-tooltip]` | navigation.css:245-273 |
| Modal | `.modal-overlay` / `.modal` / `.modal-header/-title/-body/-footer/-close` | navigation.css:276-350 |
| Toast | `.toast-container` / `.toast` (+ `.success/.error/.warning/.info`) / `.toast-title` / `.toast-message` | navigation.css:353-392 |
| Drawer | `.drawer-overlay` / `.drawer` (+ closing) | navigation.css:395-435 |

> Note: `.nav-tabs`/`.nav-tab-pill` CSS exists but is **not referenced by any TSX/JSX file** (0 usages) — legacy. `dashboard.css:2943` and `:3000` re-define `.modal-overlay`/`.modal-title`. See `DESIGN_AUDIT.md`.

---

## 7. Loading — `loading.css`

| Component | Classes | Definition |
|---|---|---|
| Skeleton | `.skeleton` | loading.css:9 |
| Skeleton text | `.skeleton-text` (+ `.wide/.medium/.narrow/.full`) | loading.css:22-31 |
| Skeleton block/circle/avatar/button | `.skeleton-block` / `.skeleton-circle` / `.skeleton-avatar` / `.skeleton-button` | loading.css:33-52 |
| Skeleton card | `.skeleton-card` / `.skeleton-card-header` | loading.css:55-68 |
| Skeleton grid | `.skeleton-grid` / `-2` / `-4` | loading.css:71-77 |
| Legacy shimmer | `.shimmer-loading-block` / `.shimmer-skeleton` / `.skeleton-line` / `.skeleton-cell` | loading.css:80-100 |
| Spinner | `.loading-spinner` (+ `.orange/.green`, `.sm/.lg`) | loading.css:103-117 |
| Dots | `.loading-dots` / `.loading-dot` | loading.css:120-135 |
| Progress | `.progress-track` / `.progress-fill` (+ `.orange/.green/.animated`) | loading.css:138-164 |
| Progress label | `.progress-header` / `.progress-label` / `.progress-value` | loading.css:167-184 |
| Full-screen | `.page-loading` / `.page-loading-logo` / `.page-loading-text` | loading.css:187-210 |

---

## 8. Glass Design Language — `glass.css`

`.glass-card`, `.glass-light`, `.glass-heavy`, `.glass-ultra`, `.glass-nav`, `.glass-sidebar`, `.glass-input`, `.glass-modal`, `.glass-modal-overlay`, `.glass-hud`, `.glass-active-blue`, `.glass-active-orange`, `.glass-panel`, `.glass-strip`, `.glow-blue/-orange/-green`, `.glass-reflect`.

---

## 9. Layout Templates — `layout.css`

`.layout-auth` (+ `.layout-auth-card`), `.layout-dashboard` (+ `.layout-dashboard-main/-header/-content`, `.collapsed`), `.layout-split` (+ `.layout-split-panel/-main`), `.layout-analytics` (+ `-header/-kpis/-body`), `.layout-settings` (+ `-nav/-content`), `.layout-wizard` (+ `.wizard-step-*`), `.layout-master-detail` (+ `.layout-master-list`, `.layout-detail-pane`), `.container/-narrow/-wide`, `.page-header/-title/-subtitle`.

---

## 10. Enterprise Unification Layer — `enterprise.css`

Additive refinements applied last across all portals:

- `.card-base/.card-glass/.card-metric/.vendor-glass-card::before` gradient overlay (38-60)
- `.card-metric::after` accent bar via `--card-accent`; `.kpi-accent-orange/green/blue/purple/cyan/amber` (62-85)
- `.kpi-value-text`, `.kpi-title`, `.kpi-subtext-block`, `.kpi-card-subdesc` (88-130)
- `.hero-card`, `.hero-section`, `.hero-title`, `.hero-desc` (133-173)
- `.card-feature` re-style + hover (176-189)
- `.table-container` shadow, sticky `.table th`, hover rows (192-219)
- `[class$="-tab-btn"]` unification of all per-feature tab classes (222-253)
- Button focus rings, `.table-action-btn` (256-297)
- Input focus ring (300-317)
- `.empty-state`, `.table-empty*` (320-339)
- Vendor refinements: `.vendor-glass-card`, `.vendor-table` (342-358)

---

## 11. Shared React Primitives

Only two real React components exist in `src/components/ui/`:

| Component | Location | Production usage |
|---|---|---|
| `Button.tsx` | `src/components/ui/Button.tsx` | **0 imports** (dead; only its test imports it) |
| `DocumentDrawer.jsx` | `src/components/ui/DocumentDrawer.jsx` | 1 import — `src/features/knowledgeBase/KnowledgeBase.jsx:4` |

`feedback/EmptyState.tsx` (`src/components/feedback/EmptyState.tsx`) is also **0-import dead code** — every feature implements its own empty state.

The folders `src/components/common/`, `src/components/cards/`, `src/components/forms/` exist but are **empty** (no files). See `COMPONENT_INVENTORY.md` and `DESIGN_AUDIT.md`.
