import React from 'react'

export default function ProfileSkeleton() {
  return (
    <div className="profile-container">
      <div className="profile-hero" style={{ opacity: 0.6 }}>
        <div style={{ width: '45%', height: '28px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', marginBottom: '12px' }} />
        <div style={{ width: '65%', height: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', marginBottom: '24px' }} />
        <div className="profile-kpi-grid">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ height: '64px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px' }} />
          ))}
        </div>
      </div>

      <div style={{ height: '50px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px' }} />
      <div style={{ height: '280px', background: 'rgba(8, 24, 42, 0.5)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px' }} />
    </div>
  )
}
