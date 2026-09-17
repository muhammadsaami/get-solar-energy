import React from 'react'

interface PerformanceEmptyStateProps {
  title?: string
  description?: string
  ctaLabel?: string
  ctaAction?: () => void
}

function PerformanceEmptyStateComponent({
  title = 'No Performance Data Available',
  description = 'Complete a Bill Analysis, Roof Scan, and ROI Calculation to populate your solar system performance metrics. Historical trends will appear as more data is collected.',
  ctaLabel,
  ctaAction,
}: PerformanceEmptyStateProps) {
  return (
    <div
      className="card-base"
      style={{ textAlign: 'center', padding: '40px 20px', marginBottom: '20px', '--card-theme': '234, 179, 8' } as React.CSSProperties}
      role="status"
      aria-label={title}
    >
      <span style={{ fontSize: '40px', display: 'block', marginBottom: '14px' }} aria-hidden="true">
        {'\uD83D\uDCCA'}
      </span>
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-navy)', marginBottom: '6px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
        {description}
      </p>
      {ctaLabel && ctaAction && (
        <button
          className="hero-btn-primary"
          onClick={ctaAction}
          style={{ padding: '10px 20px', fontSize: '11px', '--card-theme': '234, 179, 8' } as React.CSSProperties}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}

export const PerformanceEmptyState = React.memo(PerformanceEmptyStateComponent)
