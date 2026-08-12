# LAYOUT — Layout System & App Shell

Layout template classes are defined in `frontend/consumer-app/src/styles/layout.css`. The application shell is implemented in React components under `frontend/consumer-app/src/components/layout/`. Line references are to those files.

---

## 1. Layout Token Sizes (`tokens.css:303-309`)

`--sidebar-width: 280px`, `--sidebar-collapsed-width: 72px`, `--header-height: 80px`, `--content-max-width: 1440px`, `--content-padding-x: 32px`, `--content-padding-y: 32px`, `--section-max-width: 1200px`.

---

## 2. Layout Templates (`layout.css`)

| Template | Class | Line | Notes |
|---|---|---|---|
| Auth | `.layout-auth` + `.layout-auth-card` | 12-27 | Centered card (login/signup/reset); card max-width 460px |
| Dashboard | `.layout-dashboard` + `-main/-header/-content` | 31-62 | Sidebar + content; `-main.collapsed` uses collapsed width; header sticky |
| Split | `.layout-split` + `-panel/-main` | 66-83 | 380px left panel + main |
| Analytics | `.layout-analytics` + `-header/-kpis/-body` | 87-112 | 4-col KPI grid |
| Settings | `.layout-settings` + `-nav/-content` | 116-138 | 240px nav + content |
| Wizard | `.layout-wizard` + `.wizard-step-*` | 142-201 | Stepped workflow |
| Master detail | `.layout-master-detail` + `.layout-master-list`, `.layout-detail-pane` | 205-222 | List + detail (CRM/reports) |
| Containers | `.container` (1440px), `.container-narrow` (760px), `.container-wide` (1600px) | 225-241 | |
| Page header | `.page-header` / `-left`, `.page-title`, `.page-subtitle` | 244-269 | |

---

## 3. Responsive Behavior (`layout.css:272-301`)

| Breakpoint | Behavior |
|---|---|
| `max-width: 1280px` | Analytics KPIs → 2 cols; split → 320px panel |
| `max-width: 1024px` | Settings/master-detail/split → 1 col; dashboard main `margin-left: 0` (sidebar hidden) |
| `max-width: 768px` | Analytics KPIs → 2 cols; container padding 20px; `--content-padding-x: 20px`, `-y: 24px` |
| `max-width: 480px` | Analytics KPIs → 1 col; `--content-padding-x: 16px`, `-y: 16px` |

---

## 4. App Shell Components (`src/components/layout/`)

| Component | File | Role |
|---|---|---|
| `AppShell` | `src/components/layout/AppShell.tsx` | Customer portal shell; owns sidebar collapse state |
| `Sidebar` | `src/components/layout/Sidebar.tsx` | Sidebar; driven by `src/config/sidebar.ts` |
| `SidebarItem` | `src/components/layout/SidebarItem.tsx` | Sidebar nav item |
| `Topbar` | `src/components/layout/Topbar.tsx` | Header; hosts `NotificationMenu` + `UserMenu` |
| `UserMenu` | `src/components/layout/UserMenu.tsx` | User dropdown menu |
| `NotificationMenu` | `src/components/layout/NotificationMenu.tsx` | Bell/notification menu |
| `LayoutSkeleton` | `src/components/layout/LayoutSkeleton.tsx` | Shared route loading skeleton |

Sidebar configs: `src/config/sidebar.ts` (customer), `src/config/sidebar.technician.ts`, `src/config/sidebar.admin.ts`.

### Vendor shell

`src/vendor/components/VendorAppShell.tsx` (imports `src/vendor/styles/vendor-theme.css:5`) wraps:
- `VendorSidebar.tsx` (driven by `src/vendor/navigation/sidebar.config.ts`)
- `VendorTopbar.tsx` (contains an inline user menu — duplicate of `UserMenu`, see `COMPONENT_INVENTORY.md`)
- `DashboardHeader.tsx`, `VendorBrandLogo.tsx`, `VendorSearch.tsx`

### Enterprise chat sidebar

`src/components/chat/EnterpriseSidebar.tsx` — AI chat context sidebar used by `src/pages/EnterpriseAI.tsx`.

---

## 5. Layout Usage

- Every authenticated page uses `.layout-dashboard` via `AppShell`.
- Auth pages use `.layout-auth` (see `auth.css`).
- Vendor portal uses the `.vendor-portal-root` layout (`vendor-theme.css:52`).

---

## 6. Notes

- The enterprise layer adjusts `.main-panel` to `padding: 0 28px 28px` (`enterprise.css:14-16`) and `.header` margin (`enterprise.css:18-20`).
- `nav-sidebar` classes (`navigation.css:195-235`) are the CSS for sidebar items; `SidebarItem.tsx` is the React wrapper.
