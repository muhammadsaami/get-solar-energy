import React from 'react'
import type { VendorVisit } from '../types/vendor.types'

interface SiteVisitCardProps {
  visit: VendorVisit
}

export default function SiteVisitCard({ visit }: SiteVisitCardProps) {
  const isToday = visit.scheduledDate === new Date().toISOString().split('T')[0]

  return (
    <div className="card-glass" style={{
      padding: 'var(--space-4)',
      borderLeft: `3px solid ${isToday ? 'var(--color-blue)' : 'var(--border-subtle)'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: isToday ? 'var(--color-blue-surface)' : 'var(--bg-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isToday ? 'var(--color-blue)' : 'var(--text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <use href="#icon-mappin" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
              {visit.title}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
              {visit.scheduledDate} at {visit.scheduledTime}
            </div>
          </div>
        </div>
        <span className={`badge ${visit.outcome ? 'badge-green' : 'badge-blue'}`} style={{ flexShrink: 0 }}>
          {visit.outcome || 'Scheduled'}
        </span>
      </div>
    </div>
  )
}
