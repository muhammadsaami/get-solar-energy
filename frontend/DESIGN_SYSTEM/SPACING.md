# SPACING — Spacing, Radius, Layout Tokens & Utilities

Spacing/radius/layout tokens are defined in `frontend/consumer-app/src/styles/tokens.css`. Utility classes are defined in `frontend/consumer-app/src/styles/utilities.css`. Line numbers refer to those files.

---

## 1. Spacing Scale — 4px Grid (`tokens.css:186-198`)

The scale is on a 4px base grid:

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |
| `--space-20` | 80px |
| `--space-24` | 96px |
| `--space-32` | 128px |

**Rule:** all spacing must come from this token scale. No arbitrary px margins/padding.

---

## 2. Radius Scale (`tokens.css:121-128`)

| Token | Value |
|---|---|
| `--radius-xs` | 4px |
| `--radius-sm` | 8px |
| `--radius-md` | 12px |
| `--radius-lg` | 16px |
| `--radius-xl` | 20px |
| `--radius-2xl` | 28px |
| `--radius-3xl` | 40px |
| `--radius-full` | 9999px |

---

## 3. Layout Tokens (`tokens.css:303-309`)

| Token | Value | Purpose |
|---|---|---|
| `--sidebar-width` | 280px | Expanded sidebar width |
| `--sidebar-collapsed-width` | 72px | Collapsed sidebar width |
| `--header-height` | 80px | App top bar height |
| `--content-max-width` | 1440px | Max content width |
| `--content-padding-x` | 32px | Horizontal content padding |
| `--content-padding-y` | 32px | Vertical content padding |
| `--section-max-width` | 1200px | Max section width |

---

## 4. Spacing Utilities (`utilities.css`)

### Gap utilities (lines 131-139)

`.gap-1`, `.gap-2`, `.gap-3`, `.gap-4`, `.gap-5`, `.gap-6`, `.gap-8`, `.gap-10`, `.gap-12`.

### Padding utilities (lines 182-199)

`.p-0` … `.p-12`, plus `.px-4/6/8` and `.py-4/6/8`.

### Margin utilities (lines 202-209)

`.m-auto`, `.mx-auto`, `.mt-4/6/8`, `.mb-4/6/8`.

### Border radius utilities (lines 172-178)

`.rounded-xs`, `.rounded-sm`, `.rounded-md`, `.rounded-lg`, `.rounded-xl`, `.rounded-2xl`, `.rounded-full`.

---

## 5. Flex / Grid / Width Utilities (summary)

- **Flex direction:** `.flex-col`, `.flex-row`, `.flex-wrap`, `.flex-nowrap` (103-107)
- **Flex grow/shrink:** `.flex-1`, `.flex-auto`, `.flex-none`, `.flex-shrink-0`, `.flex-grow-1` (108-111)
- **Alignment:** `.items-*` (113-117), `.justify-*` (119-123), `.self-*` (125-128)
- **Grid columns:** `.grid-cols-1/2/3/4/6`, `.col-span-2/3`, `.col-span-full` (142-149)
- **Width/height:** `.w-full`, `.w-auto`, `.h-full`, `.h-screen`, `.min-h-screen` (152-156)
- **Display:** `.block`, `.inline-block`, `.inline`, `.hidden`, `.invisible`, `.flex`, `.inline-flex`, `.grid`, `.contents` (91-100)

---

## 6. Background / Border / Divider Utilities (summary)

- **Backgrounds:** `.bg-primary`, `.bg-secondary`, `.bg-card`, `.bg-surface`, `.bg-input` (212-216); color-tinted `.bg-orange/.bg-blue/.bg-green/.bg-red/.bg-yellow/.bg-purple` (218-223).
- **Borders:** `.border`, `.border-top`, `.border-bottom`, `.border-none` (226-229).
- **Dividers:** `.divider` (horizontal), `.divider-v` (vertical) (231-241).

---

## 7. Z-Index Utility Classes (`utilities.css:263-266`)

`.z-base`, `.z-raised`, `.z-overlay`, `.z-modal` map to the `--z-*` tokens in `tokens.css:287-297`.

---

## 8. Layout Usage Notes

- The page shell (`AppShell`) uses `--sidebar-width`, `--header-height`, and the `--content-*` tokens; see `LAYOUT.md`.
- Enterprise layer adjusts `.main-panel` padding to `0 28px 28px` (`enterprise.css:14-16`).
- Components in `cards.css`, `forms.css`, `tables.css`, etc. consume `--space-*` tokens for their internal rhythm.
