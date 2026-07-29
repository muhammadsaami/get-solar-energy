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

      <div className="tab-content" role="tabpanel" aria-label="rewards" style={{ display: 'block' }}>
        <div className="tab-header-block">
          <h2 className="tab-heading">Rewards & Referrals</h2>
          <p className="tab-subheading">
            Refer friends to solar energy and earn points redeemable for vouchers, services, and cashback.
          </p>
        </div>

        {state.error && (
          <div
            id="rewardsErrorBox"
            style={{ marginBottom: '16px', padding: '14px', borderRadius: '8px', background: 'rgba(231, 76, 60, 0.06)', border: '1px dashed rgba(231, 76, 60, 0.3)', textAlign: 'center' }}
            role="alert"
            aria-live="polite"
          >
            <span style={{ fontSize: '12px', color: '#ef4444', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              {state.error}
            </span>
            <button
              type="button"
              className="calc-btn"
              onClick={loadData}
              style={{ margin: '0 auto', width: 'auto', padding: '6px 16px', fontSize: '11px', height: 'auto' }}
            >
              Retry
            </button>
          </div>
        )}

        <RewardSummaryCards
          summary={state.summary}
          userRank={state.userRank}
          loading={state.loading}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px', marginBottom: '20px' }}>
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
    </>
  )
}
