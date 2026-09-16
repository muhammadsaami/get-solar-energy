import React from 'react'

interface VendorEmptyStateProps {
  icon?: string
  title?: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export default function VendorEmptyState({
  icon = 'icon-folder',
  title = 'No Records Found',
  description = 'No active records are currently available in this view. Create a new item or refresh to update live data.',
  action,
}: VendorEmptyStateProps) {
  return (
    <div className="vendor-glass-card" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px', textAlign: 'center', width: '100%', margin: '16px 0',
    }}>
      <div style={{
        width: '72px', height: '72px', borderRadius: '20px',
        background: 'rgba(23, 168, 229, 0.12)', border: '1px solid var(--vendor-primary-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '18px', boxShadow: '0 0 24px rgba(23, 168, 229, 0.2)',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--vendor-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" />
        </svg>
      </div>

      <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: '#FFFFFF', fontFamily: "'Outfit', sans-serif" }}>
        {title}
      </h3>

      {description && (
        <p style={{ fontSize: '13px', color: 'var(--vendor-text-secondary)', margin: '0 0 24px', maxWidth: '440px', lineHeight: 1.6 }}>
          {description}
        </p>
      )}

      {action && (
        <button className="vendor-btn-primary" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  )
}
