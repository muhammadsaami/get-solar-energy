import React from 'react'

const RANK_COLORS = {
  1: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  2: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  3: { color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
}

export default function Leaderboard({ entries }) {
  return (
    <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229' }}>
      <div className="kpi-header-row" style={{ marginBottom: 16 }}>
        <span className="kpi-title">Leaderboard</span>
        <svg className="kpi-title-icon blue"><use href="#icon-trending" /></svg>
      </div>

      {(!entries || entries.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
          <svg style={{ width: 36, height: 36, marginBottom: 10, stroke: 'var(--text-muted)', fill: 'none', strokeWidth: 1.5 }} viewBox="0 0 24 24"><use href="#icon-trending" /></svg>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Leaderboard data coming soon.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {entries.map((e) => {
            const rc = RANK_COLORS[e.rank] || { color: 'var(--text-muted)', bg: 'transparent' }
            return (
              <div key={e.rank} style={{
                display: 'grid', gridTemplateColumns: '32px 1fr 50px 60px',
                alignItems: 'center', gap: 8,
                padding: '6px 10px',
                borderRadius: 6,
                background: e.isCurrentUser ? 'rgba(23,168,229,0.06)' : 'transparent',
                border: e.isCurrentUser ? '1px solid rgba(23,168,229,0.15)' : 'none',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800,
                  color: rc.color, background: rc.bg,
                }}>{e.rank}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-navy)', lineHeight: 1.2 }}>
                    {e.name}
                    {e.isCurrentUser && <span style={{ fontSize: 8, color: 'var(--accent-blue)', marginLeft: 4 }}>(You)</span>}
                  </div>
                  <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>{e.role}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-navy)' }}>{e.points}</div>
                  <div style={{ fontSize: 7, color: 'var(--text-muted)' }}>pts</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-navy)' }}>{e.coursesCompleted}</div>
                  <div style={{ fontSize: 7, color: 'var(--text-muted)' }}>courses</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
