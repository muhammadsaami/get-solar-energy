import React from 'react'

interface ReportPreviewModalProps {
  templateId: string | null
  onClose: () => void
}

function ReportPreviewModalComponent({ templateId, onClose }: ReportPreviewModalProps) {
  if (!templateId) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card-base"
        style={{
          width: '90%',
          maxWidth: '720px',
          maxHeight: '85vh',
          overflow: 'auto',
          padding: '32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-navy)', margin: 0 }}>Report Preview</h3>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '4px 12px', fontSize: '11px' }}
          >
            Close
          </button>
        </div>
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}>{'\uD83D\uDD0D'}</span>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 0 }}>
            Report preview is not available yet.
          </p>
        </div>
      </div>
    </div>
  )
}

export const ReportPreviewModal = React.memo(ReportPreviewModalComponent)
