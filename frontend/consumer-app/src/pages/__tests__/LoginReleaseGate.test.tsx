import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../Login'
import {
  VENDOR_PORTAL_RELEASED,
  TECHNICIAN_PORTAL_RELEASED,
} from '../../config/release'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    technicianLogin: vi.fn(),
    isAuthenticated: false,
    loading: false,
    user: null,
  }),
}))

function renderLogin(role: string) {
  return render(
    <MemoryRouter initialEntries={[`/login?role=${role}`]}>
      <Login />
    </MemoryRouter>,
  )
}

describe('Login release gate (flags off)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('release flags remain off', () => {
    expect(VENDOR_PORTAL_RELEASED).toBe(false)
    expect(TECHNICIAN_PORTAL_RELEASED).toBe(false)
  })

  it('/login?role=vendor shows Vendor Coming Soon with no auth form', () => {
    const { container } = renderLogin('vendor')
    expect(screen.getByText(/Vendor Portal/i)).toBeInTheDocument()
    expect(screen.getByText(/Coming Soon/i)).toBeInTheDocument()
    expect(container.querySelector('#loginEmail')).toBeNull()
    expect(container.querySelector('#loginPassword')).toBeNull()
    expect(container.querySelector('#loginSubmit')).toBeNull()
    expect(container.querySelector('input[type="checkbox"]')).toBeNull()
    expect(container.querySelector('.forgot-password-link')).toBeNull()
    expect(screen.queryByText(/Register Vendor/i)).not.toBeInTheDocument()
  })

  it('/login?role=technician shows Technician Coming Soon with no auth form', () => {
    const { container } = renderLogin('technician')
    expect(screen.getByText(/Technician Portal/i)).toBeInTheDocument()
    expect(screen.getByText(/Coming Soon/i)).toBeInTheDocument()
    expect(container.querySelector('#loginEmail')).toBeNull()
    expect(container.querySelector('#loginPassword')).toBeNull()
    expect(container.querySelector('#loginSubmit')).toBeNull()
    expect(container.querySelector('input[type="checkbox"]')).toBeNull()
    expect(container.querySelector('.forgot-password-link')).toBeNull()
    expect(screen.queryByText(/Register Technician/i)).not.toBeInTheDocument()
  })

  it('/login?role=customer keeps the existing login experience', () => {
    const { container } = renderLogin('customer')
    expect(container.querySelector('#loginEmail')).not.toBeNull()
    expect(container.querySelector('#loginPassword')).not.toBeNull()
    expect(container.querySelector('#loginSubmit')).not.toBeNull()
    expect(screen.getByText(/Create your customer account/i)).toBeInTheDocument()
    expect(screen.queryByText(/Coming Soon/i)).not.toBeInTheDocument()
  })

  it('switching the role toggle to vendor shows Coming Soon inline', () => {
    renderLogin('customer')
    const radios = screen.getAllByRole('radio')
    const vendorTab = radios.find((r) => r.textContent === 'Vendor')
    expect(vendorTab).toBeDefined()
    fireEvent.click(vendorTab!)
    expect(screen.getByText(/Vendor Portal/i)).toBeInTheDocument()
    expect(screen.getByText(/Coming Soon/i)).toBeInTheDocument()
  })

  it('Coming Soon states show no auth inputs', () => {
    const { unmount } = renderLogin('vendor')
    expect(document.body.textContent).not.toMatch(/Business Email Address/i)
    unmount()
    renderLogin('technician')
    expect(document.body.textContent).not.toMatch(/Mobile \/ Email/i)
  })
})
