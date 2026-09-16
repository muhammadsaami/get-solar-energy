import React from 'react'

interface QuickActionsBarProps {
  onGenerateAll: () => void
  onDownloadLatest: () => void
  onCsvExport: (type: string) => void
  loading: boolean
}

function QuickActionsBarComponent({
  onGenerateAll,
  onDownloadLatest,
  onCsvExport,
  loading,
}: QuickActionsBarProps) {
  return (
    <div
      className="card-base"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px',
        marginBottom: '20px',
        padding: '16px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-secondary)', fontFamily: "'Outfit'" }}>Quick Actions:</span>
        <button
          className="table-action-btn"
          onClick={onGenerateAll}
          disabled={loading}
          style={{ padding: '6px 12px', fontSize: '11px', background: 'rgba(0, 174, 239, 0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(0, 174, 239, 0.2)' }}
        >
          Generate All Reports
        </button>
        <button
          className="table-action-btn"
          onClick={onDownloadLatest}
          disabled={loading}
          style={{ padding: '6px 12px', fontSize: '11px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--accent-green)', border: '1px solid rgba(34, 197, 94, 0.2)' }}
        >
          Download Latest Assessment
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Export CSV:
        </span>
        <button className="table-action-btn" onClick={() => onCsvExport('bill')} style={{ padding: '5px 10px', fontSize: '10px' }}>
          Bill CSV
        </button>
        <button className="table-action-btn" onClick={() => onCsvExport('roof')} style={{ padding: '5px 10px', fontSize: '10px' }}>
          Roof CSV
        </button>
        <button className="table-action-btn" onClick={() => onCsvExport('roi')} style={{ padding: '5px 10px', fontSize: '10px' }}>
          ROI CSV
        </button>
        <button className="table-action-btn" onClick={() => onCsvExport('combined')} style={{ padding: '5px 10px', fontSize: '10px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-orange)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          Combined CSV
        </button>
      </div>
    </div>
  )
}

export const QuickActionsBar = React.memo(QuickActionsBarComponent)
