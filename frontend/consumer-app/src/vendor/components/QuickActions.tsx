import React from 'react'
import { QUICK_ACTIONS } from '../config/vendor.config'

interface QuickActionsProps {
  onAction: (action: string) => void
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'icon-mappin': <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
  'icon-wrench': <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
  'icon-camera': <>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </>,
  'icon-clipboard-check': <>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M9 14l2 2 4-4" />
  </>,
  'icon-calendar': <>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </>,
  'icon-reports': <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </>,
  'icon-chat': <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  'icon-shield': <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
}

export default function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className="vendor-glass-card" style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 20px', color: '#FFFFFF', fontFamily: "'Outfit', sans-serif" }}>
        Vendor Quick Actions
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.action)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px',
              padding: '16px', borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
            aria-label={action.label}
          >
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'rgba(249, 115, 22, 0.12)', border: '1px solid rgba(249, 115, 22, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--vendor-accent)',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {ACTION_ICONS[action.icon] || <circle cx="12" cy="12" r="8" />}
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#FFFFFF', fontFamily: "'Outfit', sans-serif" }}>
                {action.label}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--vendor-text-muted)', lineHeight: 1.4, marginTop: '2px' }}>
                {action.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
