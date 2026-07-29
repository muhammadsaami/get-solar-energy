import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { adminService } from '../../services/admin.service'
import type { AdminDashboardData, AdminActivity, AdminHealth, AdminKpi } from './admin.types'

const HOUR = new Date().getHours()
const GREETING = HOUR < 12 ? 'Morning' : HOUR < 18 ? 'Afternoon' : 'Evening'
const TODAY = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

const QUICK_ACTIONS = [
  { id: 'customers', label: 'Manage Customers', icon: 'icon-users', desc: 'View and manage all customers', route: '/app/admin/customers' },
  { id: 'vendors', label: 'Manage Vendors', icon: 'icon-briefcase', desc: 'Vendor performance and assignments', route: '/app/vendor' },
  { id: 'reports', label: 'View Reports', icon: 'icon-reports', desc: 'Export and analyze reports', route: '/app/admin/reports' },
  { id: 'analytics', label: 'Analytics', icon: 'icon-trending-up', desc: 'Revenue, funnel and growth analytics', route: '/app/admin/analytics' },
  { id: 'platform', label: 'Platform Health', icon: 'icon-shield', desc: 'System status and performance', route: '/app/admin/platform' },
  { id: 'ai', label: 'AI Assistant', icon: 'icon-sparkles', desc: 'Enterprise AI insights', route: '/app/enterprise-ai' },
  { id: 'survey', label: 'Site Surveys', icon: 'icon-clipboard', desc: 'Survey operations', route: '/app/site-survey' },
  { id: 'settings', label: 'Settings', icon: 'icon-settings', desc: 'System configuration', route: '/app/admin/settings' },
]

const OPS_TABS = [
  { id: 'overview', label: 'Overview', icon: 'icon-home' },
  { id: 'alerts', label: 'Alerts & Issues', icon: 'icon-alert-triangle' },
  { id: 'operations', label: 'Operations', icon: 'icon-briefcase' },
  { id: 'platform', label: 'Platform', icon: 'icon-shield' },
]

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth() as unknown as { user: { name: string; role: string } | null }
  const firstName = user?.name?.split(' ')[0] || 'Admin'

  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [activity, setActivity] = useState<AdminActivity[]>([])
  const [health, setHealth] = useState<AdminHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashboardData, activityData, healthData] = await Promise.all([
        adminService.getDashboard(),
        adminService.getActivity(30),
        adminService.getHealth(),
      ])
      setData(dashboardData)
      setActivity(activityData)
      setHealth(healthData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const kpis = data?.kpis ?? []
  const pipeline = data?.pipeline
  const alerts = data?.alerts ?? []
  const charts = data?.charts

  const healthStatus = useMemo(() => {
    if (!health) return { overall: 'amber', services: [], lastCheck: '' }
    return health
  }, [health])

  if (loading && !data) {
    return (
      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div className="skeleton-loader" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton-loader" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton-loader" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <div className="card-glass" style={{ padding: 'var(--space-8)', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>⚠</div>
          <h3 style={{ margin: '0 0 var(--space-2)' }}>Connection Error</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', margin: '0 0 var(--space-4)' }}>{error}</p>
          <button className="btn btn-primary" onClick={load}>Retry Connection</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <AdminHeroSection
        firstName={firstName}
        data={data}
        onRefresh={load}
        loading={loading}
      />

      <QuickActionsGrid onAction={(id) => {
        const action = QUICK_ACTIONS.find(a => a.id === id)
        if (action) navigate(action.route)
      }} />

      <ExecutiveKpiCards kpis={kpis} loading={loading} />

      <OperationsWorkspace
        activeTab={activeTab}
        onTabChange={setActiveTab}
        charts={charts}
        alerts={alerts}
        pipeline={pipeline}
        data={data}
        loading={loading}
        activity={activity}
        health={healthStatus}
      />

      <ExecutiveAIInsights data={data} loading={loading} />

      <RecentActivityFeed activities={activity} loading={loading} />

      <PlatformHealthSection health={healthStatus} loading={loading} onRefresh={load} />
    </div>
  )
}

function AdminHeroSection({ firstName, data, onRefresh, loading }: {
  firstName: string
  data: AdminDashboardData | null
  onRefresh: () => void
  loading: boolean
}) {
  const cc = data?.commandCenter
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
              Good {GREETING}, {firstName}
            </h1>
            <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Administrator &middot; Solar Intelligence Command Center &middot; {TODAY}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            {data?.fetchTime && (
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                Last sync: {new Date(data.fetchTime).toLocaleTimeString()}
              </span>
            )}
            <button
              className="btn btn-outline btn-sm"
              onClick={onRefresh}
              disabled={loading}
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
              aria-label="Refresh dashboard"
            >
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
          <StatBadge icon="icon-users" value={data?.overview?.total_customers ?? 0} label="Total Customers" color="var(--color-blue)" />
          <StatBadge icon="icon-users" value={cc?.totalLeads30d ?? 0} label="Active Leads" color="var(--color-orange)" />
          <StatBadge icon="icon-clipboard" value={cc?.surveysPending ?? 0} label="Pending Surveys" color="var(--color-purple)" />
          <StatBadge icon="icon-hard-drive" value={cc?.installationsPending ?? 0} label="Active Installations" color="var(--color-cyan)" />
        </div>
      </div>
    </div>
  )
}

function StatBadge({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <use href={`#${icon}`} />
      </svg>
      <div>
        <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, lineHeight: 1 }}>{value.toLocaleString('en-IN')}</span>
        <span style={{ fontSize: 'var(--font-size-xs)', marginLeft: 'var(--space-1)', opacity: 0.85 }}>{label}</span>
      </div>
    </div>
  )
}

function QuickActionsGrid({ onAction }: { onAction: (id: string) => void }) {
  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
        Quick Actions
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.id}
            className="card-feature"
            onClick={() => onAction(action.id)}
            style={{ cursor: 'pointer', textAlign: 'left', padding: 'var(--space-4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)' }}
            aria-label={action.label}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 'var(--space-2)' }}>
              <use href={`#${action.icon}`} />
            </svg>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{action.label}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{action.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function ExecutiveKpiCards({ kpis, loading }: { kpis: AdminKpi[]; loading: boolean }) {
  const formatValue = (kpi: AdminKpi) => {
    if (loading) return '---'
    switch (kpi.format) {
      case 'currency': return `₹${(kpi.value / 100000).toFixed(1)}L`
      case 'percent': return `${kpi.value}%`
      case 'years': return `${kpi.value}yr`
      case 'kw': return `${kpi.value}kW`
      default: return kpi.value.toLocaleString('en-IN')
    }
  }

  const ACCENT_CLASS: Record<string, string> = {
    blue: 'kpi-accent-blue',
    green: 'kpi-accent-green',
    orange: 'kpi-accent-orange',
    purple: 'kpi-accent-purple',
    cyan: 'kpi-accent-cyan',
    amber: 'kpi-accent-amber',
  }

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
        Executive KPIs
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
        {kpis.slice(0, 14).map(kpi => (
          <div key={kpi.id} className={`card-metric ${ACCENT_CLASS[kpi.accent] || ''}`} style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <use href={`#${kpi.icon}`} />
              </svg>
              <span className="kpi-title" style={{ fontSize: 'var(--font-size-xs)' }}>{kpi.label}</span>
            </div>
            <div className="kpi-value-block">
              <span className="kpi-value" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>{formatValue(kpi)}</span>
              {kpi.change != null && (
                <span className={`kpi-change ${kpi.change >= 0 ? 'kpi-change-positive' : 'kpi-change-negative'}`} style={{ marginLeft: 'var(--space-2)' }}>
                  {kpi.change >= 0 ? '+' : ''}{kpi.change}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OperationsWorkspace({
  activeTab, onTabChange, charts, alerts, pipeline, data, activity, health,
}: {
  activeTab: string; onTabChange: (t: string) => void
  charts: AdminDashboardData['charts'] | undefined
  alerts: { type: string; title: string; description: string }[]
  pipeline: AdminDashboardData['pipeline'] | undefined
  data: AdminDashboardData | null
  loading: boolean
  activity: AdminActivity[]
  health: AdminDashboardData['health'] | null
}) {
  return (
    <div className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)',
        padding: 'var(--space-2)', background: 'var(--bg-tertiary)',
        overflowX: 'auto',
      }}>
        {OPS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-label={tab.label}
            style={{
              flex: '0 0 auto', padding: 'var(--space-3) var(--space-4)', cursor: 'pointer',
              border: 'none', borderRadius: 'var(--radius-md)',
              background: activeTab === tab.id ? 'var(--glass-bg)' : 'transparent',
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 'var(--font-size-sm)', transition: 'all var(--transition-fast)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              whiteSpace: 'nowrap',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <use href={`#${tab.icon}`} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 'var(--space-5)' }} role="tabpanel">
        {activeTab === 'overview' && <OverviewTab charts={charts} pipeline={pipeline} />}
        {activeTab === 'alerts' && <AlertsTab alerts={alerts} activity={activity} />}
        {activeTab === 'operations' && <OperationsTab data={data} />}
        {activeTab === 'platform' && <PlatformTab health={health} />}
      </div>
    </div>
  )
}

function OverviewTab({ charts, pipeline }: { charts: AdminDashboardData['charts'] | undefined; pipeline: AdminDashboardData['pipeline'] | undefined }) {
  const stageData = charts?.pipelineFunnel ?? []

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
      <div className="card-base" style={{ padding: 'var(--space-4)' }}>
        <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Pipeline Funnel</h4>
        {stageData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>No pipeline data yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {stageData.map((item, i) => {
              const maxVal = Math.max(...stageData.map(s => s.value))
              const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0
              const colors = ['#ff8a1d', '#00aeef', '#22c55e', '#a855f7', '#eab308', '#ef4444', '#06b6d4']
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{item.stage}</span>
                    <span style={{ fontWeight: 700 }}>{item.value}</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: colors[i % colors.length], borderRadius: 4, transition: 'width 0.5s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="card-base" style={{ padding: 'var(--space-4)' }}>
        <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Pipeline Metrics</h4>
        {!pipeline ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>No metrics yet</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            {[
              { label: 'Total Leads', value: pipeline.totalLeads, color: 'var(--color-orange)' },
              { label: 'Pipeline Value', value: `₹${(pipeline.pipelineValue / 100000).toFixed(1)}L`, color: 'var(--color-green)' },
              { label: 'Win Rate', value: `${pipeline.winRate}%`, color: 'var(--color-purple)' },
              { label: 'Avg Deal Size', value: `₹${(pipeline.avgDealSize / 100000).toFixed(2)}L`, color: 'var(--color-blue)' },
              { label: 'Avg Lead Score', value: `${pipeline.avgLeadScore}/100`, color: 'var(--color-cyan)' },
              { label: 'Avg Health Score', value: `${pipeline.avgHealthScore}/100`, color: 'var(--color-amber)' },
            ].map(m => (
              <div key={m.label} style={{ padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AlertsTab({ alerts, activity }: { alerts: { type: string; title: string; description: string }[]; activity: AdminActivity[] }) {
  const critical = alerts.filter(a => a.type === 'critical')
  const warnings = alerts.filter(a => a.type === 'warning')

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
      <div>
        <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-red)' }}>
          Alerts ({alerts.length})
        </h4>
        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>No active alerts</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {critical.slice(0, 5).map((a, i) => (
              <div key={i} style={{ padding: 'var(--space-3)', borderLeft: '3px solid var(--color-red)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{a.title}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>{a.description}</div>
              </div>
            ))}
            {warnings.slice(0, 5).map((a, i) => (
              <div key={i} style={{ padding: 'var(--space-3)', borderLeft: '3px solid var(--color-amber)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{a.title}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>{a.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Recent Activity</h4>
        {activity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>No recent activity</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 400, overflowY: 'auto' }}>
            {activity.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: a.type === 'bill' ? 'var(--color-green-10)' : 'var(--color-blue-10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={a.type === 'bill' ? 'var(--color-green)' : 'var(--color-blue)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <use href={a.type === 'bill' ? '#icon-file-text' : '#icon-activity'} />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.eventType}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{a.notes || a.module}</div>
                </div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {a.timestamp ? new Date(a.timestamp).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function OperationsTab({ data }: { data: AdminDashboardData | null }) {
  const vs = data?.vendorSummary ?? {}
  const ps = data?.projectSummary ?? {}
  const ss = data?.surveyStats ?? {}

  const items = [
    { label: 'Total Surveys', value: vs.totalSurveys ?? ss.total ?? 0, color: 'var(--color-blue)' },
    { label: 'Active Surveys', value: vs.activeSurveys ?? 0, color: 'var(--color-orange)' },
    { label: 'Approved Surveys', value: vs.approvedSurveys ?? ss.approved ?? 0, color: 'var(--color-green)' },
    { label: 'Total Installations', value: vs.totalInstallations ?? 0, color: 'var(--color-cyan)' },
    { label: 'Active Installations', value: vs.activeInstallations ?? 0, color: 'var(--color-purple)' },
    { label: 'Pending Tasks', value: vs.pendingTasks ?? 0, color: 'var(--color-amber)' },
    { label: 'Total Projects', value: ps.total ?? 0, color: 'var(--color-blue)' },
    { label: 'Active Projects', value: ps.active ?? 0, color: 'var(--color-green)' },
    { label: 'At Risk Projects', value: ps.atRisk ?? 0, color: 'var(--color-red)' },
    { label: 'Avg Progress', value: ps.avgProgress ? `${ps.avgProgress}%` : '0%', color: 'var(--color-orange)' },
    { label: 'Avg Health', value: ps.avgHealth ? `${ps.avgHealth}/100` : '0', color: 'var(--color-purple)' },
    { label: 'Project Pipeline', value: ps.pipelineValue ? `₹${(ps.pipelineValue / 100000).toFixed(1)}L` : '₹0', color: 'var(--color-cyan)' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
      {items.map(item => (
        <div key={item.label} style={{ padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 4 }}>{item.label}</div>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: item.color }}>{typeof item.value === 'number' ? item.value.toLocaleString('en-IN') : item.value}</div>
        </div>
      ))}
    </div>
  )
}

function PlatformTab({ health }: { health: AdminDashboardData['health'] | null }) {
  const STATUS_COLORS: Record<string, string> = { green: '#22c55e', amber: '#eab308', red: '#ef4444' }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-4)' }}>
      {(health?.services ?? []).map((s, i) => (
        <div key={i} style={{ padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: `1px solid ${STATUS_COLORS[s.status] || 'var(--border-subtle)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{s.label}</span>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: STATUS_COLORS[s.status] || 'var(--text-muted)',
              display: 'inline-block',
            }} />
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>{s.detail}</div>
        </div>
      ))}
      {(!health?.services || health.services.length === 0) && (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
          Health data not available
        </div>
      )}
    </div>
  )
}

function ExecutiveAIInsights({ data, loading: isLoading }: { data: AdminDashboardData | null; loading: boolean }) {
  const cc = data?.commandCenter

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <use href="#icon-sparkles" />
        </svg>
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Executive AI Insights</h3>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-loader" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
          <InsightCard
            icon="icon-trending-up"
            title="Revenue Forecast"
            description={cc?.executiveSummary || 'Analyzing revenue trends across all active deals and pipeline stages.'}
            color="var(--color-green)"
          />
          <InsightCard
            icon="icon-shield"
            title="Proposal Conversion"
            description={`Current win rate: ${data?.pipeline?.winRate ?? 0}%. ${(data?.pipeline?.winRate ?? 0) >= 50 ? 'Conversion is healthy.' : 'Opportunity to improve proposal follow-up.'}`}
            color="var(--color-purple)"
          />
          <InsightCard
            icon="icon-alert-triangle"
            title="High-Risk Customers"
            description={`${data?.pipeline?.totalLeads ?? 0} active leads. Avg health score: ${data?.pipeline?.avgHealthScore ?? 0}/100. ${(data?.pipeline?.avgHealthScore ?? 0) < 70 ? 'Some accounts need attention.' : 'Customer health is stable.'}`}
            color="var(--color-amber)"
          />
          <InsightCard
            icon="icon-hard-drive"
            title="Installation Pipeline"
            description={`${data?.vendorSummary?.activeInstallations ?? 0} active installations. ${data?.projectSummary?.atRisk ?? 0} at-risk projects requiring intervention.`}
            color="var(--color-cyan)"
          />
          {data?.geography && data.geography.length > 0 && (
            <InsightCard
              icon="icon-map-pin"
              title="Top Geography"
              description={`${(data.geography[0] as Record<string, unknown>)?.city || 'N/A'} leads with ${(data.geography[0] as Record<string, unknown>)?.customer_count || 0} customers. Strongest market segment.`}
              color="var(--color-blue)"
            />
          )}
          <InsightCard
            icon="icon-clock"
            title="Today's Summary"
            description={`${cc?.totalLeads30d ?? 0} total leads in pipeline. ${cc?.surveysPending ?? 0} surveys pending. ${cc?.installationsPending ?? 0} installations in progress. ${cc?.proposalsSent30d ?? 0} proposals sent.`}
            color="var(--color-orange)"
          />
        </div>
      )}
    </div>
  )
}

function InsightCard({ icon, title, description, color }: { icon: string; title: string; description: string; color: string }) {
  return (
    <div style={{ padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <use href={`#${icon}`} />
        </svg>
        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{title}</span>
      </div>
      <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{description}</p>
    </div>
  )
}

function RecentActivityFeed({ activities, loading }: { activities: AdminActivity[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>Recent Activity</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-loader" style={{ height: 50, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
        Recent Activity
      </h3>
      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>No recent activity</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {activities.slice(0, 15).map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', alignItems: 'center', borderRadius: 'var(--radius-md)' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: a.type === 'bill' ? 'var(--color-green-10)' : 'var(--color-blue-10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={a.type === 'bill' ? 'var(--color-green)' : 'var(--color-blue)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function PlatformHealthSection({ health, loading, onRefresh }: {
  health: AdminDashboardData['health'] | null
  loading: boolean
  onRefresh: () => void
}) {
  const STATUS_COLORS: Record<string, string> = { green: '#22c55e', amber: '#eab308', red: '#ef4444' }
  const overallColor = STATUS_COLORS[health?.overall ?? 'amber'] || '#eab308'

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={overallColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <use href="#icon-shield" />
          </svg>
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Platform Health</h3>
          <span style={{
            display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
            background: overallColor, marginLeft: 'var(--space-1)',
          }} />
          <span style={{ fontSize: 'var(--font-size-xs)', color: overallColor, fontWeight: 600, textTransform: 'uppercase' }}>
            {health?.overall ?? 'Unknown'}
          </span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onRefresh} disabled={loading} aria-label="Refresh health status">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
        {(health?.services ?? []).map((s, i) => (
          <div key={i} style={{
            padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
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
        ))}
        {(!health?.services || health.services.length === 0) && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-muted)' }}>
            {loading ? 'Loading health data...' : 'Health data not available'}
          </div>
        )}
      </div>
    </div>
  )
}