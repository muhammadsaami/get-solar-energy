import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AUTH_PROVIDERS } from '../config/auth'

import AnimatedBackground from '../components/auth/AnimatedBackground'
import FloatingKpiWidgets from '../components/auth/FloatingKpiWidgets'
import AuthLogo from '../components/auth/AuthLogo'
import TrustBadges from '../components/auth/TrustBadges'
import PasswordStrengthMeter from '../components/auth/PasswordStrengthMeter'
import ToastHost from '../components/auth/ToastHost'
import { authService } from '../services/auth/auth.service'
import { calcPasswordStrength } from '../utils/password'

const MOBILE_REGEX = /^[6-9]\d{9}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FieldErrors {
  name?: string
  mobile?: string
  email?: string
  password?: string
  confirm?: string
  gst?: string
  category?: string
}

const ROLE_BENEFITS: Record<string, string[]> = {
  customer: [
    'Monitor solar generation',
    'Analyze electricity bills',
    'Track savings',
    'Government subsidy eligibility',
    'AI recommendations',
  ],
  vendor: [
    'Project Management',
    'Customer CRM',
    'AMC Management',
    'Team Management',
    'Analytics & Business Reports',
  ],
  technician: [
    'Work Orders Dispatch',
    'Certifications & Badge',
    'AI Troubleshooting Assistant',
    'Earnings & Payouts',
    'Training Academy',
  ],
}

export default function Signup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roleParam = searchParams.get('role')

  const { setSession, technicianSignup } = useAuth() as unknown as {
    setSession: (token: string, user: unknown) => void
    technicianSignup: (data: Record<string, string>) => Promise<{ success: boolean; error?: string }>
  }

  const [signupMode, setSignupMode] = useState<'customer' | 'vendor' | 'technician'>(
    roleParam === 'technician' ? 'technician' :
    roleParam === 'vendor' ? 'vendor' : 'customer'
  )

  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [gst, setGst] = useState('')
  const [category, setCategory] = useState('Solar Installation & Mounting')
  const [certNum, setCertNum] = useState('')

  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)
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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockOn(true)
    } else {
      setCapsLockOn(false)
    }
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
    setSuccessMsg('')
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
      fields.name = signupMode === 'vendor' ? 'Company name is required.' : 'Full name is required.'
      hasError = true
    } else {
      setFieldSuccess((s) => ({ ...s, name: true }))
    }

    if (!trimmedMobile || !MOBILE_REGEX.test(trimmedMobile.replace(/\s/g, ''))) {
      fields.mobile = 'Mobile number must contain 10 digits.'
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
      fields.password = 'Password must contain at least 8 characters.'
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
      if (signupMode === 'technician') {
        const res = await technicianSignup({
          name: trimmedName,
          phone: trimmedMobile,
          email: trimmedEmail,
          password: pwd,
          category,
          certNum,
          city: 'Lucknow',
        })

        if (res.success) {
          setSuccessMsg('Technician account created successfully. Complete your profile to receive assignments.')
          setTimeout(() => {
            setLoading(false)
            navigate('/app/technician/dashboard')
          }, 1000)
        } else {
          setLoading(false)
          showFieldError('email', res.error || 'Signup failed')
          setError(res.error || 'Signup failed. Please try again.')
        }
        return
      }

      if (signupMode === 'vendor') {
        const result = await authService.signup({
          name: trimmedName,
          phone: trimmedMobile,
          email: trimmedEmail,
          password: pwd,
          city: 'Lucknow',
          role: 'vendor',
          gst: gst || '',
        })

        if (result.token) {
          setSession(result.token, result.user)
          setSuccessMsg('Vendor account created successfully. Welcome to the EPC Workspace.')
          setTimeout(() => {
            setLoading(false)
            navigate('/app/vendor/dashboard')
          }, 1000)
        } else {
          setLoading(false)
          setError(result.message || 'Vendor registration failed. Please try again.')
        }
        return
      }


      const est = ((window as unknown as Record<string, { city?: string }>).__solarEstimate)
      const result = await authService.signup({
        name: trimmedName,
        phone: trimmedMobile,
        email: trimmedEmail,
        password: pwd,
        city: est?.city || 'Lucknow',
      })

      if (result.token) {
        setSession(result.token, result.user)
      }

      setSuccessMsg('Welcome to GET Solar Energy. Your customer account has been created successfully.')
      setTimeout(() => {
        setLoading(false)
        navigate('/app/home')
      }, 1000)
    } catch (err: unknown) {
      setLoading(false)
      const msg = err instanceof Error ? err.message : 'Signup failed. Please try again.'
      showFieldError('email', msg)
      setError(msg)
    }
  }

  const getHeadingText = () => {
    if (signupMode === 'vendor') return 'Join the Vendor Network'
    if (signupMode === 'technician') return 'Join the Technician Network'
    return 'Create Your Account'
  }

  const getSubheadingText = () => {
    if (signupMode === 'vendor') return 'Register your EPC company and manage installations, customers, payments, inventory, and business growth.'
    if (signupMode === 'technician') return 'Become a certified solar technician and access work opportunities across India.'
    return 'Start your solar intelligence journey today.'
  }

  const getSubmitButtonText = () => {
    if (loading) {
      if (signupMode === 'vendor') return 'Creating Vendor Account...'
      if (signupMode === 'technician') return 'Creating Technician Account...'
      return 'Creating Customer Account...'
    }
    if (signupMode === 'vendor') return 'Create Vendor Account'
    if (signupMode === 'technician') return 'Create Technician Account'
    return 'Create Customer Account'
  }

  return (
    <>
      <AnimatedBackground />
      <FloatingKpiWidgets />

      <main className="auth-wrapper" id="authWrapper">
        <div className="auth-card auth-card-wide" id="signupCard">
          <AuthLogo id="signup" />

          <div className="auth-heading-block">
            <h1 className="auth-heading">{getHeadingText()}</h1>
            <p className="auth-subheading">{getSubheadingText()}</p>
          </div>

          <div className="auth-role-toggle" role="radiogroup" aria-label="Account type">
            {(['customer', 'vendor', 'technician'] as const).map((key) => {
              const provider = AUTH_PROVIDERS[key]
              if (!provider) return null
              return (
                <button
                  key={key}
                  type="button"
                  className={`auth-role-btn${signupMode === key ? ' active' : ''}`}
                  role="radio"
                  aria-checked={signupMode === key}
                  disabled={loading}
                  onClick={() => {
                    setSignupMode(key)
                    setError('')
                    setSuccessMsg('')
                    setFieldErrors({})
                    setFieldSuccess({})
                  }}
                >
                  {provider.label}
                </button>
              )
            })}
          </div>

          {/* Role Benefits Pills */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px',
            padding: '10px 14px', borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)'
          }}>
            {ROLE_BENEFITS[signupMode]?.map((b) => (
              <span key={b} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: 'var(--accent-orange)' }}>•</span> {b}
              </span>
            ))}
          </div>

          {error && (
            <div className="auth-error-banner visible" id="signupError" role="alert" aria-live="polite">
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

          <form className="auth-form" id="signupForm" onSubmit={handleSubmit} noValidate>
            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label" htmlFor="signupName">
                  {signupMode === 'vendor' ? 'Company Name' : 'Full Name'}
                </label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {signupMode === 'vendor' ? <path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4M9 3h6l2 4H7l2-4z" /> : <>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </>}
                  </svg>
                  <input
                    ref={nameRef}
                    className={getInputClass('name')}
                    type="text"
                    id="signupName"
                    name="name"
                    disabled={loading}
                    placeholder={
                      signupMode === 'vendor' ? 'Enter registered EPC company name' :
                      signupMode === 'technician' ? 'Enter your full legal name' : 'Muhammad Haq'
                    }
                    autoComplete="name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); clearFieldError('name') }}
                    required
                  />
                </div>
                {getFeedback('name')}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signupMobile">
                  {signupMode === 'vendor' ? 'Business Phone' : 'Mobile Number'}
                </label>
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
                    disabled={loading}
                    placeholder={signupMode === 'vendor' ? 'Enter 10-digit business phone number' : 'Enter 10-digit mobile number'}
                    autoComplete="tel"
                    value={mobile}
                    onChange={(e) => { setMobile(e.target.value); clearFieldError('mobile') }}
                    required
                  />
                </div>
                {getFeedback('mobile')}
              </div>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label" htmlFor="signupEmail">
                  {signupMode === 'vendor' ? 'Business Email' : 'Email Address'}
                </label>
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
                    disabled={loading}
                    placeholder={
                      signupMode === 'vendor' ? 'Enter company email (e.g. contact@epcsolar.in)' :
                      'Enter your email address'
                    }
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearFieldError('email') }}
                    required
                  />
                </div>
                {getFeedback('email')}
              </div>

              {signupMode === 'vendor' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="signupGst">GST Number (Optional)</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="12" x2="13" y2="12" /></svg>
                    <input
                      className="form-input"
                      type="text"
                      id="signupGst"
                      name="gst"
                      disabled={loading}
                      placeholder="Enter 15-digit GSTIN (optional/preferred)"
                      value={gst}
                      onChange={(e) => setGst(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {signupMode === 'technician' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="signupCategory">Skill Category</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                    <select
                      className="form-input"
                      id="signupCategory"
                      disabled={loading}
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{ paddingLeft: '38px', color: '#fff', backgroundColor: 'rgba(15, 23, 42, 0.9)' }}
                    >
                      <option value="Solar Installation & Mounting">Solar Installation & Mounting</option>
                      <option value="Electrical & Inverter Commissioning">Electrical & Inverter Commissioning</option>
                      <option value="Maintenance & AMC">Maintenance & AMC</option>
                      <option value="QA & Inspection">QA & Inspection</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {signupMode === 'technician' && (
              <div className="form-group">
                <label className="form-label" htmlFor="signupCert">Certification Number (Optional)</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  <input
                    className="form-input"
                    type="text"
                    id="signupCert"
                    disabled={loading}
                    placeholder="Enter solar certification ID (optional)"
                    value={certNum}
                    onChange={(e) => setCertNum(e.target.value)}
                  />
                </div>
              </div>
            )}

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
                    disabled={loading}
                    placeholder="Enter your password (min 8 chars)"
                    autoComplete="new-password"
                    value={password}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyDown}
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
                {capsLockOn && (
                  <span style={{ fontSize: '11px', color: '#F59E0B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><polygon points="12 2 2 22 22 22" /></svg>
                    Caps Lock is ON
                  </span>
                )}
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
                    disabled={loading}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    value={confirm}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyDown}
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
                {getSubmitButtonText()}
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
            <Link to={signupMode === 'vendor' ? '/login?role=vendor' : signupMode === 'technician' ? '/login?role=technician' : '/login'} className="auth-link"> Login</Link>
          </p>
        </div>
      </main>

      <ToastHost />
    </>
  )
}
