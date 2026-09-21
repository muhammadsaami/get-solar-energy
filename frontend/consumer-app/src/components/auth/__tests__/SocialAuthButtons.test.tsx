import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SocialAuthButtons from '../SocialAuthButtons'
import api from '../../../services/api/client'

vi.mock('../../../services/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('SocialAuthButtons Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders only "Continue with Google" for customer login (no Microsoft)', () => {
    render(<SocialAuthButtons mode="login" role="customer" />)

    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /microsoft/i })).not.toBeInTheDocument()
  })

  it('renders only "Sign up with Google" for customer signup (no Microsoft)', () => {
    render(<SocialAuthButtons mode="signup" role="customer" />)

    expect(screen.getByRole('button', { name: /sign up with google/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /microsoft/i })).not.toBeInTheDocument()
  })

  it('does NOT render for vendor role (role isolation)', () => {
    const { container } = render(<SocialAuthButtons mode="login" role="vendor" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('does NOT render for technician role (role isolation)', () => {
    const { container } = render(<SocialAuthButtons mode="login" role="technician" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('initiates OAuth request on Google button click and redirects to returned URL', async () => {
    const originalLocation = window.location
    delete (window as any).location
    window.location = { ...originalLocation, href: '' } as any

    vi.mocked(api.get).mockResolvedValueOnce({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?test=1', state: 'signed.state' },
    } as any)

    render(<SocialAuthButtons mode="login" role="customer" />)
    const googleBtn = screen.getByRole('button', { name: /continue with google/i })

    fireEvent.click(googleBtn)

    expect(api.get).toHaveBeenCalledWith('/auth/oauth/google/url')
    await waitFor(() => {
      expect(window.location.href).toBe('https://accounts.google.com/o/oauth2/v2/auth?test=1')
    })

    window.location = originalLocation
  })

  it('displays controlled safe error message when provider is unconfigured (503)', async () => {
    vi.mocked(api.get).mockRejectedValueOnce({
      response: {
        status: 503,
        data: {
          detail: 'Google authentication is not configured in this environment. Please configure provider credentials in .env or sign in with your email/password.',
        },
      },
    })

    render(<SocialAuthButtons mode="login" role="customer" />)
    const googleBtn = screen.getByRole('button', { name: /continue with google/i })

    fireEvent.click(googleBtn)

    await waitFor(() => {
      expect(
        screen.getByText(/Google authentication is not configured in this environment/i)
      ).toBeInTheDocument()
    })
  })

  it('prevents duplicate clicks while request is in progress', async () => {
    const originalLocation = window.location
    delete (window as any).location
    window.location = { ...originalLocation, href: '' } as any

    let resolvePromise: any
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    vi.mocked(api.get).mockReturnValueOnce(pendingPromise as any)

    render(<SocialAuthButtons mode="login" role="customer" />)
    const googleBtn = screen.getByRole('button', { name: /continue with google/i })

    fireEvent.click(googleBtn)

    // Button should now be disabled while the request is in flight
    expect(googleBtn).toBeDisabled()

    // Second click should be ignored
    fireEvent.click(googleBtn)
    expect(api.get).toHaveBeenCalledTimes(1)

    resolvePromise({ data: { url: 'https://done' } })
    window.location = originalLocation
  })
})
