import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import AnimatedBackground from '../components/auth/AnimatedBackground'
import AuthLogo from '../components/auth/AuthLogo'
import PasswordRequirements from '../components/auth/PasswordRequirements'
import ToastHost from '../components/auth/ToastHost'
import { authService } from '../services/auth.service'
import { getPasswordRequirements } from '../utils/password'

export default function ResetPassword() {
  const navigate = useNavigate()
  const token = new URLSearchParams(window.location.search).get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(5)

  const pwdRef = useRef<HTMLInputElement>(null)
  const countdownRef = useRef<number | null>(null)

  const requirements = getPasswordRequirements(password)

  useEffect(() => {
    if (!token) {
      setError('Invalid or expired password reset link.')
    }
  }, [token])

  useEffect(() => {
    if (submitted) {
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname)
      }

      countdownRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) window.clearInterval(countdownRef.current)
            navigate('/')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (countdownRef.current) window.clearInterval(countdownRef.current)
    }
  }, [submitted, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const allMet = requirements.every((r) => r.met)
    if (!allMet) {
      setError('Password does not meet all security requirements.')
      return
    }

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      await authService.resetPassword(token!, password)
      setLoading(false)
      setSubmitted(true)
    } catch (err: unknown) {
      setLoading(false)
      const msg =
        err instanceof Error ? err.message : 'Failed to reset password. Please try again.'
      setError(msg)
    }
  }

  return (
    <>
      <AnimatedBackground />

      <main className="auth-wrapper" id="authWrapper">
        <div className="auth-card" id="resetCard">
          <AuthLogo id="reset" />

          <div className="auth-heading-block">
            <h1 className="auth-heading">Reset Password</h1>
            <p className="auth-subheading">Enter a new secure password for your account</p>
          </div>

          <div
            className={`auth-error-banner${error ? ' visible' : ''}`}
            id="resetError"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>

          {!token && (
            <div className="forgot-success-card" id="tokenErrorCard" style={{ display: 'block' }}>
              <div
                className="success-icon-badge"
                style={{ background: 'rgba(234, 67, 53, 0.12)', borderColor: '#ff5b5b', color: '#ff5b5b' }}
              >
                {'\u2715'}
              </div>
              <h3 className="success-title">Link Invalid</h3>
              <p className="success-desc" id="tokenErrorText">
                Invalid or expired password reset link.
              </p>
              <p style={{ marginTop: '24px', display: 'flex', width: '100%' }}>
                <a
                  href="/"
                  className="btn-primary-auth"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '48px', padding: '0 24px', width: '100%' }}
                  onClick={(e) => { e.preventDefault(); navigate('/') }}
                >
                  Return to Login
                </a>
              </p>
            </div>
          )}

          {!submitted && token && (
            <form className="auth-form" id="resetPasswordForm" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="resetPassword">New Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    ref={pwdRef}
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    id="resetPassword"
                    name="password"
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    id="toggleResetPwd"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    <svg id="eyeIconReset" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    className="form-input"
                    type={showConfirm ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirm_password"
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError('') }}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    id="toggleConfirmPwd"
                    aria-label="Toggle confirm password visibility"
                    onClick={() => setShowConfirm((prev) => !prev)}
                  >
                    <svg id="eyeIconConfirm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              </div>

              <PasswordRequirements requirements={requirements} />

              <button className="btn-primary-auth" type="submit" id="resetBtn" style={{ marginTop: '16px' }} disabled={loading}>
                <span className="btn-text" style={{ opacity: loading ? 0.5 : 1 }}>
                  {loading ? 'Resetting...' : 'Reset Password \u2192'}
                </span>
                <span className={`btn-spinner${loading ? ' active' : ''}`} aria-hidden="true" />
                <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: loading ? 0 : 1 }}>
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </form>
          )}

          {submitted && (
            <div className="forgot-success-card" id="resetSuccessCard" style={{ display: 'block' }}>
              <div className="success-icon-badge">{'\u2713'}</div>
              <h3 className="success-title">Password Updated Successfully</h3>
              <p className="success-desc">
                Your password has been updated. You will be redirected to the login page in{' '}
                <strong id="countdownText">{countdown}</strong> seconds.
              </p>
              <p style={{ marginTop: '24px', display: 'flex', width: '100%' }}>
                <a
                  href="/"
                  className="btn-primary-auth"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '48px', padding: '0 24px', width: '100%' }}
                  onClick={(e) => { e.preventDefault(); navigate('/') }}
                >
                  Login Now
                </a>
              </p>
            </div>
          )}
        </div>
      </main>

      <ToastHost />
    </>
  )
}
