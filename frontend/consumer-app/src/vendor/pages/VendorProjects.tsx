import React, { useEffect, useState } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import StatusBadge from '../components/StatusBadge'
import VendorEmptyState from '../components/VendorEmptyState'
import { getVendorProjects } from '../services/vendor.service'
import { useNotificationStore } from '../../stores/notificationStore'
import { formatCurrency } from '../../utils/formatters'

interface VendorProjectRow {
  id: string
  title: string
  customerName: string
  city: string
  status: string
  progress: number
  priority: string
  projectValue: number
  solarSystemSize: number
  assignedEngineer: string
  currency: string
}

export function VendorProjects() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [projects, setProjects] = useState<VendorProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const addToast = useNotificationStore((s) => s.addToast)

  useEffect(() => {
    let active = true
    setLoading(true)
    const params: Record<string, string> = {}
    if (activeTab === 'active') params.status = 'active'
    if (activeTab === 'completed') params.status = 'completed'
    getVendorProjects(params)
      .then((rows) => {
        if (!active) return
        setProjects(Array.isArray(rows) ? (rows as VendorProjectRow[]) : [])
      })
      .catch(() => {
        if (active) addToast({ type: 'error', message: 'Could not load projects.' })
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [activeTab, addToast])

  const filtered = projects.filter((p) => {
    const q = searchTerm.toLowerCase()
    return !q || (p.title || '').toLowerCase().includes(q) || (p.customerName || '').toLowerCase().includes(q) || String(p.id || '').toLowerCase().includes(q)
  })

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Project Management"
        subtitle="Track rooftop solar projects across site inspection, procurement, execution, and grid sync."
        badgeText={`${projects.length} Total Projects`}
        actions={
          <button className="vendor-btn-primary" onClick={() => addToast({ type: 'info', message: 'Project creation is available from the dashboard.' })}>
            + New Project
          </button>
        }
      />

      <div className="vendor-glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('all')}
            className={activeTab === 'all' ? 'vendor-btn-primary' : 'vendor-btn-ghost'}
            style={{ padding: '7px 14px', fontSize: '12px' }}
          >
            All Projects ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={activeTab === 'active' ? 'vendor-btn-primary' : 'vendor-btn-ghost'}
            style={{ padding: '7px 14px', fontSize: '12px' }}
          >
            Active ({projects.filter((p) => p.status !== 'completed').length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={activeTab === 'completed' ? 'vendor-btn-primary' : 'vendor-btn-ghost'}
            style={{ padding: '7px 14px', fontSize: '12px' }}
          >
            Completed ({projects.filter((p) => p.status === 'completed').length})
          </button>
        </div>

        <div style={{ width: '260px' }}>
          <input
            type="text"
            className="vendor-input"
            placeholder="Search projects by name, client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="vendor-glass-card" style={{ padding: '0', overflow: 'hidden' }}>
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
                <th>Project ID</th>
                <th>Project Name</th>
                <th>Client</th>
                <th>System Size</th>
                <th>Progress</th>
                <th>Contract Value</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 800, color: 'var(--vendor-primary)' }}>{p.id}</td>
                  <td style={{ fontWeight: 600 }}>{p.title}</td>
                  <td style={{ color: 'var(--vendor-text-secondary)' }}>{p.customerName}</td>
                  <td>{p.solarSystemSize ? `${p.solarSystemSize} kW` : '—'}</td>
                  <td style={{ width: '160px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '7px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div style={{ width: `${p.progress ?? 0}%`, height: '100%', backgroundColor: 'var(--vendor-primary)', boxShadow: '0 0 10px var(--vendor-primary)' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--vendor-text-muted)', fontWeight: 700 }}>{p.progress ?? 0}%</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--vendor-text-primary)' }}>{p.projectValue ? formatCurrency(p.projectValue) : '—'}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <button className="vendor-btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => addToast({ type: 'info', message: `Project ${p.id} — ${p.title}` })}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <VendorEmptyState
            title="No Matching Projects"
            description="No projects match the selected filter criteria or search query."
            action={{ label: 'Reset Filters', onClick: () => { setActiveTab('all'); setSearchTerm(''); } }}
          />
        )}
      </div>
    </div>
  )
}

export default VendorProjects