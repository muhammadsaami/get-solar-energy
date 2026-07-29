import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

import AnimatedBackground from '../components/auth/AnimatedBackground'
import FloatingKpiWidgets from '../components/auth/FloatingKpiWidgets'
import AuthLogo from '../components/auth/AuthLogo'
import TrustBadges from '../components/auth/TrustBadges'
import PasswordStrengthMeter from '../components/auth/PasswordStrengthMeter'
import ToastHost from '../components/auth/ToastHost'
import { authService } from '../services/auth.service'
import { calcPasswordStrength } from '../utils/password'

const MOBILE_REGEX = /^[6-9]\d{9}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FieldErrors {
  name?: string
  mobile?: string
  email?: string
  password?: string
  confirm?: string
}

export default function Signup() {
  const navigate = useNavigate()
  const { setSession } = useAuth() as unknown as { setSession: (token: string, user: unknown) => void }

  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [fieldSuccess, setFieldSuccess] = useState<Record<string, boolean>>({})

  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const estCity = localStorage.getItem('solar_estimate_city')
      const estBill = localStorage.getItem('solar_estimate_bill')
      ;(window as unknown as Record<string, unknown>).__solarEstimate = estCity
        ? { city: estCity, bill: estBill }
        : undefined
    } catch {
      // localStorage not available
    }
  }, [])

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    setError('')
  }

  const showFieldError = (field: keyof FieldErrors, message: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: message }))
    setFieldSuccess((prev) => ({ ...prev, [field]: false }))
  }

  const getInputClass = (field: keyof FieldErrors) => {
    const cls = ['form-input']
    if (fieldErrors[field]) cls.push('input-error')
    else if (fieldSuccess[field]) cls.push('input-success')
    return cls.join(' ')
  }

  const getFeedback = (field: keyof FieldErrors) => {
    const err = fieldErrors[field]
    if (err) {
      return (
        <div className="input-feedback error">
          <span className="feedback-icon">{'\u26A0'}</span> {err}
        </div>
      )
    }
    return <div className="input-feedback" />
  }

  const strength = calcPasswordStrength(password)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setFieldSuccess({})

    const fields: FieldErrors = {}
    const trimmedName = name.trim()
    const trimmedMobile = mobile.trim()
    const trimmedEmail = email.trim()
    const pwd = password
    const pwdConfirm = confirm

    let hasError = false

    if (!trimmedName) {
      fields.name = 'Full name is required.'
      hasError = true
    } else {
      setFieldSuccess((s) => ({ ...s, name: true }))
    }

    if (!trimmedMobile || !MOBILE_REGEX.test(trimmedMobile.replace(/\s/g, ''))) {
      fields.mobile = 'Enter a valid 10-digit mobile number.'
      hasError = true
    } else {
      setFieldSuccess((s) => ({ ...s, mobile: true }))
    }

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      fields.email = 'Enter a valid email address.'
      hasError = true
    } else {
      setFieldSuccess((s) => ({ ...s, email: true }))
    }

    if (pwd.length < 8) {
      fields.password = 'Password must be at least 8 characters.'
      hasError = true
    } else {
      setFieldSuccess((s) => ({ ...s, password: true }))
    }

    if (!pwdConfirm || pwd !== pwdConfirm) {
      fields.confirm = 'Passwords do not match.'
      hasError = true
    } else {
      setFieldSuccess((s) => ({ ...s, confirm: true }))
    }

    if (Object.keys(fields).length > 0) {
      setFieldErrors(fields)
    }

    if (hasError) return

    setLoading(true)

    try {
      const est = ((window as unknown as Record<string, { city?: string }>).__solarEstimate)
      const result = await authService.signup({
        name: trimmedName,
        phone: trimmedMobile,
        email: trimmedEmail,
        password: pwd,
        city: est?.city || 'Lucknow',
      })
      setLoading(false)

      if (result.token) {
        localStorage.setItem('access_token', result.token)
        localStorage.setItem('user', JSON.stringify(result.user))
        setSession(result.token, result.user)
      }

      navigate('/app/home')
    } catch (err: unknown) {
      setLoading(false)
      const msg =
        err instanceof Error ? err.message : 'Signup failed. Please try again.'
      showFieldError('email', msg)
      setError(msg)
    }
  }

  return (
    <>
      <AnimatedBackground />
      <FloatingKpiWidgets />

      <main className="auth-wrapper" id="authWrapper">
        <div className="auth-card auth-card-wide" id="signupCard">
          <AuthLogo id="signup" />

          <div className="auth-heading-block">
            <h1 className="auth-heading">Create Account</h1>
            <p className="auth-subheading">Start your solar intelligence journey today</p>
          </div>

          <div
            className={`auth-error-banner${error ? ' visible' : ''}`}
            id="signupError"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>

          <form className="auth-form" id="signupForm" onSubmit={handleSubmit} noValidate>
            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label" htmlFor="signupName">Full Name</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    ref={nameRef}
                    className={getInputClass('name')}
                    type="text"
                    id="signupName"
                    name="name"
                    placeholder="Muhammad Haq"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); clearFieldError('name') }}
                    required
                  />
                </div>
                {getFeedback('name')}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signupMobile">Mobile Number</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <path d="M12 18h.01" />
                  </svg>
                  <input
                    className={getInputClass('mobile')}
                    type="tel"
                    id="signupMobile"
                    name="mobile"
                    placeholder="9XXXXXXXXX"
                    autoComplete="tel"
                    value={mobile}
                    onChange={(e) => { setMobile(e.target.value); clearFieldError('mobile') }}
                    required
                  />
                </div>
                {getFeedback('mobile')}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signupEmail">Email Address</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  className={getInputClass('email')}
                  type="email"
                  id="signupEmail"
                  name="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearFieldError('email') }}
                  required
                />
              </div>
              {getFeedback('email')}
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label" htmlFor="signupPassword">Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    className={getInputClass('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="signupPassword"
                    name="password"
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearFieldError('password') }}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    id="toggleSignupPwd"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                {getFeedback('password')}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signupConfirm">Confirm Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 11 2 2 4-4" />
                  </svg>
                  <input
                    className={getInputClass('confirm')}
                    type={showConfirm ? 'text' : 'password'}
                    id="signupConfirm"
                    name="confirmPassword"
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); clearFieldError('confirm') }}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    id="toggleSignupConfirm"
                    aria-label="Toggle confirm password visibility"
                    onClick={() => setShowConfirm((prev) => !prev)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {showConfirm ? (
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
                {getFeedback('confirm')}
              </div>
            </div>

            <PasswordStrengthMeter strength={strength} visible={password.length > 0} />

            <button className="btn-primary-auth" type="submit" id="signupBtn" disabled={loading}>
              <span className="btn-text" style={{ opacity: loading ? 0.5 : 1 }}>
                {loading ? 'Creating Account...' : 'Create My Account \u2192'}
              </span>
              <span className={`btn-spinner${loading ? ' active' : ''}`} aria-hidden="true" />
              <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: loading ? 0 : 1 }}>
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>

          <TrustBadges />

          <p className="auth-footer-text">
            Already have an account?
            <Link to="/" className="auth-link"> Login</Link>
          </p>
        </div>
      </main>

      <ToastHost />
    </>
  )
}
