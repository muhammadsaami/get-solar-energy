import React from 'react'

export default function EarningsSkeleton() {
  return (
    <div className="earnings-container">
      <div className="earnings-hero" style={{ opacity: 0.6 }}>
        <div style={{ width: '45%', height: '28px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', marginBottom: '12px' }} />
        <div style={{ width: '65%', height: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', marginBottom: '24px' }} />
        <div className="earnings-kpi-grid">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ height: '64px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px' }} />
          ))}
        </div>
      </div>

      <div style={{ height: '80px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px' }} />

      <div className="earnings-card-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: '180px', background: 'rgba(8, 24, 42, 0.5)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px' }} />
        ))}
      </div>
    </div>
  )
}
