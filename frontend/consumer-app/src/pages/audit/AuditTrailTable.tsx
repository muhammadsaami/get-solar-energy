import { useMemo } from 'react'
import type { AuditLogEntry, AuditFilterState } from './audit.types'

interface AuditTrailTableProps {
  entries: AuditLogEntry[]
  filters: AuditFilterState
  onSort: (key: string) => void
  page: number
  totalPages: number
  onPageChange: (p: number) => void
  loading: boolean
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return ts
  }
}

function ActionBadge({ action }: { action: string }) {
  const isCritical = action.includes('delete') || action.includes('critical') || action.includes('failed')
  const isUpdate = action.includes('update') || action.includes('changed')
  const isCreate = action.includes('create') || action.includes('added')
  const color = isCritical ? '#ef4444' : isCreate ? '#36d399' : isUpdate ? '#fbbf24' : '#17a8e5'
  const bg = isCritical ? 'rgba(239,68,68,0.15)' : isCreate ? 'rgba(54,211,153,0.15)' : isUpdate ? 'rgba(251,191,36,0.15)' : 'rgba(23,168,229,0.15)'
  return (
    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: bg, color, whiteSpace: 'nowrap' }}>
      {action}
    </span>
  )
}

export default function AuditTrailTable({ entries, filters, onSort, page, totalPages, onPageChange, loading }: AuditTrailTableProps) {
  const filtered = useMemo(() => {
    let result = entries
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
        e.reason?.toLowerCase().includes(q) ||
        e.user?.toLowerCase().includes(q)
      )
    }
    if (filters.severity) {
      if (filters.severity === 'critical') {
        result = result.filter(e => e.action?.includes('delete') || e.action?.includes('failed') || e.action?.includes('critical'))
      } else if (filters.severity === 'warning') {
        result = result.filter(e => e.action?.includes('update') || e.action?.includes('change'))
      }
    }
    return result
  }, [entries, filters])

  const sortKey = filters.sortKey || 'createdAt'
  const sortDir = filters.sortDir || 'desc'
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = String((a as unknown as Record<string, unknown>)[sortKey] ?? '')
      const bVal = String((b as unknown as Record<string, unknown>)[sortKey] ?? '')
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
  }, [filtered, sortKey, sortDir])

  const pageSize = 20
  const totalFilteredPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalFilteredPages - 1)
  const paginated = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  const handleSort = (key: string) => onSort(key)

  const SORT_ARROW = (key: string) => sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

  return (
    <div className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }} role="grid" aria-label="Audit trail">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
              {[
                { key: 'createdAt', label: 'Timestamp' },
                { key: 'user', label: 'User' },
                { key: 'action', label: 'Action' },
                { key: 'module', label: 'Module' },
                { key: 'entityType', label: 'Entity' },
                { key: 'reason', label: 'Reason' },
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
              <tr><td colSpan={6} style={{ padding: 'var(--space-4)' }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-loader" style={{ height: 36, marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-md)' }} />)}
              </td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No audit records found.
              </td></tr>
            ) : (
              paginated.map(e => (
                <tr key={e.id}
                  style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                  className="table-row-hover">
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {formatTimestamp(e.createdAt)}
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>{e.user || 'System'}</td>
                  <td style={{ padding: '8px 12px' }}><ActionBadge action={e.action} /></td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{e.module}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{e.entityType}</span>
                    {e.entityId != null && <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>#{e.entityId}</span>}
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: '11px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.reason || '-'}
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
          <span>{sorted.length} records</span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
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
