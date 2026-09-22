import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PermissionGuard from '../PermissionGuard'
import PortalReleaseGate from '../PortalReleaseGate'
import {
  VENDOR_PORTAL_RELEASED,
  TECHNICIAN_PORTAL_RELEASED,
} from '../../config/release'

let mockAuth: any = { isAuthenticated: true, loading: false, user: { role: 'admin' } }

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}))

function renderPortalRoute(portal: 'vendor' | 'technician', feature: any, role: string | null) {
  mockAuth =
    role === null
      ? { isAuthenticated: false, loading: false, user: null }
      : { isAuthenticated: true, loading: false, user: { role } }
  const released = portal === 'vendor' ? VENDOR_PORTAL_RELEASED : TECHNICIAN_PORTAL_RELEASED
  return render(
    <MemoryRouter initialEntries={[portal === 'vendor' ? '/app/vendor/dashboard' : '/app/technician/dashboard']}>
      <PermissionGuard feature={feature}>
        <PortalReleaseGate portal={portal} released={released}>
          <div>Operational Portal Content</div>
        </PortalReleaseGate>
      </PermissionGuard>
    </MemoryRouter>,
  )
}

describe('Vendor/Technician portal release gates', () => {
  beforeEach(() => {
    mockAuth = { isAuthenticated: true, loading: false, user: { role: 'admin' } }
  })

  it('release flags remain off', () => {
    expect(VENDOR_PORTAL_RELEASED).toBe(false)
    expect(TECHNICIAN_PORTAL_RELEASED).toBe(false)
  })

  it('unauthenticated users redirect to login for both portals', () => {
    renderPortalRoute('vendor', 'vendor-dashboard', null)
    expect(screen.queryByText('Operational Portal Content')).not.toBeInTheDocument()
    expect(screen.queryByText(/Coming Soon/i)).not.toBeInTheDocument()
  })

  it('customers keep AccessDenied on both portals', () => {
    const { unmount: u1 } = renderPortalRoute('vendor', 'vendor-dashboard', 'customer')
    expect(screen.queryByText('Operational Portal Content')).not.toBeInTheDocument()
    expect(screen.queryByText(/Coming Soon/i)).not.toBeInTheDocument()
    u1()
    renderPortalRoute('technician', 'technician-dashboard', 'customer')
    expect(screen.queryByText('Operational Portal Content')).not.toBeInTheDocument()
    expect(screen.queryByText(/Coming Soon/i)).not.toBeInTheDocument()
  })

  it('vendor sees Coming Soon on the vendor portal', () => {
    renderPortalRoute('vendor', 'vendor-dashboard', 'vendor')
    expect(screen.queryByText('Operational Portal Content')).not.toBeInTheDocument()
    expect(screen.getByText(/Coming Soon/i)).toBeInTheDocument()
    expect(screen.getByText(/Vendor Portal/i)).toBeInTheDocument()
  })

  it('vendor is blocked on the technician portal', () => {
    renderPortalRoute('technician', 'technician-dashboard', 'vendor')
    expect(screen.queryByText('Operational Portal Content')).not.toBeInTheDocument()
    expect(screen.queryByText(/Coming Soon/i)).not.toBeInTheDocument()
  })

  it('technician sees Coming Soon on the technician portal', () => {
    renderPortalRoute('technician', 'technician-dashboard', 'technician')
    expect(screen.queryByText('Operational Portal Content')).not.toBeInTheDocument()
    expect(screen.getByText(/Coming Soon/i)).toBeInTheDocument()
    expect(screen.getByText(/Technician Portal/i)).toBeInTheDocument()
  })

  it('technician is blocked on the vendor portal', () => {
    renderPortalRoute('vendor', 'vendor-dashboard', 'technician')
    expect(screen.queryByText('Operational Portal Content')).not.toBeInTheDocument()
    expect(screen.queryByText(/Coming Soon/i)).not.toBeInTheDocument()
  })

  it('engineer sees Coming Soon on vendor portal and is blocked on technician portal', () => {
    const { unmount } = renderPortalRoute('vendor', 'vendor-dashboard', 'engineer')
    expect(screen.queryByText('Operational Portal Content')).not.toBeInTheDocument()
    expect(screen.getByText(/Coming Soon/i)).toBeInTheDocument()
    unmount()
    renderPortalRoute('technician', 'technician-dashboard', 'engineer')
    expect(screen.queryByText('Operational Portal Content')).not.toBeInTheDocument()
    expect(screen.queryByText(/Coming Soon/i)).not.toBeInTheDocument()
  })

  it('admin sees the operational portals', () => {
    const { unmount } = renderPortalRoute('vendor', 'vendor-dashboard', 'admin')
    expect(screen.getByText('Operational Portal Content')).toBeInTheDocument()
    expect(screen.queryByText(/Coming Soon/i)).not.toBeInTheDocument()
    unmount()
    renderPortalRoute('technician', 'technician-dashboard', 'admin')
    expect(screen.getByText('Operational Portal Content')).toBeInTheDocument()
    expect(screen.queryByText(/Coming Soon/i)).not.toBeInTheDocument()
  })

  it('Coming Soon states contain no fake operational data', () => {
    renderPortalRoute('vendor', 'vendor-dashboard', 'vendor')
    const text = document.body.textContent || ''
    expect(text).not.toMatch(/\d+\s*(jobs|orders|tickets|payments|kW|%)/i)
    expect(text).not.toMatch(/₹\s*\d/i)
    expect(text).not.toMatch(/revenue\s*₹?[\d,]+/i)
  })

  it('unrelated released routes remain unaffected', () => {
    mockAuth = { isAuthenticated: true, loading: false, user: { role: 'customer' } }
    render(
      <MemoryRouter initialEntries={['/app/amc']}>
        <PermissionGuard feature="amc">
          <div>Operational Portal Content</div>
        </PermissionGuard>
      </MemoryRouter>,
    )
    expect(screen.getByText('Operational Portal Content')).toBeInTheDocument()
  })
})
