import React from 'react'

interface PerformanceErrorBannerProps {
  severity: 'critical' | 'warning' | 'info'
  message: string
  onRetry?: () => void
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  critical: {
    bg: 'rgba(231, 76, 60, 0.06)',
    border: '1px dashed rgba(231, 76, 60, 0.3)',
    color: '#ef4444',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.06)',
    border: '1px dashed rgba(245, 158, 11, 0.3)',
    color: 'var(--accent-orange, #f59e0b)',
  },
  info: {
    bg: 'rgba(0, 174, 239, 0.06)',
    border: '1px dashed rgba(0, 174, 239, 0.3)',
    color: 'var(--accent-blue, #17a8e5)',
  },
}

function PerformanceErrorBannerComponent({
  severity,
  message,
  onRetry,
}: PerformanceErrorBannerProps) {
  const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.info

  return (
    <div
      style={{
        marginBottom: '16px',
        padding: '12px 16px',
        borderRadius: '8px',
        background: style.bg,
        border: style.border,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
      }}
      role="alert"
      aria-live="polite"
    >
      <div style={{ fontSize: '11px', color: style.color, fontWeight: 600, flex: 1 }}>
        {message}
      </div>
      {onRetry && (
        <button
          className="table-action-btn"
          onClick={onRetry}
          style={{ flexShrink: 0, fontSize: '10px', padding: '4px 10px' }}
          aria-label="Retry loading performance data"
        >
          Retry
        </button>
      )}
    </div>
  )
}

export const PerformanceErrorBanner = React.memo(PerformanceErrorBannerComponent)
