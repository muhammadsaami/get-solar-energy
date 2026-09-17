import React from 'react'
import type { VendorKpis } from '../types/vendor.types'

interface VendorKpiCardsProps {
  kpis: VendorKpis | null
  loading: boolean
}

const KPI_CARDS = [
  { key: 'todaysJobs', label: "Today's Jobs", color: 'var(--color-blue)', suffix: '', icon: 'icon-briefcase', accent: 'blue' },
  { key: 'activeInstallations', label: 'Active Installations', color: 'var(--color-orange)', suffix: '', icon: 'icon-wrench', accent: 'orange' },
  { key: 'pendingSiteVisits', label: 'Pending Site Visits', color: 'var(--color-purple)', suffix: '', icon: 'icon-mappin', accent: 'purple' },
  { key: 'overdueWorkOrders', label: 'Overdue Orders', color: 'var(--color-red)', suffix: '', icon: 'icon-alert-triangle', accent: 'red' },
  { key: 'slaCompliance', label: 'SLA Compliance', color: 'var(--color-green)', suffix: '%', icon: 'icon-shield', accent: 'green' },
  { key: 'escalatedIssues', label: 'Escalated Issues', color: 'var(--color-red)', suffix: '', icon: 'icon-activity', accent: 'red' },
  { key: 'completionRate', label: 'Completion Rate', color: 'var(--color-blue)', suffix: '%', icon: 'icon-trending', accent: 'blue' },
  { key: 'avgHealthScore', label: 'Avg Health Score', color: 'var(--color-green)', suffix: '', icon: 'icon-activity', accent: 'green' },
]

export default function VendorKpiCards({ kpis, loading }: VendorKpiCardsProps) {
  if (loading && !kpis) {
    return (
      <div className="card-grid card-grid-4">
        {KPI_CARDS.map((kpi) => (
          <div key={kpi.key} className="card-metric" style={{ padding: 'var(--space-5)', height: 100 }}>
            <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 4, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 32, width: '40%', borderRadius: 4 }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="card-grid card-grid-4">
      {KPI_CARDS.map((kpi) => {
        const value = kpis ? (kpis as unknown as Record<string, number>)[kpi.key] : 0
        return (
          <div key={kpi.key} className={`card-metric accent-${kpi.accent}`} style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
              <div className="card-metric-label">{kpi.label}</div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={kpi.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                <use href={`#${kpi.icon}`} />
              </svg>
            </div>
            <div className="card-metric-value" style={{ color: kpi.color, fontSize: 'var(--font-size-3xl)' }}>
              {value}{kpi.suffix}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
              Current period
            </div>
          </div>
        )
      })}
    </div>
  )
}
