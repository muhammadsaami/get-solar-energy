import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export interface PortalCapability {
  label: string
  hint: string
}

interface PortalComingSoonProps {
  title: string
  description: string
  capabilities: PortalCapability[]
  closingNote: string
  ctaLabel: string
  ctaTo: string
  ariaLabel: string
  onCtaClick?: () => void
}

export default function PortalComingSoon({
  title,
  description,
  capabilities,
  closingNote,
  ctaLabel,
  ctaTo,
  ariaLabel,
  onCtaClick,
}: PortalComingSoonProps) {
  const navigate = useNavigate()

  const handleCta = useCallback(() => {
    if (onCtaClick) {
      onCtaClick()
      return
    }
    navigate(ctaTo)
  }, [onCtaClick, navigate, ctaTo])

  return (
    <div className="ew-page tab-content active" role="tabpanel" aria-label={ariaLabel}>
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
          {title}
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
          {description}
        </p>

        <ul
          aria-label={`Upcoming ${title} capabilities`}
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
          {capabilities.map((cap) => (
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
          {closingNote}
        </p>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleCta}
          style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 700 }}
        >
          {ctaLabel}
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '6px', verticalAlign: '-1px' }}>
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  )
}
