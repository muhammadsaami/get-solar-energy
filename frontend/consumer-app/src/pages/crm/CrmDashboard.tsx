import { useState } from 'react'
import { useCrmPipelineMetrics, useCrmAlerts } from './useCrmQueries'
import CrmPipelineBoard from './CrmPipelineBoard'
import CrmCustomerTable from './CrmCustomerTable'
import CrmCustomer360 from './CrmCustomer360'
import CrmTasksPanel from './CrmTasksPanel'
import CrmMeetingsPanel from './CrmMeetingsPanel'
import CrmFollowupsPanel from './CrmFollowupsPanel'
import CrmCommunicationsPanel from './CrmCommunicationsPanel'
import CrmAlertsPanel from './CrmAlertsPanel'
import CrmProposalTracking from './CrmProposalTracking'

/* Frozen-token accent mapping (no purple/violet/cyan) */
const ACCENT_CLASS: Record<string, string> = {
  blue: 'accent-blue',
  green: 'accent-green',
  orange: 'accent-orange',
  amber: 'accent-orange',
  cyan: 'accent-blue',
  purple: 'accent-blue',
  red: 'accent-red',
}

/* Headline KPIs above the fold (max 4): Customers / Leads / Pipeline / Revenue */
const HEAD_KPIS = [
  { id: 'pipeline_value', label: 'Pipeline Value', accent: 'green' },
  { id: 'active_leads', label: 'Active Leads', accent: 'blue' },
  { id: 'avg_deal_size', label: 'Avg Deal Size', accent: 'orange' },
  { id: 'win_rate', label: 'Win Rate', accent: 'blue' },
]

/* Primary workspaces (customers, leads, pipeline, follow-ups first) */
const CRM_TABS = [
  { id: 'pipeline', label: 'Pipeline Board' },
  { id: 'customers', label: 'Customer Directory' },
  { id: 'followups', label: 'Follow-ups' },
  { id: 'tasks', label: 'Task Queue' },
  { id: 'meetings', label: 'Site Visits' },
  { id: 'proposals', label: 'Proposals' },
  { id: 'communications', label: 'Communications' },
]

function formatKpi(kpi: { id: string; label: string }, metrics: { pipelineValue: number; totalLeads: number; avgDealSize: number; winRate: number } | null): string {
  if (!metrics) return '—'
  switch (kpi.id) {
    case 'pipeline_value': return `₹${(metrics.pipelineValue / 100000).toFixed(1)}L`
    case 'active_leads': return metrics.totalLeads.toLocaleString('en-IN')
    case 'avg_deal_size': return `₹${(metrics.avgDealSize / 100000).toFixed(2)}L`
    case 'win_rate': return `${metrics.winRate}%`
    default: return '—'
  }
}

export default function CrmDashboardPage() {
  const [activeTab, setActiveTab] = useState('pipeline')
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)

  const { data: metrics, isLoading: loading, error, refetch } = useCrmPipelineMetrics()
  const { data: alerts = [] } = useCrmAlerts()

  const openCustomer = (id: number) => setSelectedCustomerId(id)

  if (error && !metrics) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <div className="ew-workbench-card" style={{ padding: 'var(--space-8)', maxWidth: 480, margin: '0 auto' }}>
          <h3 style={{ margin: '0 0 var(--space-2)' }}>CRM Unavailable</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', margin: '0 0 var(--space-4)' }}>{error?.message}</p>
          <button className="btn btn-primary" onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="ew-page">
      {/* ════════════════════════════════════════════════════════════
          1. HERO — page title, one sentence, primary action
          ════════════════════════════════════════════════════════════ */}
      <header className="tab-header-block">
        <div>
          <h2 className="tab-heading">CRM &amp; Customers</h2>
          <p className="tab-subheading">
            Manage customers, leads, pipeline, and follow-ups in one place.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => refetch()}
          disabled={loading}
          style={{ whiteSpace: 'nowrap' }}
        >
          <span style={{ display: 'inline-flex', marginRight: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </span>
          {loading ? 'Syncing...' : 'Sync Pipeline'}
        </button>
      </header>

      {/* ════════════════════════════════════════════════════════════
          2. HEADLINE KPIs ABOVE THE FOLD (max 4, shared classes)
          ════════════════════════════════════════════════════════════ */}
      <section aria-label="Key Metrics" className="card-grid-4">
        {HEAD_KPIS.map(kpi => (
          <div key={kpi.id} className={`card-metric ${ACCENT_CLASS[kpi.accent] ?? 'accent-blue'}`}>
            <div className="card-metric-label">{kpi.label}</div>
            <div className="card-metric-value">{formatKpi(kpi, metrics ?? null)}</div>
          </div>
        ))}
      </section>

      {/* ════════════════════════════════════════════════════════════
          3. ATTENTION STRIP — who needs follow-up right now
          ════════════════════════════════════════════════════════════ */}
      <section className="ew-workbench-card" aria-label="Needs Attention">
        <div className="ew-workbench-header">
          <div className="ew-workbench-title">Needs Attention</div>
          <span className={`ew-section-chip ${alerts.some(a => a.severity === 'Critical') ? 'red' : 'amber'}`}>
            {alerts.filter(a => a.severity === 'Critical').length} critical · {alerts.filter(a => a.severity === 'Warning').length} warnings
          </span>
        </div>
        <div style={{ padding: 'var(--space-3)' }}>
          <CrmAlertsPanel alerts={alerts} onSelectCustomer={(id) => { openCustomer(id); setActiveTab('customers') }} />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          4. MAIN WORKBENCH — tabbed operational workspaces
          ════════════════════════════════════════════════════════════ */}
      <div className="ew-workbench-card">
        <div className="ew-workbench-header">
          <div className="ew-workbench-title">CRM Operational Workspace</div>
          <div className="ew-tab-bar" style={{ background: 'transparent', border: 'none', padding: 0 }}>
            {CRM_TABS.map(tab => (
              <button
                key={tab.id}
                className={`ew-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{ fontSize: 11, padding: '5px 10px' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: 'var(--space-4)' }}>
          {activeTab === 'pipeline' && <CrmPipelineBoard metrics={metrics ?? null} loading={loading} />}
          {activeTab === 'customers' && <CrmCustomerTable onSelectCustomer={openCustomer} />}
          {activeTab === 'followups' && <CrmFollowupsPanel />}
          {activeTab === 'tasks' && <CrmTasksPanel />}
          {activeTab === 'meetings' && <CrmMeetingsPanel />}
          {activeTab === 'proposals' && <CrmProposalTracking />}
          {activeTab === 'communications' && <CrmCommunicationsPanel />}
        </div>
      </div>

      {/* Customer 360 Drawer (opens from directory / alerts) */}
      <CrmCustomer360 customerId={selectedCustomerId} onClose={() => setSelectedCustomerId(null)} />
    </div>
  )
}
