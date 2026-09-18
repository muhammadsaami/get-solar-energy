import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../test/test-utils'
import { customerProfileService } from '../services/customerProfile.service'
import CustomerProfilePage from '../pages/CustomerProfilePage'

let mockCurrentUser: Record<string, unknown> | null = null

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    token: 'test-token',
    setSession: vi.fn(),
  }),
}))

vi.mock('../../../services/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: null }),
    put: vi.fn().mockResolvedValue({ data: { success: true } }),
    post: vi.fn().mockResolvedValue({ data: { photo_url: '/uploads/custom-photo.jpg' } }),
  },
}))

describe('Customer Profile Data Isolation & Placeholders', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockCurrentUser = null
  })

  it('fresh user with city Agra and phone does not see Jaipur or JVVNL fallback', () => {
    const mockUser = {
      id: 'cust-agra-123',
      name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '9876500000',
      city: 'Agra',
      role: 'customer',
    }

    const profile = customerProfileService.getProfile(mockUser)

    // Verifications: User data matches what user registered with
    expect(profile.name).toBe('Priya Sharma')
    expect(profile.phone).toBe('9876500000')
    expect(profile.city).toBe('Agra')

    // Must NEVER fall back to Jaipur, JVVNL, or fabricated address
    expect(profile.city).not.toBe('Jaipur')
    expect(profile.discom).toBeUndefined()
    expect(profile.consumerNumber).toBeUndefined()
    expect(profile.address).toBe('')
    expect(profile.sanctionedLoadKw).toBeUndefined()
  })

  it('scopes extras in localStorage per user to prevent cross-account leakage', () => {
    const userA = { email: 'userA@test.com', name: 'User A', city: 'Agra', phone: '9999999991' }
    const userB = { email: 'userB@test.com', name: 'User B', city: 'Varanasi', phone: '9999999992' }

    customerProfileService.saveProfileExtras(userA, { discom: 'DVVNL', address: 'Taj Road, Agra' })

    // Verify User A has DVVNL
    const profileA = customerProfileService.getProfile(userA)
    expect(profileA.discom).toBe('DVVNL')
    expect(profileA.address).toBe('Taj Road, Agra')

    // User B must NOT see User A's DVVNL or Taj Road address
    const profileB = customerProfileService.getProfile(userB)
    expect(profileB.discom).toBeUndefined()
    expect(profileB.address).toBe('')
    expect(profileB.city).toBe('Varanasi')
  })

  it('CustomerProfilePage renders neutral placeholders for unlinked data', async () => {
    mockCurrentUser = {
      id: 'cust-agra-456',
      name: 'Rohan Verma',
      email: 'rohan@example.com',
      phone: '9876511111',
      city: 'Agra',
      role: 'customer',
    }

    renderWithProviders(<CustomerProfilePage />)

    await waitFor(() => {
      expect(screen.getAllByText('Rohan Verma').length).toBeGreaterThanOrEqual(1)
    })

    // City should display user's city Agra
    expect(screen.getByText('Agra')).toBeInTheDocument()
    expect(screen.queryByText('Jaipur')).not.toBeInTheDocument()

    // Phone should display 9876511111
    expect(screen.getAllByText(/9876511111/).length).toBeGreaterThanOrEqual(1)

    // Unlinked data must show explicit neutral state
    const notLinkedBadges = screen.getAllByText('Not linked yet')
    expect(notLinkedBadges.length).toBeGreaterThanOrEqual(1)

    const notProvidedTexts = screen.getAllByText('Not provided')
    expect(notProvidedTexts.length).toBeGreaterThanOrEqual(1)

    // No hardcoded 42, Sunshine Enclave
    expect(screen.queryByText(/42, Sunshine Enclave/i)).not.toBeInTheDocument()
  })

  it('renders initials fallback and profile photo controls', async () => {
    mockCurrentUser = {
      id: 'cust-photo-789',
      name: 'Kavita Singh',
      email: 'kavita@example.com',
      role: 'customer',
    }

    renderWithProviders(<CustomerProfilePage />)

    await waitFor(() => {
      // Initials fallback
      expect(screen.getByText('KS')).toBeInTheDocument()
    })

    // "Add Photo" button should exist
    expect(screen.getByText(/Add Photo/i)).toBeInTheDocument()
  })
})
