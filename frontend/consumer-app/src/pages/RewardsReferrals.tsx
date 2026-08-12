import React from 'react'
import DashboardSprites from '../components/dashboard/DashboardSprites'
import { useRewards } from '../hooks/useRewards'
import RewardSummaryCards from '../components/rewards/RewardSummaryCards'
import ReferralSharingCard from '../components/rewards/ReferralSharingCard'
import ReferralHistoryTable from '../components/rewards/ReferralHistoryTable'
import RewardsWallet from '../components/rewards/RewardsWallet'
import RewardsStore from '../components/rewards/RewardsStore'
import Leaderboard from '../components/rewards/Leaderboard'
import { getUser } from '../utils/referral'

export default function RewardsReferrals() {
  const { state, loadData, applyCode, redeem } = useRewards()
  const user = getUser()

  return (
    <>
      <DashboardSprites />

      <div className="ew-page tab-content active" role="tabpanel" aria-label="rewards" style={{ display: 'block' }}>
        <header className="ew-mission-bar" role="banner" aria-label="Rewards &amp; Referrals Header">
          <div className="ew-mission-scope">
            <span className="ew-live-dot" />
            <span className="ew-scope-badge">REWARDS / ADVOCACY</span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Customer Referrals, Community Milestones &amp; Rewards Store</span>
          </div>

          <div className="ew-mission-stats">
            <div className="ew-mission-stat-item">
              <span>Tier Status:</span>
              <strong style={{ color: 'var(--color-orange)' }}>
                {state.userRank ? `RANK #${state.userRank}` : 'SOLAR ADVOCATE'}
              </strong>
            </div>
            <div className="ew-mission-stat-item">
              <span>Balance:</span>
              <strong style={{ color: 'var(--color-green)' }}>
                ₹{state.summary?.wallet_balance_rs ? Number(state.summary.wallet_balance_rs).toLocaleString('en-IN') : '0'}
              </strong>
            </div>
          </div>
        </header>

        {state.error && (
          <div
            id="rewardsErrorBox"
            style={{
              marginBottom: 'var(--space-4)',
              padding: '12px 14px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              textAlign: 'center',
            }}
            role="alert"
            aria-live="polite"
          >
            <span style={{ fontSize: '11px', color: 'var(--color-red)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              {state.error}
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={loadData}
            >
              Retry Sync
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <RewardSummaryCards
            summary={state.summary}
            userRank={state.userRank}
            loading={state.loading}
          />

          <div className="ew-asym-65-35" style={{ gridTemplateColumns: '1fr 1.6fr' }}>
            <ReferralSharingCard
              referralCode={state.referralCode}
              onApplyCode={applyCode}
            />
            <ReferralHistoryTable
              history={state.referralHistory}
              loading={state.loading}
            />
          </div>

          <RewardsWallet
            totalPoints={state.summary?.total_points ?? 0}
            walletValue={state.summary?.wallet_balance_rs ?? 0}
            transactions={state.transactions}
            loading={state.loading}
          />

          <RewardsStore
            rewards={state.rewardsCatalog}
            userPoints={state.summary?.total_points ?? 0}
            loading={state.loading}
            onRedeem={redeem}
          />

          <Leaderboard
            leaderboard={state.leaderboard}
            userEmail={user?.email}
            loading={state.loading}
          />
        </div>
      </div>
    </>
  )
}
