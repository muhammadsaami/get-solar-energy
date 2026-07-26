import React from 'react'

function AMCResultPlaceholderComponent() {
  return (
    <div
      className="card-base"
      style={{ '--card-theme': '23, 168, 229', minHeight: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' } as React.CSSProperties}
    >
      <div>
        <svg style={{ width: '64px', height: '64px', color: 'var(--text-secondary)', opacity: 0.4, marginBottom: '15px' }} aria-hidden="true">
          <use href="#icon-wrench" />
        </svg>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-navy)' }}>
          No Recommendation Generated
        </h4>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '320px' }}>
          Fill out the system parameters on the left and click Generate to analyze performance and produce the AMC service report.
        </p>
      </div>
    </div>
  )
}

export const AMCResultPlaceholder = React.memo(AMCResultPlaceholderComponent)
