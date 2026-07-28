import React from 'react'
import type { VendorVisit, VendorTask } from '../types/vendor.types'

interface TodayScheduleProps {
  visits: VendorVisit[]
  tasks: VendorTask[]
  overdueTasks: VendorTask[]
}

function StatCounter({ value, label, color, icon }: { value: number; label: string; color: string; icon: string }) {
  return (
    <div className="card-stat" style={{ textAlign: 'center', padding: 'var(--space-4) var(--space-3)', gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-1)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <use href={`#${icon}`} />
        </svg>
        <span className="card-stat-num" style={{ fontSize: 'var(--font-size-2xl)', color }}>{value}</span>
      </div>
      <div className="card-stat-label" style={{ fontSize: 'var(--font-size-xs)' }}>{label}</div>
    </div>
  )
}

export default function TodaySchedule({ visits, tasks, overdueTasks }: TodayScheduleProps) {
  return (
    <div className="card-glass" style={{ padding: 'var(--space-6)' }}>
      <div className="card-header" style={{ marginBottom: 'var(--space-5)' }}>
        <h3 className="card-title">Today's Schedule</h3>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <use href="#icon-calendar" />
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <StatCounter value={visits.length} label="Site Visits" color="var(--color-blue)" icon="icon-mappin" />
        <StatCounter value={tasks.length} label="Tasks Today" color="var(--color-orange)" icon="icon-clipboard-check" />
        <StatCounter value={overdueTasks.length} label="Overdue" color="var(--color-red)" icon="icon-alert-triangle" />
      </div>

      {overdueTasks.length > 0 && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-red)', margin: '0 0 var(--space-2)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }}>
            Urgent Tasks
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {overdueTasks.slice(0, 3).map((t) => (
              <div key={t.id} className="card-insight" style={{ borderLeft: `3px solid var(--color-red)`, padding: 'var(--space-3) var(--space-4)' }}>
                <span style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', flex: 1 }}>{t.title}</span>
                <span style={{ color: 'var(--color-red)', fontWeight: 600, fontSize: 'var(--font-size-xs)', whiteSpace: 'nowrap' }}>
                  {t.overdueDays ? `${t.overdueDays}d overdue` : 'Overdue'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {visits.length > 0 && (
        <div>
          <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-blue)', margin: '0 0 var(--space-2)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }}>
            Today's Site Visits
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {visits.map((v) => (
              <div key={v.id} className="card-insight" style={{ borderLeft: `3px solid var(--color-blue)`, padding: 'var(--space-3) var(--space-4)' }}>
                <span style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', flex: 1 }}>{v.title}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', whiteSpace: 'nowrap' }}>{v.scheduledTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {visits.length === 0 && tasks.length === 0 && overdueTasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 'var(--space-3)', opacity: 0.5 }}>
            <use href="#icon-calendar" />
          </svg>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
            No items scheduled for today.
          </p>
        </div>
      )}
    </div>
  )
}
