import React from 'react'
import { MdSchool } from 'react-icons/md'

const LABEL_MAP = {
  Emerging: 'var(--color-yellow)',
  Advancing: 'var(--color-orange)',
  Proficient: 'var(--color-blue)',
  Expert: 'var(--color-green)',
}

export default function KnowledgeScoreCard({ score }) {
  const label = score >= 85 ? 'Expert' : score >= 65 ? 'Proficient' : score >= 40 ? 'Advancing' : 'Emerging'
  const color = LABEL_MAP[label] || 'var(--color-yellow)'
  const pct = Math.max(4, Math.min(96, score))

  return (
    <div className="card-base kb-score-card" style={{ '--card-theme': '54, 211, 153' }}>
      <div className="kpi-header-row">
        <span className="kpi-title kb-score-title">
          <MdSchool size={14} className="kpi-title-icon green" />
          Knowledge Score
        </span>
      </div>
      <div className="kb-score-body">
        <div className="kb-score-ring" style={{ borderColor: color, boxShadow: `0 0 16px ${color}` }}>
          <span className="kb-score-ring-value">{score}</span>
        </div>
        <div className="kb-score-text">
          <span className="kb-score-label" style={{ color }}>{label}</span>
          <span className="kb-score-subtext">Based on reading, bookmarks & training</span>
        </div>
      </div>
      <div className="kb-score-bar">
        <div className="kb-score-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
