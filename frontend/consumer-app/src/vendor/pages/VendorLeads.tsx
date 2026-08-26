import React, { useState, useEffect, useCallback, useRef } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import StatusBadge from '../components/StatusBadge'
import VendorEmptyState from '../components/VendorEmptyState'
import { useVendorNotify } from '../hooks/useVendorNotify'
import { getVendorProjects } from '../services/vendor.service'

export function VendorLeads() {
  const notify = useVendorNotify()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leads, setLeads] = useState<Array<{
    id: string
    name: string
    size: string
    contact: string
    value: string
    status: string
    probability: string
  }>>([])

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchLeads = useCallback(async () => {
    if (!isMountedRef.current) return
    setLoading(true)
    setError(null)
    try {
      const projects = await getVendorProjects({ stage: 'lead' })
      if (!isMountedRef.current) return
      const mapped = (projects || []).map((p: any) => ({
        id: p.displayId ? `LEAD-${p.displayId.replace('PRJ-', '')}` : `LEAD-${p.id}`,
        name: p.customerName || p.title || 'Prospective Customer',
        size: p.capacityKw ? `${p.capacityKw} kW ${p.systemType || 'System'}` : '—',
        contact: p.customerPhone || p.customerEmail || p.assignedEngineer || '—',
        value: p.budget ? `₹${Number(p.budget).toLocaleString('en-IN')}` : '—',
        status: p.status === 'lead' ? 'Proposal Sent' : (p.status || 'Applied'),
        probability: p.healthScore ? `${Math.min(95, Math.max(40, p.healthScore))}%` : '—'
      }))
      setLeads(mapped)
    } catch (err: any) {
      if (!isMountedRef.current) return
      setError(err?.message || 'Failed to load sales leads from server.')
      setLeads([])
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const filtered = leads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.id.toLowerCase().includes(search.toLowerCase()) ||
    l.contact.toLowerCase().includes(search.toLowerCase())
  )

  const badgeText = loading ? 'Loading Leads...' : error ? '— Active Leads' : `${leads.length} Active Leads`

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Sales Leads & Pipeline"
        subtitle="Manage prospective solar installation leads, site surveys, and commercial proposals."
        badgeText={badgeText}
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

      <div className="vendor-glass-card" style={{ padding: 0, overflow: 'hidden', minHeight: '300px' }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--vendor-text-secondary)' }}>
            Loading sales leads from live database...
          </div>
        ) : error ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--vendor-danger)', margin: '0 0 16px', fontSize: '14px' }}>{error}</p>
            <button className="vendor-btn-primary" onClick={fetchLeads}>🔄 Retry Load</button>
          </div>
        ) : filtered.length > 0 ? (
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
