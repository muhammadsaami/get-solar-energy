import React from 'react'
import type { ActivityItem as ActivityItemType } from '../types/activity.types'

interface ActivityItemProps {
  activity: ActivityItemType
}

function ActivityItemComponent({ activity }: ActivityItemProps) {
  return (
    <div style={{ position: 'relative', paddingLeft: '0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: `${activity.color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          {activity.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-navy)' }}>{activity.title}</span>
            </div>
            {activity.relativeTime && (
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: '2px' }}>{activity.relativeTime}</span>
            )}
          </div>
          {activity.description && (
            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>{activity.description}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            {activity.user && (
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{activity.user}</span>
            )}
            {activity.module && activity.module !== 'CRM' && (
              <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{activity.module}</span>
            )}
            {activity.priority !== 'none' && (
              <span
                style={{
                  fontSize: '8px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  color: activity.priority === 'high' ? '#f97316' : activity.priority === 'medium' ? '#00aeef' : '#94a3b8',
                }}
              >
                {activity.priority}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const ActivityItem = React.memo(ActivityItemComponent)
