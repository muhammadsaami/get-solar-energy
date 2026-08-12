# ACCESSIBILITY — Accessibility Conventions

This document records the accessibility features actually implemented in the production app (`frontend/consumer-app/src`). Where a recommended pattern is **not** present in the repository, that is stated explicitly.

---

## 1. Implemented Accessibility Features

### Focus-visible ring (`src/styles/utilities.css:63-67`)

```
:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}
```

Buttons also define their own `:focus-visible` ring (`buttons.css:45-48`), and the enterprise layer adds ring+glow for all button class families (`enterprise.css:256-281`). Form inputs get a focus ring via `box-shadow` (`forms.css:60-64`).

### Skip link (`src/styles/utilities.css:281-296`)

`.skip-link` is defined (offscreen until focused; `top: 0` on focus) with `.sr-only` (`utilities.css:269-279`) for visually-hidden content.

> Note: the skip-link **class exists** in `utilities.css`; whether it is rendered in every layout is not verified here — see `DESIGN_AUDIT.md`.

### Screen-reader-only utility (`utilities.css:269`)

`.sr-only` — 1px clip technique.

### Reduced motion (`src/styles/motion.css:260-278`, `tokens.css:390-407`)

All `.animate-*` classes, `.stagger-children > *`, and transitions are disabled under `prefers-reduced-motion: reduce`; all duration/transition tokens are zeroed.

### Dialog / drawer semantics (`src/components/ui/DocumentDrawer.jsx`)

- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` (lines 60-62)
- Escape-to-close and Tab focus trap (lines 7-30)
- Scroll lock via `document.body.style.overflow = 'hidden'` (line 34)
- Focus moves into the drawer on open and returns to the previously-focused element on close (lines 32-50)
- Overlay is `aria-hidden="true"` (line 56)
- Close button has `aria-label="Close drawer"` (line 75)

> This is the only drawer with a focus trap. The 10 other feature drawer shells (`PayoutDrawer`, `WorkOrderDrawer`, `JobDrawer`, `CertificateDrawer`, `ProfileDrawer`, `TroubleshootingDrawer`, `ProjectDrawer`, `ModelDetailDrawer`, `AuditDetailDrawer`, `MobileDrawer`) do not reuse this component — see `COMPONENT_INVENTORY.md` / `DESIGN_AUDIT.md`.

### Form labels (`src/styles/forms.css`)

`.form-label` (17), required indicator `.form-label-required::after` `content: '*'` (28), helper/error/success messages (`.form-helper-text`, `.form-error-msg`, `.form-success-msg`).

---

## 2. Contrast

The text scale (`tokens.css:96-102`) is designed for a dark theme:
- `--text-primary #f0f8ff` on `--bg-primary #06111f` — high contrast.
- `--text-secondary #9fb3c8`, `--text-muted #5a7a96` on dark backgrounds.

> WCAG contrast ratios for every token pair have not been computed in this documentation; verify per-context during implementation.

---

## 3. Not Present in the Current Repository

- A global skip-link rendered on every route/layout (the `.skip-link` CSS class exists in `utilities.css:281-296`).
- An automated a11y test suite. (A test setup exists at `src/test/` and `src/components/ui/__tests__/Button.test.tsx`.)
- ARIA live-region announcements for toasts — the toast markup is in `navigation.css:353-392`; the `ToastHost` (`src/components/auth/ToastHost.tsx`) renders toasts via `stores/notificationStore.ts` (zustand), but no `aria-live` attribute was verified.

---

## 4. Conventions

- Use `.sr-only` for text meant for screen readers only.
- Use `.focus-visible`-compatible focus rings (blue `--color-blue`).
- Use `.form-label` with `for`/`id` association and `.form-label-required` for required fields.
- Respect `prefers-reduced-motion` — the motion system handles this automatically (`motion.css`).
- Reuse `ui/DocumentDrawer.jsx` (the only focus-trapped dialog) for new drawer/dialog needs.
