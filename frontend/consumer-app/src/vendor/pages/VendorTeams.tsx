import React, { useState } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import StatusBadge from '../components/StatusBadge'
import VendorEmptyState from '../components/VendorEmptyState'
import { useVendorNotify } from '../hooks/useVendorNotify'

export function VendorTeams() {
  const notify = useVendorNotify()
  const [search, setSearch] = useState('')

  const teams = [
    { id: 'TEAM-A', name: 'Alpha Field Unit', lead: 'Rajesh Kumar', size: '5 Field Technicians', utilization: '95%', status: 'Active' },
    { id: 'TEAM-B', name: 'Beta Commissioning Unit', lead: 'Ankit Patel', size: '4 System Engineers', utilization: '88%', status: 'Active' },
    { id: 'TEAM-C', name: 'Gamma AMC Unit', lead: 'Sunita Sharma', size: '3 Maintenance Techs', utilization: '75%', status: 'Active' },
  ]

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.lead.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Field Teams & Engineers"
        subtitle="Manage certified field engineer teams, skill allocations, and daily utilization rates."
        badgeText={`${teams.length} Teams`}
        actions={
          <button className="vendor-btn-primary" onClick={() => notify('Create New Team')}>
            + Create New Team
          </button>
        }
      />

      <div className="vendor-glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--vendor-text-secondary)', fontWeight: 600 }}>Field Engineering Roster</span>
        <div style={{ width: '280px' }}>
          <input
            type="text"
            className="vendor-input"
            placeholder="Search teams by name, lead..."
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
                <th>Team ID</th>
                <th>Team Name</th>
                <th>Team Lead</th>
                <th>Headcount</th>
                <th>Utilization Rate</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 800, color: 'var(--vendor-primary)' }}>{t.id}</td>
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td style={{ color: 'var(--vendor-text-secondary)' }}>{t.lead}</td>
                  <td>{t.size}</td>
                  <td style={{ fontWeight: 700, color: 'var(--vendor-success)' }}>{t.utilization}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>
                    <button className="vendor-btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => notify(`Manage Roster: ${t.name}`)}>
                      Manage Roster
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <VendorEmptyState
            title="No Field Teams Found"
            description="No field engineering teams match your current search query."
            action={{ label: 'Reset Search', onClick: () => setSearch('') }}
          />
        )}
      </div>
    </div>
  )
}

export default VendorTeams
