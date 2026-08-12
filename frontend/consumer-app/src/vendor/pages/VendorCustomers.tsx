import React, { useEffect, useState } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import StatusBadge from '../components/StatusBadge'
import VendorEmptyState from '../components/VendorEmptyState'
import { getCustomerDirectory } from '../services/vendor.service'
import { useNotificationStore } from '../../stores/notificationStore'

interface VendorCustomerRow {
  id: string
  name: string
  city: string
  system: string
  phone: string
  email: string
  status: string
}

export function VendorCustomers() {
  const [search, setSearch] = useState('')
  const [customers, setCustomers] = useState<VendorCustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const addToast = useNotificationStore((s) => s.addToast)

  useEffect(() => {
    let active = true
    setLoading(true)
    getCustomerDirectory()
      .then((rows) => {
        if (!active) return
        setCustomers((rows as Array<Record<string, unknown>>).map((c) => {
          const kw = (Array.isArray(c.bills) && (c.bills[0] as Record<string, unknown>)?.recommended_kw) || 0
          return {
            id: String(c.consumer_number || c.id),
            name: String(c.customer_name || ''),
            city: String(c.city || ''),
            system: kw ? `${kw} kW` : '—',
            phone: String(c.phone || '—'),
            email: String(c.email || '—'),
            status: String(c.status || 'Active'),
          }
        }))
      })
      .catch(() => {
        if (active) addToast({ type: 'error', message: 'Could not load customer directory.' })
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [addToast])

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)
  })

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Customer Directory"
        subtitle="Manage customer relationships, system installations, and ongoing support contacts."
        badgeText={`${customers.length} Accounts`}
        actions={
          <button className="vendor-btn-primary" onClick={() => addToast({ type: 'info', message: 'Adding customers is handled from the CRM workspace.' })}>
            + Add New Customer
          </button>
        }
      />

      <div className="vendor-glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--vendor-text-secondary)', fontWeight: 600 }}>Customer Accounts Directory</span>
        <div style={{ width: '280px' }}>
          <input
            type="text"
            className="vendor-input"
            placeholder="Search by customer name, ID, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="vendor-glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px', display: 'grid', gap: '12px' }}>
            <div className="vendor-skeleton" style={{ width: '100%', height: '40px' }} />
            <div className="vendor-skeleton" style={{ width: '100%', height: '40px' }} />
            <div className="vendor-skeleton" style={{ width: '100%', height: '40px' }} />
          </div>
        ) : filtered.length > 0 ? (
          <table className="vendor-table-container">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>City</th>
                <th>System Setup</th>
                <th>Contact Phone</th>
                <th>Email</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 800, color: 'var(--vendor-primary)' }}>{c.id || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{c.name || '—'}</td>
                  <td style={{ color: 'var(--vendor-text-secondary)' }}>{c.city || '—'}</td>
                  <td>{c.system}</td>
                  <td style={{ color: 'var(--vendor-text-muted)' }}>{c.phone}</td>
                  <td style={{ color: 'var(--vendor-text-secondary)', fontSize: '12px' }}>{c.email}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <button className="vendor-btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => addToast({ type: 'info', message: `Customer account: ${c.name}` })}>
                      Manage Account
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <VendorEmptyState
            title="No Customers Found"
            description="No customer records match your current search term."
            action={{ label: 'Clear Search', onClick: () => setSearch('') }}
          />
        )}
      </div>
    </div>
  )
}

export default VendorCustomers