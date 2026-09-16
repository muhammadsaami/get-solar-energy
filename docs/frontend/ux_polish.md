# GET Solar Energy — UX Polish Documentation

> Version: 1.0.0 | Updated: Phase 13.5B

## Accessibility Improvements

### 1. Skip-to-Content Link

**What:** A hidden link that becomes visible on keyboard focus, allowing users to skip directly to main content.

**Where:** Added after `<body>` in `index.html`:
```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

**CSS:** Styled in `utilities.css:281-296` (`.skip-link` class).

### 2. ARIA Tab Panel Roles

**What:** Each `.tab-content` element now has `role="tabpanel"` and `aria-label` for screen reader association with sidebar navigation.

**Where:** All tab content containers in `index.html`.

**Example:**
```html
<div id="tab-dashboard" class="tab-content active" role="tabpanel" aria-label="dashboard">
```

### 3. ARIA-Live Regions

**What:** Dynamic content containers marked with `aria-live="polite"` so screen readers announce updates.

**Where:**
- Toast container: `role="status" aria-live="polite" aria-atomic="true"`
- KPI value elements: `.sub-kpi-val` with `aria-live="polite"`

### 4. Keyboard Navigation for Action Cards

**What:** Quick action cards (Bill Analyzer, Roof Analysis, ROI Calculator, AI Assistant, Rewards) now support keyboard interaction.

**Implementation:**
- Added `tabindex="0"` and `role="button"` to all `.action-card` elements
- Added keyboard handler in `ui-utils.js` that triggers click on Enter/Space

### 5. Focus Visibility

**What:** All interactive elements now have consistent focus-visible outlines.

**Elements:** notification button, location button, hero buttons, action buttons, sidebar promo button, readiness button, subsidy button, performance button, AI analyze button, calculator button.

**CSS:**
```css
.action-card:focus-visible,
.notification-btn:focus-visible,
/* ... all interactive elements ... */
{
  outline: 2px solid var(--color-blue);
  outline-offset: 2px;
}
```

### 6. Reduced Motion Support

**What:** Two-layer support for users who prefer reduced motion.

**CSS Layer:** `tokens.css` zeros all duration tokens when `prefers-reduced-motion: reduce` is active. `motion.css` disables all animation utility classes.

**JavaScript Layer:** `ui-utils.js` provides `prefersReducedMotion()` helper. `animateValueSafe()` respects the setting for number counters. Card hover transforms are disabled via CSS media query.

---

## Interaction Patterns

### Card Hover Lift

**Standard:** `translateY(-2px)` with `--duration-fast` (150ms) and `--ease-standard`.

**Applies to:** `.card-base`, `.analytics-card`, `.footer-card`, `.sidebar-promo-card`

**Reduced motion:** Transform disabled via `@media (prefers-reduced-motion: reduce)`.

### Button Press Feedback

**Standard:** `scale(0.97)` on `:active` with `--duration-fast` (150ms).

**Applies to:** All primary and secondary buttons (action-btn, hero-btn, sidebar-promo-btn, footer-banner-btn, subsidy-btn).

### Focus Ring

**Standard:** `2px solid var(--color-blue)` with `2px` offset on `:focus-visible`.

**Applies to:** All interactive elements (buttons, links, inputs, action cards, profile pill).

### Drawer Transitions

**Standard:** `var(--shadow-modal)` for all drawer content shadows. Drawer entrance uses `gs-slide-in-right` keyframe.

---

## Motion Guidelines

### When to Use Each Duration

| Duration | When |
|----------|------|
| `--duration-instant` (80ms) | Color changes, opacity micro-fades |
| `--duration-fast` (150ms) | Hover transitions, focus rings, button press |
| `--duration-normal` (250ms) | Standard transitions, tab switches |
| `--duration-slow` (400ms) | Panel transitions, drawer slides |
| `--duration-xslow` (600ms) | Page-level transitions |
| `--duration-reveal` (800ms) | Content reveal animations |

### Easing Curve Guide

| Curve | When |
|-------|------|
| `--ease-standard` | Default for most transitions |
| `--ease-decelerate` | Elements entering the viewport |
| `--ease-accelerate` | Elements leaving the viewport |
| `--ease-bounce` | Success confirmations, playful pops |
| `--ease-spring` | Gentle spring-back effects |

### Reduced Motion Behavior

When `prefers-reduced-motion: reduce` is active:
- All `--duration-*` tokens → 0ms
- All animation utility classes → disabled
- Card hover transforms → disabled
- Button press transforms → disabled
- JavaScript counters → snap to final value

---

## Responsive Behavior

### Breakpoint Guide

| Width | Grid | Sidebar | Padding |
|-------|------|---------|---------|
| 1440px+ | 4-column | Expanded | 32px |
| 1280px | 3-column | Expanded | 24px |
| 1024px | 2-column | Collapsed | 20px |
| 768px | 1-column | Overlay drawer | 16px |
| 480px | 1-column | Overlay drawer | 12px |

### Grid Collapse Order

1. 4-column → 3-column (1280px)
2. 3-column → 2-column (1024px)
3. 2-column → 1-column (768px)
4. Sidebar becomes overlay drawer (768px)

### Overflow Handling

- Dashboard cards: `min-width: 0` on grid children at 1024px
- Header text: `overflow-wrap: break-word` at 640px
- KPI grid: `gap: var(--space-2)` at 480px for consistent spacing

---

## Loading / Empty / Error State Patterns

### Loading State

**API:** `ComponentState.showLoading(container, message)`

Renders a spinner with optional message inside the target container.

**Use when:** Fetching data from API, before content is available.

### Error State

**API:** `ComponentState.showError(container, message, retryCallback)`

Renders an error icon, message, and optional retry button.

**Use when:** API call fails, data is unavailable.

### Empty State

**API:** `ComponentState.showEmpty(container, message)`

Renders a "no data" message with an appropriate icon.

**Use when:** Data returns successfully but is empty.

### Success State

**API:** `ComponentState.showSuccess(container, message)`

Renders a success confirmation with checkmark.

**Use when:** Action completed successfully (e.g., after file upload).

---

## Keyboard Navigation Guide

| Key | Behavior |
|-----|----------|
| **Tab** | Navigate forward through interactive elements |
| **Shift+Tab** | Navigate backward |
| **Enter** | Activate focused button/link/card |
| **Space** | Activate focused button/card |
| **Escape** | Close open drawers/modals/dropdowns |
| **Arrow keys** | Navigate within dropdown menus |

### Focus Order

1. Skip-link (hidden, appears on first Tab)
2. Sidebar navigation items
3. Header elements (location, notifications, profile)
4. Main content cards and buttons
5. Footer elements

---

## Remaining UX Technical Debt

| # | Item | Impact | Priority |
|---|------|--------|----------|
| 1 | 35+ button classes with overlapping styles | CSS bloat, maintenance burden | Medium |
| 2 | 37 responsive breakpoints in dashboard.css | Fragile, hard to maintain | Low |
| 3 | 60+ inline `onclick` handlers in index.html | Accessibility, maintainability | Medium |
| 4 | ArcGIS map integration has no loading state | UX gap | Low |
| 5 | No unit or integration tests | Quality risk | High |
| 6 | ChartManager not used for ~8 chart instances | Inconsistent patterns | Low |
| 7 | No dynamic document title on tab switch | UX, accessibility | Low |
| 8 | `app.js` monolithic (15,570 lines) | Engineering maintainability | High |
| 9 | Consumer app duplicates style directory | Tech debt | Medium |
| 10 | No light mode support | UX limitation | Low |
