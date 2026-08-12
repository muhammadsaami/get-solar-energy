import { useState, useEffect, useCallback, useMemo } from 'react'
import { mlopsService } from '../../services/mlops.service'
import type { MlopsHealth, MlopsMetrics, MlopsDrift, MlopsEvent, MlopsVersion, MlModelInfo } from './mlops.types'
import ModelDetailDrawer from './ModelDetailDrawer'

export interface MlopsRegistryRow {
  name: string
  version: string
  algorithm: string
  framework: string
  task: string
  lifecycleState: string
  checksum?: string
  fileSize?: number
  features?: string[]
  trainingDate?: string | null
  lastDeployment?: string | null
}

const DEPLOYMENT_META: Record<string, { label: string; color: string; bg: string }> = {
  healthy: { label: 'Healthy', color: '#36d399', bg: 'rgba(54,211,153,0.15)' },
  deploying: { label: 'Deploying', color: '#17a8e5', bg: 'rgba(23,168,229,0.15)' },
  failed: { label: 'Failed', color: '#f43f5e', bg: 'rgba(244,63,94,0.15)' },
  retired: { label: 'Retired', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
}

const USAGE_COLORS = ['#ff8a1d', '#17a8e5', '#36d399', '#fbbf24', '#f43f5e']

function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${Math.floor((seconds % 3600) / 60)}m`
  return `${Math.floor(seconds / 60)}m`
}

function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  return ms < 1 ? `${(ms * 1000).toFixed(0)}μs` : `${ms.toFixed(1)}ms`
}

function shortTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ts
  }
}

function deploymentStatus(state: string): keyof typeof DEPLOYMENT_META {
  if (state === 'active' || state === 'deployed') return 'healthy'
  if (state === 'failed' || state === 'error') return 'failed'
  if (state === 'registered' || state === 'archived' || state === 'retired') return 'retired'
  return 'deploying'
}

function DeploymentBadge({ state }: { state: string }) {
  const meta = DEPLOYMENT_META[deploymentStatus(state)]
  return (
    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: meta.bg, color: meta.color, whiteSpace: 'nowrap' }}>
      {meta.label}
    </span>
  )
}

function EventBadge({ eventType }: { eventType: string }) {
  const isError = /error|fail/.test(eventType)
  const isRollback = /rollback/.test(eventType)
  const isDeploy = /deploy/.test(eventType)
  const color = isError ? '#f43f5e' : isRollback ? '#fbbf24' : isDeploy ? '#36d399' : '#17a8e5'
  const bg = isError ? 'rgba(244,63,94,0.15)' : isRollback ? 'rgba(251,191,36,0.15)' : isDeploy ? 'rgba(54,211,153,0.15)' : 'rgba(23,168,229,0.15)'
  return (
    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: bg, color, whiteSpace: 'nowrap' }}>
      {eventType.replace(/_/g, ' ')}
    </span>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="ew-divider-head">
      <h2 className="ew-divider-title">{title}</h2>
      {subtitle && <span className="ew-divider-sub">{subtitle}</span>}
    </div>
  )
}

export default function MlOpsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [platformStatus, setPlatformStatus] = useState<{ status: string; totalModels: number; activeModels: number; registryLoaded: boolean; operational: boolean } | null>(null)
  const [mlModels, setMlModels] = useState<MlModelInfo[]>([])
  const [health, setHealth] = useState<MlopsHealth | null>(null)
  const [metrics, setMetrics] = useState<MlopsMetrics | null>(null)
  const [drift, setDrift] = useState<MlopsDrift | null>(null)
  const [events, setEvents] = useState<MlopsEvent[]>([])
  const [versions, setVersions] = useState<MlopsVersion[]>([])
  const [selectedModel, setSelectedModel] = useState<MlopsRegistryRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pStatus, mlMdlList, hData, mData, dData, evData, vData] = await Promise.all([
        mlopsService.getStatus().catch(() => null),
        mlopsService.getMlModels().catch(() => []),
        mlopsService.getHealth().catch(() => null),
        mlopsService.getMetrics().catch(() => null),
        mlopsService.getDrift().catch(() => null),
        mlopsService.getEvents(undefined, 200).catch(() => []),
        mlopsService.getVersions().catch(() => []),
      ])
      setPlatformStatus(pStatus)
      setMlModels(mlMdlList)
      setHealth(hData)
      setMetrics(mData)
      setDrift(dData)
      setEvents(evData)
      setVersions(vData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load MLOps data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const registryRows = useMemo<MlopsRegistryRow[]>(() => {
    const regMap = new Map(mlModels.map(m => [m.name, m]))
    return Array.from(regMap.values()).map(m => ({
      name: m.name,
      version: m.version,
      algorithm: m.algorithm,
      framework: m.framework,
      task: m.task,
      lifecycleState: m.status || 'registered',
      checksum: m.checksum,
      fileSize: m.fileSize,
      features: m.features ?? [],
      trainingDate: null,
      lastDeployment: null,
    }))
  }, [mlModels])

  const activeModels = mlModels.filter(m => m.status === 'active').length || platformStatus?.activeModels || 0
  const totalModels = platformStatus?.totalModels ?? mlModels.length
  const inferenceRequests = useMemo(() => Object.values(metrics?.modelUsage ?? {}).reduce((sum, n) => sum + n, 0), [metrics])
  const avgLatency = metrics?.latencyStats?.avgMs ?? 0
  const availability = health?.modelAvailabilityPct ?? 0

  const kpis = [
    { label: 'Active Models', value: activeModels, accent: 'accent-blue' },
    { label: 'Inference Requests', value: inferenceRequests.toLocaleString('en-IN'), accent: 'accent-orange' },
    { label: 'Average Latency', value: avgLatency > 0 ? formatMs(avgLatency) : '—', accent: 'accent-teal' },
    { label: 'Model Availability', value: availability > 0 ? `${availability.toFixed(1)}%` : '—', accent: 'accent-green' },
  ]

  if (loading && registryRows.length === 0) {
    return (
      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div className="skeleton-loader" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton-loader" style={{ height: 60, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton-loader" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
      </div>
    )
  }

  if (error && registryRows.length === 0) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <div className="card-glass" style={{ padding: 'var(--space-8)', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>⚠</div>
          <h3 style={{ margin: '0 0 var(--space-2)' }}>Connection Error</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', margin: '0 0 var(--space-4)' }}>{error}</p>
          <button className="btn btn-primary" onClick={load}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="ew-page">
      <header className="tab-header-block">
        <div>
          <h2 className="tab-heading">ML Operations</h2>
          <p className="tab-subheading">
            Inspect the model registry, deployment health, inference performance, and drift — from a single ML lifecycle view.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={load}
          disabled={loading}
          style={{ whiteSpace: 'nowrap' }}
        >
          <span style={{ display: 'inline-flex', marginRight: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </span>
          {loading ? 'Syncing...' : 'Sync MLOps'}
        </button>
      </header>

      <section aria-label="Key Metrics" className="card-grid-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className={`card-metric ${kpi.accent}`}>
            <div className="card-metric-value">{loading ? '—' : kpi.value}</div>
            <div className="card-metric-label">{kpi.label}</div>
          </div>
        ))}
      </section>

      <ExportBar registryRows={registryRows} events={events} />

      <div>
        <SectionHeader title="Model Registry" subtitle={`${registryRows.length} models · select a model to review its version history`} />
        <RegistryTable registryRows={registryRows} loading={loading} onSelect={setSelectedModel} />
      </div>

      <div>
        <SectionHeader title="Deployment Status" subtitle="Which models are serving, and how healthy are they?" />
        <DeploymentStatusSection registryRows={registryRows} health={health} totalModels={totalModels} />
      </div>

      <div>
        <SectionHeader title="Inference Performance" subtitle="Request volume, failures, and latency distribution" />
        <InferencePerformanceSection metrics={metrics} />
      </div>

      <div>
        <SectionHeader title="Model Drift" subtitle="Has model performance changed over time?" />
        <DriftSection drift={drift} loading={loading} />
      </div>

      <div>
        <SectionHeader title="Inference Logs" subtitle="Model lifecycle and deployment timeline" />
        <EventsTable events={events} loading={loading} />
      </div>

      <ModelDetailDrawer model={selectedModel} versions={versions} events={events} onClose={() => setSelectedModel(null)} />
    </div>
  )
}

function RegistryTable({ registryRows, loading, onSelect }: {
  registryRows: MlopsRegistryRow[]; loading: boolean; onSelect: (row: MlopsRegistryRow) => void
}) {
  return (
    <div className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }} role="grid" aria-label="Model registry">
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)', position: 'sticky', top: 0, zIndex: 1 }}>
              {['Model', 'Version', 'Algorithm', 'Task', 'Status', 'Last Deployment', ''].map(col => (
                <th key={col} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '11px' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 'var(--space-4)' }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton-loader" style={{ height: 36, marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-md)' }} />)}
              </td></tr>
            ) : registryRows.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No models registered in the registry.
              </td></tr>
            ) : (
              registryRows.map(m => (
                <tr key={m.name}
                  onClick={() => onSelect(m)}
                  role="row" tabIndex={0}
                  onKeyDown={ev => ev.key === 'Enter' && onSelect(m)}
                  style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s', cursor: 'pointer' }}
                  className="table-row-hover">
                  <td style={{ padding: '8px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{m.name}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontSize: '11px', color: 'var(--text-secondary)' }}>{m.version}</span>
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: '11px', whiteSpace: 'nowrap' }}>{m.algorithm}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{m.task}</td>
                  <td style={{ padding: '8px 12px' }}><DeploymentBadge state={m.lifecycleState} /></td>
                  <td style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {m.lastDeployment ? new Date(m.lastDeployment).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-orange)', whiteSpace: 'nowrap' }}>Versions ›</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DeploymentStatusSection({ registryRows, health, totalModels }: {
  registryRows: MlopsRegistryRow[]; health: MlopsHealth | null; totalModels: number
}) {
  const loaded = health?.loadedModels ?? 0
  const availability = health?.modelAvailabilityPct ?? 0
  const loadFailures = health?.modelLoadFailures ?? 0
  const uptime = health?.uptimeSeconds ?? 0

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-4)', fontSize: '11px', color: 'var(--text-secondary)' }}>
        <span>Loaded <strong style={{ color: 'var(--text-primary)' }}>{loaded}/{totalModels}</strong> models</span>
        <span aria-hidden="true">·</span>
        <span>Availability <strong style={{ color: availability >= 99 ? '#36d399' : '#fbbf24' }}>{availability.toFixed(1)}%</strong></span>
        <span aria-hidden="true">·</span>
        <span>Load failures <strong style={{ color: loadFailures === 0 ? '#36d399' : '#f43f5e' }}>{loadFailures}</strong></span>
        <span aria-hidden="true">·</span>
        <span>Uptime <strong style={{ color: 'var(--text-primary)' }}>{formatUptime(uptime)}</strong></span>
      </div>

      <div className="card-grid-2">
        {registryRows.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            No deployment status available
          </div>
        ) : registryRows.map(m => {
          const meta = DEPLOYMENT_META[deploymentStatus(m.lifecycleState)]
          return (
            <div key={m.name} style={{ padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${meta.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{m.name}</span>
                <DeploymentBadge state={m.lifecycleState} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <span>Version <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono, ui-monospace, monospace)' }}>{m.version}</strong></span>
                <span>Last deployment <strong style={{ color: 'var(--text-primary)' }}>{m.lastDeployment ? shortTimestamp(m.lastDeployment) : '—'}</strong></span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InferencePerformanceSection({ metrics }: { metrics: MlopsMetrics | null }) {
  const usage = Object.entries(metrics?.modelUsage ?? {}).sort((a, b) => b[1] - a[1])
  const maxUsage = usage.length > 0 ? Math.max(...usage.map(([, n]) => n)) : 0

  const failures = Object.entries(metrics?.failuresByModel ?? {}).sort((a, b) => b[1] - a[1])
  const maxFailure = failures.length > 0 ? Math.max(...failures.map(([, n]) => n)) : 0

  const ls = metrics?.latencyStats

  return (
    <div className="card-grid-2">
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        <div style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
          Which models receive the most requests?
        </div>
        {usage.length === 0 ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            No request volume recorded yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {usage.map(([model, count], i) => (
              <div key={model}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{model}</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{count}</strong>
                </div>
                <div style={{ height: 6, background: 'var(--glass-bg)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${maxUsage > 0 ? (count / maxUsage) * 100 : 0}%`, height: '100%', background: USAGE_COLORS[i % USAGE_COLORS.length], borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        <div style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
          Is latency within acceptable limits?
        </div>
        {!ls ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            No latency data available
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[
              { label: 'P50', value: ls.p50Ms },
              { label: 'P95', value: ls.p95Ms },
              { label: 'P99', value: ls.p99Ms },
            ].map(item => {
              const maxLat = Math.max(ls.p99Ms, 1)
              return (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{formatMs(item.value)}</strong>
                  </div>
                  <div style={{ height: 6, background: 'var(--glass-bg)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${(item.value / maxLat) * 100}%`, height: '100%', background: item.label === 'P99' ? '#f43f5e' : item.label === 'P95' ? '#fbbf24' : '#36d399', borderRadius: 3 }} />
                  </div>
                </div>
              )
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span>Avg <strong style={{ color: 'var(--text-primary)' }}>{formatMs(ls.avgMs)}</strong></span>
              <span>Max <strong style={{ color: 'var(--text-primary)' }}>{formatMs(ls.maxMs)}</strong></span>
            </div>
          </div>
        )}
      </div>

      <div className="card-glass" style={{ padding: 'var(--space-5)', gridColumn: '1 / -1' }}>
        <div style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
          Failed predictions by model
        </div>
        {failures.length === 0 ? (
          <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            No recorded failures
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {failures.map(([model, count], i) => (
              <div key={model}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{model}</span>
                  <strong style={{ color: '#f43f5e' }}>{count}</strong>
                </div>
                <div style={{ height: 6, background: 'var(--glass-bg)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${maxFailure > 0 ? (count / maxFailure) * 100 : 0}%`, height: '100%', background: USAGE_COLORS[i % USAGE_COLORS.length], borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DriftSection({ drift, loading }: { drift: MlopsDrift | null; loading: boolean }) {
  if (loading && !drift) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-loader" style={{ height: 100, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      </div>
    )
  }

  if (!drift) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
        Drift analysis not available
      </div>
    )
  }

  const driftMetrics = [
    { label: 'Latency Drift', detail: drift.latencyDrift, isLatency: true },
    { label: 'Success Rate Drift', detail: drift.successRateDrift, isLatency: false },
    { label: 'Prediction Drift', detail: drift.predictionDrift, isLatency: false },
    { label: 'Confidence Drift', detail: drift.confidenceDrift, isLatency: false },
  ]

  if (!drift.sufficientData) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Insufficient data for drift analysis ({drift.totalEntries} entries, need more in sliding window)
          </span>
        </div>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
          Baseline: {drift.windowSizes.baseline} entries · Sliding: {drift.windowSizes.sliding} entries · Current: {drift.windowSizes.current} entries
        </div>
      </div>
    )
  }

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      {drift.driftDetected ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(244,63,94,0.1)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '14px' }}>⚠</span>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: '#f43f5e' }}>
            Drift detected in {drift.alertCount} metric{drift.alertCount === 1 ? '' : 's'}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(54,211,153,0.1)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '14px' }}>✓</span>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: '#36d399' }}>
            No drift detected — all metrics stable
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        {driftMetrics.map(m => (
          <DriftCard key={m.label} label={m.label} detail={m.detail} isLatency={m.isLatency} />
        ))}
      </div>
    </div>
  )
}

function DriftCard({ label, detail, isLatency }: {
  label: string
  detail: { driftDetected: boolean; severity: string; baselineAvgMs?: number; currentAvgMs?: number; pctChange?: number; baselineValue?: number; currentValue?: number }
  isLatency: boolean
}) {
  const severityColor = detail.severity === 'critical' ? '#f43f5e' : detail.severity === 'high' || detail.severity === 'warning' ? '#fbbf24' : '#36d399'
  const baselineVal = isLatency ? detail.baselineAvgMs : detail.baselineValue
  const currentVal = isLatency ? detail.currentAvgMs : detail.currentValue
  const baselineStr = baselineVal != null ? (isLatency ? formatMs(baselineVal) : baselineVal.toFixed(2)) : 'N/A'
  const currentStr = currentVal != null ? (isLatency ? formatMs(currentVal) : currentVal.toFixed(2)) : 'N/A'

  return (
    <div style={{ padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${severityColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{label}</span>
        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', background: `${severityColor}20`, color: severityColor }}>
          {detail.severity}
        </span>
      </div>

      {detail.driftDetected && detail.pctChange != null && (
        <div style={{ fontSize: '11px', color: severityColor, fontWeight: 600, marginBottom: 'var(--space-2)' }}>
          {detail.pctChange > 0 ? '+' : ''}{detail.pctChange.toFixed(1)}% change
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', fontSize: '11px' }}>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Baseline: </span>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{baselineStr}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Current: </span>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{currentStr}</span>
        </div>
      </div>
    </div>
  )
}

function EventsTable({ events, loading }: { events: MlopsEvent[]; loading: boolean }) {
  const sorted = useMemo(() => {
    return [...events].sort((a, b) => {
      const ta = new Date(a.timestamp).getTime()
      const tb = new Date(b.timestamp).getTime()
      if (isNaN(ta) && isNaN(tb)) return 0
      if (isNaN(ta)) return 1
      if (isNaN(tb)) return -1
      return tb - ta
    })
  }, [events])

  const shown = sorted.slice(0, 100)

  return (
    <div className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }} role="grid" aria-label="Inference logs">
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)', position: 'sticky', top: 0, zIndex: 1 }}>
              {['Timestamp', 'Event', 'Model', 'Version', 'Deployment', 'Detail'].map(col => (
                <th key={col} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '11px' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && events.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 'var(--space-4)' }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-loader" style={{ height: 36, marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-md)' }} />)}
              </td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No deployment events recorded.
              </td></tr>
            ) : (
              shown.map((e, i) => (
                <tr key={`${e.eventType}-${e.timestamp}-${e.deploymentId || ''}-${i}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {shortTimestamp(e.timestamp)}
                  </td>
                  <td style={{ padding: '8px 12px' }}><EventBadge eventType={e.eventType} /></td>
                  <td style={{ padding: '8px 12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{e.modelName || '—'}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontSize: '11px', color: 'var(--text-secondary)' }}>{e.version || '—'}</span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontSize: '11px', color: 'var(--text-muted)' }}>{e.deploymentId || '—'}</span>
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: '11px', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.error || e.stage ? `${e.stage || ''}${e.error ? ` — ${e.error}` : ''}` : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {sorted.length > 100 && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
          Showing 100 of {sorted.length} events
        </div>
      )}
    </div>
  )
}

function ExportBar({ registryRows, events }: { registryRows: MlopsRegistryRow[]; events: MlopsEvent[] }) {
  const exportCSV = (rows: Record<string, unknown>[], columns: { key: string; label: string }[], filename: string) => {
    if (rows.length === 0) return
    const header = columns.map(c => `"${c.label}"`).join(',')
    const body = rows.map(row => columns.map(c => {
      const val = row[c.key]
      const str = val == null ? '' : String(val)
      return `"${str.replace(/"/g, '""')}"`
    }).join(',')).join('\n')
    const csv = `${header}\n${body}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportRegistry = () => {
    exportCSV(registryRows.map(m => ({
      name: m.name, version: m.version, algorithm: m.algorithm, task: m.task, state: m.lifecycleState, features: (m.features || []).join('; '),
    })), [
      { key: 'name', label: 'Model Name' },
      { key: 'version', label: 'Version' },
      { key: 'algorithm', label: 'Algorithm' },
      { key: 'task', label: 'Task' },
      { key: 'state', label: 'Lifecycle State' },
      { key: 'features', label: 'Features' },
    ], 'mlops-model-registry.csv')
  }

  const handleExportEvents = () => {
    exportCSV(events.slice(0, 1000).map(e => ({
      timestamp: e.timestamp, event: e.eventType, model: e.modelName || '', version: e.version || '', deployment: e.deploymentId || '', error: e.error || '',
    })), [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'event', label: 'Event' },
      { key: 'model', label: 'Model' },
      { key: 'version', label: 'Version' },
      { key: 'deployment', label: 'Deployment' },
      { key: 'error', label: 'Error' },
    ], 'mlops-inference-logs.csv')
  }

  return (
    <div className="card-glass" style={{ padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Export</span>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={handleExportRegistry}
            style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            Export Registry (CSV)
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleExportEvents}
            style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            Export Logs (CSV)
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => window.print()}
            style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            Print
          </button>
        </div>
      </div>
    </div>
  )
}
