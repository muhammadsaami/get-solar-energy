import React, { useState, useEffect } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import StatusBadge from '../components/StatusBadge'
import VendorEmptyState from '../components/VendorEmptyState'
import { useVendorNotify } from '../hooks/useVendorNotify'
import { getVendorProjects } from '../services/vendor.service'

export function VendorAMC() {
  const notify = useVendorNotify()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [amcContracts, setAmcContracts] = useState<Array<{
    id: string
    client: string
    plan: string
    nextService: string
    health: string
    status: string
  }>>([])

  useEffect(() => {
    let active = true
    async function fetchAMC() {
      try {
        setLoading(true)
        setError(null)
        const projects = await getVendorProjects({ stage: 'amc' })
        if (!active) return
        const mapped = (projects || []).map((p: any) => ({
          id: p.displayId ? `AMC-${p.displayId.replace('PRJ-', '')}` : `AMC-${p.id}`,
          client: p.customerName || p.title || 'Client',
          plan: `${p.capacityKw || 5}kW Comprehensive AMC SLA`,
          nextService: p.targetDate ? new Date(p.targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Next Service Pending',
          health: p.healthScore ? `${p.healthScore}%` : '98.0%',
          status: p.status === 'amc' ? 'Active' : (p.status || 'Active')
        }))
        setAmcContracts(mapped)
      } catch (err: any) {
        if (!active) return
        setError(err?.message || 'Failed to load AMC contracts.')
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchAMC()
    return () => { active = false }
  }, [])

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
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--vendor-text-secondary)' }}>
            Loading AMC contracts...
          </div>
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--vendor-danger)' }}>
            {error}
          </div>
        ) : filtered.length > 0 ? (
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
