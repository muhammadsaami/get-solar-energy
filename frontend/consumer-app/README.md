# GET Solar Energy — Consumer App

React 19 + TypeScript + Vite frontend for the GET Solar Energy platform.

## Quick Start

```bash
npm install
npm run dev
```

The app starts at `http://localhost:5173` and proxies API requests to `http://localhost:8000`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type check (`tsc --noEmit`) |

## Tech Stack

- **React 19** — UI framework
- **TypeScript** — Type safety (gradually migrating from JS)
- **Vite + SWC** — Build tool (fast HMR, tree-shaking)
- **React Router v7** — Client-side routing
- **Zustand** — State management (auth, UI, notifications)
- **TanStack Query** — Server state (caching, refetching, pagination)
- **Axios** — HTTP client with JWT interceptor
- **Recharts** — Data visualization
- **CSS Modules + Design System** — Styling

## Architecture

See `docs/architecture.md` for the full architecture documentation.

## Project Structure

```
src/
├── components/    # UI, layout, feedback components
├── config/        # Environment, routes, query client
├── constants/     # App constants (journey stages, etc.)
├── contexts/      # React Contexts (migrating to Zustand)
├── features/      # Domain modules (auth, billing, roof, etc.)
├── hooks/         # Shared custom hooks
├── models/        # Data models (Bill, Roof, Proposal)
├── pages/         # Route-level page components
├── routes/        # Route guards, route config
├── services/      # API client, service modules, mocks
├── stores/        # Zustand stores
├── styles/        # CSS (points to design system)
├── test/          # Test setup, MSW mocks, test utilities
├── types/         # TypeScript type definitions
└── utils/         # Utility functions (cn, formatters, etc.)
```

## Environment Variables

Copy `.env.example` to `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | Backend API URL |
| `VITE_ENABLE_MOCKS` | `true` | Enable mock data |
| `VITE_APP_VERSION` | `0.1.0` | App version |

## Migration Status

| Phase | Status | Description |
|-------|--------|-------------|
| 17.0B | ✅ Complete | React foundation: Vite, TypeScript, Zustand, TanStack Query, routing, testing, docs |
| 17.1+ | Pending | Feature tab migrations |
