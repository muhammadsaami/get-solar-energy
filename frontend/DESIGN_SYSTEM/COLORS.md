# COLORS — Design Tokens

All values below are defined in `frontend/consumer-app/src/styles/tokens.css` (the single source of truth, v1.0.0). Line numbers refer to that file.

---

## 1. Brand Colors

### Primary brand — Orange (`tokens.css:18-25`)

| Token | Value | Purpose |
|---|---|---|
| `--color-orange` | `#ff8a1d` | Primary CTA, highlights, revenue indicators |
| `--color-orange-hover` | `#e6760f` | Hover state |
| `--color-orange-active` | `#cc6800` | Active/pressed state |
| `--color-orange-glow` | `rgba(255, 138, 29, 0.18)` | Glow effect |
| `--color-orange-glow-strong` | `rgba(255, 138, 29, 0.32)` | Strong glow |
| `--color-orange-border` | `rgba(255, 138, 29, 0.35)` | Border |
| `--color-orange-surface` | `rgba(255, 138, 29, 0.08)` | Tinted surface |
| `--color-orange-rgb` | `255, 138, 29` | RGB triplet for `rgba(var(--color-orange-rgb), n)` |

### Accent — Blue (`tokens.css:28-35`)

| Token | Value |
|---|---|
| `--color-blue` | `#17a8e5` |
| `--color-blue-hover` | `#138ebf` |
| `--color-blue-active` | `#0f79a8` |
| `--color-blue-glow` | `rgba(23, 168, 229, 0.16)` |
| `--color-blue-glow-strong` | `rgba(23, 168, 229, 0.32)` |
| `--color-blue-border` | `rgba(23, 168, 229, 0.35)` |
| `--color-blue-surface` | `rgba(23, 168, 229, 0.08)` |
| `--color-blue-rgb` | `23, 168, 229` |

### Success — Green (`tokens.css:38-44`)

| Token | Value |
|---|---|
| `--color-green` | `#36d399` |
| `--color-green-hover` | `#28b880` |
| `--color-green-active` | `#1f9e6d` |
| `--color-green-glow` | `rgba(54, 211, 153, 0.16)` |
| `--color-green-border` | `rgba(54, 211, 153, 0.35)` |
| `--color-green-surface` | `rgba(54, 211, 153, 0.08)` |
| `--color-green-rgb` | `54, 211, 153` |

### Danger — Red (`tokens.css:47-52`)

| Token | Value |
|---|---|
| `--color-red` | `#f43f5e` |
| `--color-red-hover` | `#dc2d4c` |
| `--color-red-glow` | `rgba(244, 63, 94, 0.16)` |
| `--color-red-border` | `rgba(244, 63, 94, 0.35)` |
| `--color-red-surface` | `rgba(244, 63, 94, 0.08)` |
| `--color-red-rgb` | `244, 63, 94` |

### Warning — Yellow (`tokens.css:55-60`)

| Token | Value |
|---|---|
| `--color-yellow` | `#fbbf24` |
| `--color-yellow-hover` | `#d97706` |
| `--color-yellow-glow` | `rgba(251, 191, 36, 0.16)` |
| `--color-yellow-border` | `rgba(251, 191, 36, 0.35)` |
| `--color-yellow-surface` | `rgba(251, 191, 36, 0.08)` |
| `--color-yellow-rgb` | `251, 191, 36` |

### Premium / AI — Purple (`tokens.css:63-68`)

| Token | Value |
|---|---|
| `--color-purple` | `#7c5dfa` |
| `--color-purple-hover` | `#6644e8` |
| `--color-purple-glow` | `rgba(124, 93, 250, 0.16)` |
| `--color-purple-border` | `rgba(124, 93, 250, 0.35)` |
| `--color-purple-surface` | `rgba(124, 93, 250, 0.08)` |
| `--color-purple-rgb` | `124, 93, 250` |

### Legacy alias (`tokens.css:71`)

| Token | Value | Note |
|---|---|---|
| `--color-cyan` | `#17a8e5` | "Legacy alias (landing page compat)" |

### Module accents (`tokens.css:369-383`)

| Token | Value | Note |
|---|---|---|
| `--color-violet` | `#8b5cf6` | "Violet — Project Tracking, premium features" |
| `--color-violet-hover` | `#7c3aed` | |
| `--color-violet-glow` | `rgba(139, 92, 246, 0.16)` | |
| `--color-violet-border` | `rgba(139, 92, 246, 0.35)` | |
| `--color-violet-surface` | `rgba(139, 92, 246, 0.08)` | |
| `--color-violet-rgb` | `139, 92, 246` | |
| `--color-teal` | `#14b8a6` | "Teal — Planning Workspace, success metrics" |
| `--color-teal-hover` | `#0d9488` | |
| `--color-teal-glow` | `rgba(20, 184, 166, 0.16)` | |
| `--color-teal-border` | `rgba(20, 184, 166, 0.35)` | |
| `--color-teal-surface` | `rgba(20, 184, 166, 0.08)` | |
| `--color-teal-rgb` | `20, 184, 166` | |

---

## 2. Background Scale (`tokens.css:78-90`)

### Opaque

| Token | Value | Purpose |
|---|---|---|
| `--bg-deep` | `#060F1F` | "Deepest dark — cinematic bg" |
| `--bg-primary` | `#06111f` | "Page body background" |
| `--bg-secondary` | `#081827` | "Section backgrounds, scene alternates" |
| `--bg-tertiary` | `#0a1e32` | "Tertiary panels" |
| `--bg-card-solid` | `#0D2136` | "Solid card background" |

### Translucent (used with `backdrop-filter`)

| Token | Value | Purpose |
|---|---|---|
| `--bg-card` | `rgba(8, 24, 42, 0.82)` | "Standard glass card" |
| `--bg-card-hover` | `rgba(13, 33, 54, 0.95)` | "Card hover state" |
| `--bg-surface` | `rgba(14, 34, 53, 0.76)` | "Surface panel" |
| `--bg-input` | `rgba(10, 28, 50, 0.85)` | "Form input fields" |
| `--bg-overlay` | `rgba(6, 15, 31, 0.80)` | "Modal overlays" |
| `--bg-tooltip` | `rgba(10, 24, 40, 0.96)` | "Tooltip background" |

---

## 3. Text Scale (`tokens.css:96-102`)

| Token | Value | Purpose |
|---|---|---|
| `--text-primary` | `#f0f8ff` | "Main readable text" |
| `--text-secondary` | `#9fb3c8` | "Supporting text, labels" |
| `--text-muted` | `#5a7a96` | "Placeholder, disabled text" |
| `--text-disabled` | `#3d5a72` | "Truly disabled state" |
| `--text-inverse` | `#060F1F` | "Text on light/orange buttons" |
| `--text-link` | `var(--color-blue)` | Link color |
| `--text-link-hover` | `var(--color-blue-hover)` | Link hover |

---

## 4. Border Scale (`tokens.css:108-115`)

| Token | Value | Purpose |
|---|---|---|
| `--border-subtle` | `rgba(255, 255, 255, 0.04)` | "Barely-there separators" |
| `--border-color` | `rgba(255, 255, 255, 0.08)` | "Default borders" |
| `--border-color-light` | `rgba(255, 255, 255, 0.05)` | "Landing compat alias" |
| `--border-strong` | `rgba(255, 255, 255, 0.15)` | "Emphasized borders" |
| `--border-glow` | `rgba(23, 168, 229, 0.35)` | "Blue glow border" |
| `--border-orange-glow` | `rgba(255, 138, 29, 0.35)` | "Orange glow border" |
| `--border-green-glow` | `rgba(54, 211, 153, 0.35)` | "Green glow border" |
| `--border-red-glow` | `rgba(244, 63, 94, 0.35)` | "Error border" |

---

## 5. Glass System (`tokens.css:153-166`)

| Token | Value |
|---|---|
| `--glass-bg` | `rgba(8, 24, 42, 0.72)` |
| `--glass-bg-light` | `rgba(14, 34, 53, 0.60)` |
| `--glass-bg-heavy` | `rgba(6, 17, 31, 0.88)` |
| `--glass-bg-ultra` | `rgba(4, 12, 24, 0.94)` |
| `--glass-border` | `rgba(255, 255, 255, 0.08)` |
| `--glass-border-active` | `rgba(23, 168, 229, 0.35)` |
| `--glass-border-orange` | `rgba(255, 138, 29, 0.35)` |
| `--glass-highlight` | `rgba(255, 255, 255, 0.04)` |
| `--glass-highlight-strong` | `rgba(255, 255, 255, 0.08)` |
| `--glass-shadow` | `0 24px 80px rgba(0, 0, 0, 0.28)` |

---

## 6. Chart Color Palette (`tokens.css:315-324`)

| Token | Color | Value |
|---|---|---|
| `--chart-1` | Blue | `#17a8e5` |
| `--chart-2` | Orange | `#ff8a1d` |
| `--chart-3` | Green | `#36d399` |
| `--chart-4` | Purple | `#7c5dfa` |
| `--chart-5` | Red | `#f43f5e` |
| `--chart-6` | Yellow | `#fbbf24` |
| `--chart-7` | Cyan | `#06b6d4` |
| `--chart-8` | Pink | `#ec4899` |
| `--chart-9` | Lime | `#84cc16` |
| `--chart-10` | Amber | `#f97316` |

---

## 7. Backward Compatibility Aliases (`tokens.css:326-364`)

These map legacy token names used by existing page CSS to the canonical system. The file header warns: **"DO NOT use these names in new code."**

- `--accent-cyan`, `--accent-cyan-glow`, `--accent-orange`, `--accent-orange-glow`, `--accent-green`, `--accent-green-glow`, `--accent-purple` → resolve to `--color-*` equivalents (landing.css compat).
- `--bg-deep-blue` → `--bg-secondary`; `--card-shadow` → `--shadow-card-blue`; `--hover-shadow` → `--shadow-hover`.
- `--accent-blue`, `--accent-blue-hover`, `--accent-blue-glow`, `--accent-blue-glow-strong`, `--accent-blue-rgb`, `--accent-orange-hover`, `--accent-orange-glow-strong`, `--accent-orange-rgb`, `--text-navy`, `--border-radius-sm/md/lg` (style.css dashboard compat).
- `--ease` → `--ease-spring`; `--radius-xl`/`--radius-2xl` re-declared (auth.css compat).

---

## 8. Usage Roles

| Intent | Use token |
|---|---|
| Primary CTA | `--color-orange` (gradient in `.btn-primary`) |
| Secondary action | `--color-blue` (`.btn-secondary`) |
| Success / positive | `--color-green` |
| Warning | `--color-yellow` |
| Error / destructive | `--color-red` |
| Premium / AI | `--color-purple` or `--color-violet` |
| Data viz | `--chart-1` … `--chart-10` |

---

## 9. Known Gaps & Hardcoded Values

Recorded in detail in `DESIGN_AUDIT.md`. Highlights:

- `--color-white` — **Not present in the current repository.** References to `#ffffff` are hardcoded (e.g. `typography.css:183` `.text-white`, `buttons.css:140`).
- `--color-text-secondary` — **Not present in the current repository.** The canonical token is `--text-secondary`.
- Hardcoded hex colors exist in `landing.css`, `dashboard.css`, `auth.css`, and feature CSS; see `DESIGN_AUDIT.md` for the full list.
- Vendor portal defines `--vendor-*` tokens in `src/vendor/styles/vendor-theme.css:5-49`, all resolving from canonical tokens.
