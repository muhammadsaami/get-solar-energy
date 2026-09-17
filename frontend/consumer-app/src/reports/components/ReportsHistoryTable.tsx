import React from 'react'
import type { ReportHistoryItem } from '../types/report.types'

interface ReportsHistoryTableProps {
  history: ReportHistoryItem[]
  search: string
  onSearchChange: (search: string) => void
  onDownload: (item: ReportHistoryItem) => void
}

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  completed: { text: 'Completed', className: 'badge-green' },
  failed: { text: 'Failed', className: 'badge-red' },
  generating: { text: 'Generating', className: 'badge-yellow' },
}

function getStatusBadge(status: string): { text: string; className: string } {
  return STATUS_LABEL[status] || { text: status, className: 'badge-gray' }
}

function ReportsHistoryTableComponent({
  history,
  search,
  onSearchChange,
  onDownload,
}: ReportsHistoryTableProps) {
  const filtered = search
    ? history.filter((h) => h.reportName.toLowerCase().includes(search.toLowerCase()))
    : history

  return (
    <div className="card-base" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
      <div className="saas-table-header">
        <span className="kpi-title">Report Document History & Versions</span>
        <input
          type="text"
          id="reportHistorySearch"
          placeholder="Search report history..."
          aria-label="Search reports history log"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'var(--bg-input, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-color)',
            color: 'var(--text-navy)',
            fontSize: '11px',
            outline: 'none',
            width: '180px',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <div className="table-responsive-wrapper" style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
        <table className="saas-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 700 }}>
              <th style={{ padding: '10px 8px' }}>Report Name</th>
              <th style={{ padding: '10px 8px' }}>Version</th>
              <th style={{ padding: '10px 8px' }}>Created Date</th>
              <th style={{ padding: '10px 8px' }}>Downloads</th>
              <th style={{ padding: '10px 8px' }}>Status</th>
              <th style={{ padding: '10px 8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody id="reportsHistoryTableBody" style={{ color: 'var(--text-navy)' }}>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '24px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {search ? 'No reports match your search.' : 'No reports generated yet.'}
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const badge = getStatusBadge(item.status)
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, fontSize: '11px', padding: '10px 8px' }}>{item.reportName}</td>
                    <td style={{ fontSize: '10px', padding: '10px 8px' }}>v{item.version}</td>
                    <td style={{ fontSize: '10px', padding: '10px 8px' }}>{item.createdDate}</td>
                    <td style={{ fontSize: '10px', padding: '10px 8px' }}>{item.downloadCount}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span className={`status-badge ${badge.className}`} style={{ fontSize: '9px' }}>
                        {badge.text}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <button className="table-action-btn" onClick={() => onDownload(item)} style={{ fontSize: '9px' }}>
                        {'\uD83D\uECE5'}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const ReportsHistoryTable = React.memo(ReportsHistoryTableComponent)
