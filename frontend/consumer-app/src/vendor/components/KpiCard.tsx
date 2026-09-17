import React from 'react'

interface KpiCardProps {
  title: string
  value: string | number
  subtext?: string
  previousPeriod?: string
  trend?: {
    value: string
    positive: boolean
  }
  icon?: string
  iconColor?: 'blue' | 'cyan' | 'orange' | 'green'
  loading?: boolean
}

export function KpiCard({ title, value, subtext, previousPeriod, trend, icon, iconColor = 'cyan', loading = false }: KpiCardProps) {
  const accentColor =
    iconColor === 'orange' ? 'var(--vendor-accent)' :
    iconColor === 'green' ? 'var(--vendor-success)' :
    iconColor === 'blue' ? 'var(--vendor-secondary)' : 'var(--vendor-primary)'

  if (loading) {
    return (
      <div className="vendor-glass-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div className="vendor-skeleton" style={{ width: '100px', height: '14px' }} />
          <div className="vendor-skeleton" style={{ width: '38px', height: '38px', borderRadius: '10px' }} />
        </div>
        <div className="vendor-skeleton" style={{ width: '140px', height: '32px', marginBottom: '10px' }} />
        <div className="vendor-skeleton" style={{ width: '180px', height: '12px' }} />
      </div>
    )
  }

  return (
    <div className="vendor-glass-card" style={{ padding: '22px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--vendor-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'Outfit', sans-serif" }}>
          {title}
        </span>
        {icon && (
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            backgroundColor: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${accentColor}40`, boxShadow: `0 0 16px ${accentColor}25`
          }}>
            <svg style={{ width: '18px', height: '18px', stroke: accentColor, fill: 'none', strokeWidth: 2 }} viewBox="0 0 24 24">
              <use href={`#${icon}`} />
            </svg>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
        <span style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', fontFamily: "'Outfit', sans-serif" }}>
          {value}
        </span>
        {trend && (
          <span style={{
            fontSize: '11px', fontWeight: 700,
            color: trend.positive ? 'var(--vendor-success)' : 'var(--vendor-danger)',
            backgroundColor: trend.positive ? 'var(--vendor-success-surface)' : 'var(--vendor-danger-surface)',
            padding: '3px 8px', borderRadius: '12px', border: `1px solid ${trend.positive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {subtext && (
          <span style={{ fontSize: '11px', color: 'var(--vendor-text-muted)', fontWeight: 500 }}>
            {subtext}
          </span>
        )}
        {previousPeriod && (
          <span style={{ fontSize: '10px', color: 'var(--vendor-text-muted)', fontStyle: 'italic' }}>
            vs {previousPeriod}
          </span>
        )}
      </div>

      {/* Mini SVG Sparkline Decorative Trend */}
      <svg style={{ width: '100%', height: '24px', opacity: 0.25, marginTop: '8px', overflow: 'visible' }} viewBox="0 0 100 25" preserveAspectRatio="none">
        <path
          d="M0,20 Q20,5 40,15 T80,8 T100,12"
          fill="none"
          stroke={accentColor}
          strokeWidth="2.5"
        />
      </svg>
    </div>
  )
}

export default KpiCard
