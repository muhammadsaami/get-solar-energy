import React from 'react'

interface AMCEmptyStateProps {
  title?: string
  description?: string
}

function AMCEmptyStateComponent({
  title = 'No AMC Contract Found',
  description = 'You do not have an active Annual Maintenance Contract. Get an AI-powered recommendation to find the right plan for your solar system.',
}: AMCEmptyStateProps) {
  return (
    <div
      className="card-base"
      style={{ textAlign: 'center', padding: '40px 20px', marginBottom: '20px', '--card-theme': '234, 179, 8' } as React.CSSProperties}
      role="status"
      aria-label={title}
    >
      <span style={{ fontSize: '40px', display: 'block', marginBottom: '14px' }} aria-hidden="true">
        {'\uD83D\uDD27'}
      </span>
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-navy)', marginBottom: '6px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
        {description}
      </p>
    </div>
  )
}

export const AMCEmptyState = React.memo(AMCEmptyStateComponent)
