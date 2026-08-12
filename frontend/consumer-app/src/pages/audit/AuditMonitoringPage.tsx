import { useState, useEffect, useCallback, useMemo } from 'react'
import { adminService } from '../../services/admin.service'
import type { AdminActivity } from '../admin/admin.types'
import type { AuditLogEntry, AuditEvent, AuditFilterState, AuditSeverity } from './audit.types'
import AuditFilters from './AuditFilters'
import AuditTrailTable from './AuditTrailTable'
import AuditDetailDrawer from './AuditDetailDrawer'

const INITIAL_FILTERS: AuditFilterState = {
  datePreset: '30d',
  dateRange: null,
  severity: '',
  module: '',
  user: '',
  search: '',
  sortKey: 'timestamp',
  sortDir: 'desc',
}

function deriveSeverity(e: AuditLogEntry | AdminActivity, isActivity: boolean): AuditSeverity {
  const a = (isActivity ? (e as AdminActivity).eventType : (e as AuditLogEntry).action || '').toLowerCase()
  if (/delete|failed|critical|error|breach|denied/.test(a)) return 'critical'
  if (/update|change|modify|warning/.test(a)) return 'warning'
  if (/create|add|upload|submit|won|approved|success|new/.test(a)) return 'success'
  return 'info'
}

function buildEvents(auditLog: AuditLogEntry[], activity: AdminActivity[]): AuditEvent[] {
  const audit: AuditEvent[] = auditLog.map(e => ({
    id: `audit-${e.id}`,
    timestamp: e.createdAt,
    user: e.user || 'System',
    action: e.action,
    module: e.module || 'System',
    severity: deriveSeverity(e, false),
    entityType: e.entityType || undefined,
    entityId: e.entityId,
    detail: e.reason || undefined,
    ipAddress: e.ipAddress,
    oldValue: e.oldValue,
    newValue: e.newValue,
    source: 'audit',
  }))
  const activityEvents: AuditEvent[] = activity.map((a, i) => ({
    id: `activity-${a.customerId ?? 'sys'}-${i}-${a.timestamp}`,
    timestamp: a.timestamp,
    user: a.user || 'System',
    action: a.eventType,
    module: a.module || 'System',
    severity: deriveSeverity(a, true),
    entityType: 'Customer',
    entityId: a.customerId ?? null,
    detail: a.notes || undefined,
    source: 'activity',
  }))
  return [...audit, ...activityEvents]
}

export default function AuditMonitoringPage() {
  const [filters, setFilters] = useState<AuditFilterState>(INITIAL_FILTERS)
  const [health, setHealth] = useState<{ overall: string; services: { status: string; label: string; detail: string }[] } | null>(null)
  const [activity, setActivity] = useState<AdminActivity[]>([])
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [auditPage, setAuditPage] = useState(0)
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [healthData, activityData, auditData] = await Promise.all([
        adminService.getHealth(),
        adminService.getActivity(200),
        adminService.getAuditLog(500),
      ])
      setHealth(healthData)
      setActivity(activityData)
      setAuditLog(auditData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const events = useMemo(() => buildEvents(auditLog, activity), [auditLog, activity])

  const kpis = useMemo(() => {
    const critical = events.filter(e => e.severity === 'critical').length
    const failedLogins = events.filter(e => e.action.toLowerCase().includes('login') && e.severity === 'critical').length
    const online = health?.services.filter(s => s.status === 'green').length ?? 0
    const total = health?.services.length ?? 0
    return [
      { label: 'Events', value: events.length, accent: 'accent-blue' },
      { label: 'Critical', value: critical, accent: critical > 0 ? 'accent-red' : 'accent-blue' },
      { label: 'Failed Logins', value: failedLogins, accent: failedLogins > 0 ? 'accent-red' : 'accent-blue' },
      { label: 'System Health', value: total ? `${online}/${total}` : '—', accent: online === total && total > 0 ? 'accent-green' : 'accent-orange' },
    ]
  }, [events, health])

  if (loading && events.length === 0) {
    return (
      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div className="skeleton-loader" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton-loader" style={{ height: 60, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton-loader" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
      </div>
    )
  }

  if (error && events.length === 0) {
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
          <h2 className="tab-heading">Audit &amp; Monitoring</h2>
          <p className="tab-subheading">
            Investigate what happened, who performed the action, and when — across all events and audit logs.
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
          {loading ? 'Syncing...' : 'Sync Audit Log'}
        </button>
      </header>

      <section aria-label="Key Metrics" className="card-grid-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className={`card-metric ${kpi.accent}`}>
            <div className="card-metric-value">{loading ? '—' : kpi.value}</div>
            <div className="card-metric-label">{kpi.label}</div>
          </div>
        ))}
      </section>

      <AuditFilters filters={filters} onChange={f => { setFilters(f); setAuditPage(0) }} />

      <ExportBar events={events} />

      <div>
        <SectionHeader title="Event Log" subtitle={`${events.length} events · click a row to investigate`} />
        <AuditTrailTable
          events={events}
          filters={filters}
          onSort={(key) => setFilters(f => ({ ...f, sortKey: key, sortDir: f.sortKey === key && f.sortDir === 'asc' ? 'desc' : 'asc' }))}
          page={auditPage}
          onPageChange={setAuditPage}
          loading={loading}
          onSelect={setSelectedEvent}
        />
      </div>

      <AuditDetailDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
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

function ExportBar({ events }: { events: AuditEvent[] }) {
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

  const handleExportEvents = () => {
    exportCSV(events.slice(0, 1000).map(e => ({
      timestamp: e.timestamp, severity: e.severity, user: e.user, action: e.action, module: e.module,
      entity: e.entityType ? `${e.entityType}${e.entityId != null ? ` #${e.entityId}` : ''}` : '',
      detail: e.detail || '', ip: e.ipAddress || '',
    })), [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'severity', label: 'Severity' },
      { key: 'user', label: 'User' },
      { key: 'action', label: 'Action' },
      { key: 'module', label: 'Module' },
      { key: 'entity', label: 'Entity' },
      { key: 'detail', label: 'Detail' },
      { key: 'ip', label: 'IP Address' },
    ], 'audit-events.csv')
  }

  const handlePrint = () => window.print()

  return (
    <div className="card-glass" style={{ padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Export</span>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={handleExportEvents}
            style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            Export Events (CSV)
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
