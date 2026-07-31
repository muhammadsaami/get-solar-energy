import React from 'react'

const KPI_CONFIG = [
  { label: 'Courses Enrolled', key: 'coursesEnrolled', desc: 'Active & completed', icon: 'icon-clipboard', color: 'blue', theme: '23, 168, 229' },
  { label: 'Courses Completed', key: 'coursesCompleted', desc: 'All time', icon: 'icon-clipboard-check', color: 'green', theme: '54, 211, 153' },
  { label: 'Certifications Earned', key: 'certificationsEarned', desc: 'Professional certs', icon: 'icon-shield', color: 'green', theme: '54, 211, 153' },
  { label: 'Learning Hours', key: 'learningHours', desc: 'Total logged', icon: 'icon-trending', color: 'orange', theme: '255, 138, 29' },
  { label: 'Current Streak', key: 'currentStreak', desc: 'Consecutive days', icon: 'icon-star', color: 'orange', theme: '255, 138, 29' },
  { label: 'Overall Progress', key: 'overallProgress', desc: 'Complete', icon: 'icon-activity', color: 'blue', theme: '23, 168, 229' },
]

function formatValue(key, value) {
  if (key === 'learningHours') return `${value}h`
  if (key === 'overallProgress') return `${value}%`
  return String(value)
}

export default function TrainingKPIs({ kpis }) {
  if (!kpis) return null

  return (
    <section className="kpis-stack-column" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginBottom: 20 }}>
      {KPI_CONFIG.map((kpi) => (
        <div key={kpi.key} className="card-base shadow-lift" style={{ '--card-theme': kpi.theme }}>
          <div className="kpi-header-row">
            <span className="kpi-title">{kpi.label}</span>
            <svg className={`kpi-title-icon ${kpi.color}`}><use href={`#${kpi.icon}`} /></svg>
          </div>
          <div className="kpi-value-block">
            <span className="kpi-value-text">{formatValue(kpi.key, kpis[kpi.key])}</span>
          </div>
          <p className="kpi-card-subdesc" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{kpi.desc}</p>
          {kpi.key === 'overallProgress' && (
            <div className="pro-progress-container" style={{ marginTop: 8 }}>
              <div className="pro-progress-track" style={{ height: 4 }}>
                <div className="pro-progress-fill" style={{ width: `${kpis.overallProgress}%` }} />
              </div>
            </div>
          )}
        </div>
      ))}
    </section>
  )
}
