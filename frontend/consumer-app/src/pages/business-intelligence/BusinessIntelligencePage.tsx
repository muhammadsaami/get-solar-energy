import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../../services/admin.service'
import { crmService } from '../../services/crm.service'
import type { AdminKpi, AdminPipeline, AdminDashboardData } from '../admin/admin.types'
import type { CrmPipelineMetrics, CrmCustomer } from '../crm/crm.types'
import type { BIFilterState, BIDashboardData } from './bi.types'
import BIFilterBar from './BIFilterBar'
import BICharts from './BICharts'
import BIExportBar from './BIExportBar'

const HOUR = new Date().getHours()
const GREETING = HOUR < 12 ? 'Morning' : HOUR < 18 ? 'Afternoon' : 'Evening'
const TODAY = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

const INITIAL_FILTERS: BIFilterState = {
  datePreset: '30d',
  dateRange: null,
  region: '',
  vendor: '',
  salesperson: '',
  segment: '',
  projectStatus: '',
}

const KPI_NAV_MAP: Record<string, string> = {
  total_customers: '/app/crm/leads',
  total_revenue: '',
  active_leads: '/app/crm/leads',
  conversion_rate: '/app/crm/leads',
  avg_deal_size: '/app/crm/leads',
  active_installations: '/app/admin/dashboard',
  pending_surveys: '/app/site-survey',
  avg_payback: '/app/roi-calculator',
  avg_system_size: '/app/roof-analysis',
  total_system_value: '/app/admin/dashboard',
  total_25yr_savings: '/app/roi-calculator',
  survey_approval_rate: '/app/site-survey',
  ai_conversations: '/app/enterprise-ai',
  cities_covered: '',
}

type SectionId = 'executive' | 'revenue' | 'customer' | 'funnel' | 'operations' | 'vendor' | 'geography' | 'forecast' | 'insights' | 'table'

const SECTION_NAV = [
  { id: 'executive' as SectionId, label: 'Executive' },
  { id: 'revenue' as SectionId, label: 'Revenue' },
  { id: 'customer' as SectionId, label: 'Customers' },
  { id: 'funnel' as SectionId, label: 'Funnel' },
  { id: 'operations' as SectionId, label: 'Operations' },
  { id: 'vendor' as SectionId, label: 'Vendors' },
  { id: 'geography' as SectionId, label: 'Geography' },
  { id: 'forecast' as SectionId, label: 'Forecast' },
  { id: 'insights' as SectionId, label: 'Insights' },
  { id: 'table' as SectionId, label: 'Table' },
]

function formatKpiValue(kpi: AdminKpi): string {
  switch (kpi.format) {
    case 'currency': return `₹${(kpi.value / 100000).toFixed(1)}L`
    case 'percent': return `${kpi.value}%`
    case 'years': return `${kpi.value}yr`
    case 'kw': return `${kpi.value}kW`
    default: return kpi.value.toLocaleString('en-IN')
  }
}

const ACCENT_CLASS: Record<string, string> = {
  blue: 'kpi-accent-blue', green: 'kpi-accent-green', orange: 'kpi-accent-orange',
  purple: 'kpi-accent-purple', cyan: 'kpi-accent-cyan', amber: 'kpi-accent-amber',
}

export default function BusinessIntelligencePage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<BIFilterState>(INITIAL_FILTERS)
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null)
  const [pipelineMetrics, setPipelineMetrics] = useState<CrmPipelineMetrics | null>(null)
  const [customers, setCustomers] = useState<CrmCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<SectionId>('executive')
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerSort, setCustomerSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'customerName', dir: 'asc' })
  const [customerPage, setCustomerPage] = useState(0)
  const PAGE_SIZE = 15

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashboard, pipeline, custList] = await Promise.all([
        adminService.getDashboard(),
        crmService.getPipelineMetrics(),
        crmService.getCustomers(0, 100),
      ])
      setAdminData(dashboard)
      setPipelineMetrics(pipeline)
      setCustomers(custList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Business Intelligence')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const bidData: BIDashboardData = useMemo(() => ({
    admin: adminData, pipeline: pipelineMetrics, customers, loading, error,
  }), [adminData, pipelineMetrics, customers, loading, error])

  const kpis = adminData?.kpis ?? []
  const pipeline = adminData?.pipeline
  const charts = adminData?.charts
  const vs = adminData?.vendorSummary ?? {}
  const ps = adminData?.projectSummary ?? {}
  const ss = adminData?.surveyStats ?? {}
  const filteredCustomers = useMemo(() => {
    let result = customers
    if (filters.region) {
      result = result.filter(c => c.city?.toLowerCase() === filters.region.toLowerCase())
    }
    if (filters.salesperson) {
      result = result.filter(c => c.salesperson?.toLowerCase() === filters.salesperson.toLowerCase())
    }
    if (filters.segment) {
      result = result.filter(c => {
        const score = c.leadScore ?? 50
        if (filters.segment === 'residential') return score < 60
        if (filters.segment === 'commercial') return score >= 60 && score < 80
        if (filters.segment === 'industrial') return score >= 80
        return true
      })
    }
    if (customerSearch) {
      const q = customerSearch.toLowerCase()
      result = result.filter(c =>
        c.customerName?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.discom?.toLowerCase().includes(q)
      )
    }
    const sorted = [...result].sort((a, b) => {
      const aVal = String(a[customerSort.key as keyof CrmCustomer] ?? '')
      const bVal = String(b[customerSort.key as keyof CrmCustomer] ?? '')
      return customerSort.dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
    return sorted
  }, [customers, filters, customerSearch, customerSort])

  const paginatedCustomers = useMemo(() => {
    return filteredCustomers.slice(customerPage * PAGE_SIZE, (customerPage + 1) * PAGE_SIZE)
  }, [filteredCustomers, customerPage])

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE))

  const handleSort = (key: string) => {
    setCustomerSort(prev => ({
      key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleKpiClick = (kpiId: string) => {
    const route = KPI_NAV_MAP[kpiId]
    if (route) navigate(route)
  }

  const navigateTo = (path: string) => {
    if (path) navigate(path)
  }

  const scrollToSection = (id: SectionId) => {
    setActiveSection(id)
    const el = document.getElementById(`bi-section-${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading && !adminData) {
    return (
      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div className="skeleton-loader" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton-loader" style={{ height: 60, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton-loader" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton-loader" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
      </div>
    )
  }

  if (error && !adminData) {
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
      <HeroSection loading={loading} adminData={adminData} onRefresh={load} />

      <SectionNav activeSection={activeSection} onNavigate={scrollToSection} />

      <BIFilterBar filters={filters} onChange={setFilters} data={bidData} />

      <BIExportBar data={bidData} />

      <div id="bi-section-executive">
        <ExecutiveSummary kpis={kpis} loading={loading} onKpiClick={handleKpiClick} />
      </div>

      <div id="bi-section-revenue">
        <SectionHeader title="Revenue Analytics" subtitle="Trend, distribution and top performers" />
        <BICharts data={bidData} filters={filters} onNavigate={navigateTo} />
      </div>

      <div id="bi-section-customer">
        <SectionHeader title="Customer Intelligence" subtitle="Growth, segmentation and acquisition" />
        <CustomerIntelligenceSection data={bidData} loading={loading} />
      </div>

      <div id="bi-section-funnel">
        <SectionHeader title="Sales Funnel Analytics" subtitle="Conversion, velocity and stage metrics" />
        <FunnelMetricsSection pipeline={pipeline} loading={loading} pipelineMetrics={pipelineMetrics} />
      </div>

      <div id="bi-section-operations">
        <SectionHeader title="Solar Operations" subtitle="Surveys, proposals, installations and AMC" />
        <OperationsSection
          vs={vs} ps={ps} ss={ss}
          loading={loading}
          onNavigate={navigateTo}
        />
      </div>

      <div id="bi-section-vendor">
        <SectionHeader title="Vendor Intelligence" subtitle="Workload, completion and quality" />
        <VendorSection vs={vs} loading={loading} onNavigate={navigateTo} />
      </div>

      <div id="bi-section-geography">
        <SectionHeader title="Geographic Intelligence" subtitle="Regional distribution" />
        <GeographySection geography={adminData?.geography ?? []} loading={loading} />
      </div>

      <div id="bi-section-forecast">
        <SectionHeader title="Forecasting" subtitle="ML-driven projections" />
        <ForecastSection charts={charts} loading={loading} />
      </div>

      <div id="bi-section-insights">
        <SectionHeader title="AI Business Insights" subtitle="Intelligent recommendations and risks" />
        <AIInsightsSection data={adminData} loading={loading} />
      </div>

      <div id="bi-section-table">
        <SectionHeader title="Customer Directory" subtitle={`${filteredCustomers.length} customers`} />
        <CustomerTableSection
          customers={paginatedCustomers}
          total={filteredCustomers.length}
          search={customerSearch}
          onSearchChange={v => { setCustomerSearch(v); setCustomerPage(0) }}
          sort={customerSort}
          onSort={handleSort}
          page={customerPage}
          totalPages={totalPages}
          onPageChange={setCustomerPage}
          loading={loading}
          onRowClick={(id) => navigate(`/app/crm/leads?customer=${id}`)}
        />
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
      <nav style={{ display: 'flex', gap: 'var(--space-1)' }} aria-label="Business Intelligence sections">
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

function HeroSection({ loading, adminData, onRefresh }: {
  loading: boolean; adminData: AdminDashboardData | null; onRefresh: () => void
}) {
  const cc = adminData?.commandCenter
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
              Business Intelligence &middot; Executive Analytics Platform &middot; {TODAY}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            {adminData?.fetchTime && (
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                Last sync: {new Date(adminData.fetchTime).toLocaleTimeString()}
              </span>
            )}
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
          <StatBadge icon="icon-users" value={adminData?.overview?.total_customers ?? 0} label="Total Customers" color="var(--color-blue)" />
          <StatBadge icon="icon-trending-up" value={cc?.totalLeads30d ?? 0} label="Active Leads" color="var(--color-orange)" />
          <StatBadge icon="icon-hard-drive" value={cc?.installationsPending ?? 0} label="Active Installations" color="var(--color-cyan)" />
          <StatBadge icon="icon-clipboard" value={cc?.surveysPending ?? 0} label="Pending Surveys" color="var(--color-purple)" />
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

function ExecutiveSummary({ kpis, loading, onKpiClick }: {
  kpis: AdminKpi[]; loading: boolean; onKpiClick: (id: string) => void
}) {
  const DISPLAY_KPIS = ['total_customers', 'total_revenue', 'active_leads', 'conversion_rate', 'avg_deal_size', 'active_installations', 'pending_surveys', 'avg_payback', 'avg_system_size', 'total_system_value', 'total_25yr_savings', 'survey_approval_rate', 'ai_conversations', 'cities_covered']

  const sorted = DISPLAY_KPIS.map(id => kpis.find(k => k.id === id)).filter(Boolean) as AdminKpi[]

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
        Executive Summary
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
        {sorted.map(kpi => (
          <div key={kpi.id} className={`card-metric ${ACCENT_CLASS[kpi.accent] || ''}`}
            onClick={() => onKpiClick(kpi.id)}
            role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onKpiClick(kpi.id)}
            style={{ padding: 'var(--space-4)', cursor: KPI_NAV_MAP[kpi.id] ? 'pointer' : 'default', transition: 'transform 0.15s' }}
            title={KPI_NAV_MAP[kpi.id] ? `Click to navigate` : undefined}
            aria-label={`${kpi.label}: ${formatKpiValue(kpi)}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <use href={`#${kpi.icon}`} />
              </svg>
              <span className="kpi-title" style={{ fontSize: 'var(--font-size-xs)' }}>{kpi.label}</span>
            </div>
            <div className="kpi-value-block">
              <span className="kpi-value" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>
                {loading ? '---' : formatKpiValue(kpi)}
              </span>
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

function CustomerIntelligenceSection({ data, loading }: { data: BIDashboardData; loading: boolean }) {
  const admin = data.admin
  const stats = admin?.overview

  const metrics = [
    { label: 'Total Customers', value: stats?.total_customers ?? 0, color: 'var(--color-blue)' },
    { label: 'Bills Analyzed', value: stats?.bills_analyzed ?? 0, color: 'var(--color-green)' },
    { label: 'Avg Monthly Bill', value: stats?.avg_bill ? `₹${Number(stats.avg_bill).toLocaleString('en-IN')}` : 'N/A', color: 'var(--color-orange)' },
    { label: 'Avg System Size', value: stats?.avg_system_size ? `${stats.avg_system_size} kW` : 'N/A', color: 'var(--color-cyan)' },
    { label: 'Avg Payback', value: stats?.avg_payback ? `${stats.avg_payback} yr` : 'N/A', color: 'var(--color-purple)' },
    { label: 'Cities Covered', value: stats?.cities ?? 0, color: 'var(--color-amber)' },
  ]

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton-loader" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
          {metrics.map(m => (
            <div key={m.label} style={{ padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: m.color }}>{typeof m.value === 'number' ? m.value.toLocaleString('en-IN') : m.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FunnelMetricsSection({ pipeline, loading, pipelineMetrics }: {
  pipeline: AdminPipeline | undefined; loading: boolean; pipelineMetrics: CrmPipelineMetrics | null
}) {
  const pm = pipelineMetrics || pipeline

  if (loading) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton-loader" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      </div>
    )
  }

  const metrics = [
    { label: 'Total Leads', value: pm?.totalLeads, fmt: 'number', color: 'var(--color-blue)' },
    { label: 'Pipeline Value', value: pm?.pipelineValue, fmt: 'currency', color: 'var(--color-green)' },
    { label: 'Win Rate', value: pm?.winRate, fmt: 'percent', color: 'var(--color-purple)' },
    { label: 'Avg Deal Size', value: pm?.avgDealSize, fmt: 'currency', color: 'var(--color-orange)' },
    { label: 'Avg Lead Score', value: pm?.avgLeadScore, fmt: 'score', color: 'var(--color-cyan)' },
    { label: 'Avg Health Score', value: pm?.avgHealthScore, fmt: 'score', color: 'var(--color-amber)' },
  ]

  const formatVal = (val: number | undefined, fmt: string) => {
    if (val == null) return 'N/A'
    switch (fmt) {
      case 'currency': return `₹${(val / 100000).toFixed(2)}L`
      case 'percent': return `${val}%`
      case 'score': return `${val}/100`
      default: return val.toLocaleString('en-IN')
    }
  }

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
        {metrics.map(m => (
          <div key={m.label} style={{ padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: m.color }}>{formatVal(m.value, m.fmt)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OperationsSection({ vs, ps, ss, loading, onNavigate }: {
  vs: Record<string, number>; ps: Record<string, number>; ss: Record<string, number>; loading: boolean; onNavigate: (path: string) => void
}) {
  const items = [
    { label: 'Total Surveys', value: vs.totalSurveys ?? ss.total ?? 0, color: 'var(--color-blue)', route: '/app/site-survey' },
    { label: 'Approved Surveys', value: vs.approvedSurveys ?? ss.approved ?? 0, color: 'var(--color-green)', route: '/app/site-survey' },
    { label: 'Pending Surveys', value: (ss.total ?? 0) - (ss.approved ?? 0), color: 'var(--color-orange)', route: '/app/site-survey' },
    { label: 'Total Installations', value: vs.totalInstallations ?? 0, color: 'var(--color-cyan)', route: '' },
    { label: 'Active Installations', value: vs.activeInstallations ?? 0, color: 'var(--color-purple)', route: '' },
    { label: 'Pending Tasks', value: vs.pendingTasks ?? 0, color: 'var(--color-amber)', route: '' },
    { label: 'Total Projects', value: ps.total ?? 0, color: 'var(--color-blue)', route: '' },
    { label: 'Active Projects', value: ps.active ?? 0, color: 'var(--color-green)', route: '' },
    { label: 'Completed', value: ps.completed ?? 0, color: 'var(--color-green)', route: '' },
    { label: 'At Risk', value: ps.atRisk ?? 0, color: 'var(--color-red)', route: '' },
    { label: 'Avg Progress', value: ps.avgProgress ? `${ps.avgProgress}%` : '0%', color: 'var(--color-orange)', route: '' },
    { label: 'Avg Health', value: ps.avgHealth ? `${ps.avgHealth}/100` : 'N/A', color: 'var(--color-purple)', route: '' },
  ]

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton-loader" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
          {items.map(item => (
            <div key={item.label}
              onClick={() => item.route && onNavigate(item.route)}
              role={item.route ? 'button' : undefined}
              tabIndex={item.route ? 0 : undefined}
              onKeyDown={e => e.key === 'Enter' && item.route && onNavigate(item.route)}
              style={{
                padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                cursor: item.route ? 'pointer' : 'default', transition: 'transform 0.15s',
              }}>
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

function VendorSection({ vs, loading, onNavigate }: {
  vs: Record<string, number>; loading: boolean; onNavigate: (path: string) => void
}) {
  const items = [
    { label: 'Total Surveys', value: vs.totalSurveys ?? 0, color: 'var(--color-blue)', route: '/app/site-survey' },
    { label: 'Active Surveys', value: vs.activeSurveys ?? 0, color: 'var(--color-orange)', route: '/app/site-survey' },
    { label: 'Approved Surveys', value: vs.approvedSurveys ?? 0, color: 'var(--color-green)', route: '/app/site-survey' },
    { label: 'Total Installations', value: vs.totalInstallations ?? 0, color: 'var(--color-cyan)', route: '/app/vendor' },
    { label: 'Active Installations', value: vs.activeInstallations ?? 0, color: 'var(--color-purple)', route: '/app/vendor' },
    { label: 'Pending Tasks', value: vs.pendingTasks ?? 0, color: 'var(--color-amber)', route: '/app/vendor' },
  ]

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton-loader" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
          {items.map(item => (
            <div key={item.label}
              onClick={() => item.route && onNavigate(item.route)}
              role={item.route ? 'button' : undefined}
              tabIndex={item.route ? 0 : undefined}
              onKeyDown={e => e.key === 'Enter' && item.route && onNavigate(item.route)}
              style={{
                padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                cursor: item.route ? 'pointer' : 'default',
              }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: item.color }}>
                {item.value.toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function GeographySection({ geography, loading }: {
  geography: Record<string, unknown>[]; loading: boolean
}) {
  if (loading) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-loader" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      </div>
    )
  }

  if (!geography.length) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
        Geographic data not available
      </div>
    )
  }

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
        {geography.slice(0, 8).map((g, i) => {
          const row = g as Record<string, unknown>
          return (
            <div key={i} style={{ padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-orange)', marginBottom: 2 }}>
                {String(row.city || 'Unknown')}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {String(row.customer_count ?? 0)} customers
              </div>
              {row.total_system_value != null && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  ₹{Number(row.total_system_value).toLocaleString('en-IN')}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ForecastSection({ charts, loading }: {
  charts: AdminDashboardData['charts'] | undefined; loading: boolean
}) {
  const forecast = charts?.forecasting as Record<string, unknown> | undefined

  if (loading) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        <div className="skeleton-loader" style={{ height: 120, borderRadius: 'var(--radius-md)' }} />
      </div>
    )
  }

  if (!forecast || Object.keys(forecast).length === 0) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
        Forecast unavailable — backend support required
      </div>
    )
  }

  const items = [
    { label: 'Expected Monthly Revenue', key: 'expected_monthly_revenue', fmt: 'currency' },
    { label: 'Expected Customer Growth', key: 'expected_customer_growth', fmt: 'number' },
    { label: 'Expected Installed Capacity', key: 'expected_installed_capacity', fmt: 'kw' },
    { label: 'Expected Savings', key: 'expected_savings', fmt: 'currency' },
    { label: 'Projected Annual Revenue', key: 'projected_annual_revenue', fmt: 'currency' },
  ] as const

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
        {items.map(item => {
          const val = forecast[item.key] as number | undefined
          return (
            <div key={item.key} style={{ padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-orange)' }}>
                {val == null ? 'N/A' : item.fmt === 'currency'
                  ? `₹${(val / 100000).toFixed(1)}L`
                  : item.fmt === 'kw'
                    ? `${val.toFixed(1)} kW`
                    : val.toLocaleString('en-IN')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AIInsightsSection({ data, loading }: { data: AdminDashboardData | null; loading: boolean }) {
  const cc = data?.commandCenter
  const pipeline = data?.pipeline

  if (loading) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-loader" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
        <InsightCard icon="icon-trending-up" title="Revenue Forecast"
          description={cc?.executiveSummary || 'Analyzing revenue trends across all active deals and pipeline stages.'}
          color="var(--color-green)" />
        <InsightCard icon="icon-shield" title="Proposal Conversion"
          description={`Current win rate: ${pipeline?.winRate ?? 0}%. ${(pipeline?.winRate ?? 0) >= 50 ? 'Conversion is healthy.' : 'Opportunity to improve proposal follow-up.'}`}
          color="var(--color-purple)" />
        <InsightCard icon="icon-alert-triangle" title="Customer Health"
          description={`${pipeline?.totalLeads ?? 0} active leads. Avg health score: ${pipeline?.avgHealthScore ?? 0}/100. ${(pipeline?.avgHealthScore ?? 0) < 70 ? 'Some accounts need attention.' : 'Customer health is stable.'}`}
          color="var(--color-amber)" />
        <InsightCard icon="icon-hard-drive" title="Installation Pipeline"
          description={`${data?.vendorSummary?.activeInstallations ?? 0} active installations. ${data?.projectSummary?.atRisk ?? 0} at-risk projects requiring intervention.`}
          color="var(--color-cyan)" />
        <InsightCard icon="icon-clock" title="Today's Summary"
          description={`${cc?.totalLeads30d ?? 0} total leads. ${cc?.surveysPending ?? 0} surveys pending. ${cc?.installationsPending ?? 0} installations in progress.`}
          color="var(--color-orange)" />
        <InsightCard icon="icon-users" title="Customer Base"
          description={`${data?.overview?.total_customers ?? 0} total customers across ${data?.overview?.cities ?? 0} cities. ${data?.overview?.bills_analyzed ?? 0} bills analyzed.`}
          color="var(--color-blue)" />
      </div>
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

function CustomerTableSection({ customers, total, search, onSearchChange, sort, onSort, page, totalPages, onPageChange, loading, onRowClick }: {
  customers: CrmCustomer[]; total: number; search: string; onSearchChange: (v: string) => void
  sort: { key: string; dir: 'asc' | 'desc' }; onSort: (key: string) => void
  page: number; totalPages: number; onPageChange: (p: number) => void; loading: boolean; onRowClick: (id: number) => void
}) {
  return (
    <div className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: 'var(--space-4) var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
        <input type="text" value={search} onChange={e => onSearchChange(e.target.value)}
          placeholder="Search customers by name, city or discom..."
          className="glass-input"
          aria-label="Search customers"
          style={{
            flex: 1, maxWidth: 360, padding: '8px 12px', fontSize: '12px', borderRadius: '6px',
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)',
          }} />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{total} customers</span>
      </div>

      {loading ? (
        <div style={{ padding: 'var(--space-4)' }}>
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton-loader" style={{ height: 40, marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : customers.length === 0 ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
          {search ? 'No customers match your search.' : 'No customer data available.'}
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }} role="grid" aria-label="Customer directory">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
                  {[
                    { key: 'customerName', label: 'Name' },
                    { key: 'city', label: 'City' },
                    { key: 'discom', label: 'DISCOM' },
                    { key: 'status', label: 'Status' },
                    { key: 'leadScore', label: 'Lead Score' },
                    { key: 'healthScore', label: 'Health' },
                  ].map(col => (
                    <th key={col.key} onClick={() => onSort(col.key)}
                      role="columnheader" aria-sort={sort.key === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                      style={{
                        padding: '10px 12px', textAlign: 'left', fontWeight: 600, cursor: 'pointer',
                        color: sort.key === col.key ? 'var(--color-orange)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap', userSelect: 'none',
                      }}>
                      {col.label} {sort.key === col.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} onClick={() => onRowClick(c.id)}
                    role="row" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onRowClick(c.id)}
                    style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.15s' }}
                    className="table-row-hover">
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{c.customerName}</td>
                    <td style={{ padding: '10px 12px' }}>{c.city || '-'}</td>
                    <td style={{ padding: '10px 12px' }}>{c.discom || '-'}</td>
                    <td style={{ padding: '10px 12px' }}><StatusBadge status={c.status} /></td>
                    <td style={{ padding: '10px 12px' }}><ScoreBadge score={c.leadScore} /></td>
                    <td style={{ padding: '10px 12px' }}><ScoreBadge score={c.healthScore} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--border-subtle)',
            fontSize: '11px', color: 'var(--text-muted)',
          }}>
            <span>Page {page + 1} of {totalPages}</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button disabled={page === 0} onClick={() => onPageChange(page - 1)}
                style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.4 : 1 }}>
                Previous
              </button>
              <button disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}
                style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', cursor: page >= totalPages - 1 ? 'default' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1 }}>
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    'Won': '#36d399', 'Lost': '#ef4444', 'New Lead': '#17a8e5',
    'Qualified': '#7c5dfa', 'Negotiation': '#fbbf24', 'Closed': '#06b6d4',
  }
  const bgMap: Record<string, string> = {
    'Won': 'rgba(54,211,153,0.15)', 'Lost': 'rgba(239,68,68,0.15)', 'New Lead': 'rgba(23,168,229,0.15)',
    'Qualified': 'rgba(124,93,250,0.15)', 'Negotiation': 'rgba(251,191,36,0.15)', 'Closed': 'rgba(6,182,212,0.15)',
  }
  return (
    <span style={{
      padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
      background: bgMap[status] || 'rgba(255,255,255,0.05)',
      color: colorMap[status] || 'var(--text-secondary)',
    }}>
      {status}
    </span>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? '#36d399' : score >= 40 ? '#fbbf24' : '#ef4444'
  return <span style={{ fontWeight: 600, color }}>{score}/100</span>
}
