import { useState, useRef, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type AuthContextType = {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  isAuthenticated?: boolean
  loading?: boolean
  user?: unknown
  logout?: () => void
}
import AnimatedBackground from '../components/auth/AnimatedBackground'
import FloatingKpiWidgets from '../components/auth/FloatingKpiWidgets'
import AuthLogo from '../components/auth/AuthLogo'
import TrustBadges from '../components/auth/TrustBadges'
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal'
import ToastHost from '../components/auth/ToastHost'

export default function Login() {
  const { login } = useAuth() as unknown as AuthContextType
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [fieldSuccess, setFieldSuccess] = useState<{ email?: boolean; password?: boolean }>({})

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const clearFieldError = (field: 'email' | 'password') => {
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field === 'email' ? 'email' : 'password']
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setFieldSuccess({})

    const identifier = email.trim()
    const pwd = password

    let hasError = false

    if (!identifier) {
      showFieldError('email', 'Email is required.')
      hasError = true
    } else {
      showFieldSuccess('email')
    }

    if (!pwd) {
      showFieldError('password', 'Password is required.')
      hasError = true
    } else {
      showFieldSuccess('password')
    }

    if (hasError) return

    setLoading(true)

    try {
      const res = await login(identifier, pwd)
      if (res.success) {
        showFieldSuccess('email')
        showFieldSuccess('password')
        setLoading(false)
        navigate('/app/home')
      } else {
        setLoading(false)
        showFieldError('email', res.error || 'Invalid credentials')
        showFieldError('password', 'Invalid credentials')
        setError(res.error || 'Wrong password or invalid credentials')
      }
    } catch {
      setLoading(false)
      showFieldError('email', 'Wrong password or invalid credentials')
      showFieldError('password', 'Invalid credentials')
      setError('Wrong password or invalid credentials')
    }
  }

  const getInputClass = (field: 'email' | 'password') => {
    const cls = ['form-input']
    if (fieldErrors[field]) cls.push('input-error')
    else if (fieldSuccess[field]) cls.push('input-success')
    return cls.join(' ')
  }

  const getFeedbackContent = (field: 'email' | 'password') => {
    const err = fieldErrors[field]
    if (err) {
      return (
        <div className="input-feedback error">
          <span className="feedback-icon">{'\u26A0'}</span> {err}
        </div>
      )
    }
    if (fieldSuccess[field]) {
      return <div className="input-feedback success" />
    }
    return <div className="input-feedback" />
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
            <p className="auth-subheading">Login to access your Solar Intelligence Dashboard</p>
          </div>

          <div
            className={`auth-error-banner${error ? ' visible' : ''}`}
            id="loginError"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>

          <form className="auth-form" id="loginForm" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="loginEmail">Email Address / Mobile Number</label>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  ref={emailRef}
                  className={getInputClass('email')}
                  type="text"
                  id="loginEmail"
                  name="email"
                  placeholder="you@example.com or 9XXXXXXXXX"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearFieldError('email') }}
                  required
                />
              </div>
              {getFeedbackContent('email')}
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="loginPassword">Password</label>
                <button
                  type="button"
                  className="forgot-link"
                  id="forgotPasswordBtn"
                  onClick={() => setForgotModalOpen(true)}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  ref={passwordRef}
                  className={getInputClass('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="loginPassword"
                  name="password"
                  placeholder={'\u2022'.repeat(8)}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearFieldError('password') }}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  id="toggleLoginPwd"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  <svg id="eyeIconLogin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="m6.75 5.25 10.5 13.5" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              {getFeedbackContent('password')}
            </div>

            <div className="form-options-row">
              <label className="checkbox-label" htmlFor="rememberMe">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="custom-checkbox" />
                <span>Remember Me</span>
              </label>
            </div>

            <button className="btn-primary-auth" type="submit" id="loginBtn" disabled={loading}>
              <span className="btn-text" style={{ opacity: loading ? 0.5 : 1 }}>
                {loading ? 'Logging In...' : 'Login & Continue \u2192'}
              </span>
              <span className={`btn-spinner${loading ? ' active' : ''}`} aria-hidden="true" />
              <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: loading ? 0 : 1 }}>
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>

          <div className="auth-divider"><span>or continue with</span></div>

          <div className="social-buttons">
            <button className="btn-social" id="googleBtn" type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button className="btn-social" id="microsoftBtn" type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022" />
                <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00" />
                <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF" />
                <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900" />
              </svg>
              Microsoft
            </button>
          </div>

          <TrustBadges />

          <p className="auth-footer-text">
            New to GET Solar Energy?
            <Link to="/signup" className="auth-link" id="goToSignup"> Create Account</Link>
          </p>
        </div>
      </main>

      <ForgotPasswordModal
        open={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
      />

      <ToastHost />
    </>
  )
}
