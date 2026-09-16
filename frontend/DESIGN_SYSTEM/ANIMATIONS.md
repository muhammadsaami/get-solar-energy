# ANIMATIONS — Motion System

Motion tokens are defined in `frontend/consumer-app/src/styles/tokens.css`. Keyframes and animation utilities are in `frontend/consumer-app/src/styles/motion.css`. Line references are to those files.

---

## 1. Rules (from source)

`motion.css` states: *"Every animation must reference tokens from tokens.css. Never define raw timing values in page CSS."* (`motion.css:6-7`).

---

## 2. Duration Tokens (`tokens.css:251-258`)

| Token | Value | Purpose |
|---|---|---|
| `--duration-instant` | 80ms | |
| `--duration-fast` | 150ms | Hover/press feedback |
| `--duration-normal` | 250ms | Standard transitions |
| `--duration-slow` | 400ms | Panel/entrance motion |
| `--duration-xslow` | 600ms | |
| `--duration-reveal` | 800ms | Scroll reveals |
| `--duration-cinematic` | 1200ms | Cinematic pans |
| `--duration-camera` | 3000ms | Camera moves |

## 3. Easing Curves (`tokens.css:261-268`)

| Token | Curve | Purpose |
|---|---|---|
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Material standard |
| `--ease-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | Entering elements |
| `--ease-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | Leaving elements |
| `--ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1)` | Emphasized motion |
| `--ease-cinematic` | `cubic-bezier(0.2, 0.9, 0.3, 1)` | Cinematic pan |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Springy pop |
| `--ease-spring` | `cubic-bezier(0.25, 0.8, 0.25, 1)` | Gentle spring |
| `--ease-linear` | `linear` | Spinners |

## 4. Composite Transitions (`tokens.css:271-274`)

`--transition-fast: 150ms ...`, `--transition-normal: 250ms ...`, `--transition-slow: 400ms ...`, `--transition-sidebar: 300ms ...`.

Cinematic aliases (`tokens.css:277-281`): `--time-micro: 300ms`, `--time-reveal: 800ms`, `--time-transition: 1200ms`, `--time-camera: 3000ms`, `--ease-linear-scroll: linear`.

---

## 5. Keyframes (`motion.css:16-151`)

All keyframes are prefixed `gs-`:

| Keyframe | Line | Purpose |
|---|---|---|
| `gs-fade-in` | 16 | Universal enter |
| `gs-slide-up` | 22 | Card/section entrance |
| `gs-slide-down` | 28 | Dropdown/drawer entrance |
| `gs-slide-left` | 34 | Right-panel entrance |
| `gs-slide-right` | 40 | Left-panel entrance |
| `gs-scale-in` | 46 | Modal/popover entrance |
| `gs-scale-out` | 52 | Modal dismiss |
| `gs-slide-left-exit` | 58 | Right-panel dismiss |
| `gs-fade-out` | 64 | Overlay dismiss |
| `gs-float` | 70 | Idle hover |
| `gs-pulse` | 77 | Status dot / live indicator |
| `gs-pulse-ring` | 83 | Alert / active status |
| `gs-shimmer` | 89 | Skeleton |
| `gs-spin` | 95 | Spinner |
| `gs-bounce` | 101 | Success confirmation |
| `gs-shake` | 108 | Error / validation |
| `gs-glow-pulse` | 117 | CTA glow (orange) |
| `gs-glow-pulse-blue` | 123 | Accent glow (blue) |
| `gs-count-reveal` | 129 | Count-up trigger |
| `gs-drift` | 135 | Ambient particles |
| `gs-scan` | 143 | Tech scan line |
| `gs-progress` | 149 | Progress bar fill |

---

## 6. Animation Utility Classes (`motion.css:157-228`)

`.animate-fade-in`, `.animate-slide-up`, `.animate-slide-down`, `.animate-slide-left`, `.animate-slide-right`, `.animate-scale-in`, `.animate-slide-left-exit`, `.animate-fade-out`, `.animate-float`, `.animate-pulse`, `.animate-spin`, `.animate-bounce`, `.animate-shake`.

**Delay utilities** (210-219): `.delay-50/100/150/200/300/400/500/600/700/800`.

**Transition utilities** (222-229): `.transition-fast/normal/slow/colors/opacity/transform/shadow/none`.

**Hover lift** (232-245): `.hover-lift`, `.hover-lift-sm`.

**Stagger** (249-257): `.stagger-children` animates children sequentially (delays 0–400ms).

---

## 7. Reduced Motion (`motion.css:260-278`)

Under `@media (prefers-reduced-motion: reduce)`, all `.animate-*`, `.stagger-children > *`, and transforms are disabled (`animation: none !important; transition: none !important; opacity: 1 !important;`).

`tokens.css:390-407` also zeroes all duration/transition tokens under reduced motion.

---

## 8. Usage Notes

- Skeleton shimmer uses `gs-shimmer` via `.skeleton` (`loading.css:9-19`).
- Spinner uses `gs-spin` via `.loading-spinner` (`loading.css:110`).
- Modal/drawer/toast/dropdown animation is defined in their components in `navigation.css` (e.g. `.dropdown-menu` uses `gs-slide-down`, `.modal` uses `gs-scale-in`, `.drawer` uses `gs-slide-left`).
- Progress uses `gs-progress` (`loading.css:163`).
