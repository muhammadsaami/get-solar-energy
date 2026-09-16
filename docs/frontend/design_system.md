# GET Solar Energy — Design System

> Version: 1.0.0 | Updated: Phase 13.5B

## Architecture Overview

```
design-system.css  ← Entry point, imports all modules in dependency order
  ├── tokens.css        — Design tokens (colors, spacing, motion, shadows)
  ├── typography.css    — Font faces, type scale
  ├── utilities.css     — Reset, display/flex/grid helpers, a11y utilities
  ├── glass.css         — Glassmorphism design language
  ├── motion.css        — Keyframes, animation utilities, transition helpers
  ├── buttons.css       — Button components
  ├── cards.css         — Card components
  ├── forms.css         — Form inputs, selects, validation
  ├── tables.css        — Table and data grid styles
  ├── badges.css        — Badges, status indicators, avatars
  ├── navigation.css    — Sidebar, top nav, breadcrumbs, toasts, modals
  ├── loading.css       — Skeleton loaders, spinners, progress bars
  └── layout.css        — Page-level layout templates
```

**Rule:** Never hardcode colors, spacing, motion, or typography in page CSS. Use tokens everywhere.

---

## Token System

All design values are defined as CSS custom properties in `tokens.css` (`:root`).

### Usage Pattern

```css
/* ✅ Correct — uses token */
.card {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

/* ❌ Incorrect — hardcoded values */
.card {
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
}
```

### Backward Compatibility

`tokens.css` includes alias tokens (e.g., `--accent-blue`, `--bg-deep`) for legacy page styles. New code should use the canonical token names, not aliases.

---

## Spacing Scale

All spacing values follow a **4px grid**.

| Token | Value | Use |
|-------|-------|-----|
| `--space-1` | 4px | Tight internal spacing, icon gaps |
| `--space-2` | 8px | Small padding, inline gaps |
| `--space-3` | 12px | Compact section padding |
| `--space-4` | 16px | Standard card/section padding |
| `--space-5` | 20px | Sidebar padding |
| `--space-6` | 24px | Content padding, larger gaps |
| `--space-8` | 32px | Page padding, section margins |
| `--space-10` | 40px | Large section gaps |
| `--space-12` | 48px | Extra large gaps |
| `--space-16` | 64px | Page section breaks |
| `--space-20` | 80px | Header height reference |
| `--space-24` | 96px | Large page sections |
| `--space-32` | 128px | Full-viewport gaps |

**Guideline:** Consistent 4px-based spacing creates visual rhythm. Never use arbitrary values like 13px, 17px, or 23px.

---

## Typography Scale

Font family: `'Outfit', sans-serif` (headings, display text)

| Token | Size | Use |
|-------|------|-----|
| `--font-size-2xs` | 10px | Micro text, fine print |
| `--font-size-xs` | 11px | Labels, badges |
| `--font-size-sm` | 13px | Helper text, captions |
| `--font-size-base` | 15px | Body text |
| `--font-size-md` | 16px | Standard headings |
| `--font-size-lg` | 18px | Section titles |
| `--font-size-xl` | 20px | Card headings |
| `--font-size-2xl` | 24px | Page section titles |
| `--font-size-3xl` | 30px | Major headings |
| `--font-size-4xl` | 36px | Display headings |
| `--font-size-5xl` | 48px | Hero numbers |
| `--font-size-6xl` | 60px | Large display |
| `--font-size-7xl` | 72px | Extra large display |
| `--font-size-display` | 88px | Hero display |

**Guideline:** Body text must be at least `--font-size-sm` (13px) for readability.

---

## Glass Design Language

The dashboard uses a **glassmorphism** design language for surfaces.

| Token | Use |
|-------|-----|
| `--glass-bg` | Standard glass surface |
| `--glass-bg-light` | Lighter glass for nested elements |
| `--glass-bg-heavy` | Darker glass for overlays |
| `--glass-border` | Subtle border for glass surfaces |
| `--glass-highlight` | Inner glow effect |
| `--blur-glass` | Standard backdrop blur (20px) |
| `--blur-hud` | HUD elements (12px) |

**When to use glass:** Dashboard panels, modals, drawers, cards, navigation.
**When NOT to use glass:** Auth pages, landing hero sections (use solid backgrounds).

---

## Border Radius Scale

| Token | Value | Use |
|-------|-------|-----|
| `--radius-xs` | 4px | Badges, micro elements |
| `--radius-sm` | 8px | Buttons, small cards, inputs |
| `--radius-md` | 12px | Standard cards, panels |
| `--radius-lg` | 16px | Large panels, drawers |
| `--radius-xl` | 20px | Hero cards |
| `--radius-2xl` | 28px | Feature cards |
| `--radius-3xl` | 40px | Pill shapes |
| `--radius-full` | 9999px | Fully circular |

**Guideline:** Card radius should be consistent across all card types. Use `--radius-sm` (8px) for compact cards, `--radius-md` (12px) for standard cards, `--radius-lg` (16px) for large panels.

---

## Shadow Scale

| Token | Value | Use |
|-------|-------|-----|
| `--shadow-xs` | 0 1px 4px | Subtle elevation |
| `--shadow-sm` | 0 2px 8px | Small cards, dropdowns |
| `--shadow-card` | 0 24px 80px | Card hover effect |
| `--shadow-card-blue` | 0 16px 40px | Blue-accented cards |
| `--shadow-hover` | 0 24px 80px | Card hover state |
| `--shadow-float` | 0 32px 80px | Floating elements |
| `--shadow-modal` | 0 40px 100px | Modals, drawers |
| `--shadow-inset` | inset 0 1px 0 | Inner highlight |
| `--shadow-glow-blue` | 0 0 20px | Blue glow effect |
| `--shadow-glow-orange` | 0 0 20px | Orange glow effect |

**Guideline:** Never use raw `box-shadow` values. Always use the shadow token scale.

---

## Color System

### Brand Colors

| Token | Hex | Use |
|-------|-----|-----|
| `--color-orange` | #ff8a1d | CTAs, highlights, revenue |
| `--color-blue` | #17a8e5 | Accents, links, data |
| `--color-green` | #36d399 | Success, savings |
| `--color-red` | #f43f5e | Danger, errors, alerts |
| `--color-purple` | #9f5aff | AI features |
| `--color-yellow` | #fbbf24 | Warnings, pending |

Each color family includes: `-hover`, `-active`, `-glow`, `-border`, `-surface`, `-rgb` variants.

### Background Scale

| Token | Use |
|-------|-----|
| `--bg-deep` | Deepest background |
| `--bg-primary` | Primary background |
| `--bg-secondary` | Secondary panels |
| `--bg-tertiary` | Tertiary surfaces |
| `--bg-card-solid` | Solid card background |
| `--bg-card` | Translucent card |
| `--bg-overlay` | Overlay backdrop |

### Text Scale

| Token | Use |
|-------|-----|
| `--text-primary` | Primary text |
| `--text-secondary` | Secondary text |
| `--text-muted` | Muted text |
| `--text-disabled` | Disabled text |
| `--text-inverse` | Text on colored backgrounds |
| `--text-link` | Link text |

---

## Motion System

### Durations

| Token | Value | Use |
|-------|-------|-----|
| `--duration-instant` | 80ms | Micro-interactions, color changes |
| `--duration-fast` | 150ms | Hover transitions, focus rings |
| `--duration-normal` | 250ms | Standard transitions |
| `--duration-slow` | 400ms | Panel transitions, drawer slides |
| `--duration-xslow` | 600ms | Page transitions |
| `--duration-reveal` | 800ms | Content reveals |
| `--duration-cinematic` | 1200ms | Cinematic sequences |

### Easing Curves

| Token | Value | Use |
|-------|-------|-----|
| `--ease-standard` | cubic-bezier(0.4, 0, 0.2, 1) | Default easing |
| `--ease-decelerate` | cubic-bezier(0, 0, 0.2, 1) | Elements entering view |
| `--ease-accelerate` | cubic-bezier(0.4, 0, 1, 1) | Elements leaving view |
| `--ease-emphasized` | cubic-bezier(0.2, 0, 0, 1) | Emphasized motion |
| `--ease-bounce` | cubic-bezier(0.34, 1.56, 0.64, 1) | Springy pop, success feedback |
| `--ease-spring` | cubic-bezier(0.25, 0.8, 0.25, 1) | Gentle spring |
| `--ease-linear` | linear | Progress bars, loading |

### Composite Shortcuts

| Token | Value | Use |
|-------|-------|-----|
| `--transition-fast` | 150ms standard | Hover, focus |
| `--transition-normal` | 250ms standard | Standard transitions |
| `--transition-slow` | 400ms standard | Panel transitions |
| `--transition-sidebar` | 300ms standard | Sidebar width |

**Guideline:** All animations should respect `prefers-reduced-motion: reduce` — durations are zeroed via the token override.

---

## Component Standards

### Cards

- **Standard card** (`--radius-md`): 16px padding, hover lift `translateY(-2px)` with `--duration-fast`
- **Action card** (`--radius-md`): flex column, 180px min-height, button at bottom
- **KPI card** (`--radius-sm`): Compact, 12px padding, centered content

### Buttons

- **Primary**: `--color-orange` background, 12px padding
- **Secondary**: outlined, 12px padding
- **Ghost**: transparent background, text color
- All buttons: `--radius-sm`, `--duration-fast` transitions, `:active` scale(0.97)

### Forms

- **Input height**: 44px
- **Border**: 1px solid `--border-color`
- **Focus ring**: 2px solid `--color-blue`, 3px offset
- **Validation**: green border for valid, red for invalid

---

## Responsive Rules

### Breakpoints

| Width | Behavior |
|-------|----------|
| 1440px+ | Full dashboard layout, 4-column grid |
| 1024px-1440px | 3-column grid, reduced padding |
| 768px-1024px | 2-column grid, sidebar overlay |
| 480px-768px | Single column, minimal padding |
| <480px | Single column, compact spacing |

**Guideline:** Use `min-width` for mobile-first responsive design. Use consistent breakpoints across all page CSS.

---

## Z-Index Scale

| Token | Value | Use |
|-------|-------|-----|
| `--z-base` | 0 | Default stacking |
| `--z-raised` | 10 | Elevated elements |
| `--z-dropdown` | 50 | Dropdowns |
| `--z-sticky` | 100 | Sticky headers, sidebar |
| `--z-overlay` | 200 | Overlay backdrops |
| `--z-modal` | 300 | Modals |
| `--z-toast` | 400 | Toast notifications |
| `--z-cursor` | 500 | Cursor effects |

**Guideline:** Never hardcode z-index values. Use the token scale.
