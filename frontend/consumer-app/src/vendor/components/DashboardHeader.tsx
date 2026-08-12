import React from 'react'

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  badgeText?: string
  actions?: React.ReactNode
}

export function DashboardHeader({ title, subtitle, badgeText, actions }: DashboardHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em', fontFamily: "'Outfit', sans-serif" }}>
            {title}
          </h1>
          {badgeText && (
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px',
              backgroundColor: 'var(--vendor-primary-surface)', color: 'var(--vendor-primary)',
              border: '1px solid var(--vendor-primary-border)', textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>
              {badgeText}
            </span>
          )}
        </div>
        {subtitle && (
          <p style={{ fontSize: '13px', color: 'var(--vendor-text-muted)', margin: '4px 0 0', fontWeight: 500 }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{actions}</div>}
    </div>
  )
}

export default DashboardHeader
