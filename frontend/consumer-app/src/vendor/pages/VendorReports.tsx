import React from 'react'
import VendorEmptyState from '../components/VendorEmptyState'

export default function VendorReports() {
  return (
    <div style={{ paddingBottom: 'var(--space-12)' }}>
      <div className="card-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="card-title" style={{ fontSize: 'var(--font-size-xl)' }}>Reports</h1>
      </div>
      <div className="card-glass">
        <VendorEmptyState
          icon="icon-reports"
          title="Vendor Reports"
          description="Installation completion reports, site survey summaries, and AMC service reports will be available here."
        />
      </div>
    </div>
  )
}
