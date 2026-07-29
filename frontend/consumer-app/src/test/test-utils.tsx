import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoutes?: string[]
}

function AllTheProviders({ children, initialRoutes = ['/'] }: { children: React.ReactNode; initialRoutes?: string[] }) {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialRoutes}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions,
) {
  const { initialRoutes, ...renderOptions } = options ?? {}

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders initialRoutes={initialRoutes}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

export { render }
