# Architecture

## Overview

The GET Solar Consumer App is a single-page application (SPA) built with React 19, TypeScript, and Vite. It coexists with a legacy vanilla JS frontend served by the same FastAPI backend. Migration is gradual — tab by tab.

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | React 19 | Latest stable, concurrent features |
| Language | TypeScript (strict) | Type safety, prevent runtime errors. Gradual migration via `allowJs: true` |
| Bundler | Vite 6 + SWC | 10x faster HMR than CRA, native TS, tree-shaking |
| State (Client) | Zustand 5 | ~2KB, subscriber-based (no cascading re-renders), built-in persist middleware |
| State (Server) | TanStack Query 5 | Automatic caching, refetching, pagination, optimistic updates |
| Routing | React Router v7 | Nested routes, lazy loading, route guards |
| HTTP | Axios + interceptors | JWT injection, refresh queue, error normalization |
| Styling | CSS Modules + Design System | Scoped component styles + shared CSS custom properties |
| Charts | Recharts | Declarative, React-native, responsive |
| Testing | Vitest + Testing Library + MSW | Fast, modern, realistic integration tests |

## State Management Model

```
┌──────────────────────────────────────────────┐
│              Zustand (Client State)            │
│  authStore  │  uiStore  │  notificationStore  │
│  (persist)  │  (persist) │                     │
└──────────────────┬───────────────────────────┘
                   │
┌──────────────────▼───────────────────────────┐
│           TanStack Query (Server State)        │
│  useQuery('/api/projects')                     │
│  useMutation('/api/crm/tasks')                 │
│  Automatic cache invalidation                  │
└──────────────────────────────────────────────┘
```

- **Client state**: UI toggles, auth tokens, theme preference — goes in Zustand, persisted to localStorage
- **Server state**: API responses — goes in TanStack Query (auto-cached, auto-refetched)
- **Migration path**: New features use Zustand stores directly. Existing Contexts remain unchanged until migrated

## CSS Strategy

- **Design tokens**: `frontend/styles/tokens.css` — single source of truth for colors, spacing, typography, glassmorphism, motion
- **Global styles**: Imported via `design-system.css` entry point
- **Component styles**: CSS Modules (`Component.module.css`) — scoped by default, no specificity conflicts
- **Utility classes**: `cn()` helper combining `clsx` + `tailwind-merge`

## Route Hierarchy

```
Public:
  /login           → Login page
  /signup          → Signup page
  /reset-password  → Reset password

Protected (auth required):
  /app/home        → Customer portal home
  /app/journey     → 13-stage solar journey
  /app/planning/*  → Bills, Roof, Proposal
  /app/vendor/*    → Project tracking
  /app/crm/*       → CRM (future)

  ... more routes added per phase
```

Route guards: `RouteGuard` (auth check) → `AdminGuard` (role check) → lazy-loaded page.

## Coexistence with Legacy

The FastAPI backend serves both the legacy HTML frontend and the React SPA:

- `/` → `landing.html` (legacy)
- `/frontend/*` → legacy static files
- `/app/*`, `/login`, `/signup` → React SPA (`index.html`)
- `/api/*` → FastAPI routers (shared, unchanged)

Auth is shared via localStorage keys `access_token` and `user`.
