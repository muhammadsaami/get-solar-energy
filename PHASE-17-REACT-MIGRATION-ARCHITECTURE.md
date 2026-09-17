# Phase 17.0 — React Migration Architecture

> **Author**: OpenCode AI  
> **Date**: July 2026  
> **Status**: Architecture Proposal — Zero React Code  
> **Scope**: Migration strategy, component hierarchy, state model, routing, API layer, coexistence plan  
> **Non-goals**: Writing React code, running `npm install`, creating components, modifying consumer-app/

---

## 1. Migration Principles

| Principle | Rationale |
|-----------|-----------|
| **Coexistence First** | Legacy and React must live side by side until every feature is migrated. No big-bang rewrite. |
| **Tab-by-Tab Migration** | Each dashboard tab is an independent migration unit. Start with the simplest, least-coupled tabs. |
| **Shared Auth Layer** | Both apps read/write the same `localStorage` keys (`token`, `user`) so switching between them is seamless. |
| **Single Source of Truth for CSS** | The design system (`design-system.css` + 13 sub-modules) lives in `frontend/styles/`. React `consumer-app/src/styles/` copies are removed — React app imports the originals via build tool. |
| **API Compatibility** | The FastAPI backend is already shared. No changes needed. |
| **No Feature Expansion** | Migration ports existing functionality identically. Redesign, new features, or visual changes belong in a later phase. |

---

## 2. Current State Assessment

### 2.1 Legacy (`frontend/`)
- **Bundler**: None (vanilla HTML/CSS/JS)
- **Routing**: Page-based (`dashboard.html` is a SPA via DOM tab switching: `switchTab()` function)
- **State**: Global `GSE.*` namespace + IIFE closures + `localStorage`
- **API**: `safeFetch()` custom wrapper with hardcoded `Authorization` header
- **Charts**: Chart.js (bundled in `chart.min.js`)
- **Icons**: Inline SVG sprite in `dashboard.html`
- **Module lifecycle**: `GSE.ModuleRegistry` — `register`, `init`, `mount`, `unmount`, `destroy`
- **Module instances**: `SatelliteRoof`, `ProjectTracking`, `Planning`, `Journey`
- **Auth**: Mock JWT in `localStorage` (`token`, `user`)
- **Tabs**: ~20 tab content divs in a single HTML file (~7500 lines)

### 2.2 Consumer App (`consumer-app/`) — Partial React Migration
- **Bundler**: CRA (react-scripts 5.0.1)
- **React**: 19.x
- **Routing**: react-router-dom 7.x — `BrowserRouter` with nested routes
- **State**: 4 React Contexts (`AuthContext`, `JourneyContext`, `PlanningContext`, `UIContext`)
- **API**: Axios instance with JWT interceptor (`api.js`)
- **Charts**: Recharts 3.x
- **Icons**: react-icons (Material Design)
- **What works**: Login, Signup, Layout (AppShell/Sidebar/Topbar), Home, Journey Timeline, Bills, Roof, Proposal, Project Tracking (full kanban/table/drawer/analytics)
- **What's locked/placeholder**: Installation (3 routes), Ownership (4 routes), Support (3 routes), Account (2 routes), plus 6 stub pages
- **CSS**: Duplicated design system (14 files in `consumer-app/src/styles/`)

### 2.3 Gap Analysis

| Feature Legacy | In Legacy? | In React? | Migration Priority |
|----------------|-----------|-----------|-------------------|
| Auth (login/signup) | ✅ | ✅ (working) | Already done |
| Dashboard Hero + KPI Charts | ✅ | ❌ | **P1** |
| Bill Analyzer | ✅ | ❌ (stub) | **P2** |
| ROI Calculator | ✅ | ❌ (stub) | **P2** |
| Rewards Dashboard | ✅ | ❌ | **P3** |
| AI Advisor Chat | ✅ | ❌ (stub) | **P3** |
| Satellite Roof Analysis | ✅ | ❌ | **P4** |
| CRM Dashboard | ✅ | ❌ | **P4** |
| Admin Dashboard | ✅ | ❌ | **P5** |
| Audit & Monitoring | ✅ | ❌ | **P5** |
| Business Intelligence | ✅ | ❌ | **P5** |
| Enterprise AI | ✅ | ❌ | **P5** |
| MLOps Dashboard | ✅ | ❌ | **P5** |
| AMC Workspace | ✅ | ❌ | **P5** |
| Site Survey | ✅ | ❌ | **P5** |
| Settings | ✅ | ❌ | **P6** |
| Landing Page | ✅ | ❌ | **P7** (not part of dashboard) |

---

## 3. Migration Strategy

### 3.1 Coexistence Model

```
User Browser
     │
     ├── https://example.com/ ─────────► landing.html (legacy, untouched)
     │
     ├── https://example.com/login ────► consumer-app/login.html (React build)
     ├── https://example.com/signup ───► consumer-app/signup.html (React build)
     ├── https://example.com/app/* ────► consumer-app/index.html (React SPA)
     │
     └── https://example.com/dashboard ──► frontend/dashboard.html (legacy)
              ↕ (sidebar link toggle)
         https://example.com/app/* ──────► consumer-app/index.html (React SPA)
```

**Mechanism**: A shared proxy route in `backend/main.py` inspects the URL path. If it matches a React route prefix (`/login`, `/signup`, `/app/`, `/app/*`), it serves `consumer-app/build/index.html`. Otherwise it serves legacy files from `frontend/`.

### 3.2 Cutover Order (Tab-by-Tab)

Each tab's React page is built inside `consumer-app/src/pages/`. When a tab is ready, the legacy `dashboard.html` sidebar link is updated to point to the React app's route (e.g., `href="/app/bill-analyzer"`) instead of the hashless tab switch. The user clicks it, leaves the legacy SPA, and enters the React SPA at that route. **Auth token is shared** via localStorage.

| Phase | Tab | Effort | Risk | Dependencies |
|-------|-----|--------|------|-------------|
| **17.1** | Dashboard Hero + KPI Charts | Medium | Low | Recharts integration, data.json conversion |
| **17.2** | Bill Analyzer | Medium | Low | Chart.js → Recharts port |
| **17.3** | ROI Calculator | Low | Low | Self-contained form + chart |
| **17.4** | AI Advisor Chat | Medium | Medium | WebSocket or SSE for streaming |
| **17.5** | Satellite Roof Analysis | **High** | **High** | Leaflet + html2canvas + canvas-to-blob |
| **17.6** | CRM Dashboard | **High** | Medium | Complex Kanban + 13 sub-tabs |
| **17.7** | Admin, Audit, BI, MLOps, AMC, Site Survey | **Very High** | Medium | Data-heavy dashboards, many charts |
| **17.8** | Settings | Low | Low | Simple form |
| **17.9** | Landing Page | Low | Low | Static marketing page |

### 3.3 Legacy App Modification Rules

| Rule | Detail |
|------|--------|
| **No new features in legacy** | All new development goes into React |
| **Bug fixes in legacy** | Only critical bugs. Non-critical bugs are fixed in React first, then the tab is cut over. |
| **CSS changes** | Made only in `frontend/styles/`. The React app imports from there via a build alias. |
| **Sidebar updates** | When a tab is React-ready, its `<a>` in `dashboard.html` sidebar gets an `href="/app/<route>"` and a `data-react="true"` attribute. Clicking it calls `window.location.href` instead of `switchTab()`. |

---

## 4. Component Tree (Target State)

```
<App>
  <AuthProvider>
    <JourneyProvider>
      <PlanningProvider>
        <UIProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                <Route index element={<Navigate to="/app/home" />} />
                <Route path="home" element={<Home />} />
                <Route path="journey" element={<Journey />} />

                {/* Planning Workspace */}
                <Route path="planning" element={<PlanningWorkspace />}>
                  <Route path="bills" element={<Bills />} />
                  <Route path="roof" element={<Roof />} />
                  <Route path="proposal" element={<Proposal />} />
                </Route>

                {/* Installation */}
                <Route path="installation" element={<InstallationWorkspace />}>
                  <Route path="progress" element={<InstallationProgress />} />
                  <Route path="quality" element={<QualityAssurance />} />
                  <Route path="grid" element={<GridIntegration />} />
                </Route>

                {/* Ownership */}
                <Route path="ownership" element={<OwnershipWorkspace />}>
                  <Route path="system" element={<SystemStatus />} />
                  <Route path="savings" element={<SavingsTracker />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="documents" element={<Documents />} />
                </Route>

                {/* Support */}
                <Route path="support" element={<SupportWorkspace />}>
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="help" element={<HelpCenter />} />
                  <Route path="referral" element={<Referral />} />
                </Route>

                {/* Account */}
                <Route path="account" element={<AccountWorkspace />}>
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                </Route>

                {/* Legacy Dashboard Pages (migrated tabs live here) */}
                <Route path="dashboard" element={<LegacyDashboard />} />
                <Route path="bill-analyzer" element={<BillAnalyzer />} />
                <Route path="roi-calculator" element={<ROICalculator />} />
                <Route path="roof-analysis" element={<RoofAnalysis />} />
                <Route path="ai-advisor" element={<AIAdvisor />} />

                {/* Vendor Portal */}
                <Route path="vendor">
                  <Route path="project-tracking" element={<ProjectTracking />} />
                </Route>

                {/* Admin Portal */}
                <Route path="admin">
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="audit" element={<AuditMonitoring />} />
                  <Route path="bi" element={<BusinessIntelligence />} />
                  <Route path="mlops" element={<MLOpsDashboard />} />
                </Route>

                {/* CRM */}
                <Route path="crm">
                  <Route index element={<CRMDashboard />} />
                  <Route path="customer/:id" element={<Customer360 />} />
                </Route>

                {/* Operations */}
                <Route path="operations">
                  <Route path="amc" element={<AMCWorkspace />} />
                  <Route path="site-survey" element={<SiteSurvey />} />
                </Route>

                {/* Rewards */}
                <Route path="rewards" element={<RewardsDashboard />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </UIProvider>
      </PlanningProvider>
    </JourneyProvider>
  </AuthProvider>
</App>
```

### 4.1 AppShell Composition

```
<AppShell>
  <Sidebar>
    <SidebarHeader />          {/* Logo + collapse toggle */}
    <SidebarNav>
      <SidebarGroup label="Customer Portal">
        <SidebarLink to="/app/home" icon={HiHome} />
        <SidebarLink to="/app/journey" icon={HiTimeline} />
      </SidebarGroup>
      <SidebarGroup label="Planning">
        <SidebarLink to="/app/planning/bills" icon={HiDocumentText} />
        <SidebarLink to="/app/planning/roof" icon={HiSun} />
        <SidebarLink to="/app/planning/proposal" icon={HiClipboardList} />
      </SidebarGroup>
      <SidebarGroup label="Operations">
        <SidebarLink to="/app/install/progress" icon={HiWrench} />
        <SidebarLink to="/app/ownership/system" icon={HiChartBar} />
        <SidebarLink to="/app/support/help" icon={HiSupport} />
      </SidebarGroup>
      <SidebarGroup label="Dashboards">
        <SidebarLink to="/app/dashboard" icon={HiViewGrid} />
        <SidebarLink to="/app/bill-analyzer" icon={HiDocumentSearch} />
        <SidebarLink to="/app/roi-calculator" icon={HiCalculator} />
        <SidebarLink to="/app/roof-analysis" icon={HiGlobe} />
        <SidebarLink to="/app/ai-advisor" icon={HiChat} />
      </SidebarGroup>
      <SidebarGroup label="Vendor">
        <SidebarLink to="/app/vendor/project-tracking" icon={HiFolderOpen} />
      </SidebarGroup>
      <SidebarGroup label="Admin" adminOnly>
        <SidebarLink to="/app/admin/dashboard" icon={HiShieldCheck} />
        <SidebarLink to="/app/admin/audit" icon={HiClipboardCheck} />
        <SidebarLink to="/app/admin/bi" icon={HiChartPie} />
        <SidebarLink to="/app/admin/mlops" icon={HiCog} />
      </SidebarGroup>
      <SidebarGroup label="CRM">
        <SidebarLink to="/app/crm" icon={HiUserGroup} />
      </SidebarGroup>
      <SidebarGroup label="Rewards">
        <SidebarLink to="/app/rewards" icon={HiGift} />
      </SidebarGroup>
    </SidebarNav>
    <SidebarFooter />          {/* User avatar, logout */}
  </Sidebar>
  <main>
    <Topbar />                 {/* Search, notifications, profile */}
    <Breadcrumbs />
    <Outlet />                 {/* React Router renders matched page here */}
  </main>
</AppShell>
```

---

## 5. State Management Architecture

### 5.1 Context Hierarchy

```
AuthContext (isAuthenticated, user, token, login, logout, isAdmin)
    │
    ├── JourneyContext (currentStage, routeUnlocking, progress)
    ├── PlanningContext (bills[], roofAnalysis, proposal)
    ├── UIContext (sidebarCollapsed, drawerOpen, theme)
    │
    └── [Tab-level Contexts] (created on demand per page)
         ├── BillAnalyzerContext (history[], filters, sort)
         ├── ROIContext (inputs, simulation, results)
         ├── RoofAnalysisContext (mapState, capture, analysis)
         ├── CRMContext (pipeline[], search, selectedCustomer)
         ├── AdminContext (users[], telemetry, logs)
         └── [etc.]
```

### 5.2 Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  React Page  │────►│  Context API  │────►│  Service Layer   │
│  (Component)  │     │  (useReducer) │     │  (Axios + Mock)  │
└─────────────┘     └──────────────┘     └────────┬─────────┘
                                                   │
                                          ┌────────▼─────────┐
                                          │  FastAPI Backend   │
                                          │  (unchanged)       │
                                          └──────────────────┘
```

### 5.3 localStorage Bridge

Both legacy and React read from the same localStorage keys:
- `token` — JWT string
- `user` — JSON: `{ id, name, email, phone, role, city }`
- `solar_estimate_city`, `solar_estimate_bill` — landing page pre-fill

**Rule**: React Context initializes from localStorage on mount, writes back on change. This ensures seamless switching between legacy and React.

### 5.4 Reducer Pattern (per context)

```javascript
// Each context uses useReducer with actions like:
const initialState = { data: [], loading: false, error: null };
const actions = {
  FETCH_START:  'FETCH_START',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_ERROR:  'FETCH_ERROR',
  SET_FILTER:   'SET_FILTER',
  SET_SORT:     'SET_SORT',
  RESET:        'RESET'
};
```

For extremely complex state (CRM with 13 sub-tabs, Admin with live telemetry), evaluate **Zustand** or **Jotai** as a lightweight alternative to Context + useReducer. These libraries avoid the re-render cascading issues of deeply nested Context providers.

---

## 6. API Layer Architecture

### 6.1 Axios Instance (already exists — extend)

```javascript
// consumer-app/src/services/api.js — already exists, augment

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor — attach JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401 refresh
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 6.2 Service Organization

```
consumer-app/src/services/
├── api.js                          # Axios instance + interceptors (exists)
├── auth.service.js                 # POST /login, GET /me (exists)
├── bill.service.js                 # GET /bills, POST /upload (exists)
├── roof.service.js                 # GET /roof, POST /analyze-roof (exists)
├── proposal.service.js             # GET /proposal, POST /approve (exists)
├── journey.service.js              # GET /journey/status (exists)
├── geocoding.service.js            # GET /search?q= (Nominatim proxy)
├── projectTracking.service.js      # CRUD projects (exists, all mock)
├── crm.service.js                  # CRUD leads, pipeline, tasks (NEW)
├── admin.service.js                # GET /users, GET /telemetry (NEW)
├── audit.service.js                # GET /audit/logs (NEW)
├── analytics.service.js            # GET /analytics/* (NEW)
├── mlops.service.js                # GET /mlops/* (NEW)
├── amc.service.js                  # CRUD contracts, visits (NEW)
├── siteSurvey.service.js           # CRUD surveys (NEW)
├── rewards.service.js              # GET /rewards (NEW)
└── aiAdvisor.service.js            # POST /chat (NEW)
```

### 6.3 Mock Strategy

Existing services already have mock fallbacks. For new services, use the same pattern:

```javascript
// Every service has:
export const useMock = (shouldMock) => { _useMock = shouldMock; };
export const getData = async () => {
  if (_useMock) return getMockData();
  return api.get('/endpoint').then(r => r.data);
};
```

This allows frontend development without a running backend. Mock files live in `consumer-app/src/services/mocks/`.

---

## 7. Routing Strategy

### 7.1 Current React Routes (existing)

```
/ → redirect to /login (but should be landing in production)
/login → Login page
/signup → Signup page
/app/home → Home dashboard
/app/journey → Journey timeline
/app/planning/bills → Bill management
/app/planning/roof → Roof analysis
/app/planning/proposal → Proposal review
/app/vendor/project-tracking → Project tracking (vendor)
```

All other `/app/*` routes → locked or placeholder.

### 7.2 Target Route Map (full migration)

```
Public:
  /                               → Landing page (legacy landing.html)
  /login                          → Login (React)
  /signup                         → Signup (React)

Authenticated (inside <AppShell>):
  /app/home                       → Dashboard hero + KPI charts + charts
  /app/journey                    → Customer journey timeline

  /app/planning/bills             → Bill upload + history + analysis
  /app/planning/roof              → Roof analysis (camera + satellite)
  /app/planning/proposal          → Proposal review + approval

  /app/installation/progress      → Installation progress
  /app/installation/quality       → Quality assurance
  /app/installation/grid          → Grid integration

  /app/ownership/system           → System status
  /app/ownership/savings          → Savings tracker
  /app/ownership/reports          → Reports
  /app/ownership/documents        → Documents

  /app/support/notifications      → Notifications center
  /app/support/help               → Help center
  /app/support/referral           → Referral program

  /app/account/profile            → Profile settings
  /app/account/settings           → App settings

  /app/dashboard                  → Legacy dashboard (tab view)
  /app/bill-analyzer              → Bill analyzer
  /app/roi-calculator             → ROI calculator
  /app/roof-analysis              → Satellite roof analysis
  /app/ai-advisor                 → AI advisor chat
  /app/rewards                    → Rewards dashboard

  /app/vendor/project-tracking    → Project tracking

  /app/admin/dashboard            → Admin dashboard
  /app/admin/audit                → Audit & monitoring
  /app/admin/bi                   → Business intelligence
  /app/admin/mlops                → MLOps dashboard

  /app/crm                        → CRM pipeline + Kanban
  /app/crm/customer/:id           → Customer 360° view

  /app/operations/amc             → AMC contract management
  /app/operations/site-survey     → Site survey workspace

Auth (standalone, no AppShell):
  /login                          → Login
  /signup                         → Signup
  /reset-password                 → Password reset
```

---

## 8. Module Migration — Detailed Plan Per Tab

### 8.1 P1: Dashboard Hero + KPI Charts

**Legacy location**: `dashboard.html` tab `#dashboard` + `app.js` `renderDashboardData()`  
**React location**: `consumer-app/src/pages/DashboardHome.jsx`  
**Key considerations**:
- The hero KPI grid displays 8 metrics (total savings, installed capacity, co2 offset, etc.)
- 3 Chart.js charts → Recharts `LineChart`, `BarChart`, `AreaChart`
- Chart data from `data.json` or API `/api/analytics/dashboard`
- AI insights feed is a simple list with badges → trivial React component
- Bill upload card → reuse existing `BillUploader.jsx`
- Solar report uploader → new component

### 8.2 P2: Bill Analyzer

**Legacy location**: `dashboard.html` tab `#bill-analyzer` + `app.js` bill analysis functions  
**React location**: `consumer-app/src/pages/BillAnalyzer.jsx`  
**Key considerations**:
- Upload bill → reuse `BillUploader.jsx`
- Bill history list + status timeline → reuse `BillCard.jsx` + `BillStatusTimeline.jsx`
- Usage chart (Chart.js) → `Recharts LineChart`
- Analysis results card → simple card component

### 8.3 P3: ROI Calculator

**Legacy location**: `dashboard.html` tab `#roi-calculator` + `app.js` ROI functions  
**React location**: `consumer-app/src/pages/ROICalculator.jsx`  
**Key considerations**:
- Self-contained form (system size, tariff, subsidy, etc.) + simulation output
- Trend chart → `Recharts LineChart`
- No external dependencies beyond React + Recharts

### 8.4 P4: AI Advisor Chat

**Legacy location**: `dashboard.html` tab `#ai-advisor` + `app.js` chat functions  
**React location**: `consumer-app/src/pages/AIAdvisor.jsx`  
**Key considerations**:
- Chat UI components: `ChatMessage`, `ChatInput`, `ChatHistory`
- Streaming response via SSE or polling
- Existing `GSE.Services.AIAdvisor` → new `aiAdvisor.service.js`

### 8.5 P5: Satellite Roof Analysis (HIGH RISK)

**Legacy location**: `frontend/js/modules/satellite-roof.js` + `satellite-roof.css`  
**React location**: `consumer-app/src/pages/RoofAnalysis.jsx`  
**Key considerations**:
- Leaflet integration in React:
  - Use `react-leaflet` v5.x (compatible with Leaflet 1.9)
  - Map component: `<MapContainer center={[20.59, 78.96]} zoom={5}>`
  - Tile layers: `L.tileLayer` → React `<TileLayer>` with `useMap()` hook
  - Marker: `<Marker eventHandlers={{ dragend: ... }}>`
  - Address search: Nominatim proxy via `geocoding.service.js`
- html2canvas in React:
  - `import html2canvas from 'html2canvas'` (npm package, not CDN)
  - Capture the map container div
- Step indicator workflow:
  - React state: `{ step: 'search' | 'capture' | 'analyze', location, capturedImage, analysisResult }`
  - Each step is a sub-component: `SearchStep`, `CaptureStep`, `AnalyzeStep`
- State management:
  - `useReducer` or local state in `RoofAnalysis.jsx`
  - No need for a global Context — roof analysis is page-scoped
- Shared analyze button logic:
  - Both camera and satellite modes call `POST /api/analyze-roof` with `source` param
  - Camera upload form already exists in React at `consumer-app/src/pages/Roof.jsx`
  - The satellite mode should be an alternate capture method within the same `Roof` page (or a sibling route `/app/roof-analysis`), not a separate page

**Design Decision**: Either:
- **(Recommended) Option A**: Merge satellite mode into the existing `consumer-app/src/pages/Roof.jsx` page. Add a mode toggle (Camera / Satellite) using React state. Camera uses the existing `BillUploader`-style dropzone. Satellite uses the new Leaflet map. Both feed into the same analysis endpoint and render results in the same `RoofSummaryCard.jsx`.
- **Option B**: Create a separate page at `/app/roof-analysis` for satellite mode only. Camera mode stays in `/app/planning/roof`. This creates user confusion (two roof pages).

**Recommendation**: **Option A** — Extend `Roof.jsx` with mode toggle. This preserves the single-entry-point UX for the user and avoids duplicating the analysis results view.

### 8.6 P6: CRM Dashboard (HIGH EFFORT)

**Legacy location**: `dashboard.html` tab `#crm-dashboard` + `app.js` CRM functions  
**React location**: `consumer-app/src/pages/CRM/` (directory)  
**Sub-components needed**:
- `CRMDashboard.jsx` — Main layout with Kanban + search + filters
- `CRMPipeline.jsx` — Kanban board with drag-and-drop (react-beautiful-dnd or @dnd-kit)
- `CRMLeadTable.jsx` — Sortable, filterable table
- `CRMLeadCard.jsx` — Individual lead card (for Kanban)
- `CRMSearch.jsx` — Advanced search
- `CRMFilterPanel.jsx` — Multi-filter sidebar
- `Customer360.jsx` — 13 sub-tab drawer
- `CustomerOverviewTab.jsx` + 12 sibling tabs (Bills, Roof, Survey, Proposal, Tasks, Meetings, Timeline, Documents, Communications, Installation, Payments, AMC, Analytics, Notes)

**Key considerations**:
- CRM is the most complex tab (~3000 lines of legacy logic)
- Migration effort: ~2-3 weeks for a single developer
- Recommend deferring to Phase 18 unless absolutely required now
- Drag-and-drop kanban requires `@dnd-kit/core` + `@dnd-kit/sortable`

### 8.7 P7-P9: Admin, Audit, BI, MLOps, AMC, Site Survey, Settings

**Legacy location**: Scattered across `dashboard.html` and `app.js`  
**React location**: In individual page files under `consumer-app/src/pages/`  
**Key considerations**:
- These are data-heavy dashboard pages with charts, tables, and filter panels
- Each is medium complexity individually, but collectively very large
- Recommend **deferring all of P7 to a later phase** (18+)
- Focus Phases 17.1-17.6 on the customer-facing and vendor-facing tabs that have the most user impact

### 8.8 Landing Page

**Legacy location**: `frontend/landing.html` + `landing.js` + `landing.css`  
**React location**: `consumer-app/src/pages/Landing.jsx` (or keep as legacy)  
**Key considerations**:
- Landing page is mostly static content with JS-driven animations
- The cinematic gallery, 3D tilt, particle effects, and scroll animations would need significant effort to port
- **Recommendation**: Keep landing page as legacy HTML. It's a marketing page, not part of the dashboard. It can remain vanilla indefinitely.

---

## 9. CSS Strategy

### 9.1 Single Source of Truth

```
frontend/styles/                  ← ALL design system files live here (authoritative)
├── design-system.css             ← @import chain
├── tokens.css
├── ... (13 more files)
├── satellite-roof.css
├── project-tracking.css
├── planning.css
├── journey.css
├── dashboard.css
├── auth.css
├── landing.css

consumer-app/src/styles/          ← REMOVED after migration
```

### 9.2 Import in React

Using CRA's `--use-sass` or a simple CSS import:

```javascript
// consumer-app/src/index.js (or App.js)
import '../../frontend/styles/design-system.css';  // relative path alias
import '../../frontend/styles/dashboard.css';
import '../../frontend/styles/satellite-roof.css';
// ... etc
```

Alternatively, if the paths cause issues, configure a webpack alias:

```javascript
// consumer-app/config-overrides.js (or craco)
module.exports = {
  webpack: {
    alias: {
      '@styles': path.resolve(__dirname, '../frontend/styles')
    }
  }
};
```

### 9.3 Module-Specific CSS in React

For React-specific component styles:

```javascript
// Option A: CSS Modules (recommended)
// consumer-app/src/pages/RoofAnalysis.module.css
.roofContainer { /* ... */ }

// Option B: Styled Components (if already used, but not currently)
// Option C: Plain CSS files imported in component
```

**Recommendation**: Use CSS Modules for component-specific styles. Keep all shared design system tokens in the legacy CSS files.

### 9.4 Theme Toggle

The legacy `data-theme` attribute on `<html>` is toggled by `toggleTheme()` which writes to localStorage. React reads the same localStorage key on mount and applies the same `data-theme` attribute:

```javascript
// UIContext.jsx (augment existing)
const [theme, setTheme] = useState(
  localStorage.getItem('theme') || 'light'
);
useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}, [theme]);
```

---

## 10. Third-Party Library Audit

| Library | Legacy | React | Notes |
|---------|--------|-------|-------|
| Leaflet | CDN 1.9.4 | `react-leaflet` + `leaflet` npm | Must use same version |
| html2canvas | CDN 1.4.1 | `html2canvas` npm | Must use same version |
| Chart.js | Bundled `chart.min.js` | Recharts 3.x | Breaking change — chart configs must be rewritten |
| PDF.js | CDN 2.16.105 (lazy) | `pdfjs-dist` npm | Lazy loaded, low impact |
| react-icons | N/A | Already used | Extend with needed icons |
| react-router-dom | N/A | v7 | Already used |
| axios | N/A | Already used | Already used |
| @dnd-kit | N/A | New dependency | For CRM Kanban drag-and-drop |

### New Dependencies Required

```json
{
  "react-leaflet": "^5.0.0",
  "leaflet": "^1.9.4",
  "@types/leaflet": "^1.9.0",
  "html2canvas": "^1.4.1",
  "@dnd-kit/core": "^6.0.0",
  "@dnd-kit/sortable": "^8.0.0",
  "zustand": "^5.0.0"     // optional, for complex state
}
```

---

## 11. Build & Deployment

### 11.1 Backend Proxy

The FastAPI backend serves both legacy and React:

```python
# backend/main.py (augment existing)

import os
from fastapi.responses import FileResponse

REACT_BUILD = os.path.join(os.path.dirname(__file__), '..', 'consumer-app', 'build')
LEGACY_ROOT = os.path.join(os.path.dirname(__file__), '..', 'frontend')

# Serve React static assets
app.mount("/static/js", StaticFiles(directory=os.path.join(REACT_BUILD, "static", "js")), name="react_js")
app.mount("/static/css", StaticFiles(directory=os.path.join(REACT_BUILD, "static", "css")), name="react_css")
app.mount("/static/media", StaticFiles(directory=os.path.join(REACT_BUILD, "static", "media")), name="react_media")

# Serve React SPA for /app/* routes
@app.get("/app/{path:path}", response_class=FileResponse)
def serve_react_app(path: str):
    return FileResponse(os.path.join(REACT_BUILD, "index.html"))

# Serve legacy frontend for all other routes (already exists)
app.mount("/frontend", StaticFiles(directory=LEGACY_ROOT, html=True), name="legacy")
```

### 11.2 Build Pipeline

```sh
# Development:
cd consumer-app && npm start              # React on :3000, proxies API to :8000
cd backend && uvicorn main:app --reload   # FastAPI on :8000

# Production:
cd consumer-app && npm run build           # Output to consumer-app/build/
cd backend && uvicorn main:app --host 0.0.0.0 --port 80
```

### 11.3 CORS

Already configured in `backend/main.py`. Add the React dev server origin:

```python
origins = [
    "http://localhost:3000",    # React dev server
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    # production domains
]
```

---

## 12. Migration Phasing (Detailed)

### Phase 17.1 — Dashboard Hero + KPI Charts (1 week)

| Task | Files | Dependencies |
|------|-------|-------------|
| Create `DashboardHome.jsx` | `pages/DashboardHome.jsx`, `DashboardHome.css` | Recharts |
| Port KPI grid (8 cards) | `components/planning/KpiCards.jsx` already exists, adapt | None |
| Port Chart.js line/bar/area charts to Recharts | New chart components | Recharts |
| Port AI insights feed | Simple `<FeedList>` component | None |
| Port bill upload card | Reuse `BillUploader.jsx` | None |
| Port solar report uploader | New `<ReportUploader>` component | None |
| Add route to App.js | `App.js` | None |

### Phase 17.2 — Bill Analyzer (3 days)

| Task | Files | Dependencies |
|------|-------|-------------|
| Create `BillAnalyzer.jsx` | `pages/BillAnalyzer.jsx` | Recharts |
| Port usage chart | Recharts `<LineChart>` | Recharts |
| Port history list + status timeline | Reuse `BillCard.jsx` + `BillStatusTimeline.jsx` | None |
| Wire API calls | `bill.service.js` (exists) | None |

### Phase 17.3 — ROI Calculator (2 days)

| Task | Files | Dependencies |
|------|-------|-------------|
| Create `ROICalculator.jsx` | `pages/ROICalculator.jsx` | Recharts |
| Port form inputs (system size, tariff, subsidy) | Simple controlled form | None |
| Port simulation output | Display cards | None |
| Port trend chart | Recharts `<LineChart>` | Recharts |

### Phase 17.4 — AI Advisor Chat (4 days)

| Task | Files | Dependencies |
|------|-------|-------------|
| Create `AIAdvisor.jsx` | `pages/AIAdvisor.jsx` | None |
| Create `ChatMessage` component | `components/chat/ChatMessage.jsx` | None |
| Create `ChatInput` component | `components/chat/ChatInput.jsx` | None |
| Create `ChatHistory` sidebar | `components/chat/ChatHistory.jsx` | None |
| Create `aiAdvisor.service.js` | `services/aiAdvisor.service.js` | Axios |
| Wire SSE/polling for streaming | `services/aiAdvisor.service.js` | None |

### Phase 17.5 — Satellite Roof Analysis (2 weeks — HIGH RISK)

| Task | Files | Dependencies |
|------|-------|-------------|
| Install `react-leaflet`, `leaflet`, `html2canvas` | `package.json` | npm |
| Create `RoofAnalysis.jsx` (extend existing `Roof.jsx`) | `pages/RoofAnalysis.jsx` | react-leaflet |
| Add mode toggle (Camera / Satellite) | `<ModeToggle>` component | None |
| Create `SatelliteCaptureStep.jsx` | Sub-component | Leaflet, Nominatim |
| Create `CameraUploadStep.jsx` | Sub-component, reuse `BillUploader` | None |
| Create `AnalysisResultsStep.jsx` | Sub-component, reuse `RoofSummaryCard` | None |
| Create step indicator component | `<StepIndicator>` component | None |
| Create layer toggle component | `<LayerToggle>` component | None |
| Port capture preview card | `<CapturePreview>` component | html2canvas |
| Create `geocoding.service.js` | `services/geocoding.service.js` | Axios |
| Wire camera and satellite to same API | `roof.service.js` (exists) | None |

### Phase 17.6 — Rewards Dashboard (2 days)

| Task | Files | Dependencies |
|------|-------|-------------|
| Create `RewardsDashboard.jsx` | `pages/RewardsDashboard.jsx` | None |
| Referral code display | Simple card | None |
| Points/history list | Table | None |

### Phase 17.7+ — CRM, Admin, Audit, BI, MLOps, AMC, Site Survey (DEFERRED to Phase 18+)

---

## 13. Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| `react-leaflet` v5 API changes | High | Medium | Pin exact version, test capture workflow early |
| Chart.js → Recharts visual differences | Medium | Medium | Compare side-by-side during porting; note: charts are visually similar, not pixel-identical |
| Legacy CSS specificity conflicts in React | Medium | High | Use CSS Modules for component styles; legacy CSS remains global |
| html2canvas canvas-to-blob timing | High | Low | Same library, same API — should work identically |
| CRM drag-and-drop performance with 500+ leads | Medium | Medium | Virtualization with `react-window` if needed |
| Sidebar link migration UX | Low | Medium | Add a brief "Navigating to new experience..." toast when leaving legacy |
| Build size with all dependencies | Low | Low | CRA supports code splitting via `React.lazy()` per route |
| Developer learning curve | Low | High | React patterns are well-established; legacy patterns are archaic |

---

## 14. Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| All Phase 17 tabs work in React | Manual QA checklist per tab |
| Zero regression in legacy tabs | Legacy tabs still work from `dashboard.html` |
| Auth token shared between legacy and React | Login in one, navigate to the other without re-auth |
| CSS identical between legacy and React | Visual comparison screenshots per page |
| API compatibility | All API calls return same data shape as legacy |
| Build succeeds | `npm run build` exits 0 |
| No console errors | `npm start` shows no errors in dev tools |

---

## 15. Appendix: Key Legacy Functions to Port

| Legacy Function | File | React Equivalent |
|----------------|------|-----------------|
| `renderDashboardData()` | `app.js` | `DashboardHome.jsx` |
| `renderCharts()` | `app.js` | Recharts components |
| `switchTab(tabId)` | `dashboard.html` (inline) | React Router |
| `safeFetch(url, options)` | `app.js` | Axios `api.js` |
| `GSE.ModuleRegistry.init()` | `module-registry.js` | React `useEffect` / `useMount` |
| `handleRoofFile()` | `app.js` | `CameraUploadStep.jsx` |
| `triggerRoofAnalyze()` | `app.js` | Shared analyze function |
| `renderRoofData()` | `app.js` | `AnalysisResultsStep.jsx` |
| Satellite capture logic | `satellite-roof.js` | `SatelliteCaptureStep.jsx` |
| Address search + debounce | `satellite-roof.js` | `geocoding.service.js` + `useDebounce` |
| Map initialization | `satellite-roof.js` | `react-leaflet` `<MapContainer>` |
| html2canvas capture | `satellite-roof.js` | `html2canvas` npm + ref |
| CRM pipeline + Kanban | `app.js` CRM section | `@dnd-kit` + `CRM/` components |
| `toggleTheme()` | `app.js` | `UIContext` |
| `toggleSidebar()` | `app.js` | `UIContext` |
| `showToast()` | `utils/ui-utils.js` | Toast component or library |
| `debounce()` | `utils/ui-utils.js` | `lodash.debounce` or `useDebounce` hook |
| Chart.js configs | `app.js` | Recharts config objects |
| `data.json` | `data.json` | Constants file or API response |

---

## 16. Escalation Point

If the React build process, Leaflet/react-leaflet compatibility, or html2canvas integration causes more than 2 days of blocked time, escalate to Phase 17 lead for a decision on:
1. **Pivot to Incremental**: Focus on only P1-P3, defer satellite roof to Phase 18
2. **Pivot to Parallel**: Keep satellite roof in legacy indefinitely, only migrate non-map tabs
3. **Pivot to Iframe**: Embed the satellite tab as an iframe pointing to legacy `dashboard.html#roof` until a full rewrite is possible
