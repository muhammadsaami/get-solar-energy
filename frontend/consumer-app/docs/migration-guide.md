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

### 8. Cutover

When the React page is ready:
1. Update the legacy `dashboard.html` sidebar link to point to `/app/my-feature`
2. Auth is shared via localStorage — user stays logged in
3. If issues arise, revert the sidebar link

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
