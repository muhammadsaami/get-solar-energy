import React from 'react'

export default function WorkOrdersSkeleton() {
  return (
    <div className="work-orders-container">
      <div className="wo-hero" style={{ opacity: 0.6 }}>
        <div style={{ width: '40%', height: '28px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', marginBottom: '12px' }} />
        <div style={{ width: '60%', height: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', marginBottom: '24px' }} />
        <div className="wo-kpi-grid">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ height: '64px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px' }} />
          ))}
        </div>
      </div>

      <div style={{ height: '80px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px' }} />

      <div className="wo-card-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: '200px', background: 'rgba(8, 24, 42, 0.5)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px' }} />
        ))}
      </div>
    </div>
  )
}
