import type { BIFilterState, BIDashboardData } from './bi.types'
import { DATE_PRESETS } from './bi.types'

interface BIFilterBarProps {
  filters: BIFilterState
  onChange: (f: BIFilterState) => void
  data: BIDashboardData
}

function SelectFilter({ label, value, options, onChange, id }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; id: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <label htmlFor={id} style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)}
        className="glass-input"
        style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '6px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer', minWidth: 110 }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function extractOptions(data: BIDashboardData, key: 'city' | 'vendor' | 'salesperson'): { value: string; label: string }[] {
  const set = new Set<string>()
  if (key === 'city' && data.admin?.geography) {
    for (const g of data.admin.geography) {
      const v = (g as Record<string, unknown>)[key === 'city' ? 'city' : 'city']
      if (v) set.add(String(v))
    }
  }
  if ((key === 'vendor' || key === 'salesperson') && data.customers) {
    for (const c of data.customers) {
      const v = key === 'vendor' ? null : c.salesperson
      if (v) set.add(String(v))
    }
  }
  return [{ value: '', label: `All ${key.charAt(0).toUpperCase() + key.slice(1)}s` }, ...Array.from(set).sort().map(v => ({ value: v, label: v }))]
}

export default function BIFilterBar({ filters, onChange, data }: BIFilterBarProps) {
  const regions = extractOptions(data, 'city')
  const salespeople = extractOptions(data, 'salesperson')

  return (
    <div className="card-glass" style={{ padding: 'var(--space-4)' }} role="search" aria-label="Business Intelligence filters">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</span>
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
        <SelectFilter id="bi-region" label="Region" value={filters.region} options={regions} onChange={v => onChange({ ...filters, region: v })} />
        <SelectFilter id="bi-salesperson" label="Salesperson" value={filters.salesperson} options={salespeople} onChange={v => onChange({ ...filters, salesperson: v })} />
        <SelectFilter id="bi-segment" label="Segment" value={filters.segment} options={[
          { value: '', label: 'All Segments' },
          { value: 'residential', label: 'Residential' },
          { value: 'commercial', label: 'Commercial' },
          { value: 'industrial', label: 'Industrial' },
        ]} onChange={v => onChange({ ...filters, segment: v })} />
        <SelectFilter id="bi-status" label="Status" value={filters.projectStatus} options={[
          { value: '', label: 'All Statuses' },
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Completed' },
          { value: 'pending', label: 'Pending' },
          { value: 'at_risk', label: 'At Risk' },
        ]} onChange={v => onChange({ ...filters, projectStatus: v })} />
      </div>
    </div>
  )
}
