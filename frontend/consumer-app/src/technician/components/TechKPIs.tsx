import React from 'react'
import type { TechnicianKpis } from '../types/technician.types'

interface TechKPIsProps {
  kpis: TechnicianKpis | null
}

const KPI_ICONS: Record<string, { icon: string; color: string }> = {
  'Active Work Orders': { icon: 'icon-clipboard', color: 'orange' },
  'Completed Jobs': { icon: 'icon-clipboard-check', color: 'green' },
  'Monthly Earnings': { icon: 'icon-trending', color: 'orange' },
  'Customer Rating': { icon: 'icon-star', color: 'blue' },
  'Training Progress': { icon: 'icon-activity', color: 'blue' },
  'Certification Score': { icon: 'icon-shield', color: 'green' },
}

export default function TechKPIs({ kpis }: TechKPIsProps) {
  if (!kpis) return null

  const kpiItems = [
    { label: 'Active Work Orders', value: String(kpis.activeWorkOrders), desc: 'Currently assigned', theme: '255, 138, 29' },
    { label: 'Completed Jobs', value: String(kpis.completedJobs), desc: 'All time', theme: '54, 211, 153' },
    { label: 'Monthly Earnings', value: `₹${kpis.monthlyEarnings.toLocaleString()}`, desc: 'This month', theme: '255, 138, 29' },
    { label: 'Customer Rating', value: `${kpis.customerRating}`, desc: 'out of 5.0', theme: '23, 168, 229' },
    { label: 'Training Progress', value: `${kpis.trainingProgress}%`, desc: `${kpis.trainingProgress}% complete`, theme: '23, 168, 229' },
    { label: 'Certification Score', value: `${kpis.certificationScore}%`, desc: `${kpis.certificationScore}% achieved`, theme: '54, 211, 153' },
  ]

  return (
    <section className="kpis-stack-column" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15 }}>
      {kpiItems.map((kpi) => {
        const meta = KPI_ICONS[kpi.label]
        return (
          <div key={kpi.label} className="card-base shadow-lift" style={{ '--card-theme': kpi.theme } as React.CSSProperties}>
            <div className="kpi-header-row">
              <span className="kpi-title">{kpi.label}</span>
              {meta && <svg className={`kpi-title-icon ${meta.color}`}><use href={`#${meta.icon}`} /></svg>}
            </div>
            <div className="kpi-value-block">
              <span className="kpi-value-text">{kpi.value}</span>
            </div>
            <p className="kpi-card-subdesc" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{kpi.desc}</p>
            {kpi.label === 'Training Progress' && (
              <div className="pro-progress-container" style={{ marginTop: 8 }}>
                <div className="pro-progress-track" style={{ height: 4 }}>
                  <div className="pro-progress-fill" style={{ width: `${kpis.trainingProgress}%` }} />
                </div>
              </div>
            )}
            {kpi.label === 'Certification Score' && (
              <div className="pro-progress-container" style={{ marginTop: 8 }}>
                <div className="pro-progress-track" style={{ height: 4 }}>
                  <div className="pro-progress-fill" style={{ width: `${kpis.certificationScore}%`, backgroundColor: 'var(--accent-blue)' }} />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}
