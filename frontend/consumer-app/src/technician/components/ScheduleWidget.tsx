import React from 'react'
import type { ScheduleItem } from '../types/technician.types'

interface ScheduleWidgetProps {
  schedule: ScheduleItem[]
}

const PRIORITY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  high: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  low: { color: '#22d3ee', bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.2)' },
}

export default function ScheduleWidget({ schedule }: ScheduleWidgetProps) {
  return (
    <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
      <div className="kpi-header-row" style={{ marginBottom: 16 }}>
        <span className="kpi-title">Today's Schedule</span>
        <svg className="kpi-title-icon blue"><use href="#icon-calendar" /></svg>
      </div>

      {schedule.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
          <svg style={{ width: 36, height: 36, marginBottom: 10, stroke: 'var(--text-muted)', fill: 'none', strokeWidth: 1.5 }} viewBox="0 0 24 24"><use href="#icon-calendar" /></svg>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your schedule is clear today.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {schedule.map((item) => {
            const ps = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.medium
            return (
              <div key={item.id} style={{
                padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s ease',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-navy)' }}>{item.title}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 8px', borderRadius: 3, color: ps.color, background: ps.bg, border: `1px solid ${ps.border}` }}>
                    {item.priority.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg style={{ width: 12, height: 12, stroke: 'currentColor', fill: 'none' }} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {item.time}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg style={{ width: 12, height: 12, stroke: 'currentColor', fill: 'none' }} viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    {item.location}
                  </span>
                  <span style={{ marginLeft: 'auto', color: 'var(--color-blue)', fontWeight: 600 }}>{item.status}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
