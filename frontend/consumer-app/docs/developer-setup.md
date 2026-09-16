# Developer Setup

## Prerequisites

- Node.js 22+ (LTS)
- npm 10+
- Python 3.14+ (for backend)
- Git

## Installation

```bash
# Frontend
cd frontend/consumer-app
npm install

# Backend (separate terminal)
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

## Running Locally

```bash
# Terminal 1 — Backend
cd backend
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend/consumer-app
npm run dev
```

The frontend starts at `http://localhost:5173` and proxies `/api/*` to `http://localhost:8000`.

## Environment Variables

Copy `.env.example` to `.env` in `frontend/consumer-app/`:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | Backend API URL (relative path uses dev proxy) |
| `VITE_ENABLE_MOCKS` | `true` | Enable mock data responses |
| `VITE_APP_VERSION` | `0.1.0` | Displayed version string |

For production, set these in the deployment environment.

## Proxy Configuration

The Vite dev server proxies `/api/*` to the FastAPI backend. Configuration in `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
},
```

This means during development, requests to `/api/login` go to `http://localhost:8000/api/login`.

## Available Commands

```bash
npm run dev         # Start dev server with HMR
npm run build       # Production build
npm run preview     # Preview production build
npm run test        # Run all tests
npm run test:watch  # Run tests in watch mode
npm run lint        # ESLint
npm run typecheck   # TypeScript check
```

## Troubleshooting

### Build fails with "Failed to parse source"

Files with JSX must use `.jsx` or `.tsx` extension. Rename the file.

### HMR not working

Check that the file extension is `.tsx`/`.jsx` for components. Vite HMR only works for supported extensions.

### API calls returning 404

Check the backend is running on port 8000. The Vite proxy forwards `/api/*` to `http://localhost:8000/api/*`.

### TypeScript errors in .js files

Set `checkJs: false` in `tsconfig.json` (already configured). `.js` files are included for compilation but not type-checked.

### Tests failing with "Cannot find module"

Run `npx vitest --clearCache` to clear stale cache. Ensure `vitest.config.ts` has the same alias configuration as `vite.config.ts`.

## Production Build

```bash
npm run build
```

Output goes to `dist/`. The FastAPI backend serves this directory at `/app/*`, `/login`, and `/signup` routes.
