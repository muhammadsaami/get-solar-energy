import React from 'react'

interface VendorEmptyStateProps {
  icon?: string
  title?: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export default function VendorEmptyState({ icon = 'icon-folder', title = 'No data', description = 'Nothing to show here yet.', action }: VendorEmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-16) var(--space-8)', textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 'var(--radius-xl)',
        background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 'var(--space-5)',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <use href={`#${icon}`} />
        </svg>
      </div>
      <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: '0 0 var(--space-2)', color: 'var(--text-primary)' }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: '0 0 var(--space-6)', maxWidth: 400, lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      {action && (
        <button className="btn btn-primary btn-sm" onClick={action.onClick} aria-label={action.label}>
          {action.label}
        </button>
      )}
    </div>
  )
}
