import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getVendorProjects, updateVendorProjectStage } from '../services/vendor.service'
import VendorEmptyState from '../components/VendorEmptyState'
import { useAuth } from '../../contexts/AuthContext'

interface Project {
  id: string; title: string; customerName: string; city: string
  status: string; progress: number; priority: string; healthScore: number
  assignedEngineer: string; assignedTeam: string; startDate: string
  targetDate: string
}

export default function VendorProjects() {
  const { user } = useAuth() as unknown as { user: { role: string } | null }
  const [searchParams] = useSearchParams()
  const filterStatus = searchParams.get('status') || ''

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string> = {}
      if (filterStatus) params.status = filterStatus
      if (stageFilter) params.stage = stageFilter
      if (search.trim()) params.search = search.trim()
      const data = await getVendorProjects(params)
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, stageFilter, search])

  useEffect(() => { load() }, [load])

  const handleStageChange = async (projectId: string, newStage: string) => {
    try {
      await updateVendorProjectStage(projectId, newStage)
      await load()
    } catch {
      // silently fail
    }
  }

  const isVendor = user?.role === 'vendor'

  return (
    <div style={{ paddingBottom: 'var(--space-12)' }}>
      <div className="card-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="card-title" style={{ fontSize: 'var(--font-size-xl)' }}>
          {filterStatus === 'completed' ? 'Completed Projects' : 'Active Projects'}
        </h1>
        <button className="btn btn-outline btn-sm" onClick={load} aria-label="Refresh projects">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="card-glass" style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={{ flex: 1 }}
          aria-label="Search projects"
        />
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="input"
          style={{ width: 180 }}
          aria-label="Filter by stage"
        >
          <option value="">All Stages</option>
          <option value="initiation">Initiation</option>
          <option value="design">Design</option>
          <option value="pre-installation">Pre-Installation</option>
          <option value="installation">Installation</option>
          <option value="commissioning">Commissioning</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : error ? (
        <div className="card-glass">
          <VendorEmptyState icon="icon-alert-triangle" title="Error loading projects" description={error} action={{ label: 'Retry', onClick: load }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="card-glass">
          <VendorEmptyState icon="icon-folder" title="No Projects" description="No assigned projects found matching your criteria." />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {projects.map((p) => (
            <div
              key={p.id}
              className="card-glass"
              style={{ padding: 'var(--space-4)', cursor: 'pointer' }}
              onClick={() => setSelectedProject(selectedProject?.id === p.id ? null : p)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setSelectedProject(selectedProject?.id === p.id ? null : p) }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                    {p.customerName} &middot; {p.city} &middot; ID: {p.id}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <span className="badge badge-blue">{p.status}</span>
                    <span className={`badge ${p.priority === 'critical' ? 'badge-red' : p.priority === 'high' ? 'badge-orange' : 'badge-gray'}`}>
                      {p.priority}
                    </span>
                    <span className="badge badge-green">{p.progress}%</span>
                    <span className="badge badge-purple">Health: {p.healthScore}</span>
                  </div>
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>
                  {p.assignedEngineer && <div>Engineer: {p.assignedEngineer}</div>}
                  {p.targetDate && <div>Target: {p.targetDate}</div>}
                </div>
              </div>

              {selectedProject?.id === p.id && (
                <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Update Stage</p>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {['initiation', 'design', 'pre-installation', 'installation', 'commissioning', 'completed'].map((stage) => (
                      <button
                        key={stage}
                        className={`btn btn-sm ${p.status === stage ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleStageChange(p.id, stage)}
                        disabled={p.status === stage || (isVendor && stage === 'completed')}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
