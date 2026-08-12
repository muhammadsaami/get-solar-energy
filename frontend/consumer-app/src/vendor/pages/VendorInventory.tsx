import React, { useState } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import StatusBadge from '../components/StatusBadge'
import VendorEmptyState from '../components/VendorEmptyState'
import { useVendorNotify } from '../hooks/useVendorNotify'

export function VendorInventory() {
  const notify = useVendorNotify()
  const [search, setSearch] = useState('')

  const stock = [
    { id: 'SKU-540W', name: '540W Mono PERC Solar Panels', category: 'Module', quantity: '420 Units', warehouse: 'Jaipur Central', status: 'In Stock' },
    { id: 'SKU-INV10', name: '10kW Three-Phase String Inverter', category: 'Inverter', quantity: '18 Units', warehouse: 'Jaipur Central', status: 'In Stock' },
    { id: 'SKU-MC4', name: 'MC4 Male/Female Connectors (1000V)', category: 'BOS Wire', quantity: '1200 Units', warehouse: 'Jaipur Central', status: 'In Stock' },
    { id: 'SKU-STR-AL', name: 'Aluminum Roof Mounting Rails', category: 'Structure', quantity: '45 Units', warehouse: 'Udaipur Hub', status: 'Low Stock' },
  ]

  const filtered = stock.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Inventory & Stock Tracking"
        subtitle="Real-time warehouse inventory for PV modules, string inverters, and mounting hardware."
        badgeText={`${stock.length} Active SKUs`}
        actions={
          <button className="vendor-btn-primary" onClick={() => notify('Add Stock SKU')}>
            + Add Stock Item
          </button>
        }
      />

      <div className="vendor-glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--vendor-text-secondary)', fontWeight: 600 }}>Warehouse Material Reserve</span>
        <div style={{ width: '280px' }}>
          <input
            type="text"
            className="vendor-input"
            placeholder="Search SKU by name, category..."
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
                <th>SKU Code</th>
                <th>Item Description</th>
                <th>Category</th>
                <th>Stock Quantity</th>
                <th>Warehouse Hub</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 800, color: 'var(--vendor-primary)' }}>{s.id}</td>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td style={{ color: 'var(--vendor-text-secondary)' }}>{s.category}</td>
                  <td style={{ fontWeight: 700, color: '#FFFFFF' }}>{s.quantity}</td>
                  <td style={{ color: 'var(--vendor-text-muted)' }}>{s.warehouse}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>
                    <button className="vendor-btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => notify(`Stock Dispatch for SKU ${s.id}`)}>
                      Reorder / Issue
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <VendorEmptyState
            title="No SKUs Found"
            description="No inventory items match your search term."
            action={{ label: 'Clear Filter', onClick: () => setSearch('') }}
          />
        )}
      </div>
    </div>
  )
}

export default VendorInventory
