import React from 'react'
import { QUICK_ACTIONS } from '../config/vendor.config'

interface QuickActionsProps {
  onAction: (action: string) => void
}

export default function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className="card-glass" style={{ padding: 'var(--space-6)' }}>
      <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, margin: '0 0 var(--space-5)', color: 'var(--text-primary)' }}>
        Quick Actions
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.action)}
            className="card-feature"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-2)',
              padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition-normal)',
              position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border-active)'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
            aria-label={action.label}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-md)',
              background: 'var(--color-orange-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <use href={`#${action.icon}`} />
              </svg>
            </div>
            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
              {action.label}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {action.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
