# GET SOLAR ENERGY — Enterprise Design System Guidelines

> Design authority: **the frozen "Bill Analyzer" implementation**. This document describes the design system as it is actually implemented in the production React application.
>
> Scope authority: `frontend/consumer-app/src/` only. Legacy HTML prototype files under `frontend/` (e.g. `frontend/styles/`, root `frontend/*.css`/`*.html`) are historical artifacts and are **not** part of the active design system. They are referenced below only as historical context where necessary.

---

## 1. Purpose

This document set (in `frontend/DESIGN_SYSTEM/`) codifies the enterprise design system for the GET SOLAR ENERGY application, extracted from the actual production codebase. Its purpose is to:

1. Provide a single, authoritative reference for designers and developers.
2. Document the canonical CSS modules, tokens, components, and conventions that already ship.
3. Record every known inconsistency and gap in `DESIGN_AUDIT.md` so they can be corrected deliberately — not silently re-implemented.
4. Prevent future CSS drift by fixing the load order, specificity, and naming conventions in `CSS_ARCHITECTURE.md`.

### Verification policy

Every statement in this documentation is backed by an actual file in the repository at the time of writing. If a standard, token, or component is claimed but cannot be located in `frontend/consumer-app/src/`, it is stated as:

> **Not present in the current repository.**

No standard is invented. When the codebase diverges from a documented ideal, the divergence is recorded in `DESIGN_AUDIT.md` rather than silently rewritten in this documentation.

---

## 2. Design Principles (as implemented)

These principles are stated in the source files themselves:

- **Single source of truth for design values.** `tokens.css` opens with: *"This is the single source of truth for ALL design values. Never hardcode colors, spacing, motion, or typography in any page stylesheet. Use these tokens everywhere."* — `frontend/consumer-app/src/styles/tokens.css:1-9`
- **Design-system aggregation through one entry point.** `design-system.css` states it is *"the ONLY design system file that should be linked from HTML pages"* and that its sub-modules must load in dependency order. — `frontend/consumer-app/src/styles/design-system.css:6-16`
- **Additive, non-destructive layering.** `enterprise.css` (the unification layer) states its rules: *"tokens only. No business logic. No destructive resets."* — `frontend/consumer-app/src/styles/enterprise.css:1-11`
- **Component libraries must be inherited, not re-created.** `buttons.css` opens with: *"Buttons must inherit styles from this file only. Never create ad-hoc button styles in page CSS."* — `frontend/consumer-app/src/styles/buttons.css:6-8`

---

## 3. Canonical Source Tree

The active design system lives under:

```
frontend/consumer-app/src/styles/          ← global CSS modules (22 files + assets/)
frontend/consumer-app/src/features/*/styles/  ← feature-scoped CSS (7 files)
frontend/consumer-app/src/vendor/styles/   ← vendor portal theme (1 file)
```

### 3.1 Global style modules — `src/styles/`

| File | Lines (approx.) | Role |
|---|---|---|
| `design-system.css` | 54 | Aggregator entry point; imports the 13 sub-modules in dependency order |
| `tokens.css` | 407 | Design tokens: colors, backgrounds, text, borders, radius, shadows, glass, blur, spacing, typography, motion, z-index, layout, charts |
| `typography.css` | 249 | Outfit font loading, type-scale utilities, text treatments |
| `utilities.css` | 302 | Global reset, scrollbar, focus ring, flex/grid/gap/spacing/rounded utilities |
| `glass.css` | 174 | Glass-morphism card language |
| `motion.css` | 235 | Keyframes (`gs-*`) and animation utilities |
| `buttons.css` | 326 | Button variants, sizes, states, groups |
| `cards.css` | 241 | Card base/variants |
| `forms.css` | 339 | Form controls |
| `tables.css` | 188 | Table structure |
| `badges.css` | 203 | Badges and avatars |
| `navigation.css` | 435 | Tabs, breadcrumbs, dropdown, sidebar, tooltip, modal, toast, drawer |
| `loading.css` | 210 | Skeleton, spinner, dots, progress |
| `layout.css` | 262 | Layout templates |
| `dashboard.css` | ~6,924 | Customer dashboard + legacy page styles (see audit) |
| `satellite-roof.css` | ~421 | Roof satellite feature styles |
| `auth.css` | ~1,182 | Auth page styles |
| `landing.css` | ~3,434 | Landing page styles |
| `chat.css` | 21 | Chat assistant styles |
| `enterprise.css` | 376 | Enterprise unification layer (loaded last globally) |
| `admin.css` | 420 | Admin workspace styles (`.ew-*` namespaced) |
| `project-tracking.css` | ~303 | Imported only by `ProjectTracking.jsx`, which is not routed; dead bundle |

Line counts above are approximate, from the files at the time of writing.

### 3.2 Feature-scoped style modules — `src/features/*/styles/`

| File | Imported by |
|---|---|
| `src/features/workOrders/styles/work-orders.css` | `WorkOrdersPage.tsx:12` |
| `src/features/technicianAi/styles/technician-ai.css` | `TechnicianAiPage.tsx:11` |
| `src/features/earnings/styles/earnings.css` | `EarningsPage.tsx:12` |
| `src/features/certifications/styles/certifications.css` | `CertificationsPage.tsx:14` |
| `src/features/profile/styles/profile.css` | `ProfilePage.tsx:14` |
| `src/features/knowledgeBase/styles/knowledge-base.css` | `KnowledgeBase.jsx:12` |
| `src/features/jobMarketplace/styles/job-marketplace.css` | `JobMarketplacePage.tsx:16` |

All feature routes are lazy-loaded (see `src/App.jsx:43-56` and `src/routes/technician.routes.tsx:9-16`), so each feature CSS file ships inside its route chunk and applies only when that route is visited.

### 3.3 Portal theme — `src/vendor/styles/vendor-theme.css`

Imported by `src/vendor/components/VendorAppShell.tsx:5`. Defines `--vendor-*` tokens (all resolved from canonical tokens) and `.vendor-*` classes.

---

## 4. CSS Load Order (global)

Entry chain from `frontend/consumer-app/src/main.jsx:3-11`:

1. `leaflet/dist/leaflet.css` (node_modules)
2. `./styles/design-system.css` (which `@import`s 13 sub-modules)
3. `./styles/dashboard.css`
4. `./styles/satellite-roof.css`
5. `./styles/auth.css`
6. `./styles/landing.css`
7. `./styles/chat.css`
8. `./styles/enterprise.css`
9. `./styles/admin.css`

Feature CSS files are imported at the top of their page modules and therefore load with the lazy route chunk, **after** all global styles.

At equal specificity, **later files win**. The entire override hierarchy depends on `enterprise.css` loading last among the global files — see `CSS_ARCHITECTURE.md` for the full analysis.

---

## 5. The `design-system.css` Aggregator

`frontend/consumer-app/src/styles/design-system.css` imports exactly 13 sub-modules in this order (lines 36–54):

1. `tokens.css` — foundation
2. `typography.css` — foundation
3. `utilities.css` — foundation
4. `glass.css` — visual language
5. `motion.css` — visual language
6. `buttons.css` — components
7. `cards.css` — components
8. `forms.css` — components
9. `tables.css` — components
10. `badges.css` — components
11. `navigation.css` — components
12. `loading.css` — components
13. `layout.css` — layout templates

The file's header (lines 18–31) documents this ordering and warns: *"DO NOT add component styles to this file. DO NOT import this file from other CSS files. Only HTML pages should link to this file."*

---

## 6. Non-Negotiable Rules (from source)

| Rule | Source |
|---|---|
| Never hardcode colors/spacing/motion/typography — use tokens | `tokens.css:5-7` |
| Use Outfit exclusively (300–900) | `typography.css:11-17` |
| Buttons inherit from `buttons.css` only | `buttons.css:6-8` |
| Enterprise layer: tokens only, no destructive resets | `enterprise.css:10` |
| Do not add component styles to `design-system.css` | `design-system.css:14` |

---

## 7. Related Documents

- `COLORS.md` — full color/token reference
- `TYPOGRAPHY.md` — type scale and text utilities
- `SPACING.md` — spacing, radius, layout tokens
- `ICONS.md` — icon strategy
- `COMPONENTS.md` — CSS-class component library
- `ANIMATIONS.md` — motion system
- `LAYOUT.md` — layout templates and shell
- `ACCESSIBILITY.md` — a11y conventions
- `UI_CHECKLIST.md` — implementation checklist
- `CSS_ARCHITECTURE.md` — load order, specificity, naming
- `COMPONENT_INVENTORY.md` — component-by-component inventory
- `DESIGN_AUDIT.md` — known inconsistencies and gaps
