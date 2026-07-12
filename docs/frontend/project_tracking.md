# Project Tracking Module — Phase 13.5C

## Architecture

The Project Tracking module is a frontend-first enterprise workspace built inside the existing React SPA. It follows the same architectural patterns established in earlier phases: service-based data layer, props-only component communication, and full reuse of the existing design system.

### Module Structure

```
pages/ProjectTracking.jsx          ← Single state owner (orchestrator)
services/projectTracking.service.js ← Data layer (swappable for backend)
components/projectTracking/
├── ProjectHeader.jsx              ← Title, description, quick actions
├── KpiCards.jsx                   ← 6 enterprise KPI cards
├── AdvancedSearch.jsx             ← Debounced search with recent searches
├── EnterpriseFilters.jsx          ← 9-dimension filter bar
├── KanbanBoard.jsx                ← 8-column Kanban with drag-and-drop
├── KanbanCard.jsx                 ← Draggable card with context menu
├── ProjectTable.jsx               ← Sortable, paginated enterprise table
├── ProjectDrawer.jsx              ← Project details drawer (orchestrator)
├── drawerTabs/
│   ├── OverviewTab.jsx
│   ├── TimelineTab.jsx
│   ├── TeamTab.jsx
│   ├── FinancialTab.jsx
│   ├── DocumentsTab.jsx
│   ├── NotesTab.jsx
│   ├── RisksTab.jsx
│   ├── ActivityTab.jsx
│   └── MilestonesTab.jsx
├── MilestoneTimeline.jsx          ← Vertical milestone timeline
├── RecentActivity.jsx             ← Activity feed
├── UpcomingTasks.jsx              ← Task list by category
└── ProjectAnalytics.jsx           ← 5 Recharts charts
styles/project-tracking.css        ← Module-specific CSS (minimal)
```

## Data Flow

```
ProjectTracking.jsx (state + effects)
    │
    ├── useRef: liveRegion (aria-live announcements)
    ├── useState: projects, filteredProjects, kpis, analytics, tasks, activities
    ├── useState: loading, error
    ├── useState: searchQuery, activeFilters
    ├── useState: selectedProject, isDrawerOpen, selectedProjectTimeline, selectedProjectActivities
    │
    ├── useEffect (mount): Promise.all → service methods → populate all state
    ├── useEffect (search/filter): derive filteredProjects
    │
    ├── handleStageChange(projectId, newStage):
    │   → optimistic setProjects()
    │   → service.updateProjectStage()
    │   → refresh projects + kpis
    │
    ├── handleSearch(query) → setSearchQuery
    ├── handleFilter(filters) → setActiveFilters
    ├── handleSelectProject(project) → load timeline + activities → open drawer
    ├── handleCloseDrawer() → reset drawer state
    │
    └── Props go DOWN to child components
        └── Child components call UP via callbacks only
```

**Key rule**: No child component holds project data in state. All data is passed via props. Child components only hold UI state (dropdowns, drag states, expanded sections).

## Service Layer

**File**: `src/services/projectTracking.service.js`

### Methods

| Method | Returns | Backend Placeholder |
|---|---|---|
| `getProjects()` | `ProjectModel[]` | `GET /api/projects` |
| `getProject(id)` | `ProjectModel` | `GET /api/projects/:id` |
| `getProjectKpis()` | KPIs object | `GET /api/projects/kpis` |
| `getProjectAnalytics()` | Analytics object | `GET /api/projects/analytics` |
| `getProjectTimeline(id)` | Milestone[] | `GET /api/projects/:id/timeline` |
| `getProjectTasks()` | Task[] | `GET /api/projects/tasks` |
| `getProjectActivities()` | Activity[] | `GET /api/projects/activities` |
| `updateProjectStage(id, stage)` | `{success, oldStage, newStage}` | `PATCH /api/projects/:id/stage` |
| `searchProjects(query)` | `ProjectModel[]` | `GET /api/projects?q=:query` |
| `filterProjects(filters)` | `ProjectModel[]` | `GET /api/projects?stage=:stage&city=:city&...` |

### Data Model

```
ProjectModel {
  id, projectName, customerName, customerEmail, customerPhone,
  address, city, state, pincode,
  capacityKw, systemType (residential/commercial/industrial),
  currentStage, assignedEngineer {name, email, avatar},
  assignedInstaller {name, email, avatar},
  completionPercent, revenue {budget, actual},
  status (on-track/at-risk/delayed/completed),
  priority (low/medium/high/critical),
  startDate, deadline, actualEndDate,
  totalBudget, materialsCost, laborCost, miscCost,
  leadSource, projectType (new/retrofit/expansion),
  notes[], milestones[], documents[], risks[],
  stageHistory[{stage, enteredAt}],
  lastUpdated, createdAt,
  // Computed:
  health {score, label, color},
  delayDays, budgetVariancePercent, overdueTasksCount, openRisksCount, daysInStage
}
```

### Health Score Algorithm

```
score = delayScore × 0.30 + completionScore × 0.25 + tasksScore × 0.15
      + budgetScore × 0.10 + inspectionScore × 0.10 + riskScore × 0.10

if score >= 70 → "Healthy" (green)
if score >= 40 → "At Risk" (yellow)
else → "Critical" (red)
```

## Component Hierarchy

```
ProjectTracking
├── ProjectHeader (title, description, Add/Export/Refresh buttons)
├── KpiCards (6 metric cards: Active, Completed, Delayed, Avg Completion, Revenue, Pipeline)
├── AdvancedSearch (debounced text input with recent searches dropdown)
├── EnterpriseFilters (9 filter dropdowns + active chips + clear all)
├── KanbanBoard (8-column flex layout)
│   └── KanbanCard × N (draggable, context menu, health badge, progress bar)
├── ProjectTable (sortable, paginated, click-to-select, inline stage change)
├── ProjectDrawer (overlay + drawer container)
│   ├── OverviewTab (health score, key stats, financial summary)
│   ├── TimelineTab (vertical timeline)
│   ├── TeamTab (engineer + installer cards)
│   ├── FinancialTab (revenue, cost breakdown, profit margin)
│   ├── DocumentsTab (document list with upload placeholder)
│   ├── NotesTab (note list + add note form)
│   ├── RisksTab (risk register with impact/probability/mitigation)
│   ├── ActivityTab (filtered activity feed)
│   └── MilestonesTab (milestone checklist)
├── ProjectAnalytics (5 Recharts charts grid)
│   ├── Projects by Stage (horizontal bar)
│   ├── Monthly Installations (grouped bar)
│   ├── Completion Trend (line chart)
│   ├── Revenue Forecast (area chart)
│   └── Team Productivity (horizontal stacked bar)
├── RecentActivity (scrollable feed, 7 activity types)
└── UpcomingTasks (4 categories: Due Today, This Week, Overdue, Completed)
```

## State Management

All project state lives in `ProjectTracking.jsx` using `useState` + `useEffect`. There is no shared context for project data. The module is self-contained.

### UI State per Component

| Component | UI State | Description |
|---|---|---|
| `AdvancedSearch` | `query`, `recentSearches`, `showRecent` | Text input, recent list, dropdown visibility |
| `EnterpriseFilters` | `localFilters` | Current filter selections before emitting |
| `KanbanBoard` | `dragOverColumn` | Visual feedback during drag |
| `KanbanCard` | `isDragging`, `menuOpen` | Drag state + context menu |
| `ProjectTable` | `sortConfig`, `currentPage`, `stageMenuOpen` | Sort, pagination, inline dropdown |
| `ProjectDrawer` | `activeTab` | Tab selection (local) |
| `UpcomingTasks` | `expanded` | Collapsible category sections |
| `ProjectTracking` | *all project data* | Global state owner |

## Design System Reuse

The module reuses the following existing CSS classes exclusively. No duplicate CSS was written.

| Category | Classes |
|---|---|
| Cards | `.card`, `.card-glass`, `.card-metric`, `.card-metric-value`, `.card-metric-label`, `.card-metric-change`, `.accent-*`, `.card-header`, `.card-body`, `.card-dashboard`, `.card-insight`, `.card-stat`, `.card-stat-num`, `.card-stat-label` |
| Tables | `.table`, `.table-hover`, `.table-container`, `.table-toolbar`, `.table-pagination`, `.pagination-btn`, `.table-empty`, `.td-primary`, `.td-mono`, `.td-actions` |
| Badges | `.badge`, `.badge-success`, `.badge-warning`, `.badge-error`, `.badge-info`, `.badge-neutral`, `.badge-orange`, `.badge-purple`, `.badge-sm`, `.badge-lg`, `.status-dot` |
| Buttons | `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-outline`, `.btn-danger`, `.btn-glass`, `.btn-sm`, `.btn-xs`, `.btn-icon`, `.btn-with-icon` |
| Forms | `.form-input`, `.form-select`, `.form-search`, `.form-label`, `.form-group`, `.form-input-group`, `.form-textarea` |
| Drawer | `.drawer-overlay`, `.drawer` |
| Navigation | `.nav-tabs`, `.nav-tab`, `.dropdown`, `.dropdown-menu`, `.dropdown-item`, `.dropdown-header`, `.dropdown-divider` |
| Loading | `.skeleton`, `.skeleton-text`, `.skeleton-block`, `.skeleton-card`, `.skeleton-grid`, `.loading-spinner`, `.progress-track`, `.progress-fill`, `.progress-header`, `.progress-label`, `.progress-value` |
| Avatars | `.avatar`, `.avatar-xs`, `.avatar-sm`, `.avatar-lg`, `.avatar-group` |
| Tags | `.tag`, `.tag-remove` |
| Motion | `.animate-fade-in`, `.animate-slide-up`, `.stagger-children`, `.hover-lift`, `.delay-*` |
| Layout | `.card-grid`, `.card-grid-2/3/4` |

## Chart Library

All charts use **Recharts** (v3.8.1, already installed). Chart components:
- `BarChart` — Projects by Stage, Monthly Installations, Team Productivity
- `LineChart` — Completion Trend
- `AreaChart` — Revenue Forecast

Chart colors use CSS custom properties from `tokens.css`:
`--chart-1` through `--chart-10`, `--color-blue`, `--color-green`, `--color-orange`, `--color-purple`

## Accessibility

| Feature | Implementation |
|---|---|
| **Kanban DnD** | `role="listbox"` on columns, `role="option"` on cards, `aria-grabbed`, `aria-dropeffect="move"`, keyboard: Enter to pick up, Escape to cancel |
| **Click-to-move** | Dropdown menu with all stages; current stage disabled; same `handleStageChange` function |
| **Stage announcements** | `aria-live="polite"` region announces "Project X moved from stage to stage" |
| **Drawer** | Focus trap (Tab cycles within, Escape closes), `aria-modal="true"`, `role="dialog"`, focus restoration on close |
| **Table** | `aria-sort` on headers, sort direction announced |
| **Filters** | `aria-expanded`, `aria-label`, `role="combobox"` on search |
| **Headings** | Proper `h1` → `h3` hierarchy |
| **Reduced motion** | All animations use `var(--duration-*)` tokens → `0s` under `prefers-reduced-motion: reduce` |
| **Focus** | `:focus-visible` blue ring (from `utilities.css`) |

## Responsive Breakpoints

| Breakpoint | KPI Grid | Filters | Kanban | Table | Charts | Drawer |
|---|---|---|---|---|---|---|
| ≥1600px | 3×2 | Row | 8 cols | Full | 2-col | 480px |
| ≥1440px | 3×2 | Row | 8 cols | Full | 2-col | 480px |
| ≥1366px | 3×2 | Row | Scroll H | Full | 2-col | 480px |
| ≥1024px | 2×3 | 2-row | Scroll H | Full | 2-col | 90vw |
| ≥768px | 2×3 | Popover | Scroll H | Scroll H | 1-col | 90vw |
| ≥480px | 1-col | Stack | Scroll V | Scroll H | 1-col | 100vw |

## Future Backend Integration Points

1. **Replace service methods** with `api.get('/projects')` etc. — each method returns a Promise already
2. **WebSocket real-time**: Subscribe to project updates via Socket.IO for live stage changes
3. **File upload**: Replace disabled upload button with `<input type="file">` + `FormData` POST
4. **Notes persistence**: POST notes to backend instead of local state
5. **Project creation**: Add form wizard → POST new project to backend
6. **Export to CSV/PDF**: Use the existing Recharts refs + html2canvas/jspdf for charts
7. **Role-based access**: Add user role checks to conditionally show/hide actions
8. **Notifications**: Trigger toast notifications on stage changes via existing notification system
9. **Search/filter backend**: Move `searchProjects` and `filterProjects` to query params on `GET /api/projects`
10. **Activity WebSocket**: Subscribe to activity feed for real-time updates

## Technical Debt

1. **No backend persistence**: All data is in-memory and lost on page refresh
2. **Document upload is placeholder**: UI only, no file selection or multipart upload
3. **Notes are local-only**: Notes typed in NotesTab are lost on page refresh
4. **No real-time updates**: No WebSocket for live stage changes from other users
5. **Touch DnD limited**: HTML5 DnD has limited touch support; click-to-move is fallback
6. **Kanban columns hardcoded**: No add/remove/reorder of columns
7. **Export is placeholder**: "Export" button has no CSV/PDF implementation
8. **Add Project is placeholder**: "Add Project" button shows no creation form
9. **No toast notifications**: Stage changes don't trigger the existing toast system
10. **No permission gating**: All users see the same Vendor Portal view
11. **No date range calendar**: Basic text input for date range, no calendar widget
12. **No unit tests**: Module needs test coverage

## Suggested Integration Order for Backend

1. Replace `getProjects` and `getProject` — highest value, unblocks all views
2. Replace `updateProjectStage` — enables real stage persistence
3. Replace `getProjectKpis` and `getProjectAnalytics` — dashboard value
4. Replace `getProjectTasks` and `getProjectActivities` — activity tracking
5. Implement file upload endpoint for documents
6. Implement notes CRUD endpoint
7. Add WebSocket for real-time updates
