import React from 'react'

interface SettingsErrorBannerProps {
  message: string
  onDismiss?: () => void
}

function SettingsErrorBannerComponent({ message, onDismiss }: SettingsErrorBannerProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 mb-4 p-3 px-4 rounded-sm"
      style={{
        background: 'rgba(231, 76, 60, 0.06)',
        border: '1px dashed rgba(231, 76, 60, 0.3)',
      }}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-1 text-caption font-semibold text-red">
        {message}
      </div>
      {onDismiss && (
        <button
          className="table-action-btn"
          onClick={onDismiss}
          style={{ flexShrink: 0, fontSize: '10px', padding: '4px 10px' }}
          aria-label="Dismiss error"
        >
          Dismiss
        </button>
      )}
    </div>
  )
}

export const SettingsErrorBanner = React.memo(SettingsErrorBannerComponent)
