import { useState, useEffect, useCallback, useMemo } from 'react'
import { crmService } from '../../services/crm.service'
import type { CrmCustomer } from './crm.types'

interface Props {
  onSelectCustomer: (id: number) => void
}

const PAGE_SIZE = 20

const STAGE_LABELS: Record<string, string> = {
  'New Lead': 'New',
  Qualified: 'Qual',
  'Site Survey Scheduled': 'Survey',
  'Survey Completed': 'Done',
  'Proposal Generated': 'PropGen',
  'Proposal Sent': 'PropSent',
  Negotiation: 'Neg',
  Won: 'Won',
  Closed: 'Closed',
  Lost: 'Lost',
}

const STAGE_COLORS: Record<string, string> = {
  'New Lead': 'var(--color-blue)',
  Qualified: 'var(--color-blue)',
  'Site Survey Scheduled': 'var(--color-amber)',
  'Survey Completed': 'var(--color-green)',
  'Proposal Generated': 'var(--color-orange)',
  'Proposal Sent': 'var(--color-blue)',
  Negotiation: 'var(--color-orange)',
  Won: 'var(--color-green)',
  Closed: 'var(--color-muted)',
  Lost: 'var(--color-red)',
}

export default function CrmCustomerTable({ onSelectCustomer }: Props) {
  const [customers, setCustomers] = useState<CrmCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<string>('id')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = search
        ? await crmService.searchCustomers(search)
        : await crmService.getCustomers(page * PAGE_SIZE, PAGE_SIZE)
      setCustomers(data)
    } catch {
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    let list = [...customers]
    if (statusFilter) {
      list = list.filter(c => c.status === statusFilter)
    }
    list.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortField]
      const bVal = (b as unknown as Record<string, unknown>)[sortField]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      const aStr = String(aVal ?? '')
      const bStr = String(bVal ?? '')
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })
    return list
  }, [customers, statusFilter, sortField, sortDir])

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>
    return <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return 'var(--color-green)'
    if (score >= 50) return 'var(--color-amber)'
    return 'var(--color-red)'
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search customers by name, number, or city..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            style={{
              width: '100%', padding: 'var(--space-2) var(--space-2) var(--space-2) var(--space-6)',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
              fontSize: 'var(--font-size-sm)',
            }}
            aria-label="Search customers"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)',
          }}
          aria-label="Filter by status"
        >
          <option value="">All Stages</option>
          <option value="New Lead">New Lead</option>
          <option value="Qualified">Qualified</option>
          <option value="Site Survey Scheduled">Survey Scheduled</option>
          <option value="Proposal Sent">Proposal Sent</option>
          <option value="Negotiation">Negotiation</option>
          <option value="Won">Won</option>
          <option value="Lost">Lost</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%', borderCollapse: 'collapse',
          fontSize: 'var(--font-size-sm)',
        }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)', position: 'sticky', top: 0 }}>
              {['customerName', 'leadScore', 'healthScore', 'status', 'salesperson', 'pipelineValue', 'expectedRevenue', 'lastActivity'].map(field => (
                <th
                  key={field}
                  onClick={() => toggleSort(field)}
                  style={{
                    padding: 'var(--space-2) var(--space-3)', textAlign: 'left',
                    cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600,
                    borderBottom: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {field === 'customerName' ? 'Customer' :
                   field === 'leadScore' ? 'Lead' :
                   field === 'healthScore' ? 'Health' :
                   field === 'status' ? 'Stage' :
                   field === 'salesperson' ? 'Owner' :
                   field === 'pipelineValue' ? 'Pipeline ₹' :
                   field === 'expectedRevenue' ? 'Exp Rev ₹' : 'Activity'}
                  <SortIcon field={field} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} style={{ padding: 'var(--space-3)' }}>
                      <div className="skeleton-loader" style={{ height: 16, borderRadius: 4 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                  No customers found
                </td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr
                  key={c.id}
                  onClick={() => onSelectCustomer(c.id)}
                  style={{
                    cursor: 'pointer', transition: 'background var(--transition-fast)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  tabIndex={0}
                  role="button"
                  aria-label={`View ${c.customerName}`}
                  onKeyDown={e => { if (e.key === 'Enter') onSelectCustomer(c.id) }}
                >
                  <td style={{ padding: 'var(--space-3)' }}>
                    <div style={{ fontWeight: 600 }}>{c.customerName}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{c.consumerNumber} · {c.city}</div>
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <span style={{ color: scoreColor(c.leadScore), fontWeight: 600 }}>{c.leadScore}</span>
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <span style={{ color: scoreColor(c.healthScore), fontWeight: 600 }}>{c.healthScore}</span>
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--font-size-xs)', fontWeight: 600,
                      background: `${STAGE_COLORS[c.status] || 'var(--text-muted)'}20`,
                      color: STAGE_COLORS[c.status] || 'var(--text-muted)',
                    }}>
                      {STAGE_LABELS[c.status] || c.status}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3)', color: 'var(--text-secondary)' }}>
                    {c.salesperson || '—'}
                  </td>
                  <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>
                    ₹{(c.pipelineValue / 100000).toFixed(1)}L
                  </td>
                  <td style={{ padding: 'var(--space-3)', color: 'var(--text-secondary)' }}>
                    ₹{(c.expectedRevenue / 100000).toFixed(2)}L
                  </td>
                  <td style={{ padding: 'var(--space-3)', color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
                    {c.lastActivity ? new Date(c.lastActivity).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!search && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          <button
            className="btn btn-outline btn-sm"
            disabled={page === 0 || loading}
            onClick={() => setPage(p => Math.max(0, p - 1))}
          >
            Previous
          </button>
          <span style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Page {page + 1}
          </span>
          <button
            className="btn btn-outline btn-sm"
            disabled={customers.length < PAGE_SIZE || loading}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
