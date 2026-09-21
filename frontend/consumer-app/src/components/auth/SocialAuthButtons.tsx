import React, { useState } from 'react'
import api from '../../services/api/client'

interface SocialAuthButtonsProps {
  mode?: 'login' | 'signup'
  role?: 'customer' | 'vendor' | 'technician'
  disabled?: boolean
  onError?: (msg: string) => void
}

export default function SocialAuthButtons({
  mode = 'login',
  role = 'customer',
  disabled = false,
  onError,
}: SocialAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<'google' | null>(null)
  const [localError, setLocalError] = useState<string>('')

  // Strictly Customer Only — do not render for vendor or technician
  if (role !== 'customer') {
    return null
  }

  const handleOAuthClick = async (provider: 'google') => {
    if (disabled || loadingProvider) return
    setLocalError('')
    setLoadingProvider(provider)

    try {
      const res = await api.get<{ url: string; state: string }>(`/auth/oauth/${provider}/url`)
      if (res.data && res.data.url) {
        // Redirect browser to official provider consent screen
        window.location.href = res.data.url
      } else {
        throw new Error('Authorization URL was not provided by backend.')
      }
    } catch (err: any) {
      setLoadingProvider(null)
      const providerLabel = 'Google'
      let errorMessage = `${providerLabel} authentication is not configured in this environment. Please configure provider credentials in .env or sign in with your email/password.`

      if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail
      }

      setLocalError(errorMessage)
      if (onError) {
        onError(errorMessage)
      }
    }
  }

  const isBusy = disabled || Boolean(loadingProvider)

  return (
    <div className="social-auth-container" style={{ width: '100%', marginTop: '16px' }}>
      {localError && (
        <div
          className="auth-error-banner visible"
          role="alert"
          aria-live="polite"
          style={{ marginBottom: '14px', fontSize: '12.5px', lineHeight: '1.45' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0, marginTop: '2px' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{localError}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Google Button */}
        <button
          type="button"
          className="btn-social-auth"
          id={`btn${providerTitle('google')}${mode === 'signup' ? 'Signup' : 'Login'}`}
          disabled={isBusy}
          onClick={() => handleOAuthClick('google')}
          aria-label={`${mode === 'signup' ? 'Sign up' : 'Continue'} with Google`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            height: '44px',
            padding: '0 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            color: '#f1f5f9',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: isBusy ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative',
            outline: 'none',
          }}
        >
          {loadingProvider === 'google' ? (
            <div className="btn-spinner" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span>{mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}</span>
        </button>
      </div>
    </div>
  )
}

function providerTitle(p: string): string {
  return p.charAt(0).toUpperCase() + p.slice(1)
}
