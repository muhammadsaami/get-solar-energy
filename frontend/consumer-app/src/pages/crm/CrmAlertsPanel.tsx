import type { CrmAlert } from './crm.types'

const SEVERITY_STYLE: Record<string, React.CSSProperties> = {
  Critical: { background: 'rgba(239,68,68,0.15)', color: 'var(--color-red)', borderLeft: '3px solid var(--color-red)' },
  Warning: { background: 'rgba(245,158,11,0.15)', color: 'var(--color-amber)', borderLeft: '3px solid var(--color-amber)' },
}

export default function CrmAlertsPanel({ alerts, onSelectCustomer }: { alerts: CrmAlert[]; onSelectCustomer?: (id: number) => void }) {
  if (!alerts.length) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
        <div style={{ fontSize: 32, marginBottom: 'var(--space-2)' }}>✓</div>
        <p style={{ margin: 0 }}>No alerts — everything looks good.</p>
      </div>
    )
  }

  const critical = alerts.filter(a => a.severity === 'Critical')
  const warnings = alerts.filter(a => a.severity === 'Warning')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {critical.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-red)' }}>
            Critical ({critical.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {critical.map(a => (
              <AlertCard key={a.id} alert={a} severity="Critical" onSelectCustomer={onSelectCustomer} />
            ))}
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-amber)' }}>
            Warnings ({warnings.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {warnings.map(a => (
              <AlertCard key={a.id} alert={a} severity="Warning" onSelectCustomer={onSelectCustomer} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AlertCard({ alert, severity, onSelectCustomer }: { alert: CrmAlert; severity: string; onSelectCustomer?: (id: number) => void }) {
  return (
    <div style={{
      padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)',
      ...SEVERITY_STYLE[severity],
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: 2 }}>{alert.title}</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>{alert.description}</div>
        </div>
        {onSelectCustomer && alert.customerId && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onSelectCustomer(alert.customerId)}
            aria-label={`View customer ${alert.customerName}`}
            style={{ flexShrink: 0, fontSize: 'var(--font-size-2xs)', padding: '4px 8px' }}
          >
            {alert.customerName} →
          </button>
        )}
      </div>
    </div>
  )
}
