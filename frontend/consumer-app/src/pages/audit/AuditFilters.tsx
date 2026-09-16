import type { AuditFilterState } from './audit.types'

const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
  { value: 'custom', label: 'Custom' },
] as const

interface AuditFiltersProps {
  filters: AuditFilterState
  onChange: (f: AuditFilterState) => void
}

export default function AuditFilters({ filters, onChange }: AuditFiltersProps) {
  return (
    <div className="card-glass" style={{ padding: 'var(--space-4)' }} role="search" aria-label="Audit & monitoring filters">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Date
          </span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {DATE_PRESETS.map(p => (
              <button key={p.value} onClick={() => onChange({ ...filters, datePreset: p.value })}
                aria-pressed={filters.datePreset === p.value}
                style={{
                  padding: '4px 10px', fontSize: '11px', borderRadius: '6px', cursor: 'pointer',
                  border: filters.datePreset === p.value ? '1px solid var(--color-orange)' : '1px solid var(--glass-border)',
                  background: filters.datePreset === p.value ? 'rgba(255,138,29,0.15)' : 'var(--glass-bg)',
                  color: filters.datePreset === p.value ? 'var(--color-orange)' : 'var(--text-secondary)',
                  fontWeight: filters.datePreset === p.value ? 600 : 400,
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <SelectFilter id="audit-severity" label="Severity" value={filters.severity}
          options={[
            { value: '', label: 'All Severities' },
            { value: 'critical', label: 'Critical' },
            { value: 'warning', label: 'Warning' },
            { value: 'success', label: 'Success' },
            { value: 'info', label: 'Info' },
          ]}
          onChange={v => onChange({ ...filters, severity: v })} />

        <SelectFilter id="audit-module" label="Module" value={filters.module}
          options={[
            { value: '', label: 'All Modules' },
            { value: 'CRM', label: 'CRM' },
            { value: 'Billing', label: 'Billing' },
            { value: 'Proposal', label: 'Proposal' },
            { value: 'SiteSurvey', label: 'Site Survey' },
            { value: 'Installation', label: 'Installation' },
            { value: 'AMC', label: 'AMC' },
            { value: 'System', label: 'System' },
          ]}
          onChange={v => onChange({ ...filters, module: v })} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <label htmlFor="audit-user" style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            User
          </label>
          <input id="audit-user" type="text" value={filters.user} onChange={e => onChange({ ...filters, user: e.target.value })}
            placeholder="Filter by user..."
            className="glass-input"
            style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '6px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', width: 130 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <label htmlFor="audit-search" style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Search
          </label>
          <input id="audit-search" type="text" value={filters.search} onChange={e => onChange({ ...filters, search: e.target.value })}
            placeholder="Search audit trail..."
            className="glass-input"
            style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '6px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', width: 160 }} />
        </div>
      </div>
    </div>
  )
}

function SelectFilter({ label, value, options, onChange, id }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; id: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <label htmlFor={id} style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)}
        className="glass-input"
        style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '6px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer', minWidth: 120 }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
