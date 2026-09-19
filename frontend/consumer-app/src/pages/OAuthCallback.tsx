import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api/client'
import { ROUTES } from '../config/routes'
import AnimatedBackground from '../components/auth/AnimatedBackground'
import OfficialLogo from '../components/brand/OfficialLogo'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const { provider: routeProvider } = useParams<{ provider?: string }>()
  const [searchParams] = useSearchParams()
  const { setSession } = useAuth() as unknown as {
    setSession: (token: string, user: unknown) => void
  }

  const [statusMessage, setStatusMessage] = useState('Verifying your credentials...')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const processedRef = useRef(false)

  const provider = (routeProvider || searchParams.get('provider') || 'google').toLowerCase()
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true

    // Check for provider-side cancellation or error
    if (errorParam) {
      const msg = errorDescription || errorParam === 'access_denied'
        ? 'Sign-in was cancelled or access was denied.'
        : `Authentication failed: ${errorParam}`
      setErrorMessage(msg)
      setTimeout(() => {
        navigate(ROUTES.LOGIN, { state: { error: msg }, replace: true })
      }, 2500)
      return
    }

    if (!code || !state) {
      const msg = 'Missing authorization code or state from provider callback.'
      setErrorMessage(msg)
      setTimeout(() => {
        navigate(ROUTES.LOGIN, { state: { error: msg }, replace: true })
      }, 2500)
      return
    }

    const exchangeCode = async () => {
      try {
        setStatusMessage(`Authenticating with ${provider.charAt(0).toUpperCase() + provider.slice(1)}...`)
        const res = await api.post(`/auth/oauth/${provider}/callback`, { code, state })

        if (res.data && res.data.access_token && res.data.user) {
          setStatusMessage('Securing your customer session...')
          setSession(res.data.access_token, res.data.user)
          // Clean transition to customer home
          setTimeout(() => {
            navigate(ROUTES.HOME, { replace: true })
          }, 400)
        } else {
          throw new Error('Incomplete session payload returned by server.')
        }
      } catch (err: any) {
        let errDetail = 'Failed to complete social authentication. Please try logging in with your password.'
        if (err?.response?.data?.detail) {
          errDetail = err.response.data.detail
        } else if (err?.message) {
          errDetail = err.message
        }
        setErrorMessage(errDetail)
        setTimeout(() => {
          navigate(ROUTES.LOGIN, { state: { error: errDetail }, replace: true })
        }, 3000)
      }
    }

    exchangeCode()
  }, [code, state, errorParam, errorDescription, provider, navigate, setSession])

  return (
    <>
      <AnimatedBackground />
      <main className="auth-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div
          className="auth-card"
          style={{
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
            padding: '36px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <OfficialLogo height={44} />
          </div>

          {errorMessage ? (
            <div role="alert" aria-live="assertive" style={{ width: '100%' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#ef4444',
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f87171', margin: '0 0 8px' }}>
                Authentication Failed
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 16px' }}>
                {errorMessage}
              </p>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                Redirecting back to login...
              </span>
            </div>
          ) : (
            <div role="status" aria-live="polite" style={{ width: '100%' }}>
              <div
                className="btn-spinner"
                style={{
                  width: '36px',
                  height: '36px',
                  margin: '0 auto 20px',
                  border: '3px solid rgba(255, 255, 255, 0.15)',
                  borderTopColor: 'var(--color-brand-cyan, #00d2ff)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px' }}>
                Signing you in
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                {statusMessage}
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
