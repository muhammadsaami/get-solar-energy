import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../../services/admin.service'
import { crmService } from '../../services/crm.service'
import type { AdminKpi, AdminDashboardData } from '../admin/admin.types'
import type { CrmPipelineMetrics, CrmCustomer } from '../crm/crm.types'
import type { BIFilterState, BIDashboardData } from './bi.types'
import BIFilterBar from './BIFilterBar'
import BICharts from './BICharts'
import BIExportBar from './BIExportBar'

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
  total_system_value: '/app/admin/dashboard',
  active_leads: '/app/crm/leads',
  avg_payback: '/app/roi-calculator',
}

const HEAD_KPIS = ['total_customers', 'total_system_value', 'active_leads', 'avg_payback']

const KPI_ACCENT: Record<string, string> = {
  total_customers: 'accent-blue',
  total_system_value: 'accent-orange',
  active_leads: 'accent-green',
  avg_payback: 'accent-teal',
}

function formatKpiValue(kpi: AdminKpi): string {
  switch (kpi.format) {
    case 'currency': return `₹${(kpi.value / 100000).toFixed(1)}L`
    case 'percent': return `${kpi.value}%`
    case 'years': return `${kpi.value}yr`
    case 'kw': return `${kpi.value}kW`
    default: return kpi.value.toLocaleString('en-IN')
  }
}

export default function BusinessIntelligencePage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<BIFilterState>(INITIAL_FILTERS)
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null)
  const [pipelineMetrics, setPipelineMetrics] = useState<CrmPipelineMetrics | null>(null)
  const [customers, setCustomers] = useState<CrmCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  if (loading && !adminData) {
    return (
      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div className="skeleton-loader" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
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
    <div className="ew-page">
      <header className="tab-header-block">
        <div>
          <h2 className="tab-heading">Business Intelligence</h2>
          <p className="tab-subheading">
            Answer the key questions: are we improving, where are we losing customers, and which region performs best.
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
          {loading ? 'Syncing...' : 'Sync Analytics'}
        </button>
      </header>

      <section aria-label="Executive Summary" className="card-grid-4">
        {HEAD_KPIS.map(id => {
          const kpi = kpis.find(k => k.id === id)
          if (!kpi) return null
          return (
            <div
              key={kpi.id}
              className={`card-metric ${KPI_ACCENT[kpi.id] ?? 'accent-blue'}`}
              onClick={() => handleKpiClick(kpi.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleKpiClick(kpi.id)}
              aria-label={`${kpi.label}: ${formatKpiValue(kpi)}`}
            >
              <div className="card-metric-value">{loading ? '—' : formatKpiValue(kpi)}</div>
              <div className="card-metric-label">{kpi.label}</div>
              {kpi.change != null && (
                <div className={`card-metric-change ${kpi.change >= 0 ? 'positive' : 'negative'}`}>
                  {kpi.change >= 0 ? '↑' : '↓'} {kpi.change >= 0 ? '+' : ''}{kpi.change}%
                </div>
              )}
            </div>
          )
        })}
      </section>

      <BIFilterBar filters={filters} onChange={setFilters} data={bidData} />

      <BIExportBar data={bidData} />

      <div>
        <SectionHeader title="Charts" subtitle="Each chart answers one business question" />
        <BICharts data={bidData} filters={filters} onNavigate={path => path && navigate(path)} />
      </div>

      <div>
        <SectionHeader title="Key Insights" subtitle="What the data says right now" />
        <BusinessInsightsSection data={adminData} loading={loading} />
      </div>

      <div>
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
    <div className="ew-divider-head">
      <h2 className="ew-divider-title">{title}</h2>
      {subtitle && <span className="ew-divider-sub">{subtitle}</span>}
    </div>
  )
}

const INSIGHT_DEFS: { key: string; label: string }[] = [
  { key: 'highest_bill_customer', label: 'Highest monthly bill' },
  { key: 'highest_savings_customer', label: 'Highest projected savings' },
  { key: 'fastest_payback', label: 'Fastest payback' },
  { key: 'largest_project_value', label: 'Largest project value' },
  { key: 'highest_roi', label: 'Highest ROI' },
  { key: 'most_common_city', label: 'Most served city' },
]

function BusinessInsightsSection({ data, loading }: { data: AdminDashboardData | null; loading: boolean }) {
  const insights = data?.insights as Record<string, unknown> | undefined

  if (loading) {
    return (
      <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-loader" style={{ height: 56, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      </div>
    )
  }

  const rows = INSIGHT_DEFS
    .map(d => ({ ...d, value: insights?.[d.key] }))
    .filter(r => r.value != null && String(r.value) !== '')

  return (
    <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
      {rows.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', padding: 'var(--space-4)' }}>
          No insights available yet
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
          {rows.map(row => (
            <div key={row.key} style={{ padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 4 }}>{row.label}</div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{String(row.value)}</div>
            </div>
          ))}
        </div>
      )}
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
    'Qualified': '#17a8e5', 'Negotiation': '#fbbf24', 'Closed': '#36d399',
  }
  const bgMap: Record<string, string> = {
    'Won': 'rgba(54,211,153,0.15)', 'Lost': 'rgba(239,68,68,0.15)', 'New Lead': 'rgba(23,168,229,0.15)',
    'Qualified': 'rgba(23,168,229,0.15)', 'Negotiation': 'rgba(251,191,36,0.15)', 'Closed': 'rgba(54,211,153,0.15)',
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
