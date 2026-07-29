import React from 'react'
import VendorEmptyState from '../components/VendorEmptyState'

export default function VendorAMC() {
  return (
    <div style={{ paddingBottom: 'var(--space-12)' }}>
      <div className="card-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="card-title" style={{ fontSize: 'var(--font-size-xl)' }}>AMC Contracts</h1>
      </div>
      <div className="card-glass">
        <VendorEmptyState
          icon="icon-shield"
          title="AMC Overview"
          description="Annual Maintenance Contracts assigned to your team will appear here. You'll be able to view service schedules, visit history, and upcoming maintenance tasks."
        />
      </div>
    </div>
  )
}
