import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UserMenu from '../UserMenu'
import { ROUTES } from '../../../config/routes'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

const mockLogout = vi.fn()
let mockUser: { name: string; role: string } | null = { name: 'Test Customer', role: 'customer' }

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, logout: mockLogout }),
}))

function openMenu() {
  render(<UserMenu />)
  fireEvent.click(screen.getByRole('button', { name: /open profile menu/i }))
}

describe('UserMenu Account Settings routing (customer-scoped)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows Account Settings to Standard User (customer)', () => {
    mockUser = { name: 'Test Customer', role: 'customer' }
    openMenu()
    expect(screen.getByRole('menuitem', { name: /account settings/i })).toBeInTheDocument()
  })

  it('customer click navigates to /app/account/settings', () => {
    mockUser = { name: 'Test Customer', role: 'customer' }
    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: /account settings/i }))
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.ACCOUNT_SETTINGS)
    expect(ROUTES.ACCOUNT_SETTINGS).toBe('/app/account/settings')
  })

  it('vendor click navigates to /app/vendor/settings (not customer settings)', () => {
    mockUser = { name: 'Test Vendor', role: 'vendor' }
    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: /account settings/i }))
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.VENDOR_SETTINGS)
    expect(mockNavigate).not.toHaveBeenCalledWith(ROUTES.ACCOUNT_SETTINGS)
  })

  it('hides Account Settings for technician (no settings permission)', () => {
    mockUser = { name: 'Test Tech', role: 'technician' }
    openMenu()
    expect(screen.queryByRole('menuitem', { name: /account settings/i })).not.toBeInTheDocument()
  })

  it('keeps Profile, Notifications, Billing & Rewards navigation unchanged', () => {
    mockUser = { name: 'Test Customer', role: 'customer' }
    render(<UserMenu />)
    fireEvent.click(screen.getByRole('button', { name: /open profile menu/i }))
    expect(screen.getByRole('menuitem', { name: /^profile$/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /notifications/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /billing & rewards/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('menuitem', { name: /notifications/i }))
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.SUPPORT_NOTIFICATIONS)

    // Menu closes after navigation; reopen the same instance (no re-render)
    fireEvent.click(screen.getByRole('button', { name: /open profile menu/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /billing & rewards/i }))
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.REWARDS)
  })
})
