import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PermissionGuard from '../PermissionGuard'
import { FEATURE_PERMISSIONS } from '../../config/permissions'
import { SIDEBAR_ITEMS } from '../../config/sidebar'
import { ADMIN_SIDEBAR_GROUPS } from '../../config/sidebar.admin'
import { ROUTES } from '../../config/routes'

let mockAuth: any = { isAuthenticated: true, loading: false, user: { role: 'admin' } }

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}))

function renderGuard(feature: any, role: string | null) {
  mockAuth =
    role === null
      ? { isAuthenticated: false, loading: false, user: null }
      : { isAuthenticated: true, loading: false, user: { role } }
  return render(
    <MemoryRouter initialEntries={['/app/planning/proposal']}>
      <PermissionGuard feature={feature}>
        <div>Proposal Content</div>
      </PermissionGuard>
    </MemoryRouter>,
  )
}

describe('Proposal admin-only access', () => {
  it('proposal-generator permission admits admins only', () => {
    expect(FEATURE_PERMISSIONS['proposal-generator'].roles).toEqual(['admin'])
  })

  it('customer sidebar has no Proposal entry', () => {
    const items = SIDEBAR_ITEMS.flatMap((g) => g.items)
    expect(items.find((i) => i.route === ROUTES.PLANNING_PROPOSAL)).toBeUndefined()
    expect(items.find((i) => i.id === 'proposal')).toBeUndefined()
    expect(items.find((i) => /proposal/i.test(i.label))).toBeUndefined()
  })

  it('admin sidebar retains Proposals entry', () => {
    const items = ADMIN_SIDEBAR_GROUPS.flatMap((g) => g.items)
    const entry = items.find((i) => i.route === ROUTES.ADMIN_PROPOSALS)
    expect(entry).toBeDefined()
    expect(entry?.requiredFeature).toBe('admin-proposals')
  })

  it('admin can access planning proposal guard; all non-admin roles blocked', () => {
    const { unmount: u1 } = renderGuard('admin-proposals', 'admin')
    expect(screen.getByText('Proposal Content')).toBeInTheDocument()
    u1()
    for (const role of ['customer', 'vendor', 'technician', 'engineer'] as const) {
      const { unmount } = renderGuard('admin-proposals', role)
      expect(screen.queryByText('Proposal Content')).not.toBeInTheDocument()
      unmount()
    }
  })

  it('unauthenticated user follows login behavior (no content rendered)', () => {
    renderGuard('admin-proposals', null)
    expect(screen.queryByText('Proposal Content')).not.toBeInTheDocument()
  })

  it('planning proposal path remains defined for admin workflow', () => {
    expect(ROUTES.PLANNING_PROPOSAL).toBe('/app/planning/proposal')
    expect(ROUTES.ADMIN_PROPOSALS).toBe('/app/admin/proposals')
  })
})
