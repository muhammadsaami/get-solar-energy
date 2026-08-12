import React, { useState } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import StatusBadge from '../components/StatusBadge'
import VendorEmptyState from '../components/VendorEmptyState'
import { useVendorNotify } from '../hooks/useVendorNotify'

export function VendorInstallations() {
  const notify = useVendorNotify()
  const [search, setSearch] = useState('')

  const installations = [
    { id: 'INS-301', site: 'Sharma Residence 10kW', location: 'Jaipur Sector 4', team: 'Alpha Crew (3 Engineers)', date: 'Today, 09:00 AM', status: 'In Progress' },
    { id: 'INS-302', site: 'Gupta Commercial 25kW', location: 'Okhla Phase 3, Delhi', team: 'Beta Crew (4 Engineers)', date: 'Tomorrow, 10:00 AM', status: 'Assigned' },
    { id: 'INS-303', site: 'Verma Farmhouse 15kW', location: 'Fatehsagar, Udaipur', team: 'Gamma Crew (2 Engineers)', date: 'Yesterday', status: 'Completed' },
  ]

  const filtered = installations.filter(i =>
    i.site.toLowerCase().includes(search.toLowerCase()) ||
    i.id.toLowerCase().includes(search.toLowerCase()) ||
    i.location.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Field Installations"
        subtitle="Coordinate field installation crews, equipment delivery, and pre-commissioning QA."
        badgeText={`${installations.length} Schedules`}
        actions={
          <button className="vendor-btn-primary" onClick={() => notify('Schedule Installation')}>
            + Dispatch Installation Crew
          </button>
        }
      />

      <div className="vendor-glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--vendor-text-secondary)', fontWeight: 600 }}>Active Field Dispatch Tracker</span>
        <div style={{ width: '280px' }}>
          <input
            type="text"
            className="vendor-input"
            placeholder="Search installations by site, ID..."
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
                <th>Install ID</th>
                <th>Site Location</th>
                <th>Address</th>
                <th>Assigned Crew</th>
                <th>Scheduled Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id}>
                  <td style={{ fontWeight: 800, color: 'var(--vendor-primary)' }}>{i.id}</td>
                  <td style={{ fontWeight: 600 }}>{i.site}</td>
                  <td style={{ color: 'var(--vendor-text-secondary)', fontSize: '12px' }}>{i.location}</td>
                  <td style={{ color: 'var(--vendor-text-secondary)' }}>{i.team}</td>
                  <td style={{ color: 'var(--vendor-text-muted)' }}>{i.date}</td>
                  <td><StatusBadge status={i.status} /></td>
                  <td>
                    <button className="vendor-btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => notify(`View Dispatch details: ${i.id}`)}>
                      Track Dispatch
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <VendorEmptyState
            title="No Installation Dispatches Found"
            description="No field installation dispatches match your search term."
            action={{ label: 'Reset Filter', onClick: () => setSearch('') }}
          />
        )}
      </div>
    </div>
  )
}

export default VendorInstallations
