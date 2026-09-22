import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PermissionGuard from '../PermissionGuard'
import { FEATURE_PERMISSIONS } from '../../config/permissions'

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
    <MemoryRouter initialEntries={['/app/crm/leads']}>
      <PermissionGuard feature={feature}>
        <div>Guarded Content</div>
      </PermissionGuard>
    </MemoryRouter>,
  )
}

describe('Admin route-guard permission mapping', () => {
  beforeEach(() => {
    mockAuth = { isAuthenticated: true, loading: false, user: { role: 'admin' } }
  })

  it('routes use their own feature (not a coarse admin-dashboard gate)', () => {
    expect(FEATURE_PERMISSIONS['crm-dashboard'].roles).toEqual(['admin'])
    expect(FEATURE_PERMISSIONS['business-intelligence'].roles).toEqual(['admin'])
    expect(FEATURE_PERMISSIONS['audit-monitoring'].roles).toEqual(['admin'])
  })

  it('admin passes the corrected CRM/BI/audit guards', () => {
    for (const feature of ['crm-dashboard', 'business-intelligence', 'audit-monitoring'] as const) {
      const { unmount } = renderGuard(feature, 'admin')
      expect(screen.getByText('Guarded Content')).toBeInTheDocument()
      unmount()
    }
  })

  it('customer is denied the admin-only guards (direct navigation cannot bypass)', () => {
    for (const feature of ['crm-dashboard', 'business-intelligence', 'audit-monitoring'] as const) {
      const { unmount } = renderGuard(feature, 'customer')
      expect(screen.queryByText('Guarded Content')).not.toBeInTheDocument()
      unmount()
    }
  })

  it('unauthenticated users are redirected, not rendered', () => {
    renderGuard('crm-dashboard', null)
    expect(screen.queryByText('Guarded Content')).not.toBeInTheDocument()
  })

  it('knowledge-base admits technicians and admins but not customers', () => {
    expect(FEATURE_PERMISSIONS['knowledge-base'].roles).toContain('admin')
    expect(FEATURE_PERMISSIONS['knowledge-base'].roles).toContain('technician')
    const { unmount: u1 } = renderGuard('knowledge-base', 'technician')
    expect(screen.getByText('Guarded Content')).toBeInTheDocument()
    u1()
    const { unmount: u2 } = renderGuard('knowledge-base', 'admin')
    expect(screen.getByText('Guarded Content')).toBeInTheDocument()
    u2()
    renderGuard('knowledge-base', 'customer')
    expect(screen.queryByText('Guarded Content')).not.toBeInTheDocument()
  })

  it('customer and vendor routes remain unaffected', () => {
    const { unmount } = renderGuard('amc', 'customer')
    expect(screen.getByText('Guarded Content')).toBeInTheDocument()
    unmount()
  })
})
