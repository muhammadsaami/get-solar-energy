import React from 'react'

export default function LayoutSkeleton() {
  return (
    <div
      className="app-shell"
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-deep-blue)',
        color: 'var(--text-primary)',
      }}
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          background: 'rgba(8, 22, 37, 0.92)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          padding: '20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="shimmer-block" style={{ width: 44, height: 44, borderRadius: 12 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="shimmer-line" style={{ width: '70%', height: 12 }} />
            <div className="shimmer-line" style={{ width: '50%', height: 8 }} />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="shimmer-line" style={{ width: '40%', height: 10 }} />
            {Array.from({ length: i === 0 ? 6 : i === 1 ? 3 : 2 }).map((_, j) => (
              <div key={j} className="shimmer-line" style={{ width: '85%', height: 14, borderRadius: 8 }} />
            ))}
          </div>
        ))}
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            height: 70,
            background: 'rgba(6,17,31,0.85)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 32px',
            gap: 16,
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="shimmer-line" style={{ width: 120, height: 10 }} />
            <div className="shimmer-line" style={{ width: 200, height: 16 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="shimmer-block" style={{ width: 38, height: 38, borderRadius: '50%' }} />
            <div className="shimmer-block" style={{ width: 38, height: 38, borderRadius: '50%' }} />
          </div>
        </header>
        <main style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="shimmer-block" style={{ width: '60%', height: 24 }} />
          <div className="shimmer-block" style={{ width: '100%', height: 180, borderRadius: 16 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shimmer-block" style={{ height: 160, borderRadius: 16 }} />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
