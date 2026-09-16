import React from 'react'

interface PerformanceChartCardProps {
  title: string
  description?: string
  children?: React.ReactNode
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyMessage?: string
  actions?: React.ReactNode
  footer?: React.ReactNode
  theme?: string
}

function PerformanceChartCardComponent({
  title,
  description,
  children,
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'No chart data available.',
  actions,
  footer,
  theme = '54, 211, 153',
}: PerformanceChartCardProps) {
  return (
    <div
      className="card-base"
      style={{ '--card-theme': theme } as React.CSSProperties}
      role="region"
      aria-label={title}
      aria-busy={loading}
    >
      <div className="kpi-header-row">
        <span className="kpi-title">{title}</span>
        {actions && <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>{actions}</div>}
      </div>

      {description && (
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
          {description}
        </p>
      )}

      {loading && (
        <div style={{ height: '180px', padding: '12px 0' }}>
          <div className="skeleton skeleton-block" style={{ height: '100%', width: '100%' }} />
        </div>
      )}

      {!loading && error && (
        <div
          style={{
            height: '180px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'var(--accent-red, #ef4444)',
            textAlign: 'center',
            padding: '0 20px',
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && empty && (
        <div
          style={{
            height: '180px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '0 20px',
          }}
        >
          {emptyMessage}
        </div>
      )}

      {!loading && !error && !empty && children && (
        <div style={{ height: '200px', position: 'relative' }}>
          {children}
        </div>
      )}

      {footer && (
        <div style={{ marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
          {footer}
        </div>
      )}
    </div>
  )
}

export const PerformanceChartCard = React.memo(PerformanceChartCardComponent)
