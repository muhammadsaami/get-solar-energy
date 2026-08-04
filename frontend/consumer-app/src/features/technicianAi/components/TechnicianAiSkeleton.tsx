import React from 'react'

export default function TechnicianAiSkeleton() {
  return (
    <div className="technician-ai-container">
      <div className="ai-hero" style={{ opacity: 0.6 }}>
        <div style={{ width: '45%', height: '28px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', marginBottom: '12px' }} />
        <div style={{ width: '65%', height: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }} />
      </div>

      <div className="ai-workspace-grid">
        <div className="ai-chat-panel" style={{ height: '500px', background: 'rgba(8, 24, 42, 0.5)', borderRadius: '16px' }} />
        <div className="ai-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ height: '240px', background: 'rgba(8, 24, 42, 0.5)', borderRadius: '16px' }} />
          <div style={{ height: '180px', background: 'rgba(8, 24, 42, 0.5)', borderRadius: '16px' }} />
        </div>
      </div>
    </div>
  )
}
