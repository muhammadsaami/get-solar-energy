import React from 'react'
import { MdCheckCircle, MdSchedule, MdCancel } from 'react-icons/md'
import type { AMCVisit } from '../types/amc.types'
import { VISIT_STATUS_LABELS } from '../config/amc.config'

interface AMCVisitTimelineProps {
  visits: AMCVisit[]
  loading: boolean
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed': return MdCheckCircle
    case 'scheduled': return MdSchedule
    case 'cancelled': return MdCancel
    default: return MdSchedule
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return 'var(--color-green)'
    case 'scheduled': return 'var(--color-blue)'
    case 'cancelled': return 'var(--text-muted)'
    default: return 'var(--text-muted)'
  }
}

function AMCVisitTimelineComponent({ visits, loading }: AMCVisitTimelineProps) {
  if (loading) {
    return (
      <div className="card-base" style={{ '--card-theme': '139, 92, 246' } as React.CSSProperties}>
        <div className="kpi-header-row">
          <div className="skeleton skeleton-text narrow" style={{ width: '100px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <div className="skeleton skeleton-avatar" style={{ width: '32px', height: '32px' }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-text medium" />
                <div className="skeleton skeleton-text narrow" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!visits || visits.length === 0) {
    return (
      <div className="card-base" style={{ '--card-theme': '139, 92, 246' } as React.CSSProperties}>
        <div className="kpi-header-row">
          <span className="kpi-title">Visit Timeline</span>
        </div>
        <div className="table-empty" style={{ padding: 'var(--space-8) 0' }}>
          <div className="table-empty-icon">{'\uD83D\uDCC5'}</div>
          <div className="table-empty-title">No visits scheduled</div>
          <div className="table-empty-desc">Maintenance visits will appear here once scheduled.</div>
        </div>
      </div>
    )
  }

  const sorted = [...visits].sort(
    (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime(),
  )

  return (
    <div className="card-base" style={{ '--card-theme': '139, 92, 246' } as React.CSSProperties}>
      <div className="kpi-header-row">
        <span className="kpi-title">Recent Visits ({visits.length})</span>
      </div>
      <div className="timeline-vertical animate-fade-in" style={{ marginTop: '8px' }}>
        {sorted.map((visit, idx) => {
          const IconComponent = getStatusIcon(visit.status)
          const iconColor = getStatusColor(visit.status)
          const statusLabel = VISIT_STATUS_LABELS[visit.status] || VISIT_STATUS_LABELS.scheduled

          return (
            <div
              key={visit.id}
              className={`timeline-item animate-slide-up`}
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <div style={{ marginTop: '2px', color: iconColor, fontSize: '18px', flexShrink: 0 }}>
                  <IconComponent />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                      {visit.visitType}
                    </span>
                    <span className={`status-badge ${statusLabel.className}`} style={{ fontSize: '8px' }}>
                      {statusLabel.text}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {formatDate(visit.visitDate)}
                    {visit.technicianName && ` \u2022 ${visit.technicianName}`}
                  </div>
                  {visit.notes && (
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                      {visit.notes}
                    </div>
                  )}
                  {visit.rating && (
                    <div style={{ fontSize: '10px', color: 'var(--accent-orange)', marginTop: '2px' }}>
                      {'\u2B50'} {visit.rating}/5
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const AMCVisitTimeline = React.memo(AMCVisitTimelineComponent)
