import { useState, useEffect, useCallback } from 'react'
import { adminService } from '../../services/admin.service'
import { mlopsService } from '../../services/mlops.service'
import { PerformanceMetricCard } from '../../performance/components/PerformanceMetricCard'
import type { MLStatus, MLMetrics } from '../audit/audit.types'
import type {
  MlopsModel, MlopsHealth, MlopsMetrics, MlopsDrift, MlopsEvent,
  MlModelInfo, AICapability,
} from './mlops.types'

const HOUR = new Date().getHours()
const GREETING = HOUR < 12 ? 'Morning' : HOUR < 18 ? 'Afternoon' : 'Evening'
const TODAY = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

const STATUS_COLORS: Record<string, string> = { green: '#22c55e', amber: '#eab308', red: '#ef4444' }
const LIFECYCLE_COLORS: Record<string, string> = {
  active: '#22c55e',
  deployed: '#22c55e',
  validated: '#17a8e5',
  registered: '#7c5dfa',
  archived: '#94a3b8',
  failed: '#ef4444',
}

type SectionId = 'overview' | 'registry' | 'active' | 'health' | 'inference' | 'latency' | 'drift' | 'events' | 'config' | 'capabilities'

const SECTION_NAV: { id: SectionId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'registry', label: 'Model Registry' },
  { id: 'active', label: 'Active Models' },
  { id: 'health', label: 'Model Health' },
  { id: 'inference', label: 'Inference' },
  { id: 'latency', label: 'Latency' },
  { id: 'drift', label: 'Drift' },
  { id: 'events', label: 'Events' },
  { id: 'config', label: 'Configuration' },
  { id: 'capabilities', label: 'AI Capabilities' },
]

const AI_CAPABILITIES: AICapability[] = [
  { name: 'Bill Prediction', endpoint: '/api/ml/predict/bill', method: 'POST', description: 'Predict monthly electricity bill from consumption data', available: true },
  { name: 'Savings Prediction', endpoint: '/api/ml/predict/savings', method: 'POST', description: 'Predict monthly solar savings estimate', available: true },
  { name: 'Batch Prediction', endpoint: '/api/ml/batch-predict', method: 'POST', description: 'Process multiple predictions in a single request', available: true },
  { name: 'Full AI Analysis', endpoint: '/api/ai/analyze', method: 'POST', description: 'Complete analysis pipeline: predictions + recommendations + scoring', available: true },
  { name: 'AI Recommendations', endpoint: '/api/ai/recommend', method: 'POST', description: 'Business recommendations based on customer data', available: true },
  { name: 'Prediction Explainability', endpoint: '/api/ai/explain', method: 'POST', description: 'Human-readable explanation with contributing factors', available: true },
  { name: 'Customer Scoring', endpoint: '/api/ai/customer-score', method: 'POST', description: 'Enterprise customer scoring with purchase intent and risk', available: true },
  { name: 'Solar Readiness', endpoint: '/api/ai/solar-readiness', method: 'POST', description: 'Solar feasibility assessment with ROI and environmental impact', available: true },
  { name: 'AI Assistant Chat', endpoint: '/api/assistant/chat', method: 'POST', description: 'Conversational AI with 18 integrated tools', available: true },
  { name: 'Model Registry', endpoint: '/api/mlops/models', method: 'GET', description: 'Model lifecycle management with version history', available: true },
  { name: 'Model Deployment', endpoint: '/api/mlops/deploy', method: 'POST', description: 'Six-stage deployment pipeline with rollback support', available: true },
  { name: 'Drift Detection', endpoint: '/api/mlops/drift', method: 'GET', description: 'Sliding-window drift analysis for latency, success rate, predictions', available: true },
  { name: 'Health Monitoring', endpoint: '/api/mlops/health', method: 'GET', description: 'Real-time CPU, memory, latency, and model availability monitoring', available: true },
  { name: 'Prediction Metrics', endpoint: '/api/ml/metrics', method: 'GET', description: 'Prediction volume, success rate, latency, and cache performance', available: true },
]

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

function formatPct(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return `${(value * 100).toFixed(1)}%`
}

function EventBadge({ eventType }: { eventType: string }) {
  const isDeploy = eventType.includes('deploy') || eventType.includes('Deploy')
  const isRollback = eventType.includes('rollback') || eventType.includes('Rollback')
  const isError = eventType.includes('error') || eventType.includes('fail') || eventType.includes('Error') || eventType.includes('Fail')
  const isTransition = eventType.includes('lifecycle') || eventType.includes('Lifecycle') || eventType.includes('transition') || eventType.includes('Transition')
  const color = isError ? '#ef4444' : isRollback ? '#fbbf24' : isDeploy ? '#36d399' : isTransition ? '#17a8e5' : '#7c5dfa'
  const bg = isError ? 'rgba(239,68,68,0.15)' : isRollback ? 'rgba(251,191,36,0.15)' : isDeploy ? 'rgba(54,211,153,0.15)' : isTransition ? 'rgba(23,168,229,0.15)' : 'rgba(124,93,250,0.15)'
  return (
    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: bg, color, whiteSpace: 'nowrap' }}>
      {eventType.replace(/_/g, ' ')}
    </span>
  )
}

export default function MlOpsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [mlStatus, setMlStatus] = useState<MLStatus | null>(null)
  const [mlMetrics, setMlMetrics] = useState<MLMetrics | null>(null)
  const [platformStatus, setPlatformStatus] = useState<{ status: string; totalModels: number; activeModels: number; registryLoaded: boolean; operational: boolean } | null>(null)
  const [models, setModels] = useState<MlopsModel[]>([])
  const [mlModels, setMlModels] = useState<MlModelInfo[]>([])
  const [health, setHealth] = useState<MlopsHealth | null>(null)
  const [metrics, setMetrics] = useState<MlopsMetrics | null>(null)
  const [drift, setDrift] = useState<MlopsDrift | null>(null)
  const [events, setEvents] = useState<MlopsEvent[]>([])
  const [activeSection, setActiveSection] = useState<SectionId>('overview')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [mlStat, mlMet, pStatus, mdlList, mlMdlList, hData, mData, dData, evData] = await Promise.all([
        adminService.getMlStatus().catch(() => null),
        adminService.getMlMetrics().catch(() => null),
        mlopsService.getStatus().catch(() => null),
        mlopsService.getModels().catch(() => []),
        mlopsService.getMlModels().catch(() => []),
        mlopsService.getHealth().catch(() => null),
        mlopsService.getMetrics().catch(() => null),
        mlopsService.getDrift().catch(() => null),
        mlopsService.getEvents().catch(() => []),
      ])
      setMlStatus(mlStat)
      setMlMetrics(mlMet)
      setPlatformStatus(pStatus)
      setModels(mdlList)
      setMlModels(mlMdlList)
      setHealth(hData)
      setMetrics(mData)
      setDrift(dData)
      setEvents(evData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load MLOps data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const scrollToSection = (id: SectionId) => {
    setActiveSection(id)
    const el = document.getElementById(`mlops-section-${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const overallStatus = platformStatus?.status || mlStatus?.status || 'unknown'
  const totalModels = platformStatus?.totalModels ?? mlStatus?.totalModels ?? 0
  const activeModels = platformStatus?.activeModels ?? mlStatus?.totalModels ?? 0
  const successRate = mlMetrics?.successRate ?? metrics?.successRate ?? 0
  const avgLatency = mlMetrics?.averageLatencyMs ?? metrics?.averageLatencyMs ?? 0
  const p95Latency = mlMetrics?.p95LatencyMs ?? metrics?.p95LatencyMs ?? 0
  const totalPredictions = mlMetrics?.totalPredictions ?? metrics?.totalPredictions ?? 0
  const cacheHitRate = mlMetrics?.cacheHitRate ?? 0

  if (loading && !platformStatus && !mlStatus) {
    return (
      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div className="skeleton-loader" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton-loader" style={{ height: 60, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton-loader" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton-loader" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
      </div>
    )
  }

  if (error && !platformStatus && !mlStatus) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <HeroSection
        overallStatus={overallStatus}
        totalModels={totalModels}
        activeModels={activeModels}
        loading={loading}
        onRefresh={load}
      />

      <SectionNav activeSection={activeSection} onNavigate={scrollToSection} />

      <ExportBar
        models={models}
        events={events}
        health={health}
        drift={drift}
      />

      <div id="mlops-section-overview">
        <SectionHeader title="AI Platform Overview" subtitle="Key metrics at a glance" />
        <OverviewSection
          overallStatus={overallStatus}
          totalModels={totalModels}
          activeModels={activeModels}
          successRate={successRate}
          avgLatency={avgLatency}
          p95Latency={p95Latency}
          totalPredictions={totalPredictions}
          cacheHitRate={cacheHitRate}
          uptimeSeconds={health?.uptimeSeconds ?? mlMetrics?.uptimeSeconds ?? 0}
          modelCount={models.length}
          healthyModels={models.filter(m => m.lifecycleState === 'active' || m.lifecycleState === 'deployed').length}
          loading={loading}
        />
      </div>

      <div id="mlops-section-registry">
        <SectionHeader title="Model Registry" subtitle="Lifecycle management and version history" />
        <ModelRegistrySection models={models} loading={loading} />
      </div>

      <div id="mlops-section-active">
        <SectionHeader title="Active Models" subtitle="Currently loaded and serving" />
        <ActiveModelsSection mlModels={mlModels} loading={loading} />
      </div>

      <div id="mlops-section-health">
        <SectionHeader title="Model Health" subtitle="Service status and availability" />
        <ModelHealthSection health={health} loading={loading} />
      </div>

      <div id="mlops-section-inference">
        <SectionHeader title="Inference Analytics" subtitle="Prediction volume and success metrics" />
        <InferenceSection metrics={metrics} mlMetrics={mlMetrics} loading={loading} />
      </div>

      <div id="mlops-section-latency">
        <SectionHeader title="Latency Analytics" subtitle="Response time distribution" />
        <LatencySection metrics={metrics} loading={loading} />
      </div>

      <div id="mlops-section-drift">
        <SectionHeader title="Drift Analysis" subtitle="Model performance drift detection" />
        <DriftSection drift={drift} loading={loading} />
      </div>

      <div id="mlops-section-events">
        <SectionHeader title="Deployment Events" subtitle="Model lifecycle and deployment timeline" />
        <EventsSection events={events} loading={loading} />
      </div>

      <div id="mlops-section-config">
        <SectionHeader title="Model Configuration" subtitle="Read-only model configuration" />
        <ConfigSection models={models} loading={loading} />
      </div>

      <div id="mlops-section-capabilities">
        <SectionHeader title="AI Capabilities" subtitle="Supported AI services and endpoints" />
        <CapabilitiesSection capabilities={AI_CAPABILITIES} loading={loading} />
      </div>
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
      <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{title}</h2>
      {subtitle && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{subtitle}</span>}
    </div>
  )
}

function SectionNav({ activeSection, onNavigate }: { activeSection: SectionId; onNavigate: (id: SectionId) => void }) {
  return (
    <div className="card-glass" style={{ padding: 'var(--space-2) var(--space-3)', overflowX: 'auto' }}>
      <nav style={{ display: 'flex', gap: 'var(--space-1)' }} aria-label="MLOps sections">
        {SECTION_NAV.map(s => (
          <button key={s.id} onClick={() => onNavigate(s.id)}
            aria-current={activeSection === s.id ? 'true' : undefined}
            style={{
              padding: '6px 12px', fontSize: '11px', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap',
              border: 'none',
              background: activeSection === s.id ? 'rgba(124,93,250,0.15)' : 'transparent',
              color: activeSection === s.id ? 'var(--color-purple)' : 'var(--text-secondary)',
              fontWeight: activeSection === s.id ? 600 : 400,
            }}>
            {s.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

function HeroSection({ overallStatus, totalModels, activeModels, loading, onRefresh }: {
  overallStatus: string; totalModels: number; activeModels: number; loading: boolean; onRefresh: () => void
}) {
  const statusColor = overallStatus === 'operational' ? STATUS_COLORS.green : STATUS_COLORS.amber
  return (
    <div className="hero-section" style={{
      padding: 'var(--space-6) var(--space-8)', borderRadius: 'var(--radius-lg)',
      background: 'linear-gradient(135deg, #0a1628 0%, #1a0a2e 50%, #0d1117 100%)',
      border: '1px solid var(--glass-border)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(124,93,250,0.10) 0%, rgba(168,85,247,0.08) 50%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Good {GREETING}
            </h1>
            <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Enterprise MLOps &middot; AI Platform Management &middot; {TODAY}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: '20px',
              background: `${statusColor}20`,
              border: `1px solid ${statusColor}40`,
              fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
              color: statusColor,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
              {overallStatus}
            </span>
            <button className="btn btn-outline btn-sm" onClick={onRefresh} disabled={loading}
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }} aria-label="Refresh">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)',
          paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)',
        }}>
          <StatBadge icon="icon-shield" value={overallStatus} label="Platform Status" color={statusColor} size="sm" />
          <StatBadge icon="icon-server" value={totalModels} label="Total Models" color="var(--color-purple)" size="sm" />
          <StatBadge icon="icon-activity" value={activeModels} label="Active Models" color="var(--color-cyan)" size="sm" />
          <StatBadge icon="icon-sparkles" value="MLOps" label="AI Platform" color="var(--color-orange)" size="sm" />
        </div>
      </div>
    </div>
  )
}

function StatBadge({ icon, value, label, color, size = 'md' }: { icon: string; value: string | number; label: string; color: string; size?: 'sm' | 'md' }) {
  const fontSize = size === 'sm' ? 'var(--font-size-md)' : 'var(--font-size-lg)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <use href={`#${icon}`} />
      </svg>
      <div>
        <span style={{ fontSize, fontWeight: 700, lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 'var(--font-size-xs)', marginLeft: 'var(--space-1)', opacity: 0.85 }}>{label}</span>
      </div>
    </div>
  )
}

function OverviewSection({ overallStatus, totalModels, activeModels, successRate, avgLatency, p95Latency, totalPredictions, cacheHitRate, uptimeSeconds, modelCount, healthyModels, loading }: {
  overallStatus: string; totalModels: number; activeModels: number
  successRate: number; avgLatency: number; p95Latency: number
  totalPredictions: number; cacheHitRate: number; uptimeSeconds: number
  modelCount: number; healthyModels: number; loading: boolean
}) {
  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
        <PerformanceMetricCard title="Platform Status" value={overallStatus === 'operational' ? 'Operational' : overallStatus} theme="#7c5dfa" loading={loading} badge={overallStatus === 'operational' ? { text: 'Online', className: 'badge-success' } : null} />
        <PerformanceMetricCard title="Total Models" value={totalModels} theme="#7c5dfa" loading={loading} />
        <PerformanceMetricCard title="Active Models" value={activeModels} theme="#17a8e5" loading={loading} />
        <PerformanceMetricCard title="Healthy Models" value={`${healthyModels}/${modelCount}`} theme="#22c55e" loading={loading} badge={healthyModels === modelCount && modelCount > 0 ? { text: 'All OK', className: 'badge-success' } : null} />
        <PerformanceMetricCard title="Prediction Success" value={successRate > 0 ? formatPct(successRate) : 'N/A'} theme="#22c55e" loading={loading} />
        <PerformanceMetricCard title="Average Latency" value={avgLatency > 0 ? formatMs(avgLatency) : 'N/A'} theme="#17a8e5" loading={loading} />
        <PerformanceMetricCard title="P95 Latency" value={p95Latency > 0 ? formatMs(p95Latency) : 'N/A'} theme="#fbbf24" loading={loading} />
        <PerformanceMetricCard title="Total Predictions" value={totalPredictions.toLocaleString('en-IN')} theme="#7c5dfa" loading={loading} />
        <PerformanceMetricCard title="Cache Hit Rate" value={cacheHitRate > 0 ? formatPct(cacheHitRate) : 'N/A'} theme="#36d399" loading={loading} />
        <PerformanceMetricCard title="Platform Uptime" value={uptimeSeconds > 0 ? formatUptime(uptimeSeconds) : 'N/A'} theme="#17a8e5" loading={loading} />
      </div>
    </div>
  )
}

function ModelRegistrySection({ models, loading }: { models: MlopsModel[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        {[1, 2, 3].map(i => <div key={i} className="skeleton-loader" style={{ height: 48, marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-md)' }} />)}
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
        No models registered in the registry.
      </div>
    )
  }

  return (
    <div className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }} role="grid" aria-label="Model registry">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
              {['Model', 'Version', 'Algorithm', 'Task', 'State', 'Features', 'Last Deployment', 'Training Date'].map(col => (
                <th key={col} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '11px' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map(m => (
              <tr key={m.name} style={{ borderBottom: '1px solid var(--border-subtle)' }} className="table-row-hover">
                <td style={{ padding: '8px 12px', fontWeight: 600 }}>{m.name}</td>
                <td style={{ padding: '8px 12px' }}><code style={{ fontSize: '11px', color: 'var(--color-purple)' }}>{m.version}</code></td>
                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: '11px' }}>{m.algorithm}</td>
                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{m.task}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, textTransform: 'capitalize',
                    background: `${LIFECYCLE_COLORS[m.lifecycleState] || '#94a3b8'}20`,
                    color: LIFECYCLE_COLORS[m.lifecycleState] || '#94a3b8',
                  }}>
                    {m.lifecycleState}
                  </span>
                </td>
                <td style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-muted)' }}>{(m.features || []).slice(0, 3).join(', ')}{(m.features || []).length > 3 ? '...' : ''}</td>
                <td style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-muted)' }}>{m.lastDeployment ? new Date(m.lastDeployment).toLocaleDateString() : '-'}</td>
                <td style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-muted)' }}>{m.trainingDate ? new Date(m.trainingDate).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ActiveModelsSection({ mlModels, loading }: { mlModels: MlModelInfo[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-loader" style={{ height: 100, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      </div>
    )
  }

  const knownModels = [
    { name: 'Gemini', display: 'Gemini AI', description: 'Large language model for enterprise AI assistant', status: 'active', color: '#7c5dfa' },
    { name: 'Recommendation Engine', display: 'Recommendation Engine', description: 'Business-rule recommendation engine', status: 'active', color: '#17a8e5' },
    { name: 'Forecasting', display: 'Forecasting', description: 'Solar savings and bill forecasting', status: 'active', color: '#22c55e' },
  ]

  const activeMlModels = (mlModels || []).filter(m => m.status === 'active')
  const displayModels = activeMlModels.length > 0 ? activeMlModels.map(m => ({
    name: m.name,
    display: m.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    description: `${m.algorithm} — ${m.task}`,
    status: m.status,
    color: '#7c5dfa',
  })).concat(knownModels.filter(k => !activeMlModels.some(m => m.name === k.name))) : knownModels

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
        {displayModels.map(m => (
          <div key={m.name} style={{
            padding: 'var(--space-4)', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-tertiary)', border: `1px solid ${m.color}30`,
            borderLeft: `3px solid ${m.color}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{m.display}</span>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: m.status === 'active' ? STATUS_COLORS.green : STATUS_COLORS.amber,
                display: 'inline-block',
              }} />
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{m.description}</div>
          </div>
        ))}
      </div>
      {displayModels.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
          No active models loaded
        </div>
      )}
    </div>
  )
}

function ModelHealthSection({ health, loading }: {
  health: MlopsHealth | null; loading: boolean
}) {
  if (loading) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton-loader" style={{ height: 70, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      </div>
    )
  }

  if (!health) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
        Health data not available
      </div>
    )
  }

  const avail = health.modelAvailabilityPct ?? 0
  const cpu = health.cpuPercent ?? 0
  const mem = health.memoryPercent ?? 0

  const healthMetrics = [
    { label: 'Success Rate', value: formatPct(health.successRate), color: health.successRate >= 0.95 ? '#22c55e' : health.successRate >= 0.85 ? '#fbbf24' : '#ef4444' },
    { label: 'Avg Latency', value: formatMs(health.averageLatencyMs), color: '#17a8e5' },
    { label: 'Model Availability', value: `${avail.toFixed(1)}%`, color: avail >= 99 ? '#22c55e' : '#fbbf24' },
    { label: 'Cache Hit Rate', value: formatPct(health.cacheHitRate), color: health.cacheHitRate >= 0.8 ? '#22c55e' : '#fbbf24' },
    { label: 'CPU Usage', value: `${cpu.toFixed(1)}%`, color: cpu < 70 ? '#22c55e' : cpu < 90 ? '#fbbf24' : '#ef4444' },
    { label: 'Memory Usage', value: `${mem.toFixed(1)}%`, color: mem < 70 ? '#22c55e' : mem < 90 ? '#fbbf24' : '#ef4444' },
    { label: 'Model Load Failures', value: health.modelLoadFailures ?? 0, color: (health.modelLoadFailures ?? 0) === 0 ? '#22c55e' : '#ef4444' },
    { label: 'Uptime', value: formatUptime(health.uptimeSeconds), color: '#17a8e5' },
  ]

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
        {healthMetrics.map(m => (
          <div key={m.label} style={{ padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${m.color}` }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function InferenceSection({ metrics, mlMetrics, loading }: { metrics: MlopsMetrics | null; mlMetrics: MLMetrics | null; loading: boolean }) {
  const totalPred = metrics?.totalPredictions ?? mlMetrics?.totalPredictions ?? 0
  const successPred = metrics?.successfulPredictions ?? mlMetrics?.successfulPredictions ?? 0
  const failedPred = metrics?.failedPredictions ?? mlMetrics?.failedPredictions ?? 0
  const sRate = metrics?.successRate ?? mlMetrics?.successRate ?? 0
  const avgLat = metrics?.averageLatencyMs ?? mlMetrics?.averageLatencyMs ?? 0
  const p95Lat = metrics?.p95LatencyMs ?? mlMetrics?.p95LatencyMs ?? 0

  if (loading) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton-loader" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
        <PerformanceMetricCard title="Total Requests" value={totalPred.toLocaleString('en-IN')} theme="#7c5dfa" loading={loading} />
        <PerformanceMetricCard title="Successful" value={successPred.toLocaleString('en-IN')} theme="#22c55e" loading={loading} />
        <PerformanceMetricCard title="Failed" value={failedPred.toLocaleString('en-IN')} theme="#ef4444" loading={loading} />
        <PerformanceMetricCard title="Success Rate" value={sRate > 0 ? formatPct(sRate) : 'N/A'} theme="#22c55e" loading={loading} />
        <PerformanceMetricCard title="Average Latency" value={avgLat > 0 ? formatMs(avgLat) : 'N/A'} theme="#17a8e5" loading={loading} />
        <PerformanceMetricCard title="P95 Latency" value={p95Lat > 0 ? formatMs(p95Lat) : 'N/A'} theme="#fbbf24" loading={loading} />
        {metrics?.failuresByModel && Object.keys(metrics.failuresByModel).length > 0 && (
          <PerformanceMetricCard title="Failed Predictions" value={Object.entries(metrics.failuresByModel).map(([k, v]) => `${k}: ${v}`).join(', ')} theme="#ef4444" loading={loading} />
        )}
      </div>

      {metrics?.modelUsage && Object.keys(metrics.modelUsage).length > 0 && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Model Usage Distribution</h4>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {Object.entries(metrics.modelUsage).map(([model, count]) => {
              const maxUsage = Math.max(...Object.values(metrics.modelUsage))
              const pct = maxUsage > 0 ? (count / maxUsage) * 100 : 0
              return (
                <div key={model} style={{ flex: 1, minWidth: 140, padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 4 }}>{model}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--glass-bg)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#7c5dfa', borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{count}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function LatencySection({ metrics, loading }: { metrics: MlopsMetrics | null; loading: boolean }) {
  const ls = metrics?.latencyStats

  if (loading) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton-loader" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      </div>
    )
  }

  if (!ls) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
        Latency data not available
      </div>
    )
  }

  const latencyItems = [
    { label: 'Minimum', value: formatMs(ls.minMs), color: '#22c55e' },
    { label: 'Average', value: formatMs(ls.avgMs), color: '#17a8e5' },
    { label: 'Maximum', value: formatMs(ls.maxMs), color: '#ef4444' },
    { label: 'P50', value: formatMs(ls.p50Ms), color: '#7c5dfa' },
    { label: 'P95', value: formatMs(ls.p95Ms), color: '#fbbf24' },
    { label: 'P99', value: formatMs(ls.p99Ms), color: '#fb923c' },
  ]

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
        {latencyItems.map(item => (
          <div key={item.label} style={{ padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>{item.label}</div>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DriftSection({ drift, loading }: { drift: MlopsDrift | null; loading: boolean }) {
  if (loading) {
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
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: STATUS_COLORS.amber, display: 'inline-block',
          }} />
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Insufficient data for drift analysis ({drift.totalEntries} entries, need more in sliding window)
          </span>
        </div>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
          Baseline: {drift.windowSizes.baseline} entries &middot; Sliding: {drift.windowSizes.sliding} entries &middot; Current: {drift.windowSizes.current} entries
        </div>
      </div>
    )
  }

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      {drift.driftDetected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '14px' }}>⚠</span>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: '#ef4444' }}>
            Drift detected in {drift.alertCount} metrics
          </span>
        </div>
      )}

      {!drift.driftDetected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(54,211,153,0.1)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '14px' }}>✓</span>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: '#22c55e' }}>
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

function DriftCard({ label, detail, isLatency }: { label: string; detail: { driftDetected: boolean; severity: string; baselineAvgMs?: number; currentAvgMs?: number; pctChange?: number; baselineValue?: number; currentValue?: number }; isLatency: boolean }) {
  const severityColor = detail.severity === 'critical' ? '#ef4444' : detail.severity === 'warning' ? '#fbbf24' : '#22c55e'
  const baselineVal = isLatency ? detail.baselineAvgMs : detail.baselineValue
  const currentVal = isLatency ? detail.currentAvgMs : detail.currentValue
  const baselineStr = baselineVal != null ? (isLatency ? formatMs(baselineVal) : baselineVal.toFixed(2)) : 'N/A'
  const currentStr = currentVal != null ? (isLatency ? formatMs(currentVal) : currentVal.toFixed(2)) : 'N/A'

  return (
    <div style={{ padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${severityColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{label}</span>
        <span style={{
          padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase',
          background: `${severityColor}20`, color: severityColor,
        }}>
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

function EventsSection({ events, loading }: { events: MlopsEvent[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton-loader" style={{ height: 48, marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-md)' }} />)}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
        No deployment events recorded
      </div>
    )
  }

  const sorted = [...events].sort((a, b) => {
    const ta = new Date(a.timestamp).getTime()
    const tb = new Date(b.timestamp).getTime()
    if (isNaN(ta) && isNaN(tb)) return 0
    if (isNaN(ta)) return 1
    if (isNaN(tb)) return -1
    return tb - ta
  })

  return (
    <div className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {sorted.slice(0, 50).map((e, i) => (
          <div key={`${e.eventType}-${e.timestamp}-${i}`} style={{
            display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--border-subtle)',
            background: i % 2 === 0 ? 'transparent' : 'var(--bg-tertiary)',
            alignItems: 'center',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: e.eventType.includes('error') || e.eventType.includes('fail') ? 'rgba(239,68,68,0.15)' :
                e.eventType.includes('rollback') ? 'rgba(251,191,36,0.15)' : 'rgba(54,211,153,0.15)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={
                e.eventType.includes('error') || e.eventType.includes('fail') ? '#ef4444' :
                  e.eventType.includes('rollback') ? '#fbbf24' : '#36d399'
              } strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {e.eventType.includes('error') || e.eventType.includes('fail') ? (
                  <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>
                ) : (
                  <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>
                )}
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <EventBadge eventType={e.eventType} />
                {e.modelName && <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{e.modelName}</span>}
                {e.version && <code style={{ fontSize: '10px', color: 'var(--color-purple)' }}>{e.version}</code>}
              </div>
              {e.error && <div style={{ fontSize: '10px', color: '#ef4444', marginTop: 2 }}>{e.error}</div>}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {e.timestamp ? new Date(e.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
            </span>
          </div>
        ))}
      </div>
      {sorted.length > 50 && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
          Showing 50 of {sorted.length} events
        </div>
      )}
    </div>
  )
}

function ConfigSection({ models, loading }: { models: MlopsModel[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        {[1, 2].map(i => <div key={i} className="skeleton-loader" style={{ height: 120, marginBottom: 'var(--space-3)', borderRadius: 'var(--radius-md)' }} />)}
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
        Configuration not available
      </div>
    )
  }

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        {models.map(m => (
          <div key={m.name} style={{ padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-purple)' }}>
              {m.name}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', fontSize: '11px' }}>
              <ConfigRow label="Version" value={m.version} />
              <ConfigRow label="Algorithm" value={m.algorithm} />
              <ConfigRow label="Framework" value={m.framework} />
              <ConfigRow label="Task" value={m.task} />
              <ConfigRow label="State" value={m.lifecycleState} />
              <ConfigRow label="File Size" value={m.fileSize > 0 ? `${(m.fileSize / 1024).toFixed(1)} KB` : 'N/A'} />
              <ConfigRow label="Checksum" value={m.checksum ? m.checksum.substring(0, 16) + '...' : 'N/A'} />
            </div>
            {(m.features || []).length > 0 && (
              <div style={{ marginTop: 'var(--space-2)', fontSize: '10px', color: 'var(--text-muted)' }}>
                Features: {m.features.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ color: 'var(--text-muted)' }}>{label}: </span>
      <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{value}</span>
    </div>
  )
}

function CapabilitiesSection({ capabilities, loading }: { capabilities: AICapability[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton-loader" style={{ height: 90, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-3)' }}>
        {capabilities.map(c => (
          <div key={c.name} style={{
            padding: 'var(--space-4)', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-tertiary)',
            border: `1px solid ${c.available ? 'rgba(54,211,153,0.2)' : 'var(--border-subtle)'}`,
            opacity: c.available ? 1 : 0.6,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{c.name}</span>
              {c.method === 'POST' ? (
                <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(124,93,250,0.15)', color: '#7c5dfa', fontWeight: 700 }}>POST</span>
              ) : (
                <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(54,211,153,0.15)', color: '#22c55e', fontWeight: 700 }}>GET</span>
              )}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
              <code style={{ fontSize: '9px' }}>{c.endpoint}</code>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{c.description}</div>
            <div style={{ marginTop: 'var(--space-1)' }}>
              {c.method === 'POST' ? (
                <span style={{ fontSize: '9px', color: '#fbbf24', fontWeight: 500, fontStyle: 'italic' }}>Available on-demand</span>
              ) : (
                <span style={{ fontSize: '9px', color: '#22c55e', fontWeight: 500 }}>Real-time data</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(124,93,250,0.08)', borderRadius: 'var(--radius-md)', fontSize: '11px', color: 'var(--text-secondary)' }}>
        <strong>AI Platform Total:</strong> {capabilities.filter(c => c.available).length} available capabilities &middot;{' '}
        {capabilities.filter(c => c.method === 'GET').length} real-time endpoints &middot;{' '}
        {capabilities.filter(c => c.method === 'POST').length} on-demand services &middot;{' '}
        Powered by Gemini 2.5 Flash Lite
      </div>
    </div>
  )
}

function ExportBar({ models, events, health, drift }: {
  models: MlopsModel[]; events: MlopsEvent[]; health: MlopsHealth | null; drift: MlopsDrift | null
}) {
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

  const exportJSON = (data: unknown, filename: string) => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename.endsWith('.json') ? filename : `${filename}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportRegistry = () => {
    exportCSV(models.map(m => ({
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
      timestamp: e.timestamp, event: e.eventType, model: e.modelName || '', version: e.version || '', error: e.error || '',
    })), [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'event', label: 'Event' },
      { key: 'model', label: 'Model' },
      { key: 'version', label: 'Version' },
      { key: 'error', label: 'Error' },
    ], 'mlops-deployment-events.csv')
  }

  const handleExportSnapshot = () => {
    exportJSON({
      health,
      drift,
      modelCount: models.length,
      exportedAt: new Date().toISOString(),
    }, 'mlops-snapshot.json')
  }

  return (
    <div className="card-glass" style={{ padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Export Center</span>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={handleExportRegistry}
            style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            Export Registry (CSV)
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleExportEvents}
            style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            Export Events (CSV)
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleExportSnapshot}
            style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            Export Snapshot (JSON)
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
