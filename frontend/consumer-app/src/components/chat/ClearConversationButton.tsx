import React from 'react'

interface ClearConversationButtonProps {
  onClear: () => void
  disabled: boolean
}

export default function ClearConversationButton({ onClear, disabled }: ClearConversationButtonProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
      <button
        onClick={onClear}
        disabled={disabled}
        aria-label="Clear conversation"
        title="Clear conversation"
        style={{
          background: 'none',
          border: 'none',
          cursor: disabled ? 'default' : 'pointer',
          padding: '4px 8px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          opacity: disabled ? 0.4 : 0.6,
          transition: 'opacity 0.15s',
          fontFamily: 'inherit',
        }}
        onMouseEnter={(e) => { if (!disabled) (e.target as HTMLElement).style.opacity = '1' }}
        onMouseLeave={(e) => { if (!disabled) (e.target as HTMLElement).style.opacity = '0.6' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        <span>Clear</span>
      </button>
    </div>
  )
}
