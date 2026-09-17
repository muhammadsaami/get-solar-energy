import React from 'react'
import type { TrainingProgress } from '../types/technician.types'

interface TrainingProgressCardProps {
  training: TrainingProgress | null
}

export default function TrainingProgressCard({ training }: TrainingProgressCardProps) {
  if (!training) {
    return (
      <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
        <div className="kpi-header-row" style={{ marginBottom: 16 }}>
          <span className="kpi-title">Training Progress</span>
          <svg className="kpi-title-icon blue"><use href="#icon-clipboard-check" /></svg>
        </div>
        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
          <svg style={{ width: 36, height: 36, marginBottom: 10, stroke: 'var(--text-muted)', fill: 'none', strokeWidth: 1.5 }} viewBox="0 0 24 24"><use href="#icon-clipboard-check" /></svg>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Begin your training to see progress here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
      <div className="kpi-header-row" style={{ marginBottom: 16 }}>
        <span className="kpi-title">Training Progress</span>
        <svg className="kpi-title-icon blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Current Level</span>
          <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-navy)', margin: '2px 0 0' }}>{training.currentLevel}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Next</span>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)', margin: '2px 0 0' }}>{training.nextCertification}</p>
        </div>
      </div>

      <div style={{ margin: '12px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
          <span>Overall Progress</span>
          <span style={{ fontWeight: 700, color: 'var(--text-navy)' }}>{training.completionPercentage}%</span>
        </div>
        <div className="pro-progress-track" style={{ height: 6 }}>
          <div className="pro-progress-fill" style={{ width: `${training.completionPercentage}%` }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
        <span>{training.totalModules - training.remainingModules}/{training.totalModules} modules completed</span>
        <span style={{ fontWeight: 700, color: 'var(--color-orange)' }}>{training.remainingModules} remaining</span>
      </div>
    </div>
  )
}
