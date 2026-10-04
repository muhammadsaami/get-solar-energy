# get-solar-energy
India's Solar AI Platform

## Architecture & Technology Stack

The GET Solar Energy platform is structured as a modern decoupled architecture:

- **Frontend (`frontend/consumer-app`)**:
  - React 19 Single Page Application (SPA)
  - Vite 6 + TypeScript (strict)
  - State management via Zustand 5 and TanStack Query 5
  - React Router v7 for routing and role guards
  - Component styling using CSS Modules and Design Tokens
- **Backend (`backend/`)**:
  - FastAPI (Python 3.14)
  - Pydantic v2 data models and validation
  - JWT-based authentication & RBAC (Customer, Engineer, Admin)
  - Clean API routes under `/api/*` and static file uploads under `/uploads/*`
- **Database & Services**:
  - PostgreSQL-oriented data persistence
  - Machine learning and AI services (MLOps pipelines, bill normalization, Gemini-powered assistants)

*Note: The legacy vanilla HTML/JavaScript frontend has been decommissioned and removed. All user and administrative workflows are served by the React SPA.*

## Local Development Workflow

### Prerequisites
- Python 3.11+ (Python 3.14 recommended)
- Node.js 18+ (Node.js 20+ recommended) and npm

### 1. Backend Service
```bash
# From repository root
py -3.14 -m uvicorn backend.main:app --reload --port 8000
```
API root will be available at `http://localhost:8000/`.

### 2. Frontend Development Server
```bash
# Navigate to consumer app directory
cd frontend/consumer-app
npm install
npm run dev
```
The React development server runs at `http://localhost:5173/`.

### 3. Production Frontend Build
```bash
cd frontend/consumer-app
npm run build
```
Build output is emitted to `frontend/consumer-app/dist/`.

### 4. Running Test Suites
```bash
# Backend Test Suite (from repository root)
py -3.14 -m pytest -q

# Frontend Test Suite (from frontend/consumer-app)
cd frontend/consumer-app
npm test
```

## Deployment Architecture

In production:
- Static assets from `frontend/consumer-app/dist/` are served by the web server (e.g., Hostinger / Nginx) with SPA fallback routing to `index.html`.
- Requests matching `/api/*` and `/uploads/*` are reverse-proxied to the FastAPI backend service.
- The FastAPI service connects to PostgreSQL and relevant AI services.

---

## Phase 16.0B — Satellite Roof Analysis (Beta)

### Architecture
- **Backend**: `POST /api/analyze-roof` accepts optional `source` param (`"camera"` | `"satellite"`). Returns `satellite_analysis` flag and Beta disclaimer in `analysis_notes` when `source="satellite"`.
- **Frontend**: Two-mode UI within roof analysis tab:
  - **Camera Upload** (default, unchanged): drag-drop photo + dimensions → API
  - **Satellite Analysis** (Beta): Leaflet map with OSM/ESRI tiles, Nominatim address search, html2canvas map capture → same API with `source=satellite`
- **Validation Framework** (deferred to Phase 16.1): `prototype/` directory contains standalone KPI evaluator (`validate_satellite.py`), label validator (`validate_labels.py`), and report generator (`generate_report.py`).

### Key Files
| File | Role |
|---|---|
| `backend/roof.py` | Analyzes roof images via Gemini 2.5 Flash |
| `frontend/consumer-app/src/pages/RoofAnalyzer.tsx` | React Roof Analyzer page |
| `frontend/consumer-app/src/hooks/useRoofAnalyzer.ts` | Leaflet map, address search, capture, mode management hook |
| `frontend/consumer-app/src/styles/satellite-roof.css` | Map container, toggle, beta badge, banner styles |
| `prototype/*` | Deferred validation framework |

### Conditions
- Satellite results are marked as **BETA** in both UI and API response.
- Analysis notes include disclaimer: *"Results are estimated from satellite imagery and should be confirmed through an on-site survey."*
- No production accuracy certification until Phase 16.1 validation is complete.
