import React from 'react'
import type { AMCServiceRecord } from '../types/amc.types'

interface AMCServiceHistoryTableProps {
  records: AMCServiceRecord[]
  loading: boolean
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatCurrency(val: number): string {
  if (val >= 1000) return `\u20B9${(val / 1000).toFixed(0)}K`
  return `\u20B9${val}`
}

function AMCServiceHistoryTableComponent({ records, loading }: AMCServiceHistoryTableProps) {
  if (loading) {
    return (
      <div className="card-base" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
        <div className="saas-table-header">
          <div className="skeleton skeleton-text narrow" style={{ width: '120px' }} />
        </div>
        <div style={{ marginTop: '10px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-text" style={{ width: '100%', marginBottom: '8px', height: '30px' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!records || records.length === 0) {
    return (
      <div className="card-base" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
        <div className="kpi-header-row">
          <span className="kpi-title">Service History</span>
        </div>
        <div className="table-empty" style={{ padding: 'var(--space-8) 0' }}>
          <div className="table-empty-icon">{'\uD83D\uDD27'}</div>
          <div className="table-empty-title">No service records</div>
          <div className="table-empty-desc">Service history will appear once maintenance visits are completed.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-base" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
      <div className="kpi-header-row">
        <span className="kpi-title">Service History ({records.length})</span>
      </div>
      <div className="table-responsive-wrapper" style={{ overflowX: 'auto', marginTop: '8px' }}>
        <table className="saas-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 700 }}>
              <th style={{ padding: '8px' }}>Date</th>
              <th style={{ padding: '8px' }}>Type</th>
              <th style={{ padding: '8px' }}>Description</th>
              <th style={{ padding: '8px' }}>Technician</th>
              <th style={{ padding: '8px' }}>Cost</th>
              <th style={{ padding: '8px' }}>Warranty</th>
            </tr>
          </thead>
          <tbody style={{ color: 'var(--text-navy)' }}>
            {records.map((record) => (
              <tr key={record.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '8px', fontWeight: 600 }}>{formatDate(record.serviceDate)}</td>
                <td style={{ padding: '8px' }}>{record.serviceType}</td>
                <td style={{ padding: '8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {record.description}
                </td>
                <td style={{ padding: '8px' }}>{record.technicianName}</td>
                <td style={{ padding: '8px', fontWeight: 600 }}>{formatCurrency(record.cost)}</td>
                <td style={{ padding: '8px' }}>
                  <span className={`status-badge ${record.warrantyClaim ? 'badge-yellow' : 'badge-gray'}`} style={{ fontSize: '8px' }}>
                    {record.warrantyClaim ? 'Claimed' : 'Out of Pocket'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const AMCServiceHistoryTable = React.memo(AMCServiceHistoryTableComponent)
