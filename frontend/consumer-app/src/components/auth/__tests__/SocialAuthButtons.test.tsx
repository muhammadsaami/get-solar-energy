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

  it('renders "Continue with Google" and "Continue with Microsoft" for customer login', () => {
    render(<SocialAuthButtons mode="login" role="customer" />)

    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with microsoft/i })).toBeInTheDocument()
  })

  it('renders "Sign up with Google" and "Sign up with Microsoft" for customer signup', () => {
    render(<SocialAuthButtons mode="signup" role="customer" />)

    expect(screen.getByRole('button', { name: /sign up with google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up with microsoft/i })).toBeInTheDocument()
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

  it('initiates OAuth request on Microsoft button click and redirects to returned URL', async () => {
    const originalLocation = window.location
    delete (window as any).location
    window.location = { ...originalLocation, href: '' } as any

    vi.mocked(api.get).mockResolvedValueOnce({
      data: { url: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?test=1', state: 'signed.state' },
    } as any)

    render(<SocialAuthButtons mode="login" role="customer" />)
    const msBtn = screen.getByRole('button', { name: /continue with microsoft/i })

    fireEvent.click(msBtn)

    expect(api.get).toHaveBeenCalledWith('/auth/oauth/microsoft/url')
    await waitFor(() => {
      expect(window.location.href).toBe('https://login.microsoftonline.com/common/oauth2/v2.0/authorize?test=1')
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
    const msBtn = screen.getByRole('button', { name: /continue with microsoft/i })

    fireEvent.click(googleBtn)

    // Both buttons should now be disabled
    expect(googleBtn).toBeDisabled()
    expect(msBtn).toBeDisabled()

    // Second click on Microsoft should be ignored
    fireEvent.click(msBtn)
    expect(api.get).toHaveBeenCalledTimes(1)

    resolvePromise({ data: { url: 'https://done' } })
    window.location = originalLocation
  })
})
