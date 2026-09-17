import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function AccessDenied() {
  const navigate = useNavigate()

  return (
    <div
      className="access-denied-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px',
        textAlign: 'center',
        padding: '40px 20px',
      }}
    >
      <span style={{ fontSize: '48px', lineHeight: 1 }} aria-hidden="true">403</span>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-navy)', margin: 0 }}>
        Access Denied
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.6, margin: 0 }}>
        You do not have the required permissions to access this section.
        If you believe this is a mistake, contact your administrator.
      </p>
      <button
        className="calc-btn"
        style={{ marginTop: '8px', width: 'auto' }}
        onClick={() => navigate('/app/home')}
      >
        Return to Dashboard
      </button>
    </div>
  )
}
