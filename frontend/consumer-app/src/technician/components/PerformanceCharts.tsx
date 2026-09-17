import React from 'react'
import type { PerformanceData } from '../types/technician.types'

interface PerformanceChartsProps {
  performance: PerformanceData | null
}

function MiniBarChart({ data, height = 60, color = 'var(--accent-orange)' }: { data: { label: string; value: number }[]; height?: number; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height, marginTop: 8 }}>
      {data.map((d) => {
        const pct = (d.value / max) * 100
        return (
          <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: '100%', height: `${pct}%`, background: color, borderRadius: '2px 2px 0 0', minHeight: 4, opacity: 0.85 }} />
          </div>
        )
      })}
    </div>
  )
}

export default function PerformanceCharts({ performance }: PerformanceChartsProps) {
  if (!performance) return null

  const charts = [
    {
      title: 'Completed Jobs', data: performance.completedJobs, total: performance.completedJobs.reduce((s, d) => s + d.value, 0),
      unit: 'total', color: 'var(--accent-blue)', icon: 'icon-clipboard-check', iconColor: 'blue',
    },
    {
      title: 'Monthly Earnings', data: performance.monthlyEarnings.map((d) => ({ ...d, value: d.value / 200 })),
      total: `₹${performance.monthlyEarnings[performance.monthlyEarnings.length - 1]?.value.toLocaleString() || '0'}`,
      unit: 'this month', color: 'var(--color-green)', icon: 'icon-trending', iconColor: 'green',
    },
    {
      title: 'Customer Satisfaction', data: performance.customerSatisfaction.map((d) => ({ ...d, value: d.value * 20 })),
      total: performance.customerSatisfaction[performance.customerSatisfaction.length - 1]?.value || 0,
      unit: '/ 5.0', color: 'var(--color-purple)', icon: 'icon-star', iconColor: 'blue',
    },
    {
      title: 'Training Completion', data: performance.trainingCompletion,
      total: `${performance.trainingCompletion.filter((d) => d.value >= 100).length}/${performance.trainingCompletion.length}`,
      unit: 'modules done', color: 'var(--accent-orange)', icon: 'icon-activity', iconColor: 'orange',
    },
  ]

  return (
    <section className="kpis-stack-column" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 15 }}>
      {charts.map((c) => (
        <div key={c.title} className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
          <div className="kpi-header-row" style={{ marginBottom: 4 }}>
            <span className="kpi-title">{c.title}</span>
            {c.icon && <svg className={`kpi-title-icon ${c.iconColor}`}><use href={`#${c.icon}`} /></svg>}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-navy)' }}>{c.total}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.unit}</span>
          </div>
          <MiniBarChart data={c.data} color={c.color} />
          <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
            {c.data.map((d) => (
              <span key={d.label} style={{ flex: 1, textAlign: 'center', fontSize: 7, color: 'var(--text-muted)', fontWeight: 600 }}>{d.label}</span>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
