import React, { useState, useEffect, useCallback, useRef } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import StatusBadge from '../components/StatusBadge'
import VendorEmptyState from '../components/VendorEmptyState'
import { useVendorNotify } from '../hooks/useVendorNotify'
import { getVendorProjects } from '../services/vendor.service'

export function VendorInstallations() {
  const notify = useVendorNotify()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [installations, setInstallations] = useState<Array<{
    id: string
    site: string
    location: string
    team: string
    date: string
    status: string
  }>>([])

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchInstallations = useCallback(async () => {
    if (!isMountedRef.current) return
    setLoading(true)
    setError(null)
    try {
      const projects = await getVendorProjects({ stage: 'installation' })
      if (!isMountedRef.current) return
      const mapped = (projects || []).map((p: any) => ({
        id: p.displayId || `INS-${p.id}`,
        site: p.title || p.projectName || 'Residential Solar Installation',
        location: p.address ? `${p.address}, ${p.city || ''}` : (p.city || 'Site Location'),
        team: p.assignedInstaller || p.assignedTeam || 'Field Installation Crew',
        date: p.startDate ? new Date(p.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Scheduled',
        status: p.status === 'installation' ? 'In Progress' : (p.status || 'Scheduled')
      }))
      setInstallations(mapped)
    } catch (err: any) {
      if (!isMountedRef.current) return
      setError(err?.message || 'Failed to load installation schedules.')
      setInstallations([])
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInstallations()
  }, [fetchInstallations])

  const filtered = installations.filter(i =>
    i.site.toLowerCase().includes(search.toLowerCase()) ||
    i.id.toLowerCase().includes(search.toLowerCase()) ||
    i.location.toLowerCase().includes(search.toLowerCase())
  )

  const badgeText = loading ? 'Loading Dispatches...' : error ? '— Schedules' : `${installations.length} Schedules`

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Field Installations"
        subtitle="Coordinate field installation crews, equipment delivery, and pre-commissioning QA."
        badgeText={badgeText}
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

      <div className="vendor-glass-card" style={{ padding: 0, overflow: 'hidden', minHeight: '300px' }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--vendor-text-secondary)' }}>
            Loading field installations from live database...
          </div>
        ) : error ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--vendor-danger)', margin: '0 0 16px', fontSize: '14px' }}>{error}</p>
            <button className="vendor-btn-primary" onClick={fetchInstallations}>🔄 Retry Load</button>
          </div>
        ) : filtered.length > 0 ? (
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
