import { useMemo } from 'react'
import type { AuditEvent, AuditFilterState, AuditSeverity } from './audit.types'

interface AuditTrailTableProps {
  events: AuditEvent[]
  filters: AuditFilterState
  onSort: (key: string) => void
  page: number
  onPageChange: (p: number) => void
  loading: boolean
  onSelect: (event: AuditEvent) => void
}

const PAGE_SIZE = 25

function shortTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return ts
  }
}

const SEVERITY_META: Record<AuditSeverity, { color: string; bg: string }> = {
  critical: { color: '#f43f5e', bg: 'rgba(244,63,94,0.15)' },
  warning: { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  success: { color: '#36d399', bg: 'rgba(54,211,153,0.15)' },
  info: { color: '#17a8e5', bg: 'rgba(23,168,229,0.15)' },
}

function SeverityBadge({ severity }: { severity: AuditSeverity }) {
  const meta = SEVERITY_META[severity]
  return (
    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: meta.bg, color: meta.color, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
      {severity}
    </span>
  )
}

export default function AuditTrailTable({ events, filters, onSort, page, onPageChange, loading, onSelect }: AuditTrailTableProps) {
  const filtered = useMemo(() => {
    let result = events
    if (filters.module) {
      result = result.filter(e => e.module?.toLowerCase() === filters.module.toLowerCase())
    }
    if (filters.user) {
      const q = filters.user.toLowerCase()
      result = result.filter(e => e.user?.toLowerCase().includes(q))
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(e =>
        e.action?.toLowerCase().includes(q) ||
        e.entityType?.toLowerCase().includes(q) ||
        e.detail?.toLowerCase().includes(q) ||
        e.user?.toLowerCase().includes(q) ||
        e.ipAddress?.toLowerCase().includes(q)
      )
    }
    if (filters.severity) {
      result = result.filter(e => e.severity === filters.severity)
    }
    return result
  }, [events, filters])

  const sortKey = filters.sortKey || 'timestamp'
  const sortDir = filters.sortDir || 'desc'
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = String((a as unknown as Record<string, unknown>)[sortKey] ?? '')
      const bVal = String((b as unknown as Record<string, unknown>)[sortKey] ?? '')
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
  }, [filtered, sortKey, sortDir])

  const totalFilteredPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalFilteredPages - 1)
  const paginated = sorted.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  const handleSort = (key: string) => onSort(key)
  const SORT_ARROW = (key: string) => sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

  const entityLabel = (e: AuditEvent): string => {
    const type = e.entityType || (e.source === 'activity' ? 'Customer' : '')
    const id = e.entityId != null ? e.entityId : null
    if (!type && id == null) return '—'
    return id != null ? `${type} #${id}` : type
  }

  return (
    <div className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }} role="grid" aria-label="Audit event log">
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)', position: 'sticky', top: 0, zIndex: 1 }}>
              {[
                { key: 'timestamp', label: 'Timestamp' },
                { key: 'severity', label: 'Severity' },
                { key: 'user', label: 'User' },
                { key: 'action', label: 'Action' },
                { key: 'module', label: 'Module' },
                { key: 'entityId', label: 'Entity' },
                { key: 'detail', label: 'Detail' },
              ].map(col => (
                <th key={col.key} onClick={() => handleSort(col.key)}
                  role="columnheader" aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                  style={{
                    padding: '10px 12px', textAlign: 'left', fontWeight: 600, cursor: 'pointer',
                    color: sortKey === col.key ? 'var(--color-orange)' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap', userSelect: 'none', fontSize: '11px',
                  }}>
                  {col.label}{SORT_ARROW(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 'var(--space-4)' }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-loader" style={{ height: 36, marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-md)' }} />)}
              </td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No events found.
              </td></tr>
            ) : (
              paginated.map(e => (
                <tr key={e.id}
                  onClick={() => onSelect(e)}
                  role="row" tabIndex={0}
                  onKeyDown={ev => ev.key === 'Enter' && onSelect(e)}
                  style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s', cursor: 'pointer' }}
                  className="table-row-hover">
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {shortTimestamp(e.timestamp)}
                  </td>
                  <td style={{ padding: '8px 12px' }}><SeverityBadge severity={e.severity} /></td>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>{e.user || 'System'}</td>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{e.action}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{e.module}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontSize: '11px', color: 'var(--text-secondary)' }}>{entityLabel(e)}</span>
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: '11px', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.detail || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && sorted.length > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--border-subtle)',
          fontSize: '11px', color: 'var(--text-muted)',
        }}>
          <span>{sorted.length} events</span>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <button disabled={currentPage === 0} onClick={() => onPageChange(currentPage - 1)}
              style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', cursor: currentPage === 0 ? 'default' : 'pointer', opacity: currentPage === 0 ? 0.4 : 1 }}>
              Previous
            </button>
            <span style={{ padding: '4px 0' }}>Page {currentPage + 1} of {totalFilteredPages}</span>
            <button disabled={currentPage >= totalFilteredPages - 1} onClick={() => onPageChange(currentPage + 1)}
              style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', cursor: currentPage >= totalFilteredPages - 1 ? 'default' : 'pointer', opacity: currentPage >= totalFilteredPages - 1 ? 0.4 : 1 }}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
