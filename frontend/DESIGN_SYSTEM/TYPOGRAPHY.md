# TYPOGRAPHY — Type System

All rules below are implemented in `frontend/consumer-app/src/styles/typography.css` unless noted. Line numbers refer to that file.

---

## 1. Font Family — Outfit Only

**Outfit is the ONLY approved typeface for the platform** (`typography.css:11-17`). Weights 300–900 are loaded via Google Fonts:

```
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
```

The canonical family token is `--font-family: 'Outfit', sans-serif;` (`tokens.css:204`).

A global reset applies Outfit to every element:

```
*, *::before, *::after { font-family: var(--font-family); }   // typography.css:20-24
```

**Font-family violations:** `'Inter'` and `'Courier New'` appear in the codebase (e.g. `src/vendor/styles/vendor-theme.css:59`, and Courier New in legacy dashboard/landing styles). These are recorded in `DESIGN_AUDIT.md`.

---

## 2. Type Scale Tokens (`tokens.css:207-220`)

| Token | Size | Usage |
|---|---|---|
| `--font-size-2xs` | 10px | |
| `--font-size-xs` | 11px | caption, overline |
| `--font-size-sm` | 13px | body-sm, label |
| `--font-size-base` | 15px | body |
| `--font-size-md` | 16px | button text |
| `--font-size-lg` | 18px | h6, body-lg |
| `--font-size-xl` | 20px | h5 |
| `--font-size-2xl` | 24px | h4, metric-sm |
| `--font-size-3xl` | 30px | h3, metric |
| `--font-size-4xl` | 36px | metric-lg |
| `--font-size-5xl` | 48px | h2, metric-xl |
| `--font-size-6xl` | 60px | h1 (≥1280px) |
| `--font-size-7xl` | 72px | h1 (base) |
| `--font-size-display` | 88px | display |

### Font weight tokens (`tokens.css:223-229`)

`--font-weight-light: 300`, `regular: 400`, `medium: 500`, `semibold: 600`, `bold: 700`, `extrabold: 800`, `black: 900`.

### Line height tokens (`tokens.css:232-236`)

`--line-height-tight: 1.1`, `snug: 1.3`, `normal: 1.5`, `relaxed: 1.65`, `loose: 1.8`.

### Letter spacing tokens (`tokens.css:239-244`)

`--letter-spacing-tight: -0.03em`, `snug: -0.01em`, `normal: 0em`, `wide: 0.02em`, `wider: 0.05em`, `widest: 0.12em`.

---

## 3. Semantic Text Utilities (`typography.css:31-157`)

| Class | Font size | Weight | Line height | Letter spacing |
|---|---|---|---|---|
| `.text-display` | `--font-size-display` | black | tight | tight |
| `.text-h1` | `--font-size-7xl` | black | tight | tight |
| `.text-h2` | `--font-size-5xl` | extrabold | snug | snug |
| `.text-h3` | `--font-size-3xl` | bold | snug | — |
| `.text-h4` | `--font-size-2xl` | semibold | normal | — |
| `.text-h5` | `--font-size-xl` | semibold | normal | — |
| `.text-h6` | `--font-size-lg` | semibold | normal | — |
| `.text-body-lg` | `--font-size-lg` | regular | relaxed | — |
| `.text-body` | `--font-size-base` | regular | relaxed | — |
| `.text-body-sm` | `--font-size-sm` | regular | normal | — |
| `.text-caption` | `--font-size-xs` | medium | normal | wide |
| `.text-label` | `--font-size-sm` | semibold | tight | wide (uppercase) |
| `.text-overline` | `--font-size-xs` | bold | tight | widest (uppercase) |
| `.text-metric-xl` | `--font-size-5xl` | black | 1 | tight |
| `.text-metric-lg` | `--font-size-4xl` | black | 1 | tight |
| `.text-metric` | `--font-size-3xl` | extrabold | 1 | — |
| `.text-metric-sm` | `--font-size-2xl` | bold | 1 | — |
| `.text-btn` | `--font-size-md` | semibold | 1 | wide |
| `.text-btn-sm` | `--font-size-sm` | semibold | 1 | wide |

---

## 4. Font Weight Utilities (`typography.css:160-166`)

`.font-light`, `.font-regular`, `.font-medium`, `.font-semibold`, `.font-bold`, `.font-extrabold`, `.font-black`.

## 5. Text Alignment Utilities (`typography.css:169-171`)

`.text-left`, `.text-center`, `.text-right`.

## 6. Text Color Utilities (`typography.css:174-184`)

`.text-primary-color`, `.text-secondary-color`, `.text-muted-color`, `.text-orange`, `.text-blue`, `.text-green`, `.text-red`, `.text-yellow`, `.text-purple`, `.text-white`, `.text-inverse-color`.

> Note: `.text-white { color: #ffffff; }` is a hardcoded value — no `--color-white` token exists (`DESIGN_AUDIT.md`).

## 7. Gradient Text Treatments (`typography.css:210-228`)

- `.text-gradient-orange` — `linear-gradient(135deg, var(--color-orange) 0%, #ffb84d 100%)` with background-clip text.
- `.text-gradient-blue` — `linear-gradient(135deg, var(--color-blue) 0%, #5dd5ff 100%)` with background-clip text.
- `.highlight-orange`, `.highlight-blue`, `.highlight-green` — flat color highlight spans (used in landing headings).

## 8. Truncation Utilities (`typography.css:231-249`)

- `.text-truncate` — single-line ellipsis.
- `.text-clamp-2` — 2-line clamp.
- `.text-clamp-3` — 3-line clamp.

---

## 9. Responsive Heading Scale (`typography.css:187-205`)

| Breakpoint | `.text-display` | `.text-h1` | `.text-h2` | `.text-h3` |
|---|---|---|---|---|
| base | 88px (display) | 72px | 48px | 30px |
| `max-width: 1280px` | 72px | 60px | 36px | 30px |
| `max-width: 768px` | 48px | 36px | 30px | 24px |
| `max-width: 480px` | 36px | 30px | 24px | 20px |

---

## 10. Usage Guidance (from source)

- Use the semantic `.text-*` classes rather than ad-hoc font sizes.
- Metric/KPI values use `.text-metric*` variants (see also `.kpi-value` in `enterprise.css:88-99`).
- Buttons use `.text-btn` / `.text-btn-sm` (button font handled by `buttons.css`).
