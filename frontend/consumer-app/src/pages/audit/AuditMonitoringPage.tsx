import { useState, useEffect, useCallback, useMemo } from 'react'
import { adminService } from '../../services/admin.service'
import type { AdminHealth, AdminActivity, AdminDashboardData } from '../admin/admin.types'
import type { AuditLogEntry, AuditFilterState, MLStatus, MLMetrics } from './audit.types'
import AuditFilters from './AuditFilters'
import AuditTrailTable from './AuditTrailTable'

const HOUR = new Date().getHours()
const GREETING = HOUR < 12 ? 'Morning' : HOUR < 18 ? 'Afternoon' : 'Evening'
const TODAY = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

const INITIAL_FILTERS: AuditFilterState = {
  datePreset: '7d',
  dateRange: null,
  severity: '',
  module: '',
  user: '',
  search: '',
  sortKey: 'createdAt',
  sortDir: 'desc',
}

const SECTION_IDS = ['overview', 'health', 'alerts', 'ml', 'audit', 'activity'] as const
type SectionId = typeof SECTION_IDS[number]

const SECTION_NAV: { id: SectionId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'health', label: 'Health' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'ml', label: 'ML' },
  { id: 'audit', label: 'Audit Trail' },
  { id: 'activity', label: 'Activity' },
]

const STATUS_COLORS: Record<string, string> = { green: '#22c55e', amber: '#eab308', red: '#ef4444' }

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${Math.floor((seconds % 3600) / 60)}m`
  return `${Math.floor(seconds / 60)}m`
}

export default function AuditMonitoringPage() {
  const [filters, setFilters] = useState<AuditFilterState>(INITIAL_FILTERS)
  const [health, setHealth] = useState<AdminHealth | null>(null)
  const [activity, setActivity] = useState<AdminActivity[]>([])
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null)
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [mlStatus, setMlStatus] = useState<MLStatus | null>(null)
  const [mlMetrics, setMlMetrics] = useState<MLMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [auditPage, setAuditPage] = useState(0)
  const [activeSection, setActiveSection] = useState<SectionId>('overview')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [healthData, activityData, dashboardData, auditData, mlStat, mlMet] = await Promise.all([
        adminService.getHealth(),
        adminService.getActivity(100),
        adminService.getDashboard(),
        adminService.getAuditLog(500),
        adminService.getMlStatus().catch(() => null),
        adminService.getMlMetrics().catch(() => null),
      ])
      setHealth(healthData)
      setActivity(activityData)
      setDashboard(dashboardData)
      setAuditLog(auditData)
      setMlStatus(mlStat)
      setMlMetrics(mlMet)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monitoring data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const alerts = dashboard?.alerts ?? []

  const criticalAlerts = useMemo(() => alerts.filter(a => a.type === 'critical'), [alerts])
  const warningAlerts = useMemo(() => alerts.filter(a => a.type === 'warning'), [alerts])

  const scrollToSection = (id: SectionId) => {
    setActiveSection(id)
    const el = document.getElementById(`audit-section-${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading && !health) {
    return (
      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div className="skeleton-loader" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton-loader" style={{ height: 60, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton-loader" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton-loader" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
      </div>
    )
  }

  if (error && !health) {
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

  const healthServices = health?.services ?? []
  const overallHealth = health?.overall ?? 'amber'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <HeroSection overallHealth={overallHealth} loading={loading} onRefresh={load} healthServices={healthServices} />

      <SectionNav activeSection={activeSection} onNavigate={scrollToSection} />

      <AuditFilters filters={filters} onChange={f => { setFilters(f); setAuditPage(0) }} />

      <ExportBar auditLog={auditLog} activity={activity} />

      <div id="audit-section-overview">
        <SectionHeader title="Platform Overview" subtitle="System health at a glance" />
        <OverviewSection
          overallHealth={overallHealth}
          healthServices={healthServices}
          criticalCount={criticalAlerts.length}
          warningCount={warningAlerts.length}
          activityCount={activity.length}
          auditCount={auditLog.length}
          mlStatus={mlStatus}
          loading={loading}
        />
      </div>

      <div id="audit-section-health">
        <SectionHeader title="Live Platform Health" subtitle="Service status" />
        <HealthSection services={healthServices} loading={loading} onRefresh={load} />
      </div>

      <div id="audit-section-alerts">
        <SectionHeader title="Alerts" subtitle="Operational warnings and critical issues" />
        <AlertsSection critical={criticalAlerts} warnings={warningAlerts} loading={loading} />
      </div>

      <div id="audit-section-ml">
        <SectionHeader title="AI & ML Monitoring" subtitle="Model serving status and performance" />
        <MLSection mlStatus={mlStatus} mlMetrics={mlMetrics} loading={loading} />
      </div>

      <div id="audit-section-audit">
        <SectionHeader title="Audit Trail" subtitle="Immutable record of all business operations" />
        <AuditTrailTable
          entries={auditLog}
          filters={filters}
          onSort={(key) => setFilters(f => ({ ...f, sortKey: key, sortDir: f.sortKey === key && f.sortDir === 'asc' ? 'desc' : 'asc' }))}
          page={auditPage}
          totalPages={1}
          onPageChange={setAuditPage}
          loading={loading}
        />
      </div>

      <div id="audit-section-activity">
        <SectionHeader title="Platform Activity" subtitle="Recent events across all modules" />
        <ActivitySection activities={activity} loading={loading} />
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
      <nav style={{ display: 'flex', gap: 'var(--space-1)' }} aria-label="Audit & Monitoring sections">
        {SECTION_NAV.map(s => (
          <button key={s.id} onClick={() => onNavigate(s.id)}
            aria-current={activeSection === s.id ? 'true' : undefined}
            style={{
              padding: '6px 12px', fontSize: '11px', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap',
              border: 'none',
              background: activeSection === s.id ? 'rgba(255,138,29,0.15)' : 'transparent',
              color: activeSection === s.id ? 'var(--color-orange)' : 'var(--text-secondary)',
              fontWeight: activeSection === s.id ? 600 : 400,
            }}>
            {s.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

function HeroSection({ overallHealth, loading, onRefresh, healthServices }: {
  overallHealth: string; loading: boolean; onRefresh: () => void; healthServices: { status: string; label: string; detail: string }[]
}) {
  const onlineCount = healthServices.filter(s => s.status === 'green').length
  const totalCount = healthServices.length
  return (
    <div className="hero-section" style={{
      padding: 'var(--space-6) var(--space-8)', borderRadius: 'var(--radius-lg)',
      background: 'linear-gradient(135deg, #0a1628 0%, #0D2136 50%, #06111f 100%)',
      border: '1px solid var(--glass-border)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(255,138,29,0.10) 0%, rgba(0,174,239,0.08) 50%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Good {GREETING}
            </h1>
            <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Audit & Monitoring &middot; Platform Observability &middot; {TODAY}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: '20px',
              background: `${STATUS_COLORS[overallHealth] || '#eab308'}20`,
              border: `1px solid ${STATUS_COLORS[overallHealth] || '#eab308'}40`,
              fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
              color: STATUS_COLORS[overallHealth] || '#eab308',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[overallHealth] || '#eab308', display: 'inline-block' }} />
              {overallHealth}
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
          <StatBadge icon="icon-shield" value={`${onlineCount}/${totalCount}`} label="Services Online" color="var(--color-green)" />
          <StatBadge icon="icon-activity" value={healthServices.length} label="Services Monitored" color="var(--color-blue)" />
          <StatBadge icon="icon-server" value={totalCount - onlineCount} label="Services Down" color={totalCount - onlineCount > 0 ? 'var(--color-red)' : 'var(--color-green)'} />
          <StatBadge icon="icon-clock" value={loading ? '...' : 'Live'} label="Monitoring Status" color="var(--color-orange)" />
        </div>
      </div>
    </div>
  )
}

function StatBadge({ icon, value, label, color }: { icon: string; value: string | number; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <use href={`#${icon}`} />
      </svg>
      <div>
        <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 'var(--font-size-xs)', marginLeft: 'var(--space-1)', opacity: 0.85 }}>{label}</span>
      </div>
    </div>
  )
}

function OverviewSection({ overallHealth, healthServices, criticalCount, warningCount, activityCount, auditCount, mlStatus, loading }: {
  overallHealth: string; healthServices: { status: string; label: string; detail: string }[]
  criticalCount: number; warningCount: number; activityCount: number; auditCount: number
  mlStatus: MLStatus | null; loading: boolean
}) {
  const items = [
    { label: 'System Health', value: overallHealth.toUpperCase(), color: STATUS_COLORS[overallHealth] || '#eab308' },
    { label: 'API Availability', value: healthServices.find(s => s.label === 'Backend API')?.status === 'green' ? 'Online' : 'Issue', color: healthServices.find(s => s.label === 'Backend API')?.status === 'green' ? '#36d399' : '#ef4444' },
    { label: 'Database', value: healthServices.find(s => s.label === 'Database')?.status === 'green' ? 'Connected' : 'Issue', color: healthServices.find(s => s.label === 'Database')?.status === 'green' ? '#36d399' : '#ef4444' },
    { label: 'Critical Alerts', value: criticalCount, color: criticalCount > 0 ? '#ef4444' : '#36d399' },
    { label: 'Warnings', value: warningCount, color: warningCount > 0 ? '#fbbf24' : '#36d399' },
    { label: 'Recent Events', value: activityCount, color: '#17a8e5' },
    { label: 'Audit Records', value: auditCount, color: '#7c5dfa' },
    { label: 'ML Status', value: mlStatus?.status === 'operational' ? 'Operational' : 'N/A', color: mlStatus?.status === 'operational' ? '#36d399' : '#94a3b8' },
  ]
  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="skeleton-loader" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
          {items.map(item => (
            <div key={item.label} style={{ padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: item.color }}>
                {typeof item.value === 'number' ? item.value.toLocaleString('en-IN') : item.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function HealthSection({ services, loading, onRefresh }: {
  services: { status: string; label: string; detail: string }[]; loading: boolean; onRefresh: () => void
}) {
  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
        {loading ? (
          [1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className="skeleton-loader" style={{ height: 70, borderRadius: 'var(--radius-md)' }} />)
        ) : services.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Health data not available
          </div>
        ) : (
          services.map((s, i) => (
            <div key={i} style={{
              padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              borderLeft: `3px solid ${STATUS_COLORS[s.status] || 'var(--border-subtle)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{s.label}</span>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: STATUS_COLORS[s.status] || 'var(--text-muted)',
                  display: 'inline-block',
                }} />
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{s.detail}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function AlertsSection({ critical, warnings, loading }: {
  critical: { title: string; description: string }[]
  warnings: { title: string; description: string }[]
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div><div className="skeleton-loader" style={{ height: 24, width: 120, marginBottom: 12, borderRadius: 'var(--radius-md)' }} />{[1, 2, 3].map(i => <div key={i} className="skeleton-loader" style={{ height: 60, marginBottom: 8, borderRadius: 'var(--radius-md)' }} />)}</div>
          <div><div className="skeleton-loader" style={{ height: 24, width: 120, marginBottom: 12, borderRadius: 'var(--radius-md)' }} />{[1, 2, 3].map(i => <div key={i} className="skeleton-loader" style={{ height: 60, marginBottom: 8, borderRadius: 'var(--radius-md)' }} />)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
        <div>
          <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-red)' }}>
            Critical ({critical.length})
          </h4>
          {critical.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>No critical alerts</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {critical.slice(0, 10).map((a, i) => (
                <div key={i} style={{ padding: 'var(--space-3)', borderLeft: '3px solid var(--color-red)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{a.title}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>{a.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-amber)' }}>
            Warnings ({warnings.length})
          </h4>
          {warnings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>No warnings</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {warnings.slice(0, 10).map((a, i) => (
                <div key={i} style={{ padding: 'var(--space-3)', borderLeft: '3px solid var(--color-amber)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{a.title}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>{a.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MLSection({ mlStatus, mlMetrics, loading }: { mlStatus: MLStatus | null; mlMetrics: MLMetrics | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div><div className="skeleton-loader" style={{ height: 24, width: 120, marginBottom: 12, borderRadius: 'var(--radius-md)' }} />{[1, 2, 3].map(i => <div key={i} className="skeleton-loader" style={{ height: 50, marginBottom: 8, borderRadius: 'var(--radius-md)' }} />)}</div>
          <div><div className="skeleton-loader" style={{ height: 24, width: 120, marginBottom: 12, borderRadius: 'var(--radius-md)' }} />{[1, 2, 3, 4].map(i => <div key={i} className="skeleton-loader" style={{ height: 50, marginBottom: 8, borderRadius: 'var(--radius-md)' }} />)}</div>
        </div>
      </div>
    )
  }

  if (!mlStatus && !mlMetrics) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
        ML platform metrics not available
      </div>
    )
  }

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
        <div>
          <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-purple)' }}>
            ML Platform Status
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            {[
              { label: 'Status', value: mlStatus?.status ?? 'N/A', color: mlStatus?.status === 'operational' ? '#36d399' : '#fbbf24' },
              { label: 'Models', value: mlStatus?.totalModels ?? 0, color: '#17a8e5' },
              { label: 'Encoders', value: mlStatus?.totalEncoders ?? 0, color: '#7c5dfa' },
              { label: 'Cache Size', value: mlStatus?.loaderCacheSize ?? 0, color: '#fbbf24' },
            ].map(item => (
              <div key={item.label} style={{ padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: item.color }}>
                  {typeof item.value === 'number' ? item.value.toLocaleString('en-IN') : item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-cyan)' }}>
            ML Serving Metrics
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            {[
              { label: 'Total Predictions', value: mlMetrics?.totalPredictions ?? 0, color: '#17a8e5' },
              { label: 'Success Rate', value: mlMetrics?.successRate != null ? `${(mlMetrics.successRate * 100).toFixed(1)}%` : 'N/A', color: (mlMetrics?.successRate ?? 1) >= 0.95 ? '#36d399' : '#fbbf24' },
              { label: 'Avg Latency', value: mlMetrics?.averageLatencyMs != null ? `${mlMetrics.averageLatencyMs.toFixed(0)}ms` : 'N/A', color: '#7c5dfa' },
              { label: 'Uptime', value: mlMetrics?.uptimeSeconds != null ? formatUptime(mlMetrics.uptimeSeconds) : 'N/A', color: '#36d399' },
            ].map(item => (
              <div key={item.label} style={{ padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivitySection({ activities, loading }: { activities: AdminActivity[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>Recent Activity</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton-loader" style={{ height: 48, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
        Recent Activity ({activities.length})
      </h3>
      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>No recent activity</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {activities.slice(0, 30).map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', alignItems: 'center', borderRadius: 'var(--radius-md)' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: a.type === 'bill' ? 'rgba(54,211,153,0.15)' : 'rgba(23,168,229,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={a.type === 'bill' ? '#36d399' : '#17a8e5'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <use href={a.type === 'bill' ? '#icon-file-text' : '#icon-activity'} />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>{a.eventType}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginLeft: 'var(--space-2)' }}>{a.user}</span>
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {a.timestamp ? new Date(a.timestamp).toLocaleDateString() : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExportBar({ auditLog, activity }: { auditLog: AuditLogEntry[]; activity: AdminActivity[] }) {
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

  const handleExportAudit = () => {
    exportCSV(auditLog.slice(0, 1000).map(e => ({
      timestamp: e.createdAt, user: e.user, action: e.action, module: e.module, entity: `${e.entityType}${e.entityId != null ? ` #${e.entityId}` : ''}`, reason: e.reason || '',
    })), [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'user', label: 'User' },
      { key: 'action', label: 'Action' },
      { key: 'module', label: 'Module' },
      { key: 'entity', label: 'Entity' },
      { key: 'reason', label: 'Reason' },
    ], 'audit-trail.csv')
  }

  const handleExportActivity = () => {
    exportCSV(activity.slice(0, 1000).map(a => ({
      timestamp: a.timestamp, event: a.eventType, module: a.module, user: a.user, notes: a.notes,
    })), [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'event', label: 'Event' },
      { key: 'module', label: 'Module' },
      { key: 'user', label: 'User' },
      { key: 'notes', label: 'Notes' },
    ], 'platform-activity.csv')
  }

  const handlePrint = () => window.print()

  return (
    <div className="card-glass" style={{ padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Export Center</span>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={handleExportAudit}
            style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            Export Audit Trail (CSV)
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleExportActivity}
            style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            Export Activity (CSV)
          </button>
          <button className="btn btn-outline btn-sm" onClick={handlePrint}
            style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            Print
          </button>
        </div>
      </div>
    </div>
  )
}
