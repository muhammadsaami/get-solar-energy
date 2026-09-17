import React from 'react'

const DIFFICULTY_COLORS = {
  Beginner: { color: 'var(--accent-green)', bg: 'rgba(54,211,153,0.1)', border: 'rgba(54,211,153,0.2)' },
  Intermediate: { color: 'var(--accent-orange)', bg: 'rgba(255,138,29,0.1)', border: 'rgba(255,138,29,0.2)' },
  Advanced: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
}

export default function LearningPaths({ paths }) {
  return (
    <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229' }}>
      <div className="kpi-header-row" style={{ marginBottom: 16 }}>
        <span className="kpi-title">Learning Paths</span>
        <svg className="kpi-title-icon blue"><use href="#icon-route" /></svg>
      </div>

      {(!paths || paths.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
          <svg style={{ width: 36, height: 36, marginBottom: 10, stroke: 'var(--text-muted)', fill: 'none', strokeWidth: 1.5 }} viewBox="0 0 24 24"><use href="#icon-route" /></svg>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No learning paths available yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {paths.map((p) => {
            const dc = DIFFICULTY_COLORS[p.difficulty] || DIFFICULTY_COLORS.Beginner
            return (
              <div key={p.id} style={{
                padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: 'var(--color-blue-surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg style={{ width: 14, height: 14, stroke: 'var(--accent-blue)', fill: 'none', strokeWidth: 2 }} viewBox="0 0 24 24"><use href={`#${p.icon}`} /></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-navy)' }}>{p.title}</span>
                      {p.completed && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent-green)', background: 'rgba(54,211,153,0.1)', padding: '1px 8px', borderRadius: 3, border: '1px solid rgba(54,211,153,0.2)' }}>COMPLETED</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span style={{ color: dc.color, background: dc.bg, border: `1px solid ${dc.border}`, padding: '0 6px', borderRadius: 3, fontWeight: 600 }}>{p.difficulty}</span>
                      <span>{p.duration}</span>
                      <span>{p.modules} modules</span>
                    </div>
                    <div className="pro-progress-container">
                      <div className="pro-progress-track" style={{ height: 3 }}>
                        <div className="pro-progress-fill" style={{ width: `${p.progress}%`, backgroundColor: p.completed ? 'var(--accent-green)' : 'var(--accent-blue)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
