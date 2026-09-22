import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RoofAnalyzer, { ROOF_VISION_RELEASED } from '../RoofAnalyzer'
import RoofAnalyzerWorkspace from '../RoofAnalyzerWorkspace'
import { ROUTES } from '../../config/routes'
import { FEATURE_PERMISSIONS } from '../../config/permissions'
import { ROLES } from '../../config/roles'
import { SIDEBAR_ITEMS } from '../../config/sidebar'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockPost = vi.fn()
const mockGet = vi.fn()
vi.mock('../../services/api/client', () => ({
  default: {
    get: (...a: any[]) => mockGet(...a),
    post: (...a: any[]) => mockPost(...a),
  },
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <RoofAnalyzer />
    </MemoryRouter>,
  )
}

describe('RoofAnalyzer release gate (Coming Soon)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('release flag is off: ROOF_VISION_RELEASED === false', () => {
    expect(ROOF_VISION_RELEASED).toBe(false)
  })

  it('renders Roof Vision AI with Coming Soon state', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /roof vision ai/i })).toBeInTheDocument()
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
    expect(screen.getByText(/available here in a future release/i)).toBeInTheDocument()
  })

  it('shows capability preview without fake result values', () => {
    renderPage()
    const list = screen.getByRole('list', { name: /upcoming roof vision ai capabilities/i })
    expect(list).toBeInTheDocument()
    for (const label of [/^roof geometry$/i, /^usable roof area$/i, /^shading analysis$/i, /^installation potential$/i]) {
      const items = screen.getAllByText(label)
      expect(items.length).toBeGreaterThanOrEqual(1)
      items.forEach((el) => expect(el).toBeInTheDocument())
    }
    const text = document.body.textContent || ''
    expect(text).not.toMatch(/\d+\s*%/)
    expect(text).not.toMatch(/\d+(\.\d+)?\s*kW/)
    expect(text).not.toMatch(/\d+\s*sq\s*ft/)
  })

  it('Analyze My Bill CTA navigates to the released Bill Analyzer', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /analyze my bill/i }))
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.BILL_ANALYZER)
  })

  it('contains no file input and no analysis controls', () => {
    renderPage()
    expect(document.querySelector('input[type="file"]')).toBeNull()
    expect(screen.queryByRole('button', { name: /analyze rooftop geometry/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /analyze satellite/i })).toBeNull()
    expect(screen.queryByPlaceholderText(/search.*address/i)).toBeNull()
  })

  it('makes no roof-analysis or AI requests on visit (hook never mounts)', async () => {
    renderPage()
    await new Promise((r) => setTimeout(r, 300))
    expect(mockPost).not.toHaveBeenCalled()
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('route, permission, and sidebar configuration remain intact', () => {
    expect(ROUTES.ROOF_ANALYSIS).toBe('/app/roof-analysis')
    expect(FEATURE_PERMISSIONS['roof-analysis'].roles).toContain(ROLES.CUSTOMER)
    const item = SIDEBAR_ITEMS.flatMap((g) => g.items).find((i) => i.route === ROUTES.ROOF_ANALYSIS)
    expect(item).toBeDefined()
    expect(item?.label).toBe('Roof Vision AI')
  })

  it('preserved workspace component still compiles with the full workflow', () => {
    expect(typeof RoofAnalyzerWorkspace).toBe('function')
  })
})
