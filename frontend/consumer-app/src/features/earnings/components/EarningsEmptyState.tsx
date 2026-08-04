import React from 'react'
import { MdAttachMoney, MdRefresh } from 'react-icons/md'

interface EarningsEmptyStateProps {
  onRetry?: () => void
  error?: string | null
}

export default function EarningsEmptyState({ onRetry, error }: EarningsEmptyStateProps) {
  if (error) {
    return (
      <div className="earnings-container">
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
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px auto' }}>
        <MdAttachMoney />
      </div>
      <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '22px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
        No Earnings Recorded Yet
      </h3>
      <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>
        Complete your assigned work orders to generate automatic payout records. Earnings are credited directly to your bank account upon verification.
      </p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          <MdRefresh /> Refresh Statement
        </button>
      )}
    </div>
  )
}
