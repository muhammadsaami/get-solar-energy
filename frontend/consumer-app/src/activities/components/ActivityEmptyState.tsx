import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../config/routes'

export function ActivityEmptyState() {
  const navigate = useNavigate()

  return (
    <div className="card-base" style={{ textAlign: 'center', padding: '40px 20px' }}>
      <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>{'\uD83D\uDD50'}</span>
      <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-navy)', marginBottom: '6px', margin: '0 0 6px' }}>No Activity Recorded Yet</h4>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '20px' }}>Complete an analysis or talk to GET Solar Copilot to record actions.</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <button className="hero-btn-primary" onClick={() => navigate(ROUTES.BILL_ANALYZER)} style={{ padding: '8px 16px', fontSize: '11px', width: 'auto', height: 'auto' }}>
          {'\uD83D\uDCC4'} Run Bill Analysis
        </button>
        <button
          className="hero-btn-primary"
          onClick={() => navigate(ROUTES.ROI_CALCULATOR)}
          style={{ padding: '8px 16px', fontSize: '11px', width: 'auto', height: 'auto', '--card-theme': '255, 138, 29' } as React.CSSProperties}
        >
          {'\uD83D\uDCCA'} Generate ROI
        </button>
        <button
          className="hero-btn-primary"
          onClick={() => navigate(ROUTES.AI_ADVISOR)}
          style={{ padding: '8px 16px', fontSize: '11px', width: 'auto', height: 'auto', '--card-theme': '54, 211, 153' } as React.CSSProperties}
        >
          {'\uD83E\uDD16'} Open Solar Copilot
        </button>
      </div>
    </div>
  )
}
