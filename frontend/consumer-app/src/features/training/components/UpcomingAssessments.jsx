import React from 'react'

const PREP_COLORS = {
  Ready: { color: 'var(--accent-green)', bg: 'rgba(54,211,153,0.1)', border: 'rgba(54,211,153,0.2)' },
  'In Progress': { color: 'var(--accent-orange)', bg: 'rgba(255,138,29,0.1)', border: 'rgba(255,138,29,0.2)' },
  'Not Started': { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.02)', border: 'var(--border-color)' },
}

export default function UpcomingAssessments({ assessments }) {
  return (
    <div className="card-base shadow-lift" style={{ '--card-theme': '255, 138, 29' }}>
      <div className="kpi-header-row" style={{ marginBottom: 16 }}>
        <span className="kpi-title">Upcoming Assessments</span>
        <svg className="kpi-title-icon orange"><use href="#icon-calendar" /></svg>
      </div>

      {(!assessments || assessments.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
          <svg style={{ width: 36, height: 36, marginBottom: 10, stroke: 'var(--text-muted)', fill: 'none', strokeWidth: 1.5 }} viewBox="0 0 24 24"><use href="#icon-calendar" /></svg>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No assessments scheduled. Enroll in courses to unlock assessments.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {assessments.map((a) => {
            const pc = PREP_COLORS[a.preparationStatus] || PREP_COLORS['Not Started']
            return (
              <div key={a.id} style={{
                padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-navy)' }}>{a.title}</span>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{a.courseTitle}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 8px', borderRadius: 3, color: pc.color, background: pc.bg, border: `1px solid ${pc.border}`, whiteSpace: 'nowrap', marginLeft: 8 }}>
                    {a.preparationStatus.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 9, color: 'var(--text-muted)', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <svg style={{ width: 10, height: 10, stroke: 'currentColor', fill: 'none' }} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    {a.date}
                  </span>
                  <span>{a.duration}</span>
                  <span>Pass: {a.passingScore}%</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
