import React, { useState } from 'react'
import { formatNumber, getCategoryIcon } from '../../utils/referral'
import type { RewardCatalogItem } from '../../types/rewards.types'

interface Props {
  rewards: RewardCatalogItem[]
  userPoints: number
  loading: boolean
  onRedeem: (rewardId: string) => Promise<string | null>
}

export default function RewardsStore({ rewards, userPoints, loading, onRedeem }: Props) {
  const [redeemingId, setRedeemingId] = useState<string | null>(null)

  const handleRedeem = async (rewardId: string) => {
    setRedeemingId(rewardId)
    await onRedeem(rewardId)
    setRedeemingId(null)
  }

  return (
    <div className="card-base" style={{ '--card-theme': '255, 138, 29', marginBottom: '20px' } as React.CSSProperties}>
      <div className="kpi-header-row" style={{ marginBottom: '12px' }}>
        <span className="kpi-title">Rewards Store</span>
      </div>
      <div id="rwdStoreGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px', gridColumn: 'span 3' }}>
            Loading rewards catalog...
          </div>
        ) : rewards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px', gridColumn: 'span 3' }}>
            No rewards available at this time.
          </div>
        ) : (
          rewards.map(r => {
            const canAfford = userPoints >= r.points_required
            const isRedeeming = redeemingId === r.id
            return (
              <div key={r.id} style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px',
              }}>
                <div>
                  <span style={{ fontSize: '28px', display: 'block', marginBottom: '6px' }}>{getCategoryIcon(r.category)}</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-navy)', display: 'block' }}>{r.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>{r.description}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-orange)', display: 'block', marginBottom: '8px' }}>
                    {formatNumber(r.points_required)} points
                  </span>
                  <button
                    className="calc-btn"
                    style={{
                      margin: '0 auto',
                      padding: '6px 14px',
                      fontSize: '11px',
                      height: 'auto',
                      width: 'auto',
                      opacity: canAfford ? 1 : 0.5,
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                    }}
                    disabled={!canAfford || isRedeeming}
                    onClick={() => handleRedeem(r.id)}
                    aria-label={`Redeem ${r.name}`}
                  >
                    {isRedeeming ? 'Processing...' : canAfford ? 'Redeem' : 'Not Enough'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
