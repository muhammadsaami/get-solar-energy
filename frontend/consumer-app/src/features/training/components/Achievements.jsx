import React from 'react'

export default function Achievements({ achievements }) {
  return (
    <div className="card-base shadow-lift" style={{ '--card-theme': '255, 138, 29' }}>
      <div className="kpi-header-row" style={{ marginBottom: 16 }}>
        <span className="kpi-title">Achievements</span>
        <svg className="kpi-title-icon orange"><use href="#icon-star" /></svg>
      </div>

      {(!achievements || achievements.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
          <svg style={{ width: 36, height: 36, marginBottom: 10, stroke: 'var(--text-muted)', fill: 'none', strokeWidth: 1.5 }} viewBox="0 0 24 24"><use href="#icon-star" /></svg>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Complete courses to unlock achievements.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {achievements.map((a) => (
            <div key={a.id} style={{
              padding: '10px 8px', borderRadius: 8, textAlign: 'center',
              border: `1px solid ${a.unlocked ? 'rgba(255,138,29,0.2)' : 'var(--border-color)'}`,
              background: a.unlocked ? 'rgba(255,138,29,0.04)' : 'rgba(255,255,255,0.02)',
              opacity: a.unlocked ? 1 : 0.45,
              transition: 'all 0.2s ease',
            }}>
              <svg style={{
                width: 24, height: 24, marginBottom: 6,
                stroke: a.unlocked ? 'var(--accent-orange)' : 'var(--text-muted)',
                fill: 'none', strokeWidth: 1.5,
              }} viewBox="0 0 24 24"><use href={`#${a.icon}`} /></svg>
              <div style={{ fontSize: 10, fontWeight: 700, color: a.unlocked ? 'var(--text-navy)' : 'var(--text-muted)', lineHeight: 1.3 }}>{a.title}</div>
              {a.unlocked && a.unlockedDate && (
                <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 2 }}>{a.unlockedDate}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
