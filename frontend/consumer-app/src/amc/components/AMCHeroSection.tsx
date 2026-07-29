import React from 'react'

interface AMCHeroSectionProps {
  onGenerateClick: () => void
  downloadDisabled: boolean
  onDownload: () => void
}

function AMCHeroSectionComponent({ onGenerateClick, downloadDisabled, onDownload }: AMCHeroSectionProps) {
  return (
    <div
      className="card-base"
      style={{ '--card-theme': '0, 174, 239', marginBottom: '20px', padding: '24px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' } as React.CSSProperties}
    >
      <div style={{ flex: 1, minWidth: '300px' }}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-navy)' }}>
          Standardize Your Solar O&M
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Access remote system health tracking, cleanings scheduling, electrical audits, and immediate diagnostic assessments.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          className="calc-btn"
          onClick={onGenerateClick}
          aria-label="Generate AMC Recommendation — scroll to AI form"
          style={{ marginTop: 0, width: 'auto', backgroundColor: 'var(--accent-blue)' }}
        >
          Generate AMC Recommendation
        </button>
        <button
          className="calc-btn"
          onClick={onDownload}
          disabled={downloadDisabled}
          aria-disabled={downloadDisabled}
          aria-label={downloadDisabled ? 'Download Maintenance Plan — generate a recommendation first' : 'Download Maintenance Plan'}
          style={{
            marginTop: 0, width: 'auto',
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-navy)',
          }}
        >
          Download Maintenance Plan
        </button>
      </div>
    </div>
  )
}

export const AMCHeroSection = React.memo(AMCHeroSectionComponent)
