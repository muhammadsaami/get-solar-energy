import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Release flags mocked ON: verifies the gated UI restores the real
// authentication forms logically. Production flags remain false.
vi.mock('../../config/release', () => ({
  VENDOR_PORTAL_RELEASED: true,
  TECHNICIAN_PORTAL_RELEASED: true,
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    technicianLogin: vi.fn(),
    isAuthenticated: false,
    loading: false,
    user: null,
  }),
}))

import Login from '../Login'

function renderLogin(role: string) {
  return render(
    <MemoryRouter initialEntries={[`/login?role=${role}`]}>
      <Login />
    </MemoryRouter>,
  )
}

describe('Login release gate (flags on — restoration logic)', () => {
  it('/login?role=vendor restores the vendor auth form', () => {
    const { container } = renderLogin('vendor')
    expect(container.querySelector('#loginEmail')).not.toBeNull()
    expect(container.querySelector('#loginSubmit')).not.toBeNull()
    expect(screen.getByText(/Register Vendor/i)).toBeInTheDocument()
    expect(screen.queryByText(/Coming Soon/i)).not.toBeInTheDocument()
  })

  it('/login?role=technician restores the technician auth form', () => {
    const { container } = renderLogin('technician')
    expect(container.querySelector('#loginEmail')).not.toBeNull()
    expect(container.querySelector('#loginSubmit')).not.toBeNull()
    expect(screen.getByText(/Register Technician/i)).toBeInTheDocument()
  })
})
