import React from 'react'
import { MdWork, MdRefresh } from 'react-icons/md'

interface JobMarketplaceEmptyStateProps {
  onRetry?: () => void
  error?: string | null
}

export default function JobMarketplaceEmptyState({ onRetry, error }: JobMarketplaceEmptyStateProps) {
  if (error) {
    return (
      <div className="job-marketplace-container">
        <div
          className="auth-error-banner visible"
          role="alert"
          style={{
            margin: '40px auto',
            maxWidth: '600px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#f87171',
          }}
        >
          <span style={{ fontSize: '14px' }}>⚠️ {error}</span>
          {onRetry && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onRetry}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <MdRefresh /> Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'rgba(8, 24, 42, 0.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '48px 24px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0, 174, 239, 0.1)', color: '#00aeef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px auto' }}>
        <MdWork />
      </div>
      <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '22px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
        No Open Jobs Available
      </h3>
      <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>
        There are currently no open work orders matching your filters. Check back soon as vendors post new installation and maintenance requests daily.
      </p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          <MdRefresh /> Refresh Job Feed
        </button>
      )}
    </div>
  )
}
