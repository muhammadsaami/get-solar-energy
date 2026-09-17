import React from 'react'
import type { ActivityItem } from '../types/activity.types'

interface ActivityAlertsPanelProps {
  alerts: ActivityItem[]
  loading: boolean
}

export function ActivityAlertsPanel({ alerts, loading }: ActivityAlertsPanelProps) {
  if (loading) {
    return (
      <div className="card-base" style={{ marginBottom: '20px' }}>
        <div className="kpi-header-row">
          <span className="kpi-title">Operational Alerts</span>
        </div>
        <div style={{ padding: '12px 0' }}>
          <div className="skeleton skeleton-text wide" />
          <div className="skeleton skeleton-text medium" />
        </div>
      </div>
    )
  }

  return (
    <div className="card-base" style={{ marginBottom: '20px' }}>
      <div className="kpi-header-row">
        <span className="kpi-title">Operational Alerts</span>
        {alerts.length > 0 && (
          <span className="api-tag">{alerts.length} Active</span>
        )}
      </div>
      {alerts.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
          No operational alerts.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.slice(0, 5).map((alert) => (
            <div
              key={alert.id}
              className={`notification-item${alert.priority === 'high' ? ' priority-high' : alert.priority === 'medium' ? ' priority-medium' : ''}`}
            >
              <div className="notif-header">
                <div className="notif-title-row">
                  <span style={{ fontSize: '12px' }}>{alert.icon}</span>
                  <span className="notif-title">{alert.title}</span>
                </div>
                {alert.relativeTime && (
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{alert.relativeTime}</span>
                )}
              </div>
              <div className="notif-message">{alert.description}</div>
              {alert.customer?.name && (
                <div className="notif-meta">
                  <span>{alert.customer.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
