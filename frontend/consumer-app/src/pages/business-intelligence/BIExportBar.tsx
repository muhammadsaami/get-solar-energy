import { useCallback } from 'react'
import type { BIDashboardData } from './bi.types'
import type { AdminKpi } from '../admin/admin.types'

function formatKpiValue(kpi: AdminKpi): string {
  switch (kpi.format) {
    case 'currency': return `₹${(kpi.value / 100000).toFixed(2)}L`
    case 'percent': return `${kpi.value}%`
    case 'years': return `${kpi.value} yr`
    case 'kw': return `${kpi.value} kW`
    default: return kpi.value.toLocaleString('en-IN')
  }
}

function exportCSV(rows: Record<string, unknown>[], columns: { key: string; label: string }[], filename: string) {
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

export default function BIExportBar({ data }: { data: BIDashboardData }) {
  const admin = data.admin

  const handleExportKPIs = useCallback(() => {
    if (!admin?.kpis) return
    const rows = admin.kpis.map(k => ({
      label: k.label, value: formatKpiValue(k), change: k.change != null ? `${k.change >= 0 ? '+' : ''}${k.change}%` : 'N/A',
    }))
    exportCSV(rows, [
      { key: 'label', label: 'KPI' },
      { key: 'value', label: 'Value' },
      { key: 'change', label: 'Change' },
    ], 'bi-kpi-summary.csv')
  }, [admin])

  const handleExportRevenue = useCallback(() => {
    const trend = admin?.charts?.revenueTrend
    if (!trend || trend.length === 0) return
    exportCSV(trend.map(d => ({ month: d.month, revenue: d.revenue })), [
      { key: 'month', label: 'Month' },
      { key: 'revenue', label: 'Revenue (₹)' },
    ], 'bi-revenue-trend.csv')
  }, [admin])

  const handleExportCustomers = useCallback(() => {
    if (data.customers.length === 0) return
    exportCSV(data.customers.map(c => ({
      name: c.customerName, city: c.city, status: c.status, leadScore: c.leadScore, healthScore: c.healthScore,
    })), [
      { key: 'name', label: 'Customer Name' },
      { key: 'city', label: 'City' },
      { key: 'status', label: 'Status' },
      { key: 'leadScore', label: 'Lead Score' },
      { key: 'healthScore', label: 'Health Score' },
    ], 'bi-customers.csv')
  }, [data.customers])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  return (
    <div className="card-glass" style={{ padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Export</span>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={handleExportKPIs}
            style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            Export KPI Summary (CSV)
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleExportRevenue}
            style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            Export Revenue (CSV)
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleExportCustomers}
            style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            Export Customers (CSV)
          </button>
          <button className="btn btn-outline btn-sm" onClick={handlePrint}
            style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            Print Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
