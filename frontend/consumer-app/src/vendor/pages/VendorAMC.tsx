import React, { useState } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import StatusBadge from '../components/StatusBadge'
import VendorEmptyState from '../components/VendorEmptyState'
import { useVendorNotify } from '../hooks/useVendorNotify'

export function VendorAMC() {
  const notify = useVendorNotify()
  const [search, setSearch] = useState('')

  const amcContracts = [
    { id: 'AMC-801', client: 'Sharma Residence', plan: 'Gold 5-Year AMC', nextService: '15 Aug 2026', health: '98.5%', status: 'Active' },
    { id: 'AMC-802', client: 'Gupta Commercial', plan: 'Platinum 10-Year AMC', nextService: '22 Aug 2026', health: '96.2%', status: 'Active' },
    { id: 'AMC-803', client: 'Verma Farmhouse', plan: 'Silver 3-Year AMC', nextService: '01 Sep 2026', health: '99.1%', status: 'Active' },
  ]

  const filtered = amcContracts.filter(a =>
    a.client.toLowerCase().includes(search.toLowerCase()) ||
    a.id.toLowerCase().includes(search.toLowerCase()) ||
    a.plan.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Annual Maintenance Contracts (AMC)"
        subtitle="Track system health compliance, automated maintenance schedules, and SLA guarantees."
        badgeText={`${amcContracts.length} Active Contracts`}
        actions={
          <button className="vendor-btn-primary" onClick={() => notify('New AMC Contract')}>
            + Issue New Contract
          </button>
        }
      />

      <div className="vendor-glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--vendor-text-secondary)', fontWeight: 600 }}>Active AMC Service SLA Portfolio</span>
        <div style={{ width: '280px' }}>
          <input
            type="text"
            className="vendor-input"
            placeholder="Search AMC by client, ID, plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="vendor-glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length > 0 ? (
          <table className="vendor-table-container">
            <thead>
              <tr>
                <th>Contract ID</th>
                <th>Client</th>
                <th>Service Plan</th>
                <th>Next Service Date</th>
                <th>Health Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 800, color: 'var(--vendor-primary)' }}>{a.id}</td>
                  <td style={{ fontWeight: 600 }}>{a.client}</td>
                  <td style={{ color: 'var(--vendor-text-secondary)' }}>{a.plan}</td>
                  <td style={{ color: 'var(--vendor-text-muted)' }}>{a.nextService}</td>
                  <td style={{ fontWeight: 700, color: 'var(--vendor-success)' }}>{a.health}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>
                    <button className="vendor-btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => notify(`Schedule Inspection for ${a.id}`)}>
                      Schedule Service
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <VendorEmptyState
            title="No AMC Contracts Found"
            description="No AMC service contracts match your current search query."
            action={{ label: 'Clear Filter', onClick: () => setSearch('') }}
          />
        )}
      </div>
    </div>
  )
}

export default VendorAMC
