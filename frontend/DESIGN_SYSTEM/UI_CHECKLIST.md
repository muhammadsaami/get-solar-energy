# UI_CHECKLIST — Implementation & Review Checklist

Checklist for implementing new UI in the GET SOLAR ENERGY app, derived from the actual design system in `frontend/consumer-app/src/`. Every rule references a source file.

---

## 1. Tokens First

- [ ] All colors use tokens (`tokens.css`) — never hardcoded hex.
- [ ] All spacing uses `--space-*` (4px grid, `tokens.css:186-198`) — never arbitrary px.
- [ ] All radii use `--radius-*` (`tokens.css:121-128`).
- [ ] All typography sizes/weights/line-heights use `--font-size-*`, `--font-weight-*`, `--line-height-*` (`tokens.css:207-236`).
- [ ] All motion uses `--duration-*`, `--ease-*`, `--transition-*` (`tokens.css:251-274`).
- [ ] All z-index uses `--z-*` (`tokens.css:287-297`).

## 2. Typography

- [ ] Font family is `Outfit` only (`--font-family`, `tokens.css:204`; `typography.css:11-17`).
- [ ] Use semantic text classes `.text-h1`…`.text-h6`, `.text-body*`, `.text-caption`, `.text-label`, `.text-overline`, `.text-metric*`, `.text-btn*` (`typography.css:31-157`).
- [ ] Use `.text-truncate` / `.text-clamp-2` / `.text-clamp-3` for overflow (`typography.css:231-249`).
- [ ] Do NOT introduce `'Inter'` or `'Courier New'` — both are font-family violations (`DESIGN_AUDIT.md`).

## 3. Buttons

- [ ] Use `.btn` + variant/size classes from `buttons.css` (`.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-outline`, `.btn-outline-orange`, `.btn-danger`, `.btn-success`, `.btn-glass`; sizes `.btn-xs/sm/lg/xl`).
- [ ] Do NOT create ad-hoc button classes in page CSS (`buttons.css:6-8`).
- [ ] Use `.btn.loading` and `:disabled` states (`buttons.css:259-284`).

## 4. Cards / Glass

- [ ] Use card classes from `cards.css` (`.card`, `.card-glass`, `.card-metric`, `.card-dashboard`, `.card-feature`, `.card-insight`, `.card-stat`).
- [ ] Use glass classes from `glass.css` (`.glass-card`, `.glass-light`, `.glass-heavy`, `.glass-ultra`).
- [ ] Do not implement glass independently (`glass.css:5-8`).

## 5. Forms

- [ ] Use `forms.css` structure: `.form-group` > `.form-label` (+`.form-label-required`) > `.form-input/.form-select/.form-textarea`.
- [ ] Use state classes `.error` / `.success` (`forms.css:192-205`).
- [ ] Use message classes `.form-error-msg`, `.form-helper-text`, `.form-success-msg` (`forms.css:208-227`).
- [ ] Use `.form-checkbox`, `.form-radio`, `.form-switch`, `.form-upload` where relevant.

## 6. Tables

- [ ] Wrap in `.table-container`; use `.table` + `.table-hover`/`.table-striped`/`.table-compact` as needed (`tables.css`).
- [ ] Use `.table-empty` block for empty states (`tables.css:175-200`), not ad-hoc markup.

## 7. Badges / Tags / Avatars

- [ ] Use `.badge` + semantic variant (`badges.css`): `.badge-success/warning/error/info/neutral/orange/purple`, `.badge-solid-*`, `.badge-sm/lg`.
- [ ] Use `.tag` for removable chips, `.avatar` + sizes for avatars.

## 8. Navigation / Overlays

- [ ] Use `.nav-tabs`/`.nav-tab-pill`, `.nav-breadcrumb`, `.dropdown*`, `.nav-sidebar-item`, `[data-tooltip]`, `.modal*`, `.toast*`, `.drawer*` from `navigation.css`.
- [ ] For new dialogs, reuse `ui/DocumentDrawer.jsx` (the only focus-trapped drawer) — `src/components/ui/DocumentDrawer.jsx`.

## 9. Loading

- [ ] Use `.skeleton*`, `.loading-spinner`, `.loading-dots`, `.progress-*` from `loading.css`.
- [ ] Use shared `LayoutSkeleton` (`src/components/layout/LayoutSkeleton.tsx`) for route loading.

## 10. Icons

- [ ] Use `react-icons/md` (`Md`) only — the single installed icon family (`ICONS.md`).
- [ ] Do not add a second icon package (`lucide-react` is **not present** in the repository).
- [ ] Avoid hand-rolling inline `<svg>` for general icons.

## 11. Layout

- [ ] Use `.layout-*` templates from `layout.css` (dashboard, auth, split, analytics, settings, wizard, master-detail).
- [ ] Respect layout tokens: `--sidebar-width`, `--header-height`, `--content-*`, `--content-max-width` (`tokens.css:303-309`).

## 12. Motion

- [ ] Use `gs-*` keyframes + `.animate-*` classes from `motion.css`.
- [ ] Use `.delay-*` and `.stagger-children` for sequencing.
- [ ] Never define raw timing values in page CSS (`motion.css:6-7`).

## 13. Accessibility

- [ ] Visible focus ring (`:focus-visible`, `utilities.css:63-67`).
- [ ] `.sr-only` for screen-reader text.
- [ ] Form labels with `for`/`id`.
- [ ] Reduced-motion respected (handled globally by `motion.css`).
- [ ] Dialogs have `role="dialog"` + `aria-modal` + focus management (see `DocumentDrawer.jsx`).

## 14. Rules of Thumb

- [ ] Feature CSS files use the feature prefix (`earnings-*`, `wo-*`, `cert-*`, `profile-*`, `kb-*`, `job-*`, `ai-*`, `vendor-*`, `ew-*`) — see `CSS_ARCHITECTURE.md`.
- [ ] Prefer shared CSS classes over inline `style={{}}` — the app currently has ~3,977 inline styles vs ~3,226 class usages; reduce inline styles (`DESIGN_AUDIT.md`).
- [ ] Run `npx tsc --noEmit` and the repo lint before finishing.
