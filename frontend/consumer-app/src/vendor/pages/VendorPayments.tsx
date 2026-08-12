import React, { useState } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import StatusBadge from '../components/StatusBadge'
import VendorEmptyState from '../components/VendorEmptyState'
import { useVendorNotify } from '../hooks/useVendorNotify'

export function VendorPayments() {
  const notify = useVendorNotify()
  const [search, setSearch] = useState('')

  const payouts = [
    { id: 'PAY-401', project: 'Sharma Residence 10kW', milestone: 'Milestone 2 (50% Completion)', amount: '₹2,75,000', method: 'NEFT Transfer', status: 'Paid' },
    { id: 'PAY-402', project: 'Gupta Commercial 25kW', milestone: 'Milestone 1 (Advance Procurement)', amount: '₹3,84,000', method: 'RTGS Transfer', status: 'Paid' },
    { id: 'PAY-403', project: 'Verma Farmhouse 15kW', milestone: 'Milestone 3 (Commissioning & QA)', amount: '₹1,64,000', method: 'Escrow Release', status: 'Pending' },
  ]

  const filtered = payouts.filter(p =>
    p.project.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.milestone.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Escrow & Payment Milestone Ledger"
        subtitle="Track customer milestone deposits, escrow releases, and direct bank settlement transfers."
        badgeText={`${payouts.length} Transactions`}
        actions={
          <button className="vendor-btn-primary" onClick={() => notify('Create New Invoice')}>
            + Create New Invoice
          </button>
        }
      />

      <div className="vendor-glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--vendor-text-secondary)', fontWeight: 600 }}>Settlement & Escrow Ledger</span>
        <div style={{ width: '280px' }}>
          <input
            type="text"
            className="vendor-input"
            placeholder="Search payments by Txn, project..."
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
                <th>Txn Ref</th>
                <th>Project</th>
                <th>Payment Milestone</th>
                <th>Amount</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 800, color: 'var(--vendor-primary)' }}>{p.id}</td>
                  <td style={{ fontWeight: 600 }}>{p.project}</td>
                  <td style={{ color: 'var(--vendor-text-secondary)' }}>{p.milestone}</td>
                  <td style={{ fontWeight: 700, color: 'var(--vendor-success)' }}>{p.amount}</td>
                  <td style={{ color: 'var(--vendor-text-muted)' }}>{p.method}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <button className="vendor-btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => notify(`Download Receipt for ${p.id}`)}>
                      Receipt PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <VendorEmptyState
            title="No Payment Records Found"
            description="No transactions match your current search term."
            action={{ label: 'Reset Filter', onClick: () => setSearch('') }}
          />
        )}
      </div>
    </div>
  )
}

export default VendorPayments
