import React from 'react'

interface PerformanceMetricCardProps {
  title: string
  icon?: string
  value: string | number | null
  subtitle?: string
  theme: string
  loading?: boolean
  error?: string | null
  empty?: boolean
  badge?: { text: string; className: string } | null
  size?: 'sm' | 'md'
}

const CONTAINER_CLASSES = {
  sm: 'shadow-lift',
  md: 'shadow-lift',
}

function PerformanceMetricCardComponent({
  title,
  icon,
  value,
  subtitle,
  theme,
  loading = false,
  error = null,
  empty = false,
  badge = null,
  size = 'md',
}: PerformanceMetricCardProps) {
  const containerClass = CONTAINER_CLASSES[size]

  return (
    <div
      className={`card-base ${containerClass}`}
      style={{ '--card-theme': theme } as React.CSSProperties}
      role="region"
      aria-label={title}
      aria-busy={loading}
    >
      <div className="kpi-header-row" style={{ marginBottom: 0 }}>
        <span className="kpi-title" style={{ fontSize: '11px' }}>{title}</span>
        {icon && (
          <span style={{ fontSize: '16px', lineHeight: 1 }} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>

      {loading && (
        <div style={{ padding: '10px 0' }}>
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
          <div className="skeleton skeleton-text narrow" style={{ marginTop: '6px' }} />
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: '10px 0', fontSize: '10px', color: 'var(--accent-red, #ef4444)' }}>
          {error}
        </div>
      )}

      {!loading && !error && empty && (
        <div style={{ padding: '10px 0', fontSize: '10px', color: 'var(--text-muted)' }}>
          No data available
        </div>
      )}

      {!loading && !error && !empty && value !== null && (
        <div style={{ padding: '4px 0 2px' }}>
          <div className="kpi-value-block" style={{ margin: 0 }}>
            <span
              className="kpi-value-text"
              style={{ fontSize: size === 'sm' ? '18px' : '22px' }}
            >
              {value}
            </span>
            {badge && (
              <span className={`status-badge ${badge.className}`} style={{ marginLeft: '8px', fontSize: '9px', verticalAlign: 'middle' }}>
                {badge.text}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="kpi-card-subdesc" style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export const PerformanceMetricCard = React.memo(PerformanceMetricCardComponent)
