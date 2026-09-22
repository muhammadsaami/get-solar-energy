import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../config/routes'

const UPCOMING_CAPABILITIES = [
  { label: 'Roof geometry', hint: 'Dimensions and layout assessment' },
  { label: 'Usable roof area', hint: 'Shadow-free installable surface' },
  { label: 'Shading analysis', hint: 'Obstruction and shade factors' },
  { label: 'Installation potential', hint: 'Recommended system sizing' },
]

export default function RoofComingSoon() {
  const navigate = useNavigate()

  return (
    <div className="ew-page tab-content active" role="tabpanel" aria-label="roof analysis">
      <div
        className="card-glass"
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: 'var(--space-6)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(23, 168, 229, 0.1)',
            border: '1px solid rgba(23, 168, 229, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan, #17a8e5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="rgba(23,168,229,0.2)" />
          </svg>
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Roof Vision AI
        </h1>

        <span
          style={{
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--accent-orange)',
            background: 'rgba(247, 147, 30, 0.1)',
            border: '1px solid rgba(247, 147, 30, 0.3)',
            padding: '4px 12px',
            borderRadius: '999px',
          }}
        >
          Coming Soon
        </span>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, maxWidth: '460px' }}>
          Advanced rooftop intelligence is being prepared to assess roof geometry,
          usable area, shading, and solar installation potential.
        </p>

        <ul
          aria-label="Upcoming Roof Vision AI capabilities"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '8px',
            width: '100%',
            textAlign: 'left',
          }}
        >
          {UPCOMING_CAPABILITIES.map((cap) => (
            <li
              key={cap.label}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>
                {cap.label}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                {cap.hint}
              </span>
            </li>
          ))}
        </ul>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
          Your rooftop assessment tools will be available here in a future release.
        </p>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(ROUTES.BILL_ANALYZER)}
          style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 700 }}
        >
          Analyze My Bill
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '6px', verticalAlign: '-1px' }}>
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  )
}
