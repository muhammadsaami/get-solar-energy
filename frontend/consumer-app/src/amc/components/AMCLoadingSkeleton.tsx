import React from 'react'

function AMCLoadingSkeletonComponent() {
  return (
    <div style={{ marginBottom: '20px' }} role="status" aria-label="Loading AMC data">
      <div style={{ padding: '12px 0' }}>
        <div className="kpi-header-row" style={{ marginBottom: '16px' }}>
          <span className="kpi-title">
            <div className="skeleton skeleton-text narrow" />
          </span>
        </div>
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-base" style={{ height: '100px' }}>
              <div className="skeleton skeleton-text narrow" style={{ width: '60%', marginBottom: '8px' }} />
              <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: '4px' }} />
            </div>
          ))}
        </div>
        <div className="card-base" style={{ height: '200px' }}>
          <div className="kpi-header-row">
            <div className="skeleton skeleton-text narrow" style={{ width: '120px' }} />
          </div>
          <div className="skeleton skeleton-block" style={{ height: '140px', marginTop: '10px' }} />
        </div>
      </div>
    </div>
  )
}

export const AMCLoadingSkeleton = React.memo(AMCLoadingSkeletonComponent)
