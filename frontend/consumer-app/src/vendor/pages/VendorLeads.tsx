import React, { useState } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import StatusBadge from '../components/StatusBadge'
import VendorEmptyState from '../components/VendorEmptyState'
import { useVendorNotify } from '../hooks/useVendorNotify'

export function VendorLeads() {
  const notify = useVendorNotify()
  const [search, setSearch] = useState('')

  const leads = [
    { id: 'LEAD-901', name: 'Jaipur Textile Mill', size: '100 kW Commercial', contact: 'Manish Mehta', status: 'Proposal Sent', probability: '80%', value: '₹42,00,000' },
    { id: 'LEAD-902', name: 'Singhal Villa', size: '8 kW Residential', contact: 'Ritu Singhal', status: 'Site Surveyed', probability: '60%', value: '₹4,80,000' },
    { id: 'LEAD-903', name: 'Apex Hospital Array', size: '40 kW Commercial', contact: 'Dr. K. Sharma', status: 'Applied', probability: '40%', value: '₹18,50,000' },
  ]

  const filtered = leads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.id.toLowerCase().includes(search.toLowerCase()) ||
    l.contact.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Sales Leads & Pipeline"
        subtitle="Manage prospective solar installation leads, site surveys, and commercial proposals."
        badgeText={`${leads.length} Active Leads`}
        actions={
          <button className="vendor-btn-primary" onClick={() => notify('Capture Lead Modal')}>
            + Capture New Lead
          </button>
        }
      />

      <div className="vendor-glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--vendor-text-secondary)', fontWeight: 600 }}>Inbound Lead Conversion Pipeline</span>
        <div style={{ width: '280px' }}>
          <input
            type="text"
            className="vendor-input"
            placeholder="Search leads by name, ID, contact..."
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
                <th>Lead ID</th>
                <th>Lead Name</th>
                <th>Capacity</th>
                <th>Contact Person</th>
                <th>Est. Deal Value</th>
                <th>Stage</th>
                <th>Win Probability</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 800, color: 'var(--vendor-primary)' }}>{l.id}</td>
                  <td style={{ fontWeight: 600 }}>{l.name}</td>
                  <td>{l.size}</td>
                  <td style={{ color: 'var(--vendor-text-secondary)' }}>{l.contact}</td>
                  <td style={{ fontWeight: 700, color: '#FFFFFF' }}>{l.value}</td>
                  <td><StatusBadge status={l.status} /></td>
                  <td style={{ fontWeight: 700, color: 'var(--vendor-success)' }}>{l.probability}</td>
                  <td>
                    <button className="vendor-btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => notify(`Open Proposal for ${l.name}`)}>
                      Convert Lead
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <VendorEmptyState
            title="No Matching Leads"
            description="No sales leads match the current search query."
            action={{ label: 'Reset Search', onClick: () => setSearch('') }}
          />
        )}
      </div>
    </div>
  )
}

export default VendorLeads
