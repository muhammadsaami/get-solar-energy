import React, { useState } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import StatusBadge from '../components/StatusBadge'
import VendorEmptyState from '../components/VendorEmptyState'
import { useVendorNotify } from '../hooks/useVendorNotify'

export function VendorDocuments() {
  const notify = useVendorNotify()
  const [search, setSearch] = useState('')

  const docs = [
    { id: 'DOC-101', title: 'Jaipur DISCOM Net-Metering Application Form-A', category: 'Government & Utility', date: '28 Jul 2026', status: 'Approved' },
    { id: 'DOC-102', title: 'Sharma Residence EPC Turnkey Contract & Warranty', category: 'Customer Contracts', date: '25 Jul 2026', status: 'Verified' },
    { id: 'DOC-103', title: '540W Mono PERC Module Flash Test Reports', category: 'Quality Inspection', date: '20 Jul 2026', status: 'Verified' },
  ]

  const filtered = docs.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.id.toLowerCase().includes(search.toLowerCase()) ||
    d.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Document Vault & Legal Approvals"
        subtitle="Centralized repository for turnkey EPC contracts, DISCOM interconnection permits, and warranty certificates."
        badgeText={`${docs.length} Verified Records`}
        actions={
          <button className="vendor-btn-primary" onClick={() => notify('Upload Document')}>
            + Upload New Document
          </button>
        }
      />

      <div className="vendor-glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--vendor-text-secondary)', fontWeight: 600 }}>Compliance & Legal Vault</span>
        <div style={{ width: '280px' }}>
          <input
            type="text"
            className="vendor-input"
            placeholder="Search documents by title, ID..."
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
                <th>Doc Ref</th>
                <th>Document Title</th>
                <th>Category</th>
                <th>Filing Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 800, color: 'var(--vendor-primary)' }}>{d.id}</td>
                  <td style={{ fontWeight: 600 }}>{d.title}</td>
                  <td style={{ color: 'var(--vendor-text-secondary)' }}>{d.category}</td>
                  <td style={{ color: 'var(--vendor-text-muted)' }}>{d.date}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>
                    <button className="vendor-btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => notify(`View Document ${d.id}`)}>
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <VendorEmptyState
            title="No Documents Found"
            description="No documents in your vault match your search query."
            action={{ label: 'Reset Search', onClick: () => setSearch('') }}
          />
        )}
      </div>
    </div>
  )
}

export default VendorDocuments
