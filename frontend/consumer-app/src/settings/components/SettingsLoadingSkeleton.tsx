import React from 'react'

function SettingsLoadingSkeletonComponent() {
  return (
    <div role="status" aria-label="Loading settings">
      <div className="card-base p-5" style={{ maxWidth: '600px' }}>
        <div className="kpi-header-row mb-4">
          <div className="kpi-title">
            <div className="skeleton skeleton-text narrow" style={{ width: '160px' }} />
          </div>
        </div>
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: '8px' }} />
            <div className="skeleton skeleton-block rounded-xs" style={{ height: '34px' }} />
          </div>
          <div className="flex-1">
            <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: '8px' }} />
            <div className="skeleton skeleton-block rounded-xs" style={{ height: '34px' }} />
          </div>
        </div>
        <div className="skeleton skeleton-text" style={{ width: '30%', marginBottom: '8px' }} />
        <div className="skeleton skeleton-block rounded-xs" style={{ height: '34px', marginBottom: '12px' }} />
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="skeleton skeleton-text" style={{ width: '50%', marginBottom: '8px' }} />
            <div className="skeleton skeleton-block rounded-xs" style={{ height: '34px' }} />
          </div>
          <div className="flex-1">
            <div className="skeleton skeleton-text" style={{ width: '50%', marginBottom: '8px' }} />
            <div className="skeleton skeleton-block rounded-xs" style={{ height: '34px' }} />
          </div>
        </div>
        <div className="skeleton skeleton-block rounded-xs" style={{ height: '36px', width: '140px', marginTop: '10px' }} />
      </div>
    </div>
  )
}

export const SettingsLoadingSkeleton = React.memo(SettingsLoadingSkeletonComponent)
