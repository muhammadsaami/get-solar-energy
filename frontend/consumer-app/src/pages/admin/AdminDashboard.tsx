import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../../services/admin.service'
import type { AdminDashboardData, AdminActivity, AdminHealth, AdminKpi } from './admin.types'

/* ─── Functional Icons ─────────────────────────────────────── */
const IcoRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const IcoSearch = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

/* ─── KPI formatting (shared with Business Intelligence) ───── */
function formatKpiValue(kpi: AdminKpi): string {
  switch (kpi.format) {
    case 'currency': return `₹${(kpi.value / 100000).toFixed(1)}L`
    case 'percent': return `${kpi.value}%`
    case 'years': return `${kpi.value}yr`
    case 'kw': return `${kpi.value}kW`
    default: return kpi.value.toLocaleString('en-IN')
  }
}

/* Frozen-token accent mapping (no purple/violet/cyan in admin) */
const ACCENT_CLASS: Record<string, string> = {
  blue: 'accent-blue',
  green: 'accent-green',
  orange: 'accent-orange',
  amber: 'accent-orange',
  cyan: 'accent-blue',
  purple: 'accent-blue',
  red: 'accent-red',
}

/* Headline KPIs shown above the fold (max 4) */
const HEAD_KPIS = ['total_customers', 'total_revenue', 'active_leads', 'pending_surveys']

/* Quick navigation: one primary + ghost secondaries + overflow */
const QUICK_LINKS = [
  { label: 'CRM Leads', path: '/app/crm/leads' },
  { label: 'Business Intel', path: '/app/admin/analytics' },
  { label: 'Audit Log', path: '/app/audit/monitoring' },
  { label: 'Site Surveys', path: '/app/site-survey' },
  { label: 'MLOps Hub', path: '/app/mlops' },
  { label: 'Settings', path: '/app/account/settings' },
]

interface GeoRow {
  city?: string
  customers?: number
  total_project_value?: number
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [activity, setActivity] = useState<AdminActivity[]>([])
  const [health, setHealth] = useState<AdminHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Workbench interactive state
  const [searchQuery, setSearchQuery] = useState('')
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(0)
  const [density, setDensity] = useState<'compact' | 'standard'>('compact')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [d, a, h] = await Promise.all([
        adminService.getDashboard(),
        adminService.getActivity(50),
        adminService.getHealth(),
      ])
      setData(d)
      setActivity(a)
      setHealth(h)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-refresh interval if selected
  useEffect(() => {
    if (autoRefreshSec <= 0) return
    const timer = setInterval(() => {
      loadData()
    }, autoRefreshSec * 1000)
    return () => clearInterval(timer)
  }, [autoRefreshSec, loadData])

  const filteredActivity = useMemo(() => {
    if (!searchQuery.trim()) return activity
    const q = searchQuery.toLowerCase()
    return activity.filter(a =>
      a.eventType?.toLowerCase().includes(q) ||
      a.user?.toLowerCase().includes(q) ||
      a.module?.toLowerCase().includes(q) ||
      a.notes?.toLowerCase().includes(q)
    )
  }, [activity, searchQuery])

  const kpis = data?.kpis ?? []
  const cc = data?.commandCenter
  const pipeline = data?.pipeline
  const alerts = data?.alerts ?? []
  const healthServices = health?.services ?? []
  const overallHealth = health?.overall ?? 'green'
  const criticalAlerts = alerts.filter(a => a.type === 'critical' || a.type === 'error')

  const headKpis = HEAD_KPIS
    .map(id => kpis.find(k => k.id === id))
    .filter((k): k is AdminKpi => Boolean(k))
    .slice(0, 4)

  const geography = (data?.geography ?? []) as GeoRow[]

  const lastSync = data?.fetchTime ? new Date(data.fetchTime).toLocaleTimeString('en-IN') : '—'

  const [primaryLink, ...restLinks] = QUICK_LINKS
  const visibleLinks = restLinks.slice(0, 3)
  const overflowLinks = restLinks.slice(3)

  if (error && !data) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <div className="ew-workbench-card" style={{ padding: 'var(--space-8)', maxWidth: 480, margin: '0 auto' }}>
          <h3 style={{ margin: '0 0 var(--space-2)' }}>Dashboard Unavailable</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', margin: '0 0 var(--space-4)' }}>{error}</p>
          <button className="btn btn-primary" onClick={loadData}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="ew-page" style={{ fontSize: density === 'compact' ? '12px' : '13px' }}>
      {/* ════════════════════════════════════════════════════════════
          1. HERO — page title, one sentence, primary action
          ════════════════════════════════════════════════════════════ */}
      <header className="tab-header-block">
        <div>
          <h2 className="tab-heading">Command Center</h2>
          <p className="tab-subheading">
            Platform-wide operations: pipeline health, service status, incidents, and audit activity.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setDensity(d => (d === 'compact' ? 'standard' : 'compact'))}
            title="Toggle compact/standard density"
            style={{ fontSize: 11 }}
          >
            {density === 'compact' ? 'Dense' : 'Standard'}
          </button>
          <select
            value={autoRefreshSec}
            onChange={e => setAutoRefreshSec(Number(e.target.value))}
            aria-label="Auto-Refresh Interval"
            style={{ fontSize: 11, padding: '4px 6px' }}
          >
            <option value={0}>Refresh: Manual</option>
            <option value={10}>Auto: 10s</option>
            <option value={30}>Auto: 30s</option>
            <option value={60}>Auto: 60s</option>
          </select>
          <button
            className="btn btn-primary"
            onClick={loadData}
            disabled={loading}
            style={{ whiteSpace: 'nowrap' }}
          >
            <span style={{ display: 'inline-flex', marginRight: 6 }}><IcoRefresh /></span>
            {loading ? 'Syncing...' : 'Sync Dashboard'}
          </button>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════
          2. HEADLINE KPIs ABOVE THE FOLD (max 4, shared classes)
          ════════════════════════════════════════════════════════════ */}
      <section aria-label="Key Metrics" className="card-grid-4">
        {headKpis.map(kpi => (
          <div key={kpi.id} className={`card-metric ${ACCENT_CLASS[kpi.accent] ?? 'accent-blue'}`}>
            <div className="card-metric-label">{kpi.label}</div>
            <div className="card-metric-value">{formatKpiValue(kpi)}</div>
          </div>
        ))}
      </section>

      {/* ════════════════════════════════════════════════════════════
          4. MAIN WORKBENCH (65 / 35)
          ════════════════════════════════════════════════════════════ */}
      <div className="ew-asym-65-35">
        {/* ── LEFT COLUMN (65%) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Incidents & Alerts */}
          <section className="ew-workbench-card" aria-label="Incidents and Alerts">
            <div className="ew-workbench-header">
              <div className="ew-workbench-title">Incidents &amp; Alerts</div>
              <span className="ew-section-chip blue">{alerts.length}</span>
            </div>
            <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No unresolved platform alerts. All systems healthy.
                </div>
              ) : (
                alerts.map((al, idx) => (
                  <div
                    key={idx}
                    className={`ew-alert-card ${al.type === 'critical' ? 'critical' : al.type === 'warning' ? 'warning' : 'info'}`}
                    style={{ padding: '8px 12px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`ew-section-chip ${al.type === 'critical' ? 'red' : 'amber'}`}>
                        {al.type.toUpperCase()}
                      </span>
                      <span className="ew-alert-title" style={{ margin: 0 }}>{al.title}</span>
                    </div>
                    <div className="ew-alert-desc" style={{ marginTop: 4 }}>{al.description}</div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Pipeline Funnel */}
          <section className="ew-workbench-card" aria-label="Pipeline Funnel">
            <div className="ew-workbench-header">
              <div className="ew-workbench-title">Pipeline Funnel</div>
              <span className="ew-section-chip green">
                {pipeline ? `₹${(pipeline.pipelineValue / 100000).toFixed(1)}L` : '—'}
              </span>
            </div>
            <div style={{ padding: 'var(--space-4)' }}>
              {data?.charts?.pipelineFunnel && data.charts.pipelineFunnel.length > 0 ? (
                <div className="ew-funnel-bar-wrap">
                  {data.charts.pipelineFunnel.map((st, i) => {
                    const maxVal = Math.max(...(data.charts?.pipelineFunnel?.map(s => s.value) ?? [1]))
                    const pct = maxVal > 0 ? (st.value / maxVal) * 100 : 0
                    return (
                      <div key={i} className="ew-funnel-bar-row">
                        <div className="ew-funnel-bar-labels">
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{st.stage}</span>
                          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {st.value} Leads
                          </span>
                        </div>
                        <div className="ew-funnel-track">
                          <div
                            className="ew-funnel-fill"
                            style={{
                              width: `${pct}%`,
                              background: i === 0 ? 'var(--color-orange)' : i === 1 ? 'var(--color-blue)' : 'var(--color-green)',
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                  Pipeline data unavailable.
                </div>
              )}
            </div>
          </section>

          {/* Audit Activity */}
          <section className="ew-workbench-card" aria-label="Recent Audit Activity">
            <div className="ew-workbench-header">
              <div className="ew-workbench-title">Recent Activity</div>
              <span className="ew-section-chip blue">{filteredActivity.length} events</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ color: 'var(--text-muted)', display: 'inline-flex' }}><IcoSearch /></span>
              <input
                type="text"
                placeholder="Filter activity..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, fontSize: 12, padding: '4px 8px', maxWidth: 320 }}
              />
            </div>
            <div className="ew-dense-table-container" style={{ maxHeight: 340, overflowY: 'auto' }}>
              <table className="ew-dense-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Actor</th>
                    <th>Event</th>
                    <th>Module / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivity.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                        No audit events found.
                      </td>
                    </tr>
                  ) : (
                    filteredActivity.slice(0, 30).map((act, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, color: 'var(--text-muted)' }}>
                          {act.timestamp ? new Date(act.timestamp).toLocaleTimeString('en-IN') : '—'}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{act.user || 'system.worker'}</td>
                        <td>
                          <span className="ew-code-tag">{act.eventType || act.module || 'EXEC'}</span>
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{act.notes || act.module || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ── RIGHT COLUMN (35%) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Executive Summary */}
          <section className="ew-workbench-card" aria-label="Executive Summary">
            <div className="ew-workbench-header">
              <div className="ew-workbench-title">Executive Summary</div>
            </div>
            <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {cc?.executiveSummary || 'No summary available.'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span className="ew-code-tag">{cc?.surveysPending ?? 0} surveys pending</span>
                <span className="ew-code-tag">{cc?.installationsPending ?? 0} installs pending</span>
                <span className="ew-code-tag">{cc?.proposalsSent30d ?? 0} proposals (30d)</span>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/app/site-survey')}
                style={{ alignSelf: 'flex-start', marginTop: 4 }}
              >
                Dispatch Survey Techs
              </button>
            </div>
          </section>

          {/* System Health */}
          <section className="ew-workbench-card" aria-label="System Health">
            <div className="ew-workbench-header">
              <div className="ew-workbench-title">System Health</div>
              <span className={`ew-section-chip ${overallHealth === 'green' ? 'green' : 'amber'}`}>
                {overallHealth === 'red' ? 'Degraded' : overallHealth === 'amber' ? 'Advisory' : 'Operational'}
              </span>
            </div>
            <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {healthServices.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Health data unavailable.
                </div>
              ) : (
                healthServices.map((s, idx) => (
                  <div
                    key={idx}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: s.status === 'green' ? 'var(--color-green)' : s.status === 'amber' ? 'var(--color-yellow)' : 'var(--color-red)',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500, flex: 1 }}>{s.label}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{s.detail}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Geographic Coverage */}
          <section className="ew-workbench-card" aria-label="Geographic Coverage">
            <div className="ew-workbench-header">
              <div className="ew-workbench-title">Geographic Coverage</div>
              <span className="ew-section-chip blue">{data?.overview?.cities ?? 0} Cities</span>
            </div>
            <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {geography.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Geography data unavailable.
                </div>
              ) : (
                geography.map((geo, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{geo.city ?? '—'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{geo.customers ?? 0} accounts</span>
                      {typeof geo.total_project_value === 'number' && geo.total_project_value > 0 && (
                        <span className="ew-section-chip green" style={{ padding: '1px 6px', fontSize: 9 }}>
                          ₹{(geo.total_project_value / 100000).toFixed(1)}L
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Quick Navigation */}
          <section className="ew-workbench-card" aria-label="Quick Navigation">
            <div className="ew-workbench-header">
              <div className="ew-workbench-title">Quick Navigation</div>
            </div>
            <div style={{ padding: 'var(--space-3)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(primaryLink.path)}
              >
                {primaryLink.label}
              </button>
              {visibleLinks.map(r => (
                <button
                  key={r.label}
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate(r.path)}
                >
                  {r.label}
                </button>
              ))}
              {overflowLinks.length > 0 && (
                <select
                  defaultValue=""
                  aria-label="More actions"
                  onChange={e => {
                    if (e.target.value) navigate(e.target.value)
                  }}
                  style={{ fontSize: 11, padding: '4px 6px' }}
                >
                  <option value="" disabled>More…</option>
                  {overflowLinks.map(r => (
                    <option key={r.label} value={r.path}>{r.label}</option>
                  ))}
                </select>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
