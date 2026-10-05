# Migration Guide

## How to Port a Legacy Tab to React

### 1. Create the Page Component

```tsx
// src/pages/MyFeature.tsx
export default function MyFeature() {
  return <div>Feature content</div>
}
```

### 2. Add the Route

Update `src/App.jsx`:

```tsx
import MyFeature from './pages/MyFeature'

// In AppRoutes():
<Route path="/app/my-feature" element={<AppRoute><MyFeature /></AppRoute>} />
```

### 3. Add Route Constant

```ts
// src/config/routes.ts
export const ROUTES = {
  MY_FEATURE: '/app/my-feature',
}
```

### 4. State: Zustand (new code) or Context (existing)

**If new feature**, create a Zustand store:

```ts
// src/features/myFeature/store.ts
import { create } from 'zustand'

export const useMyFeatureStore = create((set) => ({
  data: null,
  loading: false,
  fetchData: async () => {
    set({ loading: true })
    const data = await api.get('/my-feature')
    set({ data, loading: false })
  },
}))
```

**If existing Context**, continue using it. Migrate to Zustand when refactoring.

### 5. API Calls

Use TanStack Query for server data:

```tsx
import { useQuery } from '@tanstack/react-query'
import api from '../services/api/client'

export function useMyFeatureData() {
  return useQuery({
    queryKey: ['my-feature'],
    queryFn: () => api.get('/my-feature').then(r => r.data),
  })
}
```

### 6. Styling

Use CSS Modules for component-specific styles:

```css
/* MyFeature.module.css */
.container { /* ... */ }
```

Import the design system tokens globally (already set up). Use CSS custom properties from `tokens.css` for colors, spacing, and typography.

### 7. Testing

```tsx
// MyFeature.test.tsx
import { renderWithProviders } from '../test/test-utils'
import MyFeature from './MyFeature'

test('renders feature content', () => {
  renderWithProviders(<MyFeature />)
  // assertions
})
```

### 8. Cutover (Completed)

All application features and routes have been migrated to the React SPA. The legacy `dashboard.html` and static pages have been fully retired and removed.

## Patterns

| Pattern | File Convention | Example |
|---------|----------------|---------|
| Page component | `pages/FeatureName.tsx` | `pages/BillAnalyzer.tsx` |
| UI component | `components/ui/ComponentName.tsx` | `components/ui/Button.tsx` |
| Feature store | `features/{name}/store.ts` | `features/auth/store.ts` |
| Feature service | `features/{name}/services/service.ts` | `features/billing/services/bill.service.ts` |
| Custom hook | `hooks/useHookName.ts` | `hooks/useDebounce.ts` |
| Type definition | `types/domain.ts` | `types/user.ts` |
| Utility | `utils/utilName.ts` | `utils/formatters.ts` |

## Phase 7B: Solar Production Persistence & Data Reconciliation

### Server-Side Persistence Architecture
Previously, manual solar generation inputs and extracted solar report data lived only in client-side `localStorage`. In Phase 7B, server persistence was introduced:

1. **Database Schema (`CustomerSolarProduction`)**:
   - Stores `customer_email`, `period_type` (`month`, `year`, `custom`, `lifetime`), `start_date`, `end_date`, `month`, `year`, `production_kwh`, `installed_capacity_kwp`, `system_size_kw`, `source` (`manual`, `upload`, `report`), `daily_generation_kwh`, and `daily_points` (JSON).
   - Strict customer isolation enforced using verified JWT `sub` claims.
2. **REST API (`/api/solar-production`)**:
   - `POST /api/solar-production`: Validate and save verified solar production reading.
   - `GET /api/solar-production/latest`: Retrieve most recent verified reading for authenticated customer.
   - `GET /api/solar-production/history`: Retrieve paginated reading history.
   - `DELETE /api/solar-production/{id}`: Delete an owned reading.
3. **Frontend Client Service (`solarProduction.service.ts`)**:
   - Provides clean asynchronous methods with silent fallback on network/auth errors.
4. **Hook Synchronization (`useBillAnalyzer.ts`)**:
   - **Mount Effect**: Performs server-first query via `fetchLatestSolarProductionFromServer()`, automatically syncing verified cloud records down to localStorage. If server is offline or user unauthenticated, seamlessly falls back to `readLS()`.
   - **Save Actions**: Both `saveManualSolar` and `handleSolarFile`'s `doComplete` trigger non-blocking fire-and-forget `saveSolarProductionToServer()`, ensuring immediate responsive UI updates while guaranteeing cross-device persistence.
