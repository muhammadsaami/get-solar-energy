import React from 'react'

interface DashboardEmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export default function DashboardEmptyState({ icon, title, description, action }: DashboardEmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      {icon && (
        <svg style={{ width: 40, height: 40, marginBottom: 12, stroke: 'var(--text-muted)', fill: 'none', strokeWidth: 1.5 }} viewBox="0 0 24 24">
          <use href={`#${icon}`} />
        </svg>
      )}
      <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-navy)', marginBottom: 4 }}>{title}</h4>
      {description && <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 auto', maxWidth: 280 }}>{description}</p>}
      {action && (
        <button type="button" className="calc-btn" onClick={action.onClick} style={{ marginTop: 12, width: 'auto', padding: '6px 16px', fontSize: 11, height: 'auto' }}>
          {action.label}
        </button>
      )}
    </div>
  )
}
