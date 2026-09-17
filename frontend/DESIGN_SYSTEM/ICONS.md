# ICONS — Icon Strategy

This document records the icon system actually present in the production React app (`frontend/consumer-app/src`).

---

## 1. Icon Library

**`react-icons` is the only icon package installed.** Verified in `frontend/consumer-app/package.json`: `react-icons@5.6.0`.

**`lucide-react` is NOT installed.** **Not present in the current repository.** Any future icon work should use `react-icons`.

---

## 2. Usage Facts (verified by grep of `src/`)

| Metric | Value |
|---|---|
| Files importing `react-icons/md` | 90 |
| Icon token occurrences (`Md...`) | 449 |
| Distinct `Md...` icons referenced | 88 |

All icons in the app come from a **single family: `Md` (Material Design)** via `react-icons/md`. No other family (e.g. `Fi` Feather, `Fa` FontAwesome) is imported.

Representative import (source files):

```
import { MdDashboard, MdSolarPower, MdWbSunny } from 'react-icons/md'
```

---

## 3. Naming Convention

- Icons are imported as named `MdXxx` components.
- Rendered as JSX: `<MdDashboard size={18} />`.
- Sizing is applied inline or via container CSS; the shared `.btn-with-icon svg` rule sizes icons to `18px` (`buttons.css:249-254`), and `.nav-sidebar-item svg` sizes to `18px` (`navigation.css:230-235`).

---

## 4. Inline SVG

**93 source files contain inline `<svg>` markup.** These are hand-rolled SVGs (e.g. `src/components/dashboard/DashboardSprites.tsx` and other sprite/logotype components) that exist outside the `react-icons` system. They are inconsistent with the icon library strategy and are recorded as candidates for consolidation in `DESIGN_AUDIT.md`.

---

## 5. Rules (based on observed implementation)

1. Use `react-icons/md` (`Md`) components — the only installed family.
2. Do not introduce a second icon package (`lucide-react`, etc.) — **Not present in the current repository.** The single-family policy keeps bundles small and look consistent.
3. Do not hand-roll inline `<svg>` for general-purpose icons; prefer `Md` components. (Inline SVG currently present in 93 files — see `DESIGN_AUDIT.md`.)
4. Size icons via the `size` prop or via the shared CSS icon-size rules (`18px` convention for nav/buttons).

---

## 6. Known Gaps

- No custom brand icon set (sprite) is centrally managed; `DashboardSprites.tsx` and similar files duplicate inline SVG that could be `Md` components.
- See `DESIGN_AUDIT.md` for the inline-SVG inventory and consolidation priority.
