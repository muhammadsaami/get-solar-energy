import React from 'react'

function PerformanceLoadingSkeletonComponent() {
  return (
    <div style={{ marginBottom: '20px' }} role="status" aria-label="Loading performance data">
      <div style={{ padding: '12px 0' }}>
        <div className="kpi-header-row" style={{ marginBottom: '16px' }}>
          <span className="kpi-title">
            <div className="skeleton skeleton-text narrow" />
          </span>
        </div>
        <div className="tab-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px', marginBottom: '20px' }}>
          <div className="card-base" style={{ height: '240px' }}>
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div className="skeleton skeleton-circle" style={{ margin: '0 auto 16px' }} />
              <div className="skeleton skeleton-text" style={{ width: '100px', margin: '0 auto 8px' }} />
              <div className="skeleton skeleton-text narrow" style={{ width: '60px', margin: '0 auto' }} />
            </div>
            <div className="perf-progress-list" style={{ marginTop: '10px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="perf-progress-item">
                  <div className="perf-progress-labels">
                    <div className="skeleton skeleton-text narrow" style={{ width: '80px' }} />
                    <div className="skeleton skeleton-text narrow" style={{ width: '30px' }} />
                  </div>
                  <div className="perf-progress-track">
                    <div className="skeleton" style={{ height: '6px', borderRadius: '3px', width: '100%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card-base shadow-lift">
                <div style={{ padding: '12px 0' }}>
                  <div className="skeleton skeleton-text narrow" style={{ width: '70%', marginBottom: '8px' }} />
                  <div className="skeleton skeleton-text" style={{ width: '50%', marginBottom: '4px' }} />
                  <div className="skeleton skeleton-text narrow" style={{ width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card-base" style={{ height: '240px' }}>
              <div className="kpi-header-row">
                <div className="skeleton skeleton-text narrow" style={{ width: '120px' }} />
              </div>
              <div className="skeleton skeleton-block" style={{ height: '180px', marginTop: '10px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const PerformanceLoadingSkeleton = React.memo(PerformanceLoadingSkeletonComponent)
