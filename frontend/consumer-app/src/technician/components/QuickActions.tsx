import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../config/routes'

const ACTIONS = [
  { id: 'work-orders', label: 'View Work Orders', desc: 'Manage your assigned jobs', route: ROUTES.TECHNICIAN_WORK_ORDERS, icon: 'icon-clipboard', color: 'orange' },
  { id: 'training', label: 'Training Academy', desc: 'Advance your skills', route: ROUTES.TECHNICIAN_TRAINING, icon: 'icon-clipboard-check', color: 'blue' },
  { id: 'marketplace', label: 'Job Marketplace', desc: 'Find new opportunities', route: ROUTES.TECHNICIAN_MARKETPLACE, icon: 'icon-briefcase', color: 'orange' },
  { id: 'ai', label: 'AI Troubleshooting', desc: 'Get AI-powered support', route: ROUTES.TECHNICIAN_AI, icon: 'icon-sparkles', color: 'blue' },
]

export default function QuickActions() {
  const navigate = useNavigate()

  return (
    <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
      <div className="kpi-header-row" style={{ marginBottom: 16 }}>
        <span className="kpi-title">Quick Actions</span>
        <svg className="kpi-title-icon blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ACTIONS.map((a) => (
          <div key={a.id} tabIndex={0} role="button" onClick={() => navigate(a.route)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)',
              borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `var(--color-${a.color}-surface)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg style={{ width: 16, height: 16, stroke: `var(--color-${a.color})`, fill: 'none', strokeWidth: 2 }} viewBox="0 0 24 24">
                <use href={`#${a.icon}`} />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-navy)' }}>{a.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{a.desc}</div>
            </div>
            <svg style={{ width: 14, height: 14, stroke: 'var(--text-muted)', fill: 'none', strokeWidth: 2, flexShrink: 0 }} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
          </div>
        ))}
      </div>
    </div>
  )
}
