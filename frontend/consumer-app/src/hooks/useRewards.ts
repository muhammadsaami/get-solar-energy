import { useState, useEffect, useCallback, useRef } from 'react'
import { getUser } from '../utils/referral'
import { fetchAnalytics, applyReferralCode, redeemReward } from '../services/reward.service'
import {
  saveRewardsToLocalStorage,
  loadRewardsFromLocalStorage,
} from '../utils/rewardsLocalStorage'
import type {
  AnalyticsResponse,
  RewardSummary,
  ReferralHistoryEntry,
  WalletTransaction,
  RewardCatalogItem,
  LeaderboardEntry,
} from '../types/rewards.types'

export interface RewardsState {
  loading: boolean
  error: string | null
  referralCode: string
  summary: RewardSummary | null
  referralHistory: ReferralHistoryEntry[]
  transactions: WalletTransaction[]
  rewardsCatalog: RewardCatalogItem[]
  leaderboard: LeaderboardEntry[]
  userRank: number | null
}

function emptyRewardsState(referralCode: string): RewardsState {
  return {
    loading: true,
    error: null,
    referralCode,
    summary: null,
    referralHistory: [],
    transactions: [],
    rewardsCatalog: [],
    leaderboard: [],
    userRank: null,
  }
}

function stateFromCache(cached: AnalyticsResponse, referralFallback: string): RewardsState {
  return {
    loading: true,
    error: null,
    referralCode: cached.referral_code || referralFallback,
    summary: cached.summary ?? null,
    referralHistory: cached.referral_history || [],
    transactions: buildTransactions(cached),
    rewardsCatalog: cached.rewards_catalog || [],
    leaderboard: cached.leaderboard || [],
    userRank: cached.user_rank ?? null,
  }
}

export function useRewards() {
  const user = getUser()
  const fetchingRef = useRef(false)

  const [state, setState] = useState<RewardsState>(() => {
    // Hydrate only from the current account's scoped storage — never from
    // another customer's persisted rewards.
    const cached = loadRewardsFromLocalStorage(user)
    if (cached) {
      return stateFromCache(cached, user?.referral_code || '')
    }
    return emptyRewardsState(user?.referral_code || '')
  })

  const loadData = useCallback(async () => {
    if (!user?.email) {
      setState(emptyRewardsState(''))
      return
    }
    if (fetchingRef.current) return
    fetchingRef.current = true

    // Discard any previous account's state first, then hydrate this
    // account's own persisted rewards while the fresh fetch runs.
    const scoped = loadRewardsFromLocalStorage(user)
    setState(scoped ? stateFromCache(scoped, user.referral_code || '') : emptyRewardsState(user.referral_code || ''))

    try {
      const data = await fetchAnalytics(user.email)
      if (!data.success) {
        setState(prev => ({ ...prev, loading: false, error: data.error || 'Failed to load rewards data.' }))
        return
      }
      saveRewardsToLocalStorage(data, user)
      setState({
        loading: false,
        error: null,
        referralCode: data.referral_code || user.referral_code || '',
        summary: data.summary ?? null,
        referralHistory: data.referral_history || [],
        transactions: buildTransactions(data),
        rewardsCatalog: data.rewards_catalog || [],
        leaderboard: data.leaderboard || [],
        userRank: data.user_rank ?? null,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load rewards data.'
      setState(prev => ({ ...prev, loading: false, error: msg }))
    } finally {
      fetchingRef.current = false
    }
  }, [user?.email, user?.referral_code])

  useEffect(() => {
    loadData()
  }, [loadData])

  const applyCode = useCallback(async (code: string): Promise<string | null> => {
    if (!user?.email) return 'User not found.'
    try {
      const res = await applyReferralCode({ referral_code: code, email: user.email })
      if (res.success) {
        await loadData()
        return null
      }
      return res.error || 'Failed to apply referral code.'
    } catch {
      return 'Failed to apply referral code.'
    }
  }, [user?.email, loadData])

  const redeem = useCallback(async (rewardId: string): Promise<string | null> => {
    if (!user?.email) return 'User not found.'
    try {
      const res = await redeemReward({ email: user.email, reward_id: rewardId })
      if (res.success) {
        await loadData()
        return null
      }
      return res.error || 'Redemption failed.'
    } catch {
      return 'Redemption failed.'
    }
  }, [user?.email, loadData])

  return { state, loadData, applyCode, redeem }
}

function buildTransactions(data: AnalyticsResponse): WalletTransaction[] {
  const txns: WalletTransaction[] = []
  ;(data.referral_history || []).forEach(h => {
    txns.push({
      type: 'credit',
      description: `Referral — ${h.referred_name || h.referred_email}`,
      points: h.points_earned || 100,
      date: h.date,
    })
  })
  ;(data.redemption_history || []).forEach(rd => {
    txns.push({
      type: 'debit',
      description: `Redeemed — ${rd.reward_name || rd.reward_id}`,
      points: -(rd.points_spent || 0),
      date: rd.redeemed_at,
    })
  })
  txns.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  return txns
}
