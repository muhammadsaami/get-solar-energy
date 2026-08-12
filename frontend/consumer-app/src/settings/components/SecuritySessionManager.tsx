import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { sessionService } from '../../services/auth/session.service'
import type { SessionInfo } from '../../types/auth'

export function SecuritySessionManager() {
  const { logout } = useAuth() as unknown as { logout: () => void }
  const navigate = useNavigate()

  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [loggingOutAll, setLoggingOutAll] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Confirmation modal states
  const [targetSessionToRevoke, setTargetSessionToRevoke] = useState<SessionInfo | null>(null)
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await sessionService.getSessions()
      setSessions(data.sessions || [])
    } catch (err: any) {
      setError(err?.message || 'Unable to load active sessions.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Auto-dismiss toast feedback after 4 seconds
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timer)
  }, [feedback])

  // Handle escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTargetSessionToRevoke(null)
        setShowLogoutAllConfirm(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleRevokeSingle = async (session: SessionInfo) => {
    setRevokingId(session.id)
    setTargetSessionToRevoke(null)
    try {
      await sessionService.revokeSession(session.id)
      setFeedback({ type: 'success', message: `Signed out session on ${session.os} (${session.browser}).` })
      setSessions((prev) => prev.filter((s) => s.id !== session.id))
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to sign out device. Please retry.' })
    } finally {
      setRevokingId(null)
    }
  }

  const handleLogoutAll = async () => {
    setLoggingOutAll(true)
    setShowLogoutAllConfirm(false)
    try {
      await sessionService.logoutAllOtherSessions()
      setFeedback({ type: 'success', message: 'All active sessions have been terminated. Redirecting...' })
      setTimeout(() => {
        logout()
        navigate('/login')
      }, 1200)
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to sign out all sessions. Please retry.' })
      setLoggingOutAll(false)
    }
  }

  const currentSession = sessions.find((s) => s.current || s.is_current) || {
    id: 'current-session-fallback',
    device_name: 'Desktop Workstation',
    browser: 'Web Browser',
    os: 'Windows 11',
    last_used_at: new Date().toISOString(),
    current: true,
    is_current: true,
  }

  const otherSessions = sessions.filter((s) => !s.current && !s.is_current)

  return (
    <div className="card-base" style={{ padding: 'var(--space-5)', maxWidth: '1080px' }}>
      {/* Header */}
      <div className="ew-divider-head" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <div>
            <h2 className="ew-divider-title" style={{ fontSize: '16px', margin: 0, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
              Security &amp; Active Sessions
            </h2>
            <span className="ew-divider-sub" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Manage your active sessions and account security across all devices.
            </span>
          </div>
          {otherSessions.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowLogoutAllConfirm(true)}
              disabled={loggingOutAll}
              style={{ fontSize: '11px', padding: '5px 12px' }}
            >
              {loggingOutAll ? 'Signing out...' : 'Sign out other devices'}
            </button>
          )}
        </div>
      </div>

      {/* Inline Feedback Alert */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: 'var(--space-3)',
            fontSize: '12px',
            fontWeight: 600,
            background: feedback.type === 'success' ? 'rgba(54, 211, 153, 0.12)' : 'rgba(255, 107, 107, 0.12)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(54, 211, 153, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`,
            color: feedback.type === 'success' ? 'var(--color-green)' : 'var(--color-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}
            aria-label="Dismiss message"
          >
            &times;
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }} aria-label="Loading active sessions">
          <div style={{ height: '64px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }} />
          <div style={{ height: '64px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }} />
        </div>
      ) : error ? (
        <div style={{ padding: 'var(--space-4)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 var(--space-3)' }}>{error}</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchSessions}>
            ↻ Retry
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Current Device Card */}
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '8px', letterSpacing: '0.04em' }}>
              Current Device
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '8px',
                background: 'rgba(23, 168, 229, 0.06)',
                border: '1px solid rgba(23, 168, 229, 0.25)',
                flexWrap: 'wrap',
                gap: 'var(--space-2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: 'rgba(23, 168, 229, 0.15)',
                    color: 'var(--color-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  💻
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                      {currentSession.os} &bull; {currentSession.browser}
                    </strong>
                    <span className="badge badge-success badge-sm">Current device</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                    {currentSession.device_name} &middot; Last active: Active now
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Other Active Devices Section */}
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '8px', letterSpacing: '0.04em' }}>
              Other Active Sessions
            </span>

            {otherSessions.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontSize: '12.5px',
                  textAlign: 'center',
                }}
              >
                No other active sessions.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {otherSessions.map((session) => (
                  <div
                    key={session.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      flexWrap: 'wrap',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          flexShrink: 0,
                        }}
                        aria-hidden="true"
                      >
                        {session.os.toLowerCase().includes('android') || session.os.toLowerCase().includes('ios') ? '📱' : '💻'}
                      </div>
                      <div>
                        <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                          {session.os} &bull; {session.browser}
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                          {session.device_name} &middot; Last active:{' '}
                          {session.last_used_at ? new Date(session.last_used_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setTargetSessionToRevoke(session)}
                      disabled={revokingId === session.id}
                      style={{ fontSize: '11px', padding: '4px 10px', color: 'var(--color-red)' }}
                      aria-label={`Sign out session on ${session.os} ${session.browser}`}
                    >
                      {revokingId === session.id ? 'Signing out...' : 'Sign out'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal: Revoke Single Session */}
      {targetSessionToRevoke && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="revoke-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setTargetSessionToRevoke(null)}
        >
          <div
            className="card-base"
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: 'var(--space-5)',
              background: 'var(--bg-deep, #06111f)',
              border: '1px solid var(--border-color)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="revoke-modal-title" style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
              Sign out this device?
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 var(--space-4)' }}>
              This will immediately terminate the session on <strong>{targetSessionToRevoke.os} ({targetSessionToRevoke.browser})</strong>.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setTargetSessionToRevoke(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleRevokeSingle(targetSessionToRevoke)}
                style={{ background: 'var(--color-red)', borderColor: 'var(--color-red)' }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Logout All Other Devices */}
      {showLogoutAllConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-all-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowLogoutAllConfirm(false)}
        >
          <div
            className="card-base"
            style={{
              maxWidth: '460px',
              width: '100%',
              padding: 'var(--space-5)',
              background: 'var(--bg-deep, #06111f)',
              border: '1px solid var(--border-color)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="logout-all-modal-title" style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
              Sign out all devices?
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 var(--space-4)' }}>
              This will revoke all active sessions across all your devices. You will be signed out and redirected to the login page.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowLogoutAllConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleLogoutAll}
                style={{ background: 'var(--color-red)', borderColor: 'var(--color-red)' }}
              >
                Sign Out All Sessions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SecuritySessionManager
