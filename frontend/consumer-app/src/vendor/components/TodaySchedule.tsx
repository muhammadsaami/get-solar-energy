import React from 'react'
import type { VendorVisit, VendorTask } from '../types/vendor.types'

interface TodayScheduleProps {
  visits: VendorVisit[]
  tasks: VendorTask[]
  overdueTasks: VendorTask[]
}

export default function TodaySchedule({ visits, tasks, overdueTasks }: TodayScheduleProps) {
  return (
    <div className="vendor-glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
          Today's Operations Schedule
        </h3>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--vendor-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center', padding: '12px', borderRadius: '10px', background: 'rgba(23, 168, 229, 0.1)', border: '1px solid rgba(23, 168, 229, 0.2)' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--vendor-primary)' }}>{visits.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--vendor-text-muted)', marginTop: '2px' }}>Site Visits</div>
        </div>
        <div style={{ textAlign: 'center', padding: '12px', borderRadius: '10px', background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--vendor-accent)' }}>{tasks.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--vendor-text-muted)', marginTop: '2px' }}>Tasks Today</div>
        </div>
        <div style={{ textAlign: 'center', padding: '12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--vendor-danger)' }}>{overdueTasks.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--vendor-text-muted)', marginTop: '2px' }}>Overdue</div>
        </div>
      </div>

      {overdueTasks.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--vendor-danger)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Critical Action Required
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {overdueTasks.slice(0, 3).map((t) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid var(--vendor-danger)' }}>
                <span style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: 600 }}>{t.title}</span>
                <span style={{ fontSize: '11px', color: 'var(--vendor-danger)', fontWeight: 700 }}>
                  {t.overdueDays ? `${t.overdueDays}d overdue` : 'Overdue'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {visits.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--vendor-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Today's Scheduled Site Inspections
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {visits.map((v) => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', background: 'rgba(23, 168, 229, 0.08)', borderLeft: '3px solid var(--vendor-primary)' }}>
                <span style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: 600 }}>{v.title}</span>
                <span style={{ fontSize: '11px', color: 'var(--vendor-text-muted)' }}>{v.scheduledTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
