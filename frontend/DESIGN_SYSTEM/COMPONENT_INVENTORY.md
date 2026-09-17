# COMPONENT_INVENTORY — Component-by-Component Audit

Audit of every reusable component concept in the production React app (`frontend/consumer-app/src`). For each component: **Location · Used by · Variants · Shared? · Duplicate? · Consolidation candidate? · Status**.

Status values: **CANONICAL** (one shared implementation), **FRAGMENTED** (multiple implementations of one concept), **DEAD** (implemented but unused), **N/A** (concept only via CSS classes).

---

## 1. Card

**Verdict: FRAGMENTED**

- **Shared:** No React `Card` component. Card is expressed via CSS classes (`cards.css`, `glass.css`, `dashboard.css` `card-base`) used in ~73 files via `className`. 40 dedicated `*Card` React files exist, each feature-local.
- **Notable duplicates:**
  - `WorkOrderCard` **exists twice**: `src/features/workOrders/components/WorkOrderCard.tsx` (used by `WorkOrderGrid`) and `src/vendor/components/WorkOrderCard.tsx` (used by `vendor/pages/MyWork.tsx`).
  - `KpiCard` concept: `vendor/KpiCard.tsx`, `vendor/VendorKpiCards.tsx`, `amc/AMCKpiCards.tsx`, `amc/AMCRecommendationKpiCards.tsx`, `projectTracking/KpiCards.jsx` + feature `*KPI*` grids.
  - `GlassCard` (React, vendor) vs `card-glass` / `glass-card` CSS classes — 3 competing glass-card implementations.
  - `SummaryCards`: `rewards/RewardSummaryCards.tsx`, `activities/ActivitySummaryCards.tsx`, `reports/ReportsSummaryCards.tsx`.
- **Representative files:** `features/jobMarketplace/components/JobCard.tsx`, `features/earnings/components/EarningCard.tsx`, `features/certifications/components/CertificateCard.tsx`, `features/knowledgeBase/components/DocumentCard.jsx`, `components/planning/BillCard.jsx`, `components/reports/ReportTemplateCard.tsx`, `vendor/components/GlassCard.tsx`.
- **Consolidation:** Extract a shared `Card` (using `card-base`/`card-glass`/`card-metric` classes) and a shared `KpiCard`. High priority.

## 2. Button

**Verdict: FRAGMENTED + DEAD shared component**

- **Shared:** `src/components/ui/Button.tsx` — **0 production imports** (only its test). **Status: DEAD.**
- **Inline class usage:** 90 files use `className="btn`; `btn-primary` → 66 files, `btn-secondary` → 40, `btn-ghost` → 35.
- **Parallel button vocabularies (hand-rolled):**
  - `vendor-btn-*` → 16 files (`vendor-theme.css`)
  - `hero-btn-*` → 7 files
  - `calc-btn` → 14 files
  - `table-action-btn` → 7 files (`enterprise.css:283`)
- **Consolidation:** 5 vocabularies + orphaned `Button.tsx`. Medium-high priority.

## 3. Table

**Verdict: FRAGMENTED**

- **Dedicated components (6):** `components/projectTracking/ProjectTable.jsx`, `pages/audit/AuditTrailTable.tsx`, `pages/crm/CrmCustomerTable.tsx`, `reports/components/ReportsHistoryTable.tsx`, `components/rewards/ReferralHistoryTable.tsx`, `amc/components/AMCServiceHistoryTable.tsx`.
- **Inline tables:** `pages/mlops/MlOpsPage.tsx`, `pages/business-intelligence/BusinessIntelligencePage.tsx`, `pages/admin/AdminDashboard.tsx`, `pages/Proposal.jsx`, multiple `Vendor*` pages.
- **No `TableEmpty` component** — `.table-empty` markup (tables.css:175) is hand-written in 12+ files.
- **Consolidation:** shared `DataTable` + `TableEmpty`. High priority.

## 4. Drawer

**Verdict: FRAGMENTED (11 shells)**

- **Shared (1 user):** `src/components/ui/DocumentDrawer.jsx` — focus trap, Escape, scroll lock. Used only by `features/knowledgeBase/KnowledgeBase.jsx:4`. **Status: shared but underused.**
- **Feature shells (7, each with own `*Content`):** `PayoutDrawer.tsx` (earnings), `WorkOrderDrawer.tsx` (workOrders), `JobDrawer.tsx` (jobMarketplace), `CertificateDrawer.tsx` (certifications), `ProfileDrawer.tsx` (profile), `TroubleshootingDrawer.tsx` (technicianAi), `ProjectDrawer.jsx` (projectTracking).
- **Other shells:** `components/landing/MobileDrawer.tsx`, `pages/mlops/ModelDetailDrawer.tsx`, `pages/audit/AuditDetailDrawer.tsx`.
- **Consolidation:** Reuse `DocumentDrawer.jsx` for all feature drawers. High priority.

## 5. Modal

**Verdict: 2 implementations, each unique**

- `src/components/auth/ForgotPasswordModal.tsx` (used by `pages/Login.tsx`)
- `src/reports/components/ReportPreviewModal.tsx` (used by `reports/pages/ReportsCenter.tsx`)
- `drawer`/`modal` class usage overlaps (drawer class → 46 files). **Consolidation candidate:** share `DocumentDrawer`-style shell. Low-medium priority.

## 6. Badge

**Verdict: FRAGMENTED**

- **Dedicated components (3):** `components/landing/RecommendationBadge.tsx`, `vendor/components/StatusBadge.tsx` (10 vendor pages), `components/auth/TrustBadges.tsx`.
- **Local badge implementations (4):** `siteSurvey/SurveyList.jsx` (local `StatusBadge`), `siteSurvey/AIAnalysis.jsx` (`SeverityBadge`), `siteSurvey/SiteSurveyDashboard.jsx` (`StatBadge`), `reports/ReportsHistoryTable.tsx` (`getStatusBadge()`), `rewards/ReferralHistoryTable.tsx` (`getStatusBadgeStyle()`).
- **CSS:** `badge` → 116 files (highest reuse); `badge-*` semantic variants in `badges.css`; ~20 class names for one concept.
- **Consolidation:** single `Badge` component + `badges.css` variants. Medium priority.

## 7. Chip

**Verdict: CSS-only, fragmented**

- **No `*Chip` component exists.**
- `chip` class → 9 files; `job-pill-badge` acts as chips; `JobSearchBar.tsx` renders "Active Filter Chips" inline.
- **Consolidation:** use `.tag` (`badges.css:156`) as the chip primitive. Low priority.

## 8. Input / Form controls

**Verdict: FRAGMENTED**

- **No shared `Input`/`TextField` component.** CSS: `.form-input` etc. (`forms.css`), re-defined by `auth.css:470`.
- **SearchBar components (5 separate):** `features/knowledgeBase/components/SearchBar.jsx`, `features/earnings/components/EarningsSearchBar.tsx`, `features/workOrders/components/WorkOrderSearchBar.tsx`, `features/jobMarketplace/components/JobSearchBar.tsx`, `vendor/components/VendorSearch.tsx`.
- **Other form pieces:** `BillUploader.jsx`, `PasswordRequirements.tsx`, `PasswordStrengthMeter.tsx`, `MonthlyBillInput.tsx`, `CitySelector.tsx`, `EstimateForm.tsx`, `SettingsForm.tsx`.
- **Consolidation:** shared `Input`, `SearchBar`, `FormField`. Medium priority.

## 9. Select

**Verdict: N/A (no shared component)**

- **No shared `Select` component.** True `<select>` usages: `siteSurvey/SurveyList.jsx` (×3, `.form-input`), `jobMarketplace/JobSearchBar.tsx` (`job-select-input`), `pages/audit/AuditFilters.tsx` (local `SelectFilter`), `features/knowledgeBase/KnowledgeBase.jsx`, `features/certifications/pages/CertificationsPage.tsx`.
- **Consolidation:** shared `Select` using `.form-select` (`forms.css:72`). Low priority.

## 10. Tabs

**Verdict: FRAGMENTED**

- **Dedicated components (3):** `EarningsTabs.tsx` (`.earnings-tabs`), `WorkOrderTabs.tsx` (`.wo-tabs`), `ProfileTabs.tsx` (`.profile-tabs`).
- **Inline tab families (5+):** `cert-tabs` (CertificationsPage), `job-tabs` (QuickFilters), `ew-tab-btn` (CrmDashboard), `drawer-section-tabs` (ProjectDrawer), `nav-tabs`/`nav-tab-pill`.
- **`nav-tabs` CSS (navigation.css) has 0 TSX/JSX references** — legacy.
- The enterprise layer unifies all `*-tab-btn` classes via `[class$="-tab-btn"]` (`enterprise.css:222`).
- **Consolidation:** shared `Tabs` component. Medium priority.

## 11. Hero

**Verdict: FRAGMENTED — 13 implementations**

`DashboardHeroCard.tsx`, `landing/HeroScene.tsx`, `CertificationsHero.tsx`, `EarningsHero.tsx`, `JobMarketplaceHero.tsx`, `KnowledgeBaseHero.jsx`, `ProfileHero.tsx`, `TechHero.tsx`, `VendorHeroSection.tsx`, `AMCHeroSection.tsx`, `WorkOrdersHero.tsx`, `TechnicianAiHero.tsx`, `TrainingHero.jsx`. No shared Hero. CSS: `hero-title` → 9 files. **Consolidation candidate:** shared `Hero` + `hero-*` classes. Medium priority.

## 12. KPI

**Verdict: FRAGMENTED — 19 implementations**

`KPIGrid.tsx` + `SubKPIGrid.tsx` (dashboard), `EarningsKPIs.tsx`, `WorkOrdersKPIs.tsx`, `JobMarketplaceKPIs.tsx`, `ProfileKPIs.tsx`, `TrainingKPIs.jsx`, `TechKPIs.tsx`, `VendorKpiCards.tsx` + `KpiCard.tsx`, `AMCKpiCards.tsx` + `AMCRecommendationKpiCards.tsx`, `projectTracking/KpiCards.jsx`, `RewardSummaryCards.tsx`, `ActivitySummaryCards.tsx`, `ReportsSummaryCards.tsx`, `FloatingKpiWidgets.tsx`, plus page-local KPI renderers (`AdminDashboard`, `AuditMonitoringPage`, `MlOpsPage`, `SiteSurveyDashboard`).

CSS: `kpi-title` → 52 files, `kpi-value` → 9, `kpi-value-text` → 8. **No shared `KpiCard`/`KpiGrid` primitive** (vendor `KpiCard.tsx` is closest). **Consolidation candidate:** high priority.

## 13. Empty State

**Verdict: FRAGMENTED + DEAD shared component**

- **Shared:** `src/components/feedback/EmptyState.tsx` — **0 imports** (dead).
- **Hand-written (16):** `ActivityEmptyState.tsx`, `AMCEmptyState.tsx`, `CertificationsEmptyState.tsx`, `EarningsEmptyState.tsx`, `JobMarketplaceEmptyState.tsx`, `KnowledgeBaseEmptyState.jsx`, `ProfileEmptyState.tsx`, `TechnicianAiEmptyState.tsx`, `WorkOrdersEmptyState.tsx`, `PerformanceEmptyState.tsx`, `ReportsEmptyState.tsx`, `SettingsEmptyState.tsx`, `technician/DashboardEmptyState.tsx`, `vendor/VendorEmptyState.tsx` (10 vendor pages), `siteSurvey/SurveyList.jsx` (`PremiumEmptyState`), `projectTracking/drawerTabs/*.jsx` (inline `.table-empty`).
- **Consolidation:** wire `feedback/EmptyState.tsx` (or a successor) into all 16. High priority.

## 14. Loading / Skeleton

**Verdict: FRAGMENTED (1 shared)**

- **Shared:** `components/layout/LayoutSkeleton.tsx` — used by `App.jsx`, `routes/vendor.routes.tsx` (×14), `routes/technician.routes.tsx` (×8). **Status: CANONICAL.**
- **Feature skeletons (11, hand-rolled):** `CertificationsSkeleton.tsx`, `EarningsSkeleton.tsx`, `JobMarketplaceSkeleton.tsx`, `DocumentSkeleton.jsx`, `ProfileSkeleton.tsx`, `TechnicianAiSkeleton.tsx`, `TrainingSkeleton.jsx`, `WorkOrdersSkeleton.tsx`, `AMCLoadingSkeleton.tsx`, `PerformanceLoadingSkeleton.tsx`, `SettingsLoadingSkeleton.tsx`, plus `landing/LoadingSkeleton.tsx`.
- CSS `skeleton` → 71 files. **Consolidation candidate:** shared `Skeleton` variants (`loading.css`). Medium priority.

## 15. Sidebar

**Verdict: FRAGMENTED (3)**

- `components/layout/Sidebar.tsx` + `SidebarItem.tsx` (customer shell; config-driven `config/sidebar.ts`, `sidebar.technician.ts`, `sidebar.admin.ts`). **Status: CANONICAL for customer.**
- `components/chat/EnterpriseSidebar.tsx` (AI chat; `pages/EnterpriseAI.tsx`).
- `vendor/components/VendorSidebar.tsx` (vendor shell; `vendor/navigation/sidebar.config.ts`).
- **Consolidation candidate:** shared config-driven `Sidebar`. Medium priority.

## 16. Topbar

**Verdict: FRAGMENTED (2)**

- `components/layout/Topbar.tsx` (customer shell; hosts `NotificationMenu` + `UserMenu`).
- `vendor/components/VendorTopbar.tsx` (vendor shell; contains inline user menu + `VendorSearch`).
- **Consolidation candidate:** low priority.

## 17. Notification / Toast

**Verdict: ONE TRUE TOAST SYSTEM**

- **Toast host:** `components/auth/ToastHost.tsx` (mounted in `AppShell`, `Login`, `Signup`, `ResetPassword`).
- **Toast store:** `stores/notificationStore.ts` (zustand `addToast`) consumed in ~30 files; `vendor/hooks/useVendorNotify.ts` wraps it for the vendor portal.
- **Bell/menus:** `layout/NotificationMenu.tsx` (customer), `technician/components/NotificationWidget.tsx`.
- **Alert panels:** `pages/crm/CrmAlertsPanel.tsx`, `activities/components/ActivityAlertsPanel.tsx`.
- **Status: CANONICAL** (no competing toast implementation).

## 18. User Menu

**Verdict: FRAGMENTED (1 component + 1 inline)**

- `components/layout/UserMenu.tsx` (customer Topbar). **Status: CANONICAL.**
- `vendor/components/VendorTopbar.tsx` contains an inline user menu (duplicate concept).
- **Consolidation candidate:** reuse `UserMenu`. Low priority.

## 19. Timeline

**Verdict: FRAGMENTED — 10 implementations**

`BillStatusTimeline.jsx`, `projectTracking/MilestoneTimeline.jsx`, `certifications/CertificationTimeline.tsx`, `crm/CrmActivityTimeline.tsx`, `crm/CrmJourneyTimeline.tsx`, `amc/AMCMaintenanceTimeline.tsx`, `amc/AMCVisitTimeline.tsx`, `siteSurvey/SurveyTimeline.jsx`, `navigation/JourneyTimeline.jsx` (`pages/Journey.jsx`), `projectTracking/drawerTabs/TimelineTab.jsx`. No shared timeline primitive. **Consolidation candidate:** medium priority.

---

## Appendix — Most-Reused CSS Classes (file counts)

| Class | Files | Class | Files |
|---|---|---|---|
| `badge` | 116 | `table` | 49 |
| `btn btn-*` | 79-90 | `drawer` | 46 |
| `card-base` | 73 | `btn-secondary` | 40 |
| `skeleton` | 71 | `btn-ghost` | 35 |
| `btn-primary` | 66 | `badge-*` | 31 |
| `kpi-title` | 52 | `glass-card` | 30 |
| `hero` | 51 | `toast` | 29 |
| `input` | 78 | `card-glass` | 24 |
| `skeleton-text` | 23 | `card-metric` | 13 |
| `vendor-glass-card` | 22 | `table-container` | 12 |
| `form-group` / `form-input` | 13 | `hero-btn-primary` | 7 |
| `nav-tabs` | **0 (CSS only)** | `table-action-btn` | 7 |

## Appendix — Top Consolidation Opportunities

1. **Drawers** — 11 shells repeat identical logic; `ui/DocumentDrawer.jsx` centralizes it but has 1 consumer.
2. **Empty states** — 17 hand-written; shared `feedback/EmptyState.tsx` unused.
3. **Buttons** — 5 vocabularies + orphaned `Button.tsx`.
4. **KPI** — 19 renderers, no primitive.
5. **Cards** — 40 files; duplicate `WorkOrderCard`, `KpiCard`, `SummaryCards`.
6. **Hero/Tabs/Timeline/Skeleton** — 13/8/10/12 feature-local implementations.
7. **Badge** — 3 components + 4 local badge functions + ~20 class names.
8. **Tables** — no shared `Table`/`TableEmpty`.
9. **Dead shared components** — `ui/Button.tsx` (0 usages), `feedback/EmptyState.tsx` (0 usages).
