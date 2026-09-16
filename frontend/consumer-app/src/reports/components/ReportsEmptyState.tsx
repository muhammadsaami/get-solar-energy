import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../config/routes'

function ReportsEmptyStateComponent() {
  const navigate = useNavigate()

  return (
    <div className="card-base" style={{ '--card-theme': '23, 168, 229', padding: '40px', textAlign: 'center', marginBottom: '20px' } as React.CSSProperties}>
      <span style={{ fontSize: '40px', display: 'block', marginBottom: '14px' }}>{'\uD83D\uDCCA'}</span>
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-navy)', marginBottom: '6px' }}>Start Your Solar Journey</h3>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
        Complete the steps below to generate your personalized solar reports.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '14px',
          maxWidth: '620px',
          margin: '0 auto 24px',
        }}
      >
        <div
          onClick={() => navigate(ROUTES.BILL_ANALYZER)}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,174,239,0.2)', borderRadius: '10px', padding: '16px 10px', cursor: 'pointer' }}
        >
          <div style={{ fontSize: '26px', marginBottom: '6px' }}>{'\uD83D\uDCC4'}</div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-blue)', marginBottom: '3px' }}>Step 1</div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-navy)', marginBottom: '4px' }}>Upload Bill</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Upload your electricity bill for AI analysis</div>
        </div>
        <div
          onClick={() => navigate(ROUTES.ROOF_ANALYSIS)}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(54,211,153,0.2)', borderRadius: '10px', padding: '16px 10px', cursor: 'pointer' }}
        >
          <div style={{ fontSize: '26px', marginBottom: '6px' }}>{'\uD83C\uDFE0'}</div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)', marginBottom: '3px' }}>Step 2</div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-navy)', marginBottom: '4px' }}>Roof Analysis</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Satellite scan of your rooftop solar potential</div>
        </div>
        <div
          onClick={() => navigate(ROUTES.ROI_CALCULATOR)}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,138,29,0.2)', borderRadius: '10px', padding: '16px 10px', cursor: 'pointer' }}
        >
          <div style={{ fontSize: '26px', marginBottom: '6px' }}>{'\uD83D\uDCCA'}</div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-orange)', marginBottom: '3px' }}>Step 3</div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-navy)', marginBottom: '4px' }}>ROI Report</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Calculate payback period and annual savings</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px 10px' }}>
          <div style={{ fontSize: '26px', marginBottom: '6px' }}>{'\uD83D\uECE5'}</div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '3px' }}>Step 4</div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-navy)', marginBottom: '4px' }}>Download Reports</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Export PDF &amp; CSV reports</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button className="hero-btn-primary" onClick={() => navigate(ROUTES.BILL_ANALYZER)} style={{ padding: '10px 20px', fontSize: '11px' }}>
          Upload Bill Now
        </button>
        <button
          className="hero-btn-primary"
          onClick={() => navigate(ROUTES.ROOF_ANALYSIS)}
          style={{ padding: '10px 20px', fontSize: '11px', '--card-theme': '54, 211, 153' } as React.CSSProperties}
        >
          Scan My Roof
        </button>
        <button
          className="hero-btn-primary"
          onClick={() => navigate(ROUTES.ROI_CALCULATOR)}
          style={{ padding: '10px 20px', fontSize: '11px', '--card-theme': '255, 138, 29' } as React.CSSProperties}
        >
          Calculate ROI
        </button>
      </div>
    </div>
  )
}

export const ReportsEmptyState = React.memo(ReportsEmptyStateComponent)
