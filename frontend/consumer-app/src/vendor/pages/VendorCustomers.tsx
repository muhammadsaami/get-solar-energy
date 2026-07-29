import React from 'react'
import VendorEmptyState from '../components/VendorEmptyState'

export default function VendorCustomers() {
  return (
    <div style={{ paddingBottom: 'var(--space-12)' }}>
      <div className="card-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="card-title" style={{ fontSize: 'var(--font-size-xl)' }}>Customers</h1>
      </div>
      <div className="card-glass">
        <VendorEmptyState
          icon="icon-users"
          title="Customer Directory"
          description="Customer profiles and contact information will appear here. This view will show customers assigned to your projects."
        />
      </div>
    </div>
  )
}
