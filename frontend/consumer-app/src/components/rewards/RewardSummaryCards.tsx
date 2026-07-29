import React from 'react'
import { formatNumber } from '../../utils/referral'
import type { RewardSummary } from '../../types/rewards.types'

interface Props {
  summary: RewardSummary | null
  userRank: number | null
  loading: boolean
}

export default function RewardSummaryCards({ summary, userRank, loading }: Props) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }} className="rewards-kpi-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card-base shadow-lift" style={{ padding: '16px' }}>
            <div style={{ height: '14px', width: '60%', background: 'var(--border-color)', borderRadius: '4px', marginBottom: '12px' }} />
            <div style={{ height: '26px', width: '40%', background: 'var(--border-color)', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    )
  }

  const s = summary || { total_referrals: 0, completed_referrals: 0, pending_referrals: 0, total_points: 0, wallet_balance_rs: 0 }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }} className="rewards-kpi-grid">
      <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
        <div className="kpi-header-row">
          <span className="kpi-title">Total Referrals</span>
          <svg className="kpi-title-icon blue" style={{ width: '16px', height: '16px' }}><use href="#icon-gift"></use></svg>
        </div>
        <div className="kpi-value-block" style={{ margin: '6px 0' }}>
          <span className="kpi-value-text" style={{ fontSize: '26px' }}>{formatNumber(s.total_referrals)}</span>
        </div>
      </div>
      <div className="card-base shadow-lift" style={{ '--card-theme': '54, 211, 153' } as React.CSSProperties}>
        <div className="kpi-header-row">
          <span className="kpi-title">Points Balance</span>
          <svg className="kpi-title-icon green" style={{ width: '16px', height: '16px' }}><use href="#icon-star"></use></svg>
        </div>
        <div className="kpi-value-block" style={{ margin: '6px 0' }}>
          <span className="kpi-value-text" style={{ fontSize: '26px' }}>{formatNumber(s.total_points)}</span>
        </div>
      </div>
      <div className="card-base shadow-lift" style={{ '--card-theme': '255, 138, 29' } as React.CSSProperties}>
        <div className="kpi-header-row">
          <span className="kpi-title">Wallet Value</span>
          <svg className="kpi-title-icon orange" style={{ width: '16px', height: '16px' }}><use href="#icon-lifetime-savings"></use></svg>
        </div>
        <div className="kpi-value-block" style={{ margin: '6px 0' }}>
          <span className="kpi-value-text" style={{ fontSize: '26px' }}>₹{formatNumber(s.wallet_balance_rs)}</span>
        </div>
      </div>
      <div className="card-base shadow-lift" style={{ '--card-theme': '234, 179, 8' } as React.CSSProperties}>
        <div className="kpi-header-row">
          <span className="kpi-title">Leaderboard Rank</span>
          <svg style={{ width: '16px', height: '16px', stroke: '#eab308' }}><use href="#icon-star"></use></svg>
        </div>
        <div className="kpi-value-block" style={{ margin: '6px 0' }}>
          <span className="kpi-value-text" style={{ fontSize: '26px' }}>{userRank ? `#${userRank}` : '\u2014'}</span>
        </div>
      </div>
    </div>
  )
}
