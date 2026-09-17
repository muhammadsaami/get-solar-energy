import React from 'react'

interface DemoBannerProps {
  onExitDemo: () => void
}

export default function DemoBanner({ onExitDemo }: DemoBannerProps) {
  return (
    <div
      className="card-base demo-mode-banner"
      role="region"
      aria-label="Demo Mode Notice"
      style={
        {
          '--card-theme': '23, 168, 229',
          padding: '14px 18px',
          marginBottom: '16px',
          background:
            'linear-gradient(135deg, rgba(23, 168, 229, 0.08) 0%, rgba(54, 211, 153, 0.05) 100%)',
          border: '1px solid rgba(23, 168, 229, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderRadius: '8px',
        } as React.CSSProperties
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '260px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'rgba(23, 168, 229, 0.15)',
            border: '1px solid rgba(23, 168, 229, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg
            style={{ width: '18px', height: '18px', stroke: 'var(--accent-blue)', fill: 'none', strokeWidth: '2' }}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              className="demo-pill-badge"
              style={{
                fontSize: '10px',
                fontWeight: '800',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                background: 'var(--accent-blue)',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              DEMO — SAMPLE DATA
            </span>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-navy)' }}>
              Interactive Educational Preview
            </span>
          </div>
          <p
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              margin: '3px 0 0',
              lineHeight: '1.4',
            }}
          >
            This is a representative example of the insights Bill Analyzer provides after analyzing a bill.
            No personal data or daily analysis quota was used.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={onExitDemo}
          className="calc-btn"
          style={{
            margin: 0,
            padding: '8px 18px',
            fontSize: '12px',
            height: 'auto',
            width: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <svg
            style={{ width: '14px', height: '14px', stroke: 'currentColor', fill: 'none', strokeWidth: '2' }}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>Analyze My Bill</span>
        </button>

        <button
          type="button"
          onClick={onExitDemo}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            padding: '7px 12px',
            fontSize: '11px',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          aria-label="Exit Demo View"
        >
          Exit Demo
        </button>
      </div>
    </div>
  )
}
