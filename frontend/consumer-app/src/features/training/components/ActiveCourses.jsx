import React from 'react'

const CATEGORY_COLORS = {
  Installation: { color: 'var(--accent-blue)', bg: 'rgba(23,168,229,0.1)' },
  Technical: { color: 'var(--accent-orange)', bg: 'rgba(255,138,29,0.1)' },
  Safety: { color: 'var(--accent-green)', bg: 'rgba(54,211,153,0.1)' },
  Compliance: { color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
}

const COURSE_THUMBNAILS = {
  solar: { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', icon: 'icon-solar-readiness' },
  inverter: { gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', icon: 'icon-system-performance' },
  safety: { gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', icon: 'icon-shield' },
  roof: { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', icon: 'icon-roof' },
  battery: { gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', icon: 'icon-energy-production' },
  grid: { gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', icon: 'icon-clipboard' },
}

export default function ActiveCourses({ courses }) {
  return (
    <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229' }}>
      <div className="kpi-header-row" style={{ marginBottom: 16 }}>
        <span className="kpi-title">Active Courses</span>
        <svg className="kpi-title-icon blue"><use href="#icon-clipboard" /></svg>
      </div>

      {(!courses || courses.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
          <svg style={{ width: 36, height: 36, marginBottom: 10, stroke: 'var(--text-muted)', fill: 'none', strokeWidth: 1.5 }} viewBox="0 0 24 24"><use href="#icon-clipboard" /></svg>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No active courses. Start a new course to track progress.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {courses.map((c) => {
            const cc = CATEGORY_COLORS[c.category] || CATEGORY_COLORS.Installation
            const thumb = COURSE_THUMBNAILS[c.thumbnail] || COURSE_THUMBNAILS.solar
            return (
              <div key={c.id} style={{
                display: 'flex', gap: 10, padding: '10px 12px',
                border: '1px solid var(--border-color)', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s ease',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                  background: thumb.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg style={{ width: 18, height: 18, stroke: 'rgba(255,255,255,0.9)', fill: 'none', strokeWidth: 1.5 }} viewBox="0 0 24 24"><use href={`#${thumb.icon}`} /></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-navy)', lineHeight: 1.3 }}>{c.title}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 8px', borderRadius: 3, color: cc.color, background: cc.bg, whiteSpace: 'nowrap', marginLeft: 8 }}>{c.category}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>{c.instructor}</span>
                    <span>{c.duration}</span>
                    {c.lastAccessed && <span>Last: {c.lastAccessed}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div className="pro-progress-track" style={{ height: 3 }}>
                        <div className="pro-progress-fill" style={{ width: `${c.progress}%` }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-navy)', whiteSpace: 'nowrap' }}>{c.progress}%</span>
                    {c.progress > 0 && c.progress < 100 && (
                      <button className="calc-btn" style={{ width: 'auto', fontSize: 9, padding: '2px 12px', height: 'auto', minHeight: 0 }}>Resume</button>
                    )}
                    {c.progress === 100 && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent-green)' }}>Complete</span>
                    )}
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
