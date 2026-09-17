import React from 'react'

interface AMCErrorBannerProps {
  message: string
  onRetry?: () => void
}

function AMCErrorBannerComponent({ message, onRetry }: AMCErrorBannerProps) {
  return (
    <div
      style={{
        marginBottom: '16px',
        padding: '12px 16px',
        borderRadius: '8px',
        background: 'rgba(231, 76, 60, 0.06)',
        border: '1px dashed rgba(231, 76, 60, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
      }}
      role="alert"
      aria-live="polite"
    >
      <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, flex: 1 }}>
        {message}
      </div>
      {onRetry && (
        <button
          className="table-action-btn"
          onClick={onRetry}
          style={{ flexShrink: 0, fontSize: '10px', padding: '4px 10px' }}
          aria-label="Retry loading AMC data"
        >
          Retry
        </button>
      )}
    </div>
  )
}

export const AMCErrorBanner = React.memo(AMCErrorBannerComponent)
