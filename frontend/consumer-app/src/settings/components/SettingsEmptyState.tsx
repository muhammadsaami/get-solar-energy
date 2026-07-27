import React from 'react'

function SettingsEmptyStateComponent() {
  return (
    <div
      className="card-base"
      style={{ textAlign: 'center', padding: '40px 20px', marginBottom: '20px', '--card-theme': '234, 179, 8' } as React.CSSProperties}
      role="status"
      aria-label="No settings data"
    >
      <span style={{ fontSize: '40px', display: 'block', marginBottom: '14px' }} aria-hidden="true">{'\u2699\uFE0F'}</span>
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-navy)', marginBottom: '6px' }}>
        No Settings Data
      </h3>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
        Configure your utility provider, tariff rate, and net metering preferences to personalize your solar intelligence dashboard.
      </p>
    </div>
  )
}

export const SettingsEmptyState = React.memo(SettingsEmptyStateComponent)
