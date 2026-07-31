import React from 'react'
import type { NotificationItem } from '../types/technician.types'

interface NotificationWidgetProps {
  notifications: NotificationItem[]
}

const TYPE_ICONS: Record<string, string> = {
  work_order: 'icon-clipboard',
  training: 'icon-clipboard-check',
  payment: 'icon-trending',
  certification: 'icon-star',
  general: 'icon-bell',
}

const TYPE_COLORS: Record<string, string> = {
  work_order: 'var(--color-orange)',
  training: 'var(--color-blue)',
  payment: 'var(--color-green)',
  certification: 'var(--color-orange)',
  general: 'var(--text-muted)',
}

export default function NotificationWidget({ notifications }: NotificationWidgetProps) {
  return (
    <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
      <div className="kpi-header-row" style={{ marginBottom: 16 }}>
        <span className="kpi-title">Notifications</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {notifications.some((n) => !n.read) && (
            <span style={{ fontSize: 9, background: 'var(--color-orange-surface)', color: 'var(--color-orange)', padding: '1px 8px', borderRadius: 3, border: '1px solid var(--color-orange-border)', fontWeight: 700 }}>
              {notifications.filter((n) => !n.read).length} new
            </span>
          )}
          <svg className="kpi-title-icon blue"><use href="#icon-bell" /></svg>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
          <svg style={{ width: 36, height: 36, marginBottom: 10, stroke: 'var(--text-muted)', fill: 'none', strokeWidth: 1.5 }} viewBox="0 0 24 24"><use href="#icon-bell" /></svg>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No notifications. You're all caught up!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {notifications.slice(0, 4).map((n) => (
            <div key={n.id} style={{
              display: 'flex', gap: 10, padding: '8px 0',
              borderBottom: '1px solid var(--border-color)',
              opacity: n.read ? 0.6 : 1,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: n.read ? 'var(--bg-input)' : `${TYPE_COLORS[n.type]}16`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg style={{ width: 14, height: 14, stroke: n.read ? 'var(--text-muted)' : TYPE_COLORS[n.type], fill: 'none', strokeWidth: 2 }} viewBox="0 0 24 24">
                  <use href={`#${TYPE_ICONS[n.type] || TYPE_ICONS.general}`} />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, color: n.read ? 'var(--text-muted)' : 'var(--text-navy)', lineHeight: 1.4, margin: 0 }}>{n.message}</p>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{n.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
