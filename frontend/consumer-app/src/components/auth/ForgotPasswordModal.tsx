import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react'
import AuthLogo from './AuthLogo'
import { authService } from '../../services/auth.service'

interface ForgotPasswordModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function ForgotPasswordModal({ open, onClose, onSuccess }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
        return
      }
      if (e.key === 'Tab' && open && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    },
    [open, onClose]
  )

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      setEmail('')
      setError('')
      setSent(false)
      setLoading(false)
      setTimeout(() => emailRef.current?.focus(), 150)
      document.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmed = email.trim()
    if (!trimmed) {
      setError('Email is required.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      await authService.forgotPassword(trimmed)
      setSent(true)
      onSuccess?.()
    } catch {
      setError('Server is currently unreachable. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`auth-modal-overlay${open ? ' active' : ''}`}
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgotModalTitle"
      onClick={(e) => { if (e.target === modalRef.current) onClose() }}
    >
      <div className="auth-modal-card">
        <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Close modal">
          &times;
        </button>

        <AuthLogo id="forgot" showTagline={false} />

        <div className="auth-heading-block">
          <h2 className="auth-heading" id="forgotModalTitle">Forgot your password?</h2>
          <p className="auth-subheading">
            Enter your registered email address and we'll send you a secure password reset link.
          </p>
        </div>

        {!sent ? (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="forgotEmail">Email Address</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  ref={emailRef}
                  className={`form-input${error ? ' input-error' : ''}`}
                  type="email"
                  id="forgotEmail"
                  name="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  required
                  autoComplete="email"
                />
              </div>
              {error && <div className="input-feedback error">{error}</div>}
            </div>

            <button className="btn-primary-auth" type="submit" disabled={loading}>
              <span className="btn-text">{loading ? 'Sending...' : 'Send Reset Link \u2192'}</span>
              <span className={`btn-spinner${loading ? ' active' : ''}`} aria-hidden="true" />
              <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>
        ) : (
          <div className="forgot-success-card">
            <div className="success-icon-badge">{'\u2713'}</div>
            <h3 className="success-title">Email Sent</h3>
            <p className="success-desc">
              If an account exists for this email address, a password reset link has been sent.
              Please check your inbox and spam folder.
            </p>
          </div>
        )}

        <p className="auth-footer-text" style={{ marginTop: '24px' }}>
          <a href="#" className="auth-link" onClick={(e) => { e.preventDefault(); onClose() }}>
            Back to Login
          </a>
        </p>
      </div>
    </div>
  )
}
