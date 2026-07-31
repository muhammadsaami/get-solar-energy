import React from 'react'

export default function TrainingSkeleton() {
  return (
    <div className="tab-content active" role="tabpanel" aria-label="training-academy-loading" aria-busy="true">
      <div className="tab-header-block">
        <h2 className="tab-heading">Training Academy</h2>
        <p className="tab-subheading">Loading your learning workspace...</p>
      </div>
      <div className="card-base skeleton-card" style={{ height: 240, marginBottom: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="skeleton-loader skeleton-text" style={{ width: '30%', height: 14 }} />
        <div className="skeleton-loader skeleton-text" style={{ width: '50%', height: 24 }} />
        <div className="skeleton-loader skeleton-text" style={{ width: '70%', height: 12 }} />
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <div className="skeleton-loader" style={{ width: 140, height: 38, borderRadius: 8 }} />
          <div className="skeleton-loader" style={{ width: 140, height: 38, borderRadius: 8 }} />
        </div>
      </div>
      <div className="skeleton-grid skeleton-grid-4" style={{ marginBottom: 20 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-base shadow-lift skeleton-card" style={{ height: 110, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="skeleton-loader skeleton-text" style={{ width: '60%', height: 12 }} />
            <div className="skeleton-loader skeleton-text" style={{ width: '40%', height: 22 }} />
            <div className="skeleton-loader skeleton-text" style={{ width: '30%', height: 10 }} />
          </div>
        ))}
      </div>
      <div className="card-base shadow-lift skeleton-card" style={{ height: 180, padding: 16, marginBottom: 20 }}>
        <div className="skeleton-loader skeleton-text" style={{ width: '40%', height: 16 }} />
        <div className="skeleton-loader skeleton-text" style={{ width: '80%', height: 12, marginTop: 12 }} />
        <div className="skeleton-loader" style={{ width: '100%', height: 8, borderRadius: 4, marginTop: 12 }} />
      </div>
    </div>
  )
}
