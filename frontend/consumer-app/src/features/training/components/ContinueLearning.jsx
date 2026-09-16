import React from 'react'

export default function ContinueLearning({ course }) {
  if (!course) {
    return (
      <div className="card-base shadow-lift" style={{ marginBottom: 20, padding: 32, textAlign: 'center', '--card-theme': '23, 168, 229' }}>
        <svg style={{ width: 40, height: 40, marginBottom: 12, stroke: 'var(--text-muted)', fill: 'none', strokeWidth: 1.5 }} viewBox="0 0 24 24"><use href="#icon-clipboard-check" /></svg>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No active courses. Browse available courses to get started.</p>
      </div>
    )
  }

  return (
    <div className="card-base shadow-lift" style={{ marginBottom: 20, overflow: 'hidden', '--card-theme': '23, 168, 229' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, padding: 24 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(23,168,229,0.15) 0%, rgba(23,168,229,0.05) 100%)',
          border: '1px solid rgba(23,168,229,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg style={{ width: 36, height: 36, stroke: 'var(--accent-blue)', fill: 'none', strokeWidth: 1.5 }} viewBox="0 0 24 24"><use href="#icon-clipboard" /></svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-blue)', background: 'rgba(23,168,229,0.1)', padding: '2px 8px', borderRadius: 4 }}>Continue Learning</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{course.category}</span>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-navy)', margin: 0 }}>{course.title}</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '6px 0 8px', lineHeight: 1.5, maxWidth: 500 }}>{course.description}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" /></svg>
              {course.instructor}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              {course.remainingTime} remaining
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1, maxWidth: 300 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Progress</span>
                <span style={{ fontWeight: 700, color: 'var(--text-navy)' }}>{course.progress}%</span>
              </div>
              <div className="pro-progress-track" style={{ height: 6 }}>
                <div className="pro-progress-fill" style={{ width: `${course.progress}%` }} />
              </div>
            </div>
            <button className="calc-btn" style={{ width: 'auto', fontSize: 12, padding: '6px 20px', height: 'auto' }}>Resume</button>
          </div>
        </div>
      </div>
    </div>
  )
}
