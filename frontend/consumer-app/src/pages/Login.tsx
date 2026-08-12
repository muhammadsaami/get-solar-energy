import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AUTH_PROVIDERS } from '../config/auth'
import type { Role } from '../config/roles'

type AuthContextType = {
  login: (email: string, password: string, roleHint?: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  technicianLogin: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  isAuthenticated?: boolean
  loading?: boolean
  user?: { role: Role } | null
  logout?: () => void
}

import AnimatedBackground from '../components/auth/AnimatedBackground'
import FloatingKpiWidgets from '../components/auth/FloatingKpiWidgets'
import AuthLogo from '../components/auth/AuthLogo'
import TrustBadges from '../components/auth/TrustBadges'
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal'
import ToastHost from '../components/auth/ToastHost'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const { login, technicianLogin } = useAuth() as unknown as AuthContextType
  const navigate = useNavigate()

  const [searchParams] = useSearchParams()
  const roleParam = searchParams.get('role')
  const [authMode, setAuthMode] = useState<'customer' | 'vendor' | 'technician'>(
    roleParam === 'technician' ? 'technician' :
    roleParam === 'vendor' ? 'vendor' : 'customer'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [fieldSuccess, setFieldSuccess] = useState<{ email?: boolean; password?: boolean }>({})

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const clearFieldError = (field: 'email' | 'password') => {
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    setError('')
  }

  const showFieldError = (field: 'email' | 'password', message: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: message }))
    setFieldSuccess((prev) => ({ ...prev, [field]: false }))
  }

  const showFieldSuccess = (field: 'email' | 'password') => {
    setFieldSuccess((prev) => ({ ...prev, [field]: true }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockOn(true)
    } else {
      setCapsLockOn(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setFieldErrors({})
    setFieldSuccess({})

    const identifier = email.trim()
    const pwd = password

    let hasError = false

    if (!identifier) {
      showFieldError('email', 'Email is required.')
      hasError = true
    } else if (authMode === 'customer' && !EMAIL_REGEX.test(identifier) && !/^\d{10}$/.test(identifier.replace(/\s/g, ''))) {
      showFieldError('email', 'Enter a valid email or 10-digit mobile number.')
      hasError = true
    } else {
      showFieldSuccess('email')
    }

    if (!pwd) {
      showFieldError('password', 'Password is required.')
      hasError = true
    } else if (pwd.length < 8) {
      showFieldError('password', 'Password must contain at least 8 characters.')
      hasError = true
    } else {
      showFieldSuccess('password')
    }

    if (hasError) return

    setLoading(true)

    try {
      const loginFn = authMode === 'technician'
        ? (em: string, pw: string) => technicianLogin(em, pw, rememberMe)
        : (em: string, pw: string) => login(em, pw, authMode, rememberMe)
      const provider = AUTH_PROVIDERS[authMode]
      const res = await loginFn(identifier, pwd)
      
      if (res.success) {
        showFieldSuccess('email')
        showFieldSuccess('password')
        
        const redirectLabel =
          authMode === 'vendor' ? 'Redirecting to Vendor Workspace...' :
          authMode === 'technician' ? 'Redirecting to Technician Portal...' :
          'Redirecting to Dashboard...'
        
        setSuccessMsg(redirectLabel)
        
        setTimeout(() => {
          setLoading(false)
          navigate(provider.defaultRoute)
        }, 800)
      } else {
        setLoading(false)
        showFieldError('email', 'Incorrect email or password.')
        showFieldError('password', 'Incorrect email or password.')
        setError('Incorrect email or password. Please check your credentials.')
      }
    } catch {
      setLoading(false)
      showFieldError('email', 'Incorrect email or password.')
      showFieldError('password', 'Incorrect email or password.')
      setError('Incorrect email or password. Please try again.')
    }
  }

  const getInputClass = (field: 'email' | 'password') => {
    const cls = ['form-input']
    if (fieldErrors[field]) cls.push('input-error')
    else if (fieldSuccess[field]) cls.push('input-success')
    return cls.join(' ')
  }

  const getFeedbackContent = (field: 'email' | 'password') => {
    if (fieldErrors[field]) {
      return (
        <span className="field-feedback error" id={`${field}Error`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {fieldErrors[field]}
        </span>
      )
    }
    if (fieldSuccess[field]) {
      return (
        <span className="field-feedback success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><polyline points="20 6 9 17 4 12" /></svg>
          Valid entry
        </span>
      )
    }
    return null
  }

  const getEmailPlaceholder = () => {
    if (authMode === 'vendor') return 'Enter company email (e.g. contact@epcsolar.in)'
    if (authMode === 'technician') return 'Enter registered mobile or email'
    return 'Enter your email address'
  }

  const getButtonText = () => {
    if (loading) {
      if (authMode === 'vendor') return 'Signing In as Vendor...'
      if (authMode === 'technician') return 'Signing In as Technician...'
      return 'Signing In...'
    }
    if (authMode === 'vendor') return 'Sign In as Vendor'
    if (authMode === 'technician') return 'Sign In as Technician'
    return 'Sign In as Customer'
  }

  return (
    <>
      <AnimatedBackground />
      <FloatingKpiWidgets />

      <main className="auth-wrapper" id="authWrapper">
        <div className="auth-card" id="loginCard">
          <AuthLogo id="login" />

          <div className="auth-heading-block">
            <h1 className="auth-heading">Welcome Back</h1>
            <p className="auth-subheading">{AUTH_PROVIDERS[authMode]?.description}</p>
          </div>

          <div className="auth-role-toggle" role="radiogroup" aria-label="Login type">
            {Object.entries(AUTH_PROVIDERS).map(([key, provider]) => (
              <button
                key={key}
                type="button"
                className={`auth-role-btn${authMode === key ? ' active' : ''}`}
                role="radio"
                aria-checked={authMode === key}
                disabled={loading}
                onClick={() => {
                  setAuthMode(key as 'customer' | 'vendor' | 'technician')
                  setError('')
                  setSuccessMsg('')
                  setFieldErrors({})
                  setFieldSuccess({})
                }}
              >
                {provider.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="auth-error-banner visible" id="loginError" role="alert" aria-live="polite">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '8px', padding: '12px 16px', color: '#10B981', fontSize: '13px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px'
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
              <span>{successMsg}</span>
            </div>
          )}

          <form className="auth-form" id="loginForm" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="loginEmail">
                {authMode === 'vendor' ? 'Business Email Address' : authMode === 'technician' ? 'Mobile / Email' : 'Email Address / Mobile'}
              </label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  ref={emailRef}
                  className={getInputClass('email')}
                  type="text"
                  id="loginEmail"
                  name="email"
                  placeholder={getEmailPlaceholder()}
                  value={email}
                  disabled={loading}
                  onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                  autoComplete="username"
                />
              </div>
              {getFeedbackContent('email')}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="loginPassword">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  ref={passwordRef}
                  className={getInputClass('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="loginPassword"
                  name="password"
                  placeholder="Enter your password"
                  value={password}
                  disabled={loading}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyDown}
                  onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
              {capsLockOn && (
                <span style={{ fontSize: '11px', color: '#F59E0B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><polygon points="12 2 2 22 22 22" /></svg>
                  Caps Lock is ON
                </span>
              )}
              {getFeedbackContent('password')}
            </div>

            <div className="auth-form-row">
              <label className="remember-me-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={loading}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <button
                type="button"
                className="forgot-password-link"
                disabled={loading}
                onClick={() => setForgotModalOpen(true)}
              >
                Forgot your password?
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              id="loginSubmit"
              disabled={loading}
            >
              {loading ? (
                <div className="btn-spinner" />
              ) : (
                getButtonText()
              )}
            </button>
          </form>

          <div className="auth-footer-text" style={{ marginTop: '20px' }}>
            {authMode === 'vendor' ? (
              <>Join the GET Solar Vendor Network. <Link to="/signup?role=vendor" className="auth-link">Register Vendor</Link></>
            ) : authMode === 'technician' ? (
              <>Become a certified GET Solar Technician. <Link to="/signup?role=technician" className="auth-link">Register Technician</Link></>
            ) : (
              <>New to GET Solar Energy? <Link to="/signup?role=customer" className="auth-link">Create your customer account.</Link></>
            )}
          </div>
        </div>
      </main>

      <TrustBadges />
      <ForgotPasswordModal open={forgotModalOpen} onClose={() => setForgotModalOpen(false)} />
      <ToastHost />
    </>
  )
}
