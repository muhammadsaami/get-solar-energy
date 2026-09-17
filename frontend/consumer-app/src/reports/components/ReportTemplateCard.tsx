import React from 'react'
import type { ReportTemplate } from '../types/report.types'

interface ReportTemplateCardProps {
  template: ReportTemplate
  generating: boolean
  onGenerate: (templateId: string) => void
  onPreview: (templateId: string) => void
  onDownload: (templateId: string) => void
}

function ReportTemplateCardComponent({
  template,
  generating,
  onGenerate,
  onPreview,
  onDownload,
}: ReportTemplateCardProps) {
  return (
    <div
      className="card-base shadow-lift"
      style={{ '--card-theme': template.theme, padding: '20px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } as React.CSSProperties}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-navy)', margin: 0 }}>
            {template.title}
          </h4>
          <span className="status-badge badge-green">Ready</span>
        </div>
        <p style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 12px 0' }}>
          {template.description}
        </p>
        <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '15px' }}>
          <div style={{ marginBottom: '4px' }}>
            {'\uD83D\uDCC2'} <span style={{ fontWeight: 700 }}>Includes:</span> {template.includes.join(', ')}
          </div>
          <div style={{ fontStyle: 'italic' }}>Last Run: Never</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          className="table-action-btn"
          disabled={generating}
          onClick={() => onGenerate(template.id)}
          style={{ flex: 1, fontSize: '10px', padding: '5px 0' }}
        >
          {generating ? 'Generating...' : 'Generate'}
        </button>
        <button
          className="table-action-btn"
          disabled={!template.supportsPreview}
          onClick={() => onPreview(template.id)}
          style={{ flex: 1, fontSize: '10px', padding: '5px 0' }}
          title={!template.supportsPreview ? 'Preview not available' : ''}
        >
          Preview
        </button>
        <button
          className="table-action-btn"
          disabled={generating}
          onClick={() => onDownload(template.id)}
          style={{ fontSize: '10px', padding: '5px' }}
          title="Download CSV"
        >
          {'\uD83D\uECE5'}
        </button>
      </div>
    </div>
  )
}

export const ReportTemplateCard = React.memo(ReportTemplateCardComponent)
