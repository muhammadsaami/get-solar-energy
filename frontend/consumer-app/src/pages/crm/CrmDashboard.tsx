import { useState, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useCrmPipelineMetrics, useCrmAlerts } from './useCrmQueries'
import CrmPipelineBoard from './CrmPipelineBoard'
import CrmCustomerTable from './CrmCustomerTable'
import CrmCustomer360 from './CrmCustomer360'
import CrmActivityTimeline from './CrmActivityTimeline'
import CrmTasksPanel from './CrmTasksPanel'
import CrmMeetingsPanel from './CrmMeetingsPanel'
import CrmFollowupsPanel from './CrmFollowupsPanel'
import CrmCommunicationsPanel from './CrmCommunicationsPanel'
import CrmAlertsPanel from './CrmAlertsPanel'
import type { CrmPipelineMetrics, CrmKpi } from './crm.types'

const HOUR = new Date().getHours()
const GREETING = HOUR < 12 ? 'Morning' : HOUR < 18 ? 'Afternoon' : 'Evening'
const TODAY = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

const QUICK_ACTIONS = [
  { id: 'task', label: 'Create Task', icon: 'icon-check-square', desc: 'Add a new task' },
  { id: 'followup', label: 'Create Follow-up', icon: 'icon-clock', desc: 'Schedule a follow-up action' },
  { id: 'meeting', label: 'Schedule Meeting', icon: 'icon-calendar', desc: 'Plan a site visit or call' },
  { id: 'communication', label: 'Log Communication', icon: 'icon-message-square', desc: 'Record a call, email, or SMS' },
  { id: 'search', label: 'Search Customers', icon: 'icon-search', desc: 'Find customers by name or number' },
  { id: 'report', label: 'Generate Report', icon: 'icon-reports', desc: 'Export CRM analytics report' },
]

const CRM_TABS = [
  { id: 'pipeline', label: 'Pipeline', icon: 'icon-trending-up' },
  { id: 'customers', label: 'Customers', icon: 'icon-users' },
  { id: 'customer360', label: 'Customer 360', icon: 'icon-user' },
  { id: 'timeline', label: 'Timeline', icon: 'icon-activity' },
  { id: 'tasks', label: 'Tasks', icon: 'icon-check-square' },
  { id: 'followups', label: 'Follow-ups', icon: 'icon-clock' },
  { id: 'meetings', label: 'Meetings', icon: 'icon-calendar' },
  { id: 'communications', label: 'Communications', icon: 'icon-message-square' },
  { id: 'alerts', label: 'Alerts', icon: 'icon-alert-triangle' },
  { id: 'proposals', label: 'Proposals', icon: 'icon-file-text' },
]

function buildKpis(metrics: CrmPipelineMetrics | null): CrmKpi[] {
  if (!metrics) return []
  return [
    { id: 'pipeline-revenue', label: 'Pipeline Revenue', value: metrics.pipelineValue, format: 'currency', accent: 'green', icon: 'icon-trending-up', change: null },
    { id: 'active-leads', label: 'Active Leads', value: metrics.totalLeads, format: 'number', accent: 'blue', icon: 'icon-users', change: null },
    { id: 'conversion-rate', label: 'Conversion Rate', value: metrics.winRate, format: 'percent', accent: 'purple', icon: 'icon-shield', change: null },
    { id: 'avg-lead-score', label: 'Avg Lead Score', value: metrics.avgLeadScore, format: 'score', accent: 'cyan', icon: 'icon-activity', change: null },
    { id: 'avg-health-score', label: 'Avg Health Score', value: metrics.avgHealthScore, format: 'score', accent: 'amber', icon: 'icon-heart', change: null },
    { id: 'avg-deal-size', label: 'Avg Deal Size', value: metrics.avgDealSize, format: 'currency', accent: 'orange', icon: 'icon-briefcase', change: null },
    { id: 'pipeline-velocity', label: 'Pipeline Velocity', value: metrics.pipelineVelocity, format: 'currency', accent: 'blue', icon: 'icon-zap', change: null },
    { id: 'avg-sales-cycle', label: 'Avg Sales Cycle', value: metrics.avgSalesCycle, format: 'number', accent: 'purple', icon: 'icon-clock', change: null },
  ]
}

export default function CrmDashboardPage() {
  const { user } = useAuth() as unknown as { user: { name: string } | null }
  const firstName = user?.name?.split(' ')[0] || 'Manager'

  const [activeTab, setActiveTab] = useState('pipeline')
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [showAlerts, setShowAlerts] = useState(false)

  const { data: metrics, isLoading: loading, error, refetch } = useCrmPipelineMetrics()
  const { data: alerts = [] } = useCrmAlerts()

  const kpis = useMemo(() => buildKpis(metrics ?? null), [metrics])

  const handleQuickAction = (id: string) => {
    switch (id) {
      case 'task': setActiveTab('tasks'); break
      case 'followup': setActiveTab('followups'); break
      case 'meeting': setActiveTab('meetings'); break
      case 'communication': setActiveTab('communications'); break
      case 'search': setActiveTab('customers'); break
      case 'report': window.open('/api/crm/reports/activity', '_blank'); break
    }
  }

  if (error && !metrics) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <div className="card-glass" style={{ padding: 'var(--space-8)', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>⚠</div>
          <h3 style={{ margin: '0 0 var(--space-2)' }}>Connection Error</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', margin: '0 0 var(--space-4)' }}>{error?.message}</p>
          <button className="btn btn-primary" onClick={() => refetch()}>Retry Connection</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <CrmHeroSection firstName={firstName} metrics={metrics ?? null} onRefresh={() => refetch()} loading={loading} />

      <QuickActionsGrid onAction={handleQuickAction} />

      <CrmKpiCards kpis={kpis} loading={loading} />

      {alerts.length > 0 && (
        <div className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            style={{
              width: '100%', padding: 'var(--space-4) var(--space-5)', cursor: 'pointer',
              border: 'none', background: 'transparent', color: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              fontSize: 'var(--font-size-sm)', fontWeight: 600,
            }}
            aria-expanded={showAlerts}
            aria-label={`${alerts.length} alert${alerts.length > 1 ? 's' : ''}`}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: alerts.some(a => a.severity === 'Critical') ? 'var(--color-red)' : 'var(--color-amber)',
              flexShrink: 0,
            }} />
            {alerts.length} Alert{alerts.length > 1 ? 's' : ''} — {alerts.filter(a => a.severity === 'Critical').length} Critical, {alerts.filter(a => a.severity === 'Warning').length} Warning
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto', transform: showAlerts ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showAlerts && (
            <div style={{ padding: '0 var(--space-5) var(--space-4)' }}>
              <CrmAlertsPanel alerts={alerts} onSelectCustomer={(id) => { setSelectedCustomerId(id); setActiveTab('customers') }} />
            </div>
          )}
        </div>
      )}

      <div className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)',
          padding: 'var(--space-2)', background: 'var(--bg-tertiary)',
          overflowX: 'auto',
        }}>
          {CRM_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
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
          {activeTab === 'pipeline' && <CrmPipelineBoard metrics={metrics ?? null} loading={loading} />}
          {activeTab === 'customers' && <CrmCustomerTable onSelectCustomer={(id) => setSelectedCustomerId(id)} />}
          {activeTab === 'customer360' && (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 'var(--space-4)', opacity: 0.4 }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <h3 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Customer 360 Profile</h3>
              <p style={{ margin: '0 auto var(--space-4)', fontSize: 'var(--font-size-sm)', maxWidth: 400 }}>
                Select a customer from the <strong>Customers</strong> tab to view their full 360 profile — bills, roof analysis, survey, proposal, ROI, installation, AMC, timeline, documents, communications, and tasks.
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('customers')}>
                Go to Customers
              </button>
            </div>
          )}
          {activeTab === 'timeline' && <CrmActivityTimeline />}
          {activeTab === 'tasks' && <CrmTasksPanel />}
          {activeTab === 'followups' && <CrmFollowupsPanel />}
          {activeTab === 'meetings' && <CrmMeetingsPanel />}
          {activeTab === 'communications' && <CrmCommunicationsPanel />}
          {activeTab === 'alerts' && <CrmAlertsPanel alerts={alerts} onSelectCustomer={(id) => { setSelectedCustomerId(id); setActiveTab('customers') }} />}
          {activeTab === 'proposals' && <PlaceholderSection title="Proposal Tracking" description="Track generated, viewed, accepted, rejected, and expired proposals. Coming in Phase 17.16C." />}
        </div>
      </div>
      <CrmCustomer360 customerId={selectedCustomerId} onClose={() => setSelectedCustomerId(null)} />
    </div>
  )
}

function CrmHeroSection({ firstName, metrics, onRefresh, loading }: {
  firstName: string
  metrics: CrmPipelineMetrics | null
  onRefresh: () => void
  loading: boolean
}) {
  return (
    <div className="hero-section" style={{
      padding: 'var(--space-6) var(--space-8)', borderRadius: 'var(--radius-lg)',
      background: 'linear-gradient(135deg, #0a1628 0%, #1a1a3e 50%, #0d2136 100%)',
      border: '1px solid var(--glass-border)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(139,92,246,0.10) 0%, rgba(59,130,246,0.08) 50%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Good {GREETING}, {firstName}
            </h1>
            <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Enterprise CRM & Sales Operations &middot; {TODAY}
            </p>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={onRefresh}
            disabled={loading}
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
            aria-label="Refresh CRM"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Refresh
          </button>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)',
          paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)',
        }}>
          <StatBadge icon="icon-trending-up" value={metrics?.pipelineValue ?? 0} label="Pipeline Revenue" color="var(--color-green)" format="currency" />
          <StatBadge icon="icon-users" value={metrics?.totalLeads ?? 0} label="Active Leads" color="var(--color-blue)" format="number" />
          <StatBadge icon="icon-activity" value={metrics?.avgLeadScore ?? 0} label="Avg Lead Score" color="var(--color-purple)" format="score" />
          <StatBadge icon="icon-heart" value={metrics?.avgHealthScore ?? 0} label="Avg Health Score" color="var(--color-amber)" format="score" />
        </div>
      </div>
    </div>
  )
}

function StatBadge({ icon, value, label, color, format }: {
  icon: string; value: number; label: string; color: string; format?: string
}) {
  const displayValue = format === 'currency'
    ? `₹${(value / 100000).toFixed(1)}L`
    : format === 'score'
      ? `${Math.round(value)}/100`
      : value.toLocaleString('en-IN')

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <use href={`#${icon}`} />
      </svg>
      <div>
        <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, lineHeight: 1 }}>{displayValue}</span>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--space-3)' }}>
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.id}
            className="card-feature"
            onClick={() => onAction(action.id)}
            style={{ cursor: 'pointer', textAlign: 'left', padding: 'var(--space-4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)' }}
            aria-label={action.label}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 'var(--space-2)' }}>
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

function CrmKpiCards({ kpis, loading }: { kpis: CrmKpi[]; loading: boolean }) {
  const formatValue = (kpi: CrmKpi) => {
    if (loading) return '---'
    switch (kpi.format) {
      case 'currency': return `₹${(kpi.value / 100000).toFixed(1)}L`
      case 'percent': return `${kpi.value}%`
      case 'score': return `${Math.round(kpi.value)}/100`
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
    red: 'kpi-accent-red',
  }

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
        CRM KPIs
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
        {kpis.slice(0, 8).map(kpi => (
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

function PlaceholderSection({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 'var(--space-4)', opacity: 0.4 }}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
      <h3 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', maxWidth: 480, marginInline: 'auto' }}>{description}</p>
    </div>
  )
}
